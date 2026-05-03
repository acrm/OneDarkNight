import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
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

    const outline = '#73c2ff';
    const shadow = '#10243f';

    for (let row = 0; row < grid.rows; row += 1) {
      for (let col = 0; col < grid.columns; col += 1) {
        const x = grid.offsetX + col * (grid.cellWidth + grid.gapX);
        const y = grid.offsetY + row * (grid.cellHeight + grid.gapY);

        ctx.strokeStyle = shadow;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, grid.cellWidth, grid.cellHeight);

        ctx.strokeStyle = outline;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, grid.cellWidth, grid.cellHeight);
      }
    }
  }, [atlasImage, grid]);

  const renderedFrames = useMemo<RenderedFrame[]>(() => {
    if (!atlasImage) return [];

    const rawFrames = buildFrames(grid);

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
      const processed = removeBackground(imageData, backgroundRemoval);
      ctx.putImageData(processed, 0, 0);

      return {
        index: frame.index,
        dataUrl: canvas.toDataURL('image/png'),
      };
    });
  }, [atlasImage, grid, backgroundRemoval]);

  const frameMap = useMemo(() => {
    const entries = renderedFrames.map((frame) => [frame.index, frame.dataUrl] as const);
    return new Map<number, string>(entries);
  }, [renderedFrames]);

  const maxFrameIndex = grid.columns * grid.rows;

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
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'Не удалось импортировать JSON.');
    }
  };

  const onGridInput = (field: keyof AtlasGridConfig, rawValue: string) => {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return;

    if (field === 'columns' || field === 'rows' || field === 'cellWidth' || field === 'cellHeight') {
      const fallback = grid[field] as number;
      updateGrid({ [field]: clampPositiveInt(numeric, fallback) } as Partial<AtlasGridConfig>);
      return;
    }

    updateGrid({ [field]: Math.round(numeric) } as Partial<AtlasGridConfig>);
  };

  const onToleranceInput = (rawValue: string) => {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return;
    updateBackgroundRemoval({ tolerance: Math.max(0, Math.min(255, Math.round(numeric))) });
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
          <button className="devtools-btn danger" onClick={() => reset()} type="button">Сбросить</button>
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
            />
          ) : (
            <div className="devtools-atlas-placeholder">Загрузите atlas, чтобы увидеть изображение и сетку.</div>
          )}
        </div>
        <div className="devtools-grid-config">
          <label className="devtools-field"><span>Cell W</span><input type="number" value={grid.cellWidth} onChange={(e) => onGridInput('cellWidth', e.target.value)} /></label>
          <label className="devtools-field"><span>Cell H</span><input type="number" value={grid.cellHeight} onChange={(e) => onGridInput('cellHeight', e.target.value)} /></label>
          <label className="devtools-field"><span>Offset X</span><input type="number" value={grid.offsetX} onChange={(e) => onGridInput('offsetX', e.target.value)} /></label>
          <label className="devtools-field"><span>Offset Y</span><input type="number" value={grid.offsetY} onChange={(e) => onGridInput('offsetY', e.target.value)} /></label>
          <label className="devtools-field"><span>Gap X</span><input type="number" value={grid.gapX} onChange={(e) => onGridInput('gapX', e.target.value)} /></label>
          <label className="devtools-field"><span>Gap Y</span><input type="number" value={grid.gapY} onChange={(e) => onGridInput('gapY', e.target.value)} /></label>
          <label className="devtools-field"><span>Columns</span><input type="number" value={grid.columns} onChange={(e) => onGridInput('columns', e.target.value)} /></label>
          <label className="devtools-field"><span>Rows</span><input type="number" value={grid.rows} onChange={(e) => onGridInput('rows', e.target.value)} /></label>
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
          <label className="devtools-field small">
            <span>Tolerance (0..255)</span>
            <input type="number" value={backgroundRemoval.tolerance} onChange={(e) => onToleranceInput(e.target.value)} />
          </label>
          <button className="devtools-btn" type="button" onClick={() => regenerateDefaultSprites()}>
            Сгенерировать список спрайтов по всем кадрам
          </button>
        </div>
      </section>

      <section className="devtools-panel">
        <h2>3. Кадры атласа (нумерация)</h2>
        <p className="devtools-hint">Нажмите на кадр, чтобы добавить его в выбранный спрайт.</p>
        <div className="devtools-frames-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, grid.columns)}, minmax(48px, 96px))` }}>
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
