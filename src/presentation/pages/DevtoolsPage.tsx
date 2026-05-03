import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useDevtoolsStore } from '../../application/devtoolsStore';
import {
  buildFrames,
  clampPositiveInt,
  parseFrameSpec,
  removeBackground,
  toAtlasDocument,
} from '../../application/spriteAtlasUtils';
import type { AtlasDocument, AtlasGridConfig, SpriteDefinition } from '../../application/devtoolsTypes';
import './DevtoolsPage.css';

interface RenderedFrame {
  index: number;
  dataUrl: string;
}

type DragHandle = 'top-left' | 'bottom-right' | null;

interface NumberStepperFieldProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

const HANDLE_VISUAL_RADIUS_UI = 14;
const HANDLE_HIT_RADIUS_UI = 28;

const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Не удалось загрузить изображение атласа.'));
    image.src = dataUrl;
  });
};

const parseJsonFile = (file: File): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)));
      } catch {
        reject(new Error('Файл JSON поврежден или имеет неверный формат.'));
      }
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать JSON файл.'));
    reader.readAsText(file);
  });
};

const isAtlasDocument = (value: unknown): value is AtlasDocument => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AtlasDocument>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.atlasFileName === 'string' &&
    !!candidate.grid &&
    !!candidate.backgroundRemoval &&
    Array.isArray(candidate.sprites)
  );
};

const normalizeGrid = (grid: AtlasGridConfig): AtlasGridConfig => ({
  cellWidth: clampPositiveInt(grid.cellWidth, 48),
  cellHeight: clampPositiveInt(grid.cellHeight, 48),
  offsetX: Number.isFinite(grid.offsetX) ? Math.round(grid.offsetX) : 0,
  offsetY: Number.isFinite(grid.offsetY) ? Math.round(grid.offsetY) : 0,
  gapX: Number.isFinite(grid.gapX) ? Math.round(grid.gapX) : 0,
  gapY: Number.isFinite(grid.gapY) ? Math.round(grid.gapY) : 0,
  columns: clampPositiveInt(grid.columns, 1),
  rows: clampPositiveInt(grid.rows, 1),
});

const normalizeSprites = (sprites: AtlasDocument['sprites']): SpriteDefinition[] => {
  return sprites.map((sprite, idx) => ({
    id: sprite.id || `imported-${idx + 1}`,
    name: sprite.name || `imported_${idx + 1}`,
    frameSpec: sprite.frameSpec || String(sprite.frameIndices[0] ?? 1),
    fps: clampPositiveInt(sprite.fps, 6),
    loop: Boolean(sprite.loop),
  }));
};

const getCanvasScale = (canvas: HTMLCanvasElement): { scaleX: number; scaleY: number } => {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { scaleX: 1, scaleY: 1 };
  }
  return {
    scaleX: canvas.width / rect.width,
    scaleY: canvas.height / rect.height,
  };
};

const uiPxToCanvasPx = (canvas: HTMLCanvasElement, px: number): number => {
  const { scaleX, scaleY } = getCanvasScale(canvas);
  return px * ((scaleX + scaleY) / 2);
};

const NumberStepperField = ({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: NumberStepperFieldProps) => {
  const clamp = (raw: number): number => {
    let next = raw;
    if (typeof min === 'number') next = Math.max(min, next);
    if (typeof max === 'number') next = Math.min(max, next);
    return next;
  };

  const changeByStep = (delta: number) => onChange(clamp(value + delta));

  return (
    <label className="devtools-field devtools-field-stepper">
      <span>{label}</span>
      <div className="stepper-control">
        <button className="devtools-btn tiny" type="button" onClick={() => changeByStep(-step)} aria-label={`${label} minus`}>
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const numeric = Number(e.target.value);
            if (!Number.isFinite(numeric)) return;
            onChange(clamp(Math.round(numeric)));
          }}
        />
        <button className="devtools-btn tiny" type="button" onClick={() => changeByStep(step)} aria-label={`${label} plus`}>
          +
        </button>
      </div>
    </label>
  );
};

