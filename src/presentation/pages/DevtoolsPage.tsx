import { ChangeEvent, PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useDevtoolsStore } from '../../application/devtoolsStore';
import { clampPositiveInt, toAtlasDocument } from '../../application/spriteAtlasUtils';
import type { AtlasDocument, SpriteDefinition } from '../../application/devtoolsTypes';
import './DevtoolsPage.css';

type DragMode = 'pan' | 'anchor' | 'crosshair';

interface DragState {
  mode: DragMode;
  pointerId: number;
  spriteId?: string;
  frameIndex?: number;
  lastClientX: number;
  lastClientY: number;
}

interface LastMovedAnchor {
  spriteId: string;
  frameIndex: number;
}

interface NumberStepperFieldProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const MARKER_VISUAL_RADIUS_UI = 16;
const MARKER_HIT_RADIUS_UI = 30;
const VIEW_MIN_SCALE = 0.25;
const VIEW_MAX_SCALE = 12;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

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
  return candidate.schemaVersion === 1 && typeof candidate.atlasFileName === 'string' && Array.isArray(candidate.sprites);
};

const NumberStepperField = ({ label, value, onChange, min, max, step = 1 }: NumberStepperFieldProps) => {
  const clampNumber = (raw: number): number => {
    let next = raw;
    if (typeof min === 'number') next = Math.max(min, next);
    if (typeof max === 'number') next = Math.min(max, next);
    return next;
  };

  return (
    <label className="devtools-field devtools-field-stepper">
      <span>{label}</span>
      <div className="stepper-control">
        <button className="devtools-btn tiny" type="button" onClick={() => onChange(clampNumber(value - step))}>
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const numeric = Number(e.target.value);
            if (!Number.isFinite(numeric)) return;
            onChange(clampNumber(Math.round(numeric)));
          }}
        />
        <button className="devtools-btn tiny" type="button" onClick={() => onChange(clampNumber(value + step))}>
          +
        </button>
      </div>
    </label>
  );
};