const isSameGrid = (a: AtlasGridConfig, b: AtlasGridConfig): boolean => {
  return (
    a.cellWidth === b.cellWidth &&
    a.cellHeight === b.cellHeight &&
    a.offsetX === b.offsetX &&
    a.offsetY === b.offsetY &&
    a.gapX === b.gapX &&
    a.gapY === b.gapY &&
    a.columns === b.columns &&
    a.rows === b.rows
  );
};

export function DevtoolsPage() {
  const {
    atlasDataUrl,
    atlasFileName,
    imageWidth,
    imageHeight,
    grid,
    backgroundRemoval,
    sprites,
    selectedSpriteId,
    selectedPreviewSpriteId,
    setAtlasImage,
    updateGrid,
    updateBackgroundRemoval,
    regenerateDefaultSprites,
    addSprite,
    updateSprite,
    deleteSprite,
    selectSprite,
    selectPreviewSprite,
    importDocument,
    reset,
  } = useDevtoolsStore();

  const [atlasImage, setAtlasImageEl] = useState<HTMLImageElement | null>(null);
  const atlasCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragHandle, setDragHandle] = useState<DragHandle>(null);
  const [confirmedGrid, setConfirmedGrid] = useState<AtlasGridConfig | null>(null);
  const [confirmedBgTolerance, setConfirmedBgTolerance] = useState<number | null>(null);
  const [confirmedBgEnabled, setConfirmedBgEnabled] = useState<boolean | null>(null);
  const [errorText, setErrorText] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackFrame, setPlaybackFrame] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!atlasDataUrl) {
      setAtlasImageEl(null);
      return;
    }

    loadImageFromDataUrl(atlasDataUrl)
      .then((image) => {
        if (cancelled) return;
        setAtlasImageEl(image);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorText(error instanceof Error ? error.message : 'Не удалось загрузить атлас.');
      });

    return () => {
      cancelled = true;
    };
  }, [atlasDataUrl]);

  useEffect(() => {
    const canvas = atlasCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!atlasImage) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const width = atlasImage.width;
    const height = atlasImage.height;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlasImage, 0, 0);

    const topLeft = { x: grid.offsetX, y: grid.offsetY };
    const bottomRight = { x: grid.offsetX + grid.cellWidth, y: grid.offsetY + grid.cellHeight };

    const stepX = Math.max(1, bottomRight.x - topLeft.x);
    const stepY = Math.max(1, bottomRight.y - topLeft.y);

    const drawVerticalLine = (x: number, color: string, lineWidth: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    };

    const drawHorizontalLine = (y: number, color: string, lineWidth: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    };

    const drawRepeatingLines = (
      origin: number,
      step: number,
      limit: number,
      drawLine: (value: number, color: string, lineWidth: number) => void
    ) => {
      for (let v = origin; v <= limit; v += step) {
        drawLine(v, '#2a446f', 1);
      }
      for (let v = origin - step; v >= 0; v -= step) {
        drawLine(v, '#2a446f', 1);
      }
    };

    drawRepeatingLines(topLeft.x, stepX, width - 1, drawVerticalLine);
    drawRepeatingLines(topLeft.y, stepY, height - 1, drawHorizontalLine);

    drawVerticalLine(topLeft.x, '#34d6ff', 2);
    drawHorizontalLine(topLeft.y, '#34d6ff', 2);
    drawVerticalLine(bottomRight.x, '#ffb74d', 2);
    drawHorizontalLine(bottomRight.y, '#ffb74d', 2);

    const handleRadius = Math.max(8, uiPxToCanvasPx(canvas, HANDLE_VISUAL_RADIUS_UI));

    const drawHandle = (x: number, y: number, color: string) => {
      ctx.beginPath();
      ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
    };

    drawHandle(topLeft.x, topLeft.y, '#22d3ee');
    drawHandle(bottomRight.x, bottomRight.y, '#f59e0b');
  }, [atlasImage, grid]);

  const confirmedGridInUse = confirmedGrid ?? grid;
  const confirmedBackgroundRemoval = useMemo(
    () => ({
      enabled: confirmedBgEnabled ?? backgroundRemoval.enabled,
      tolerance: confirmedBgTolerance ?? backgroundRemoval.tolerance,
    }),
    [backgroundRemoval.enabled, backgroundRemoval.tolerance, confirmedBgEnabled, confirmedBgTolerance]
  );

  const hasConfirmedProcessing = Boolean(confirmedGrid);
  const hasPendingConfigChanges =
    hasConfirmedProcessing &&
    (!isSameGrid(grid, confirmedGridInUse) ||
      confirmedBackgroundRemoval.enabled !== backgroundRemoval.enabled ||
      confirmedBackgroundRemoval.tolerance !== backgroundRemoval.tolerance);

  const renderedFrames = useMemo<RenderedFrame[]>(() => {
    if (!atlasImage || !hasConfirmedProcessing) return [];

    const rawFrames = buildFrames(confirmedGridInUse);

    return rawFrames.map((frame) => {
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return { index: frame.index, dataUrl: '' };
      }

      ctx.clearRect(0, 0, frame.width, frame.height);
      ctx.drawImage(
        atlasImage,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        0,
        0,
        frame.width,
        frame.height
      );

      const imageData = ctx.getImageData(0, 0, frame.width, frame.height);
      const processed = removeBackground(imageData, confirmedBackgroundRemoval);
      ctx.putImageData(processed, 0, 0);

      return {
        index: frame.index,
        dataUrl: canvas.toDataURL('image/png'),
      };
    });
  }, [atlasImage, confirmedGridInUse, confirmedBackgroundRemoval, hasConfirmedProcessing]);

  const frameMap = useMemo(() => {
    const entries = renderedFrames.map((frame) => [frame.index, frame.dataUrl] as const);
    return new Map<number, string>(entries);
  }, [renderedFrames]);

  const maxFrameIndex = confirmedGridInUse.columns * confirmedGridInUse.rows;

  const parsedSprites = useMemo(() => {
    return sprites.map((sprite) => {
      const parsed = parseFrameSpec(sprite.frameSpec, maxFrameIndex);
      return {
        sprite,
        frameIndices: parsed.error ? [] : parsed.frameIndices,
        error: parsed.error,
        type: parsed.error ? 'invalid' : parsed.frameIndices.length > 1 ? 'animated' : 'static',
      };
    });
  }, [sprites, maxFrameIndex]);

  const selectedSprite = parsedSprites.find((entry) => entry.sprite.id === selectedSpriteId) ?? null;

  const selectedFrameSet = useMemo(() => {
    if (!selectedSprite) return new Set<number>();
    return new Set(selectedSprite.frameIndices);
  }, [selectedSprite]);

  const previewEntry =
    parsedSprites.find((entry) => entry.sprite.id === selectedPreviewSpriteId) ?? parsedSprites[0] ?? null;

  const previewFrames = useMemo(() => {
    if (!previewEntry) return [];
    return previewEntry.frameIndices
      .map((index) => frameMap.get(index))
      .filter((value): value is string => Boolean(value));
  }, [previewEntry, frameMap]);

  useEffect(() => {
    setPlaybackFrame(0);
  }, [selectedPreviewSpriteId]);

  useEffect(() => {
    if (!isPlaying || !previewEntry || previewFrames.length <= 1) {
      return;
    }

    const frameDuration = Math.max(40, Math.floor(1000 / Math.max(1, previewEntry.sprite.fps)));

    const timer = window.setInterval(() => {
      setPlaybackFrame((current) => {
        const next = current + 1;
        if (next < previewFrames.length) {
          return next;
        }
        if (previewEntry.sprite.loop) {
          return 0;
        }
        setIsPlaying(false);
        return current;
      });
    }, frameDuration);

    return () => window.clearInterval(timer);
  }, [isPlaying, previewEntry, previewFrames.length]);

  const activePreviewFrame = previewFrames[Math.min(playbackFrame, Math.max(0, previewFrames.length - 1))] ?? null;

  const onAtlasFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorText('');

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Не удалось прочитать изображение.'));
        reader.readAsDataURL(file);
      });

      const image = await loadImageFromDataUrl(dataUrl);
      setAtlasImage({
        dataUrl,
        fileName: file.name,
        imageWidth: image.width,
        imageHeight: image.height,
      });
      setAtlasImageEl(image);
      setConfirmedGrid(null);
      setConfirmedBgEnabled(null);
      setConfirmedBgTolerance(null);
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'Не удалось загрузить атлас.');
    }
  };

  const onImportDocumentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorText('');

    try {
      const parsed = await parseJsonFile(file);
      if (!isAtlasDocument(parsed)) {
        throw new Error('JSON не соответствует формату AtlasDocument v1.');
      }

      importDocument({
        atlasFileName: parsed.atlasFileName,
        imageWidth: parsed.imageWidth,
        imageHeight: parsed.imageHeight,
        grid: normalizeGrid(parsed.grid),
        backgroundRemoval: {
          enabled: Boolean(parsed.backgroundRemoval.enabled),
          tolerance: Math.max(0, Math.round(parsed.backgroundRemoval.tolerance)),
        },
        sprites: normalizeSprites(parsed.sprites),
      });
      setConfirmedGrid(normalizeGrid(parsed.grid));
      setConfirmedBgEnabled(Boolean(parsed.backgroundRemoval.enabled));
      setConfirmedBgTolerance(Math.max(0, Math.round(parsed.backgroundRemoval.tolerance)));
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'Не удалось импортировать JSON.');
    }
  };

  const resetTool = () => {
    reset();
    setConfirmedGrid(null);
    setConfirmedBgEnabled(null);
    setConfirmedBgTolerance(null);
  };

  const updateGridFromHandle = (handle: Exclude<DragHandle, null>, x: number, y: number) => {
    if (!atlasImage) return;
    const clampedX = Math.max(0, Math.min(atlasImage.width, Math.round(x)));
    const clampedY = Math.max(0, Math.min(atlasImage.height, Math.round(y)));

    if (handle === 'top-left') {
      const right = grid.offsetX + grid.cellWidth;
      const bottom = grid.offsetY + grid.cellHeight;
      const nextOffsetX = Math.min(clampedX, right - 1);
      const nextOffsetY = Math.min(clampedY, bottom - 1);
      const nextCellWidth = Math.max(1, right - nextOffsetX);
      const nextCellHeight = Math.max(1, bottom - nextOffsetY);
      updateGrid({
        offsetX: nextOffsetX,
        offsetY: nextOffsetY,
        cellWidth: nextCellWidth,
        cellHeight: nextCellHeight,
      });
      return;
    }

    const nextCellWidth = Math.max(1, clampedX - grid.offsetX);
    const nextCellHeight = Math.max(1, clampedY - grid.offsetY);
    updateGrid({ cellWidth: nextCellWidth, cellHeight: nextCellHeight });
  };

  const locateHandle = (x: number, y: number): DragHandle => {
    const canvas = atlasCanvasRef.current;
    if (!canvas) return null;
    const topLeft = { x: grid.offsetX, y: grid.offsetY };
    const bottomRight = { x: grid.offsetX + grid.cellWidth, y: grid.offsetY + grid.cellHeight };
    const radius = Math.max(12, uiPxToCanvasPx(canvas, HANDLE_HIT_RADIUS_UI));
    const inCircle = (cx: number, cy: number): boolean => {
      const dx = x - cx;
      const dy = y - cy;
      return dx * dx + dy * dy <= radius * radius;
    };

    if (inCircle(topLeft.x, topLeft.y)) return 'top-left';
    if (inCircle(bottomRight.x, bottomRight.y)) return 'bottom-right';
    return null;
  };

  const getCanvasCoords = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const onCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!atlasImage) return;
    const canvas = atlasCanvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(canvas, event.clientX, event.clientY);
    const handle = locateHandle(coords.x, coords.y);
    if (!handle) return;
    setDragHandle(handle);
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onCanvasPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragHandle) return;
    const canvas = atlasCanvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(canvas, event.clientX, event.clientY);
    updateGridFromHandle(dragHandle, coords.x, coords.y);
    event.preventDefault();
  };

  const onCanvasPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = atlasCanvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    setDragHandle(null);
  };

  const confirmSlicingParams = () => {
    setConfirmedGrid({ ...grid });
    setConfirmedBgEnabled(backgroundRemoval.enabled);
    setConfirmedBgTolerance(backgroundRemoval.tolerance);
  };

  const appendFrameToSelectedSprite = (frameIndex: number) => {
    if (!selectedSprite) return;
    const current = selectedSprite.sprite.frameSpec.trim();
    const next = current ? `${current},${frameIndex}` : String(frameIndex);
    updateSprite(selectedSprite.sprite.id, { frameSpec: next });
  };

  const exportJson = () => {
    if (!atlasFileName) {
      setErrorText('Сначала загрузите atlas PNG, затем экспортируйте JSON.');
      return;
    }

    const doc = toAtlasDocument(
      atlasFileName,
      { width: imageWidth, height: imageHeight },
      grid,
      backgroundRemoval,
      sprites
    );

    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${atlasFileName.replace(/\.[^.]+$/, '') || 'atlas'}-config.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="devtools-page">
      <header className="devtools-header">
        <div>
          <h1>Sprite Atlas Devtool</h1>
          <p>Загрузка atlas, разрезка на кадры, вырезание фона, именование спрайтов и preview анимаций.</p>
        </div>
        <div className="devtools-header-actions">
          <a className="devtools-link" href="#/">Вернуться к игре</a>
          <button className="devtools-btn danger" onClick={resetTool} type="button">Сбросить</button>
        </div>
      </header>

      {errorText ? <div className="devtools-error">{errorText}</div> : null}

      <section className="devtools-panel devtools-upload-panel">
        <h2>1. Источник данных</h2>
        <div className="devtools-upload-grid">
          <label className="devtools-field">
            <span>Atlas PNG</span>
            <input type="file" accept="image/png,image/webp,image/jpeg" onChange={onAtlasFileChange} />
          </label>
          <label className="devtools-field">
            <span>Импорт JSON</span>
            <input type="file" accept="application/json,.json" onChange={onImportDocumentChange} />
          </label>
          <button className="devtools-btn" type="button" onClick={exportJson}>Экспорт JSON</button>
        </div>
        <div className="devtools-atlas-meta">
          <span>Файл: {atlasFileName || 'не загружен'}</span>
          <span>Размер: {imageWidth || 0} x {imageHeight || 0}</span>
          <span>Кадров: {maxFrameIndex}</span>
        </div>
      </section>

      <section className="devtools-panel">
        <h2>2. Сетка и вырезание фона</h2>
        <div className="devtools-atlas-preview-wrap">
          {atlasImage ? (
            <canvas
              ref={atlasCanvasRef}
              className="devtools-atlas-preview"
              width={atlasImage.width}
              height={atlasImage.height}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerCancel={onCanvasPointerUp}
            />
          ) : (
            <div className="devtools-atlas-placeholder">Загрузите atlas, чтобы увидеть изображение и сетку.</div>
          )}
        </div>
        <p className="devtools-hint">
          Перетаскивайте точки: бирюзовая задает верхний левый угол первого кадра, оранжевая задает правый нижний.
          От каждой точки идут опорные вертикальная и горизонтальная линии, остальные линии повторяются с тем же шагом.
          Тяжелая разрезка и удаление фона запускаются только после подтверждения параметров.
        </p>
        <div className="devtools-grid-config">
          <NumberStepperField label="Cell W" value={grid.cellWidth} onChange={(next) => updateGrid({ cellWidth: clampPositiveInt(next, grid.cellWidth) })} min={1} />
          <NumberStepperField label="Cell H" value={grid.cellHeight} onChange={(next) => updateGrid({ cellHeight: clampPositiveInt(next, grid.cellHeight) })} min={1} />
          <NumberStepperField label="Offset X" value={grid.offsetX} onChange={(next) => updateGrid({ offsetX: next })} />
          <NumberStepperField label="Offset Y" value={grid.offsetY} onChange={(next) => updateGrid({ offsetY: next })} />
          <NumberStepperField label="Gap X" value={grid.gapX} onChange={(next) => updateGrid({ gapX: next })} />
          <NumberStepperField label="Gap Y" value={grid.gapY} onChange={(next) => updateGrid({ gapY: next })} />
          <NumberStepperField label="Columns" value={grid.columns} onChange={(next) => updateGrid({ columns: clampPositiveInt(next, grid.columns) })} min={1} />
          <NumberStepperField label="Rows" value={grid.rows} onChange={(next) => updateGrid({ rows: clampPositiveInt(next, grid.rows) })} min={1} />
        </div>

        <div className="devtools-bg-config">
          <label className="devtools-toggle">
            <input
              type="checkbox"
              checked={backgroundRemoval.enabled}
              onChange={(e) => updateBackgroundRemoval({ enabled: e.target.checked })}
            />
            <span>Вырезать фон по цвету из верхнего левого пикселя каждого кадра</span>
          </label>
          <NumberStepperField
            label="Tolerance (0..255)"
            value={backgroundRemoval.tolerance}
            min={0}
            max={255}
            onChange={(next) => updateBackgroundRemoval({ tolerance: Math.max(0, Math.min(255, next)) })}
          />
          <button className="devtools-btn" type="button" onClick={() => regenerateDefaultSprites()}>
            Сгенерировать список спрайтов по всем кадрам
          </button>
        </div>
        <div className="devtools-confirm-row">
          <button className="devtools-btn primary" type="button" onClick={confirmSlicingParams}>
            Подтвердить параметры разрезки
          </button>
          <span className="devtools-confirm-status">
            {!hasConfirmedProcessing
              ? 'Параметры еще не подтверждены: обработка кадров отключена.'
              : hasPendingConfigChanges
                ? 'Параметры изменены после подтверждения: нажмите подтверждение, чтобы пересчитать кадры.'
                : 'Используются подтвержденные параметры.'}
          </span>
        </div>
      </section>

      <section className="devtools-panel">
        <h2>3. Кадры атласа (нумерация)</h2>
        {!hasConfirmedProcessing ? (
          <p className="devtools-warning">Подтвердите параметры разрезки, чтобы запустить извлечение кадров и удаление фона.</p>
        ) : null}
        {hasPendingConfigChanges ? (
          <p className="devtools-warning">Текущие кадры построены по последним подтвержденным параметрам. Подтвердите новые параметры для пересчета.</p>
        ) : null}
        <p className="devtools-hint">Нажмите на кадр, чтобы добавить его в выбранный спрайт.</p>
        <div className="devtools-frames-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, confirmedGridInUse.columns)}, minmax(48px, 96px))` }}>
          {renderedFrames.map((frame) => (
            <button
              key={frame.index}
              className={`devtools-frame ${selectedFrameSet.has(frame.index) ? 'selected' : ''}`}
              type="button"
              onClick={() => appendFrameToSelectedSprite(frame.index)}
              title={`Кадр ${frame.index}`}
            >
              {frame.dataUrl ? <img src={frame.dataUrl} alt={`frame-${frame.index}`} /> : <span className="empty">N/A</span>}
              <span className="index">{frame.index}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="devtools-panel devtools-sprites-panel">
        <h2>4. Спрайты и анимации</h2>
        <div className="devtools-sprites-actions">
          <button className="devtools-btn" type="button" onClick={() => addSprite()}>Добавить спрайт</button>
        </div>
        <div className="devtools-sprites-table">
          <div className="head">Имя</div>
          <div className="head">Кадры (пример: 1-4, 7, 9-12)</div>
          <div className="head">FPS</div>
          <div className="head">Loop</div>
          <div className="head">Тип</div>
          <div className="head">Действия</div>

          {parsedSprites.map((entry) => {
            const { sprite, error, frameIndices, type } = entry;
            const isSelected = sprite.id === selectedSpriteId;
            const isPreview = sprite.id === selectedPreviewSpriteId;

            return (
              <>
                <div className={`cell ${isSelected ? 'active' : ''}`}>
                  <input
                    value={sprite.name}
                    onFocus={() => selectSprite(sprite.id)}
                    onChange={(e) => updateSprite(sprite.id, { name: e.target.value })}
                  />
                </div>
                <div className={`cell ${isSelected ? 'active' : ''}`}>
                  <input
                    value={sprite.frameSpec}
                    onFocus={() => selectSprite(sprite.id)}
                    onChange={(e) => updateSprite(sprite.id, { frameSpec: e.target.value })}
                  />
                  <div className="inline-meta">
                    {error ? <span className="invalid">{error}</span> : <span>{frameIndices.join(', ') || '—'}</span>}
                  </div>
                </div>
                <div className={`cell ${isSelected ? 'active' : ''}`}>
                  <input
                    type="number"
                    min={1}
                    value={sprite.fps}
                    onFocus={() => selectSprite(sprite.id)}
                    onChange={(e) => updateSprite(sprite.id, { fps: clampPositiveInt(Number(e.target.value), sprite.fps) })}
                  />
                </div>
                <div className={`cell ${isSelected ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={sprite.loop}
                    onFocus={() => selectSprite(sprite.id)}
                    onChange={(e) => updateSprite(sprite.id, { loop: e.target.checked })}
                  />
                </div>
                <div className={`cell ${isSelected ? 'active' : ''}`}>
                  <span className={`sprite-type ${type}`}>{type}</span>
                </div>
                <div className={`cell ${isSelected ? 'active' : ''} actions`}>
                  <button
                    className={`devtools-btn tiny ${isPreview ? 'primary' : ''}`}
                    type="button"
                    onClick={() => selectPreviewSprite(sprite.id)}
                  >
                    Preview
                  </button>
                  <button className="devtools-btn tiny danger" type="button" onClick={() => deleteSprite(sprite.id)}>
                    Удалить
                  </button>
                </div>
              </>
            );
          })}
        </div>
      </section>

      <section className="devtools-panel">
        <h2>5. Preview выбранной анимации</h2>
        {!previewEntry ? <p>Добавьте или выберите спрайт для предпросмотра.</p> : null}
        {previewEntry ? (
          <div className="devtools-preview-area">
            <div className="preview-canvas">
              {activePreviewFrame ? (
                <img src={activePreviewFrame} alt={`preview-${previewEntry.sprite.name}`} />
              ) : (
                <span>Нет кадров для предпросмотра</span>
              )}
            </div>
            <div className="preview-info">
              <div><strong>Спрайт:</strong> {previewEntry.sprite.name}</div>
              <div><strong>Кадры:</strong> {previewEntry.frameIndices.join(', ') || '—'}</div>
              <div><strong>FPS:</strong> {previewEntry.sprite.fps}</div>
              <div><strong>Loop:</strong> {previewEntry.sprite.loop ? 'да' : 'нет'}</div>
              <div className="preview-controls">
                <button className="devtools-btn" type="button" onClick={() => setIsPlaying((v) => !v)}>
                  {isPlaying ? 'Пауза' : 'Старт'}
                </button>
                <button className="devtools-btn" type="button" onClick={() => setPlaybackFrame(0)}>
                  С начала
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