const createInitialAnchors = (
  frameCount: number,
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number
): Array<{ x: number; y: number }> => {
  if (frameCount <= 0) return [];

  const anchors: Array<{ x: number; y: number }> = [];
  const margin = 12;
  const stepX = Math.max(8, frameWidth + 8);
  const startX = frameWidth / 2 + margin;
  const startY = frameHeight / 2 + margin;

  for (let i = 0; i < frameCount; i += 1) {
    const x = clamp(startX + i * stepX, frameWidth / 2, Math.max(frameWidth / 2, imageWidth - frameWidth / 2));
    const y = clamp(startY, frameHeight / 2, Math.max(frameHeight / 2, imageHeight - frameHeight / 2));
    anchors.push({ x, y });
  }

  return anchors;
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
    setAtlasImage,
    updateSprite,
    addSprite,
    deleteSprite,
    selectSprite,
    importDocument,
    reset,
  } = useDevtoolsStore();

  const [atlasImage, setAtlasImageEl] = useState<HTMLImageElement | null>(null);
  const [errorText, setErrorText] = useState('');
  const [lastMovedAnchor, setLastMovedAnchor] = useState<LastMovedAnchor | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [viewScale, setViewScale] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 420 });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!atlasDataUrl) {
      setAtlasImageEl(null);
      return;
    }

    loadImageFromDataUrl(atlasDataUrl)
      .then((img) => {
        if (cancelled) return;
        setAtlasImageEl(img);
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
    const viewport = viewportRef.current;
    if (!viewport) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setCanvasSize({ width: Math.max(280, Math.round(rect.width)), height: Math.max(260, Math.round(rect.height)) });
    });

    resizeObserver.observe(viewport);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!atlasImage) return;
    const fitScale = Math.min(canvasSize.width / atlasImage.width, canvasSize.height / atlasImage.height);
    const nextScale = clamp(fitScale, VIEW_MIN_SCALE, VIEW_MAX_SCALE);
    setViewScale(nextScale);
    setViewOffset({
      x: (canvasSize.width - atlasImage.width * nextScale) / 2,
      y: (canvasSize.height - atlasImage.height * nextScale) / 2,
    });
  }, [atlasImage, canvasSize.height, canvasSize.width]);

  const markerModel = useMemo(() => {
    const confirmedSprites = sprites.filter((sprite) => sprite.confirmed && sprite.anchors.length > 0);
    const crosshair =
      lastMovedAnchor &&
      confirmedSprites.some((sprite) => sprite.id === lastMovedAnchor.spriteId)
        ? lastMovedAnchor
        : null;
    return { confirmedSprites, crosshair };
  }, [lastMovedAnchor, sprites]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(canvasSize.width));
    const height = Math.max(1, Math.round(canvasSize.height));

    if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
    if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0e1120';
    ctx.fillRect(0, 0, width, height);

    if (!atlasImage) return;

    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);
    ctx.scale(viewScale, viewScale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlasImage, 0, 0);

    const baseLineWidth = Math.max(2.2, 3.2 / viewScale);
    const markerRadius = Math.max(8, MARKER_VISUAL_RADIUS_UI / viewScale);

    for (const sprite of markerModel.confirmedSprites) {
      const isSelected = sprite.id === selectedSpriteId;
      const rectColor = isSelected ? '#f97316' : '#60a5fa';

      for (let idx = 0; idx < sprite.anchors.length; idx += 1) {
        const anchor = sprite.anchors[idx];
        const left = anchor.x - sprite.frameWidth / 2;
        const top = anchor.y - sprite.frameHeight / 2;
        const right = left + sprite.frameWidth;
        const bottom = top + sprite.frameHeight;

        ctx.strokeStyle = '#000000cc';
        ctx.lineWidth = baseLineWidth + 2 / viewScale;
        ctx.strokeRect(left, top, sprite.frameWidth, sprite.frameHeight);

        ctx.strokeStyle = rectColor;
        ctx.lineWidth = baseLineWidth;
        ctx.strokeRect(left, top, sprite.frameWidth, sprite.frameHeight);

        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, markerRadius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#f97316' : '#22d3ee';
        ctx.fill();
        ctx.lineWidth = baseLineWidth;
        ctx.strokeStyle = '#020617';
        ctx.stroke();

        if (markerModel.crosshair && markerModel.crosshair.spriteId === sprite.id && markerModel.crosshair.frameIndex === idx) {
          const crossX = right;
          const crossY = bottom;

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = Math.max(3, 3.8 / viewScale);
          ctx.beginPath();
          ctx.moveTo(crossX, 0);
          ctx.lineTo(crossX, atlasImage.height);
          ctx.moveTo(0, crossY);
          ctx.lineTo(atlasImage.width, crossY);
          ctx.stroke();

          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = Math.max(3, 3.8 / viewScale);
          ctx.beginPath();
          ctx.moveTo(anchor.x, 0);
          ctx.lineTo(anchor.x, atlasImage.height);
          ctx.moveTo(0, anchor.y);
          ctx.lineTo(atlasImage.width, anchor.y);
          ctx.stroke();

          const crossRadius = markerRadius + 2 / viewScale;
          ctx.beginPath();
          ctx.arc(crossX, crossY, crossRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
          ctx.lineWidth = baseLineWidth;
          ctx.strokeStyle = '#111827';
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }, [atlasImage, canvasSize.height, canvasSize.width, markerModel.confirmedSprites, markerModel.crosshair, selectedSpriteId, viewOffset.x, viewOffset.y, viewScale]);

  const toWorldCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const uiX = clientX - rect.left;
    const uiY = clientY - rect.top;

    return {
      x: (uiX - viewOffset.x) / viewScale,
      y: (uiY - viewOffset.y) / viewScale,
    };
  };

  const worldToUi = (x: number, y: number): { x: number; y: number } => {
    return {
      x: x * viewScale + viewOffset.x,
      y: y * viewScale + viewOffset.y,
    };
  };

  const hitTestMarkers = (clientX: number, clientY: number): { mode: 'anchor' | 'crosshair'; spriteId: string; frameIndex: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas || !atlasImage) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (markerModel.crosshair) {
      const sprite = sprites.find((item) => item.id === markerModel.crosshair?.spriteId);
      if (sprite && sprite.anchors[markerModel.crosshair.frameIndex]) {
        const anchor = sprite.anchors[markerModel.crosshair.frameIndex];
        const cross = worldToUi(anchor.x + sprite.frameWidth / 2, anchor.y + sprite.frameHeight / 2);
        const dx = x - cross.x;
        const dy = y - cross.y;
        if (dx * dx + dy * dy <= MARKER_HIT_RADIUS_UI * MARKER_HIT_RADIUS_UI) {
          return { mode: 'crosshair', spriteId: sprite.id, frameIndex: markerModel.crosshair.frameIndex };
        }
      }
    }

    for (const sprite of markerModel.confirmedSprites) {
      for (let i = 0; i < sprite.anchors.length; i += 1) {
        const anchorUi = worldToUi(sprite.anchors[i].x, sprite.anchors[i].y);
        const dx = x - anchorUi.x;
        const dy = y - anchorUi.y;
        if (dx * dx + dy * dy <= MARKER_HIT_RADIUS_UI * MARKER_HIT_RADIUS_UI) {
          return { mode: 'anchor', spriteId: sprite.id, frameIndex: i };
        }
      }
    }

    return null;
  };

  const updateAnchor = (spriteId: string, frameIndex: number, worldX: number, worldY: number) => {
    if (!atlasImage) return;
    const sprite = sprites.find((item) => item.id === spriteId);
    if (!sprite || !sprite.anchors[frameIndex]) return;

    const clampedX = clamp(worldX, sprite.frameWidth / 2, atlasImage.width - sprite.frameWidth / 2);
    const clampedY = clamp(worldY, sprite.frameHeight / 2, atlasImage.height - sprite.frameHeight / 2);

    const anchors = sprite.anchors.map((point, idx) => (idx === frameIndex ? { x: clampedX, y: clampedY } : point));
    updateSprite(spriteId, { anchors, confirmed: true });
    setLastMovedAnchor({ spriteId, frameIndex });
  };

  const updateSpriteSizeFromCrosshair = (spriteId: string, frameIndex: number, worldX: number, worldY: number) => {
    if (!atlasImage) return;
    const sprite = sprites.find((item) => item.id === spriteId);
    if (!sprite || !sprite.anchors[frameIndex]) return;

    const anchor = sprite.anchors[frameIndex];
    const frameWidth = clampPositiveInt(Math.round((worldX - anchor.x) * 2), sprite.frameWidth);
    const frameHeight = clampPositiveInt(Math.round((worldY - anchor.y) * 2), sprite.frameHeight);

    const clampedWidth = clamp(frameWidth, 8, atlasImage.width);
    const clampedHeight = clamp(frameHeight, 8, atlasImage.height);

    updateSprite(spriteId, {
      frameWidth: clampedWidth,
      frameHeight: clampedHeight,
      confirmed: true,
    });
    setLastMovedAnchor({ spriteId, frameIndex });
  };

  const onCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!atlasImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hit = hitTestMarkers(event.clientX, event.clientY);
    canvas.setPointerCapture(event.pointerId);

    if (hit) {
      selectSprite(hit.spriteId);
      setDragState({
        mode: hit.mode,
        pointerId: event.pointerId,
        spriteId: hit.spriteId,
        frameIndex: hit.frameIndex,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
      });
      return;
    }

    setDragState({
      mode: 'pan',
      pointerId: event.pointerId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
    });
  };

  const onCanvasPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (dragState.mode === 'pan') {
      const dx = event.clientX - dragState.lastClientX;
      const dy = event.clientY - dragState.lastClientY;
      setViewOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragState((prev) => (prev ? { ...prev, lastClientX: event.clientX, lastClientY: event.clientY } : prev));
      return;
    }

    const world = toWorldCoords(event.clientX, event.clientY);
    if (!world || !dragState.spriteId || dragState.frameIndex === undefined) return;

    if (dragState.mode === 'anchor') {
      updateAnchor(dragState.spriteId, dragState.frameIndex, world.x, world.y);
      return;
    }

    updateSpriteSizeFromCrosshair(dragState.spriteId, dragState.frameIndex, world.x, world.y);
  };

  const onCanvasPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    setDragState(null);
  };

  const zoomBy = (factor: number, centerUiX?: number, centerUiY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = centerUiX ?? rect.width / 2;
    const cy = centerUiY ?? rect.height / 2;

    const prevScale = viewScale;
    const nextScale = clamp(prevScale * factor, VIEW_MIN_SCALE, VIEW_MAX_SCALE);
    if (nextScale === prevScale) return;

    const worldX = (cx - viewOffset.x) / prevScale;
    const worldY = (cy - viewOffset.y) / prevScale;

    setViewScale(nextScale);
    setViewOffset({
      x: cx - worldX * nextScale,
      y: cy - worldY * nextScale,
    });
  };

  const onCanvasWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomBy(factor, centerX, centerY);
  };

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
      setLastMovedAnchor(null);
      setAtlasImageEl(image);
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

      const normalizedSprites: SpriteDefinition[] = parsed.sprites.map((sprite, idx) => ({
        id: sprite.id || `imported-${idx + 1}`,
        name: sprite.name || `imported_${idx + 1}`,
        frameCount: clampPositiveInt(sprite.frameCount ?? sprite.frameIndices.length ?? 1, 1),
        frameWidth: clampPositiveInt(sprite.frameWidth ?? grid.cellWidth, grid.cellWidth),
        frameHeight: clampPositiveInt(sprite.frameHeight ?? grid.cellHeight, grid.cellHeight),
        anchors: [],
        confirmed: false,
        frameSpec: sprite.frameSpec || String(sprite.frameIndices[0] ?? 1),
        fps: clampPositiveInt(sprite.fps, 6),
        loop: Boolean(sprite.loop),
      }));

      importDocument({
        atlasFileName: parsed.atlasFileName,
        imageWidth: parsed.imageWidth,
        imageHeight: parsed.imageHeight,
        grid,
        backgroundRemoval,
        sprites: normalizedSprites,
      });
      setLastMovedAnchor(null);
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'Не удалось импортировать JSON.');
    }
  };

  const confirmSprite = (sprite: SpriteDefinition) => {
    if (!atlasImage) {
      setErrorText('Сначала загрузите атлас.');
      return;
    }

    const frameCount = clampPositiveInt(sprite.frameCount, 1);
    const frameWidth = clampPositiveInt(sprite.frameWidth, 1);
    const frameHeight = clampPositiveInt(sprite.frameHeight, 1);

    let anchors = sprite.anchors.slice(0, frameCount);
    if (anchors.length < frameCount) {
      const initial = createInitialAnchors(frameCount, frameWidth, frameHeight, atlasImage.width, atlasImage.height);
      anchors = anchors.concat(initial.slice(anchors.length));
    }

    updateSprite(sprite.id, {
      frameCount,
      frameWidth,
      frameHeight,
      anchors,
      confirmed: true,
    });

    setLastMovedAnchor({ spriteId: sprite.id, frameIndex: Math.max(0, anchors.length - 1) });
    selectSprite(sprite.id);
  };

  const exportJson = () => {
    if (!atlasFileName) {
      setErrorText('Сначала загрузите atlas PNG, затем экспортируйте JSON.');
      return;
    }

    const doc = toAtlasDocument(atlasFileName, { width: imageWidth, height: imageHeight }, grid, backgroundRemoval, sprites);
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${atlasFileName.replace(/\.[^.]+$/, '') || 'atlas'}-config.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetTool = () => {
    reset();
    setLastMovedAnchor(null);
    setErrorText('');
  };

  return (
    <div className="devtools-page">
      <header className="devtools-header">
        <div>
          <h1>Sprite Atlas Devtool</h1>
          <p>Зум/панорама атласа и настройка маркеров спрайтов через якорь и перекрестие.</p>
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
          <span>Спрайтов: {sprites.length}</span>
        </div>
      </section>

      <section className="devtools-layout">
        <div className="devtools-panel devtools-canvas-panel">
          <h2>2. Атлас, маркеры и навигация</h2>
          <div className="viewer-toolbar">
            <button className="devtools-btn tiny" type="button" onClick={() => zoomBy(1.15)}>Zoom +</button>
            <button className="devtools-btn tiny" type="button" onClick={() => zoomBy(1 / 1.15)}>Zoom -</button>
            <button
              className="devtools-btn tiny"
              type="button"
              onClick={() => {
                if (!atlasImage) return;
                const fitScale = clamp(Math.min(canvasSize.width / atlasImage.width, canvasSize.height / atlasImage.height), VIEW_MIN_SCALE, VIEW_MAX_SCALE);
                setViewScale(fitScale);
                setViewOffset({
                  x: (canvasSize.width - atlasImage.width * fitScale) / 2,
                  y: (canvasSize.height - atlasImage.height * fitScale) / 2,
                });
              }}
            >
              Fit
            </button>
            <span className="viewer-scale">{Math.round(viewScale * 100)}%</span>
          </div>

          <div className="atlas-viewport" ref={viewportRef}>
            {atlasImage ? (
              <canvas
                ref={canvasRef}
                className="devtools-atlas-preview"
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
                onPointerCancel={onCanvasPointerUp}
                onWheel={onCanvasWheel}
              />
            ) : (
              <div className="devtools-atlas-placeholder">Загрузите атлас, чтобы включить редактор маркеров.</div>
            )}
          </div>

          <p className="devtools-hint">
            Якорь двигает позицию кадра. Для последнего перемещенного якоря показывается перекрестие в правом нижнем углу рамки.
            Перетаскивание перекрестия меняет размеры кадра сразу для всех кадров выбранного спрайта.
          </p>
        </div>

        <div className="devtools-panel devtools-sprites-panel">
          <h2>3. Список спрайтов</h2>
          <div className="devtools-sprites-actions">
            <button className="devtools-btn" type="button" onClick={() => addSprite()}>Добавить спрайт</button>
          </div>

          {sprites.length === 0 ? <p className="devtools-hint">Список пуст. Добавьте первый спрайт.</p> : null}

          <div className="sprite-cards">
            {sprites.map((sprite) => (
              <div key={sprite.id} className={`sprite-card ${sprite.id === selectedSpriteId ? 'selected' : ''}`}>
                <label className="devtools-field">
                  <span>Имя спрайта</span>
                  <input
                    value={sprite.name}
                    onFocus={() => selectSprite(sprite.id)}
                    onChange={(e) => updateSprite(sprite.id, { name: e.target.value })}
                  />
                </label>

                <NumberStepperField
                  label="Количество кадров"
                  value={sprite.frameCount}
                  min={1}
                  onChange={(next) => updateSprite(sprite.id, { frameCount: clampPositiveInt(next, sprite.frameCount), confirmed: false })}
                />

                <NumberStepperField
                  label="Ширина кадра"
                  value={sprite.frameWidth}
                  min={1}
                  onChange={(next) => updateSprite(sprite.id, { frameWidth: clampPositiveInt(next, sprite.frameWidth), confirmed: false })}
                />

                <NumberStepperField
                  label="Высота кадра"
                  value={sprite.frameHeight}
                  min={1}
                  onChange={(next) => updateSprite(sprite.id, { frameHeight: clampPositiveInt(next, sprite.frameHeight), confirmed: false })}
                />

                <div className="sprite-card-actions">
                  <button className="devtools-btn primary" type="button" onClick={() => confirmSprite(sprite)}>
                    Подтвердить
                  </button>
                  <button className="devtools-btn tiny danger" type="button" onClick={() => deleteSprite(sprite.id)}>
                    Удалить
                  </button>
                </div>

                <div className="sprite-status">
                  {sprite.confirmed ? `Маркеров на атласе: ${sprite.anchors.length}` : 'Не подтвержден'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
