import { ChangeEvent, PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  value: number | undefined;
  onChange: (next: number) => void;
  onBlurCommit?: (next: number) => void;
  fallbackValue: number;
  min?: number;
  max?: number;
  step?: number;
}

const MARKER_VISUAL_RADIUS_UI = 12;
const MARKER_HIT_RADIUS_UI = 30;
const VIEW_MIN_SCALE = 0.25;
const VIEW_MAX_SCALE = 12;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const drawAnchorIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, lineWidth: number) => {
  const r = size * 0.45;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.arc(x, y - r * 0.65, r * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.25);
  ctx.lineTo(x, y + r * 0.72);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y + r * 0.72, r * 0.85, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - r * 0.72, y + r * 0.92);
  ctx.lineTo(x - r * 0.98, y + r * 0.58);
  ctx.moveTo(x + r * 0.72, y + r * 0.92);
  ctx.lineTo(x + r * 0.98, y + r * 0.58);
  ctx.stroke();
  ctx.restore();
};

const drawCornerIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, lineWidth: number) => {
  const arm = size * 0.42;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - arm, y);
  ctx.lineTo(x + arm * 0.95, y);
  ctx.lineTo(x + arm * 0.95, y - arm * 0.95);
  ctx.stroke();
  ctx.restore();
};

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

const NumberStepperField = ({
  label,
  value,
  onChange,
  onBlurCommit,
  fallbackValue,
  min,
  max,
  step = 1,
}: NumberStepperFieldProps) => {
  const [draft, setDraft] = useState('');

  const clampNumber = (raw: number): number => {
    let next = raw;
    if (typeof min === 'number') next = Math.max(min, next);
    if (typeof max === 'number') next = Math.min(max, next);
    return next;
  };

  const normalizedValue = Number.isFinite(value) ? Number(value) : fallbackValue;

  useEffect(() => {
    setDraft(String(normalizedValue));
  }, [normalizedValue]);

  const commitNumber = (raw: number) => {
    const next = clampNumber(Math.round(raw));
    onChange(next);
    onBlurCommit?.(next);
    setDraft(String(next));
  };

  return (
    <label className="devtools-field devtools-field-stepper">
      <span>{label}</span>
      <div className="stepper-control">
        <button className="devtools-btn tiny" type="button" onClick={() => commitNumber((Number(draft) || normalizedValue) - step)}>
          -
        </button>
        <input
          type="number"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value.trim() === '') return;
            const numeric = Number(e.target.value);
            if (!Number.isFinite(numeric)) return;
            onChange(clampNumber(Math.round(numeric)));
          }}
          onBlur={() => {
            if (draft.trim() === '') {
              commitNumber(fallbackValue);
              return;
            }
            const numeric = Number(draft);
            if (!Number.isFinite(numeric)) {
              commitNumber(fallbackValue);
              return;
            }
            commitNumber(numeric);
          }}
        />
        <button className="devtools-btn tiny" type="button" onClick={() => commitNumber((Number(draft) || normalizedValue) + step)}>
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
  const [deleteConfirmSpriteId, setDeleteConfirmSpriteId] = useState<string | null>(null);
  const [viewScale, setViewScale] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 420 });
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedSprite = sprites.find((sprite) => sprite.id === selectedSpriteId) ?? null;

  const getSpriteAnchors = (sprite: SpriteDefinition): Array<{ x: number; y: number }> => {
    return Array.isArray(sprite.anchors) ? sprite.anchors : [];
  };

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
    const selectedAnchors = selectedSprite ? getSpriteAnchors(selectedSprite) : [];
    const selectedConfirmedSprite =
      selectedSprite && selectedSprite.confirmed && selectedAnchors.length > 0
        ? selectedSprite
        : null;

    if (!selectedConfirmedSprite) {
      return { selectedConfirmedSprite: null, activeFrameIndex: null as number | null };
    }

    const anchors = getSpriteAnchors(selectedConfirmedSprite);

    if (anchors[selectedFrameIndex]) {
      return { selectedConfirmedSprite, activeFrameIndex: selectedFrameIndex };
    }

    if (
      lastMovedAnchor &&
      lastMovedAnchor.spriteId === selectedConfirmedSprite.id &&
      anchors[lastMovedAnchor.frameIndex]
    ) {
      return { selectedConfirmedSprite, activeFrameIndex: lastMovedAnchor.frameIndex };
    }

    return {
      selectedConfirmedSprite,
      activeFrameIndex: anchors.length > 0 ? 0 : null,
    };
  }, [lastMovedAnchor, selectedFrameIndex, selectedSprite]);

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

    const sprite = markerModel.selectedConfirmedSprite;
    if (sprite) {
      const anchors = getSpriteAnchors(sprite);
      for (let idx = 0; idx < anchors.length; idx += 1) {
        const anchor = anchors[idx];
        const left = anchor.x - sprite.frameWidth / 2;
        const top = anchor.y - sprite.frameHeight / 2;
        const right = left + sprite.frameWidth;
        const bottom = top + sprite.frameHeight;
        const isActiveFrame = markerModel.activeFrameIndex === idx;
        const frameStroke = isActiveFrame ? '#ff7b1f' : '#3f6f93aa';
        const anchorFill = isActiveFrame ? '#ff7b1f' : '#1ea7c8cc';
        const anchorDrawRadius = markerRadius; // Do not differentiate by size

        ctx.strokeStyle = isActiveFrame ? '#000000dd' : '#00000099';
        ctx.lineWidth = isActiveFrame ? baseLineWidth + 2 / viewScale : baseLineWidth + 1.2 / viewScale;
        ctx.strokeRect(left, top, sprite.frameWidth, sprite.frameHeight);

        ctx.strokeStyle = frameStroke;
        ctx.lineWidth = isActiveFrame ? baseLineWidth * 1.55 : baseLineWidth * 0.92;
        ctx.strokeRect(left, top, sprite.frameWidth, sprite.frameHeight);

        if (isActiveFrame) {
          ctx.fillStyle = '#ff7b1f22';
        } else {
          ctx.fillStyle = '#2f6ea014';
        }
        ctx.fillRect(left, top, sprite.frameWidth, sprite.frameHeight);

        if (isActiveFrame) {
          ctx.strokeStyle = '#facc1599';
          ctx.lineWidth = Math.max(1.6, 2 / viewScale);
          ctx.strokeRect(left - 1 / viewScale, top - 1 / viewScale, sprite.frameWidth + 2 / viewScale, sprite.frameHeight + 2 / viewScale);
        }

        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, anchorDrawRadius, 0, Math.PI * 2);
        ctx.fillStyle = anchorFill;
        ctx.fill();
        ctx.lineWidth = baseLineWidth;
        ctx.strokeStyle = '#020617';
        ctx.stroke();
        drawAnchorIcon(
          ctx,
          anchor.x,
          anchor.y,
          anchorDrawRadius * 0.7, // make it fit inside
          isActiveFrame ? '#0b1022' : '#10253a',
          Math.max(1.0, 1.4 / viewScale)
        );

        if (isActiveFrame) {
          const crossX = right;
          const crossY = bottom;
          const crossRadius = markerRadius;
          const crossLine = markerRadius * 0.65;

          ctx.beginPath();
          ctx.arc(crossX, crossY, crossRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
          ctx.lineWidth = baseLineWidth;
          ctx.strokeStyle = '#111827';
          ctx.stroke();
          drawCornerIcon(ctx, crossX, crossY, crossLine, '#111827', Math.max(1.8, 2.2 / viewScale));
        }
      }
    }

    ctx.restore();
  }, [atlasImage, canvasSize.height, canvasSize.width, markerModel.activeFrameIndex, markerModel.selectedConfirmedSprite, viewOffset.x, viewOffset.y, viewScale]);

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

    if (markerModel.selectedConfirmedSprite && markerModel.activeFrameIndex !== null) {
      const sprite = markerModel.selectedConfirmedSprite;
      const frameIndex = markerModel.activeFrameIndex;
      const anchors = getSpriteAnchors(sprite);
      if (anchors[frameIndex]) {
        const anchor = anchors[frameIndex];
        const cross = worldToUi(anchor.x + sprite.frameWidth / 2, anchor.y + sprite.frameHeight / 2);
        const dx = x - cross.x;
        const dy = y - cross.y;
        if (dx * dx + dy * dy <= MARKER_HIT_RADIUS_UI * MARKER_HIT_RADIUS_UI) {
          return { mode: 'crosshair', spriteId: sprite.id, frameIndex };
        }
      }
    }

    const sprite = markerModel.selectedConfirmedSprite;
    if (sprite) {
      const anchors = getSpriteAnchors(sprite);
      for (let i = 0; i < anchors.length; i += 1) {
        const anchorUi = worldToUi(anchors[i].x, anchors[i].y);
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
    if (!sprite) return;
    const currentAnchors = getSpriteAnchors(sprite);
    if (!currentAnchors[frameIndex]) return;

    const clampedX = clamp(worldX, sprite.frameWidth / 2, atlasImage.width - sprite.frameWidth / 2);
    const clampedY = clamp(worldY, sprite.frameHeight / 2, atlasImage.height - sprite.frameHeight / 2);

    const anchors = currentAnchors.map((point, idx) => (idx === frameIndex ? { x: clampedX, y: clampedY } : point));
    updateSprite(spriteId, { anchors, confirmed: true });
    setLastMovedAnchor({ spriteId, frameIndex });
    setSelectedFrameIndex(frameIndex);
  };

  const updateSpriteSizeFromCrosshair = (spriteId: string, frameIndex: number, worldX: number, worldY: number) => {
    if (!atlasImage) return;
    const sprite = sprites.find((item) => item.id === spriteId);
    if (!sprite) return;
    const anchors = getSpriteAnchors(sprite);
    if (!anchors[frameIndex]) return;

    const anchor = anchors[frameIndex];
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
    setSelectedFrameIndex(frameIndex);
  };

  const onCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!atlasImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hit = hitTestMarkers(event.clientX, event.clientY);
    canvas.setPointerCapture(event.pointerId);

    if (hit) {
      selectSprite(hit.spriteId);
      setSelectedFrameIndex(hit.frameIndex);
      setLastMovedAnchor({ spriteId: hit.spriteId, frameIndex: hit.frameIndex });
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

  const zoomBy = useCallback((factor: number, centerUiX?: number, centerUiY?: number) => {
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
  }, [viewOffset.x, viewOffset.y, viewScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const centerX = event.clientX - rect.left;
      const centerY = event.clientY - rect.top;
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomBy(factor, centerX, centerY);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoomBy]);

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
      setSelectedFrameIndex(0);
      setDeleteConfirmSpriteId(null);
    } catch (error: unknown) {
      setErrorText(error instanceof Error ? error.message : 'Не удалось импортировать JSON.');
    }
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
    setSelectedFrameIndex(0);
    setDeleteConfirmSpriteId(null);
  };

  const fitView = () => {
    if (!atlasImage) return;
    const fitScale = clamp(
      Math.min(canvasSize.width / atlasImage.width, canvasSize.height / atlasImage.height),
      VIEW_MIN_SCALE,
      VIEW_MAX_SCALE
    );
    setViewScale(fitScale);
    setViewOffset({
      x: (canvasSize.width - atlasImage.width * fitScale) / 2,
      y: (canvasSize.height - atlasImage.height * fitScale) / 2,
    });
  };

  const addFrame = () => {
    if (!selectedSprite || !atlasImage) return;
    const baseFrameCount = clampPositiveInt(selectedSprite.frameCount, 1);
    const frameCount = baseFrameCount + 1;
    const frameWidth = clampPositiveInt(selectedSprite.frameWidth, grid.cellWidth);
    const frameHeight = clampPositiveInt(selectedSprite.frameHeight, grid.cellHeight);
    const existingAnchors = getSpriteAnchors(selectedSprite);
    let anchors = existingAnchors.slice(0, frameCount);
    if (anchors.length < frameCount) {
      const initial = createInitialAnchors(frameCount, frameWidth, frameHeight, atlasImage.width, atlasImage.height);
      anchors = anchors.concat(initial.slice(anchors.length));
    }
    updateSprite(selectedSprite.id, { frameCount, frameWidth, frameHeight, anchors, confirmed: true });
    const newFrameIndex = frameCount - 1;
    setSelectedFrameIndex(newFrameIndex);
    setLastMovedAnchor({ spriteId: selectedSprite.id, frameIndex: newFrameIndex });
  };

  const defaultSpriteName = (sprite: SpriteDefinition): string => {
    const index = sprites.findIndex((item) => item.id === sprite.id);
    return `sprite_${Math.max(1, index + 1)}`;
  };

  const ensureSpriteDefaults = (sprite: SpriteDefinition, preferredFrameIndex = 0) => {
    if (!atlasImage) return;
    const frameCount = clampPositiveInt(sprite.frameCount, 1);
    const frameWidth = clampPositiveInt(sprite.frameWidth, grid.cellWidth);
    const frameHeight = clampPositiveInt(sprite.frameHeight, grid.cellHeight);
    const existingAnchors = getSpriteAnchors(sprite);
    let anchors = existingAnchors.slice(0, frameCount);
    if (anchors.length < frameCount) {
      const initial = createInitialAnchors(frameCount, frameWidth, frameHeight, atlasImage.width, atlasImage.height);
      anchors = anchors.concat(initial.slice(anchors.length));
    }
    const safeName = sprite.name?.trim() ? sprite.name : defaultSpriteName(sprite);
    updateSprite(sprite.id, {
      name: safeName,
      frameCount,
      frameWidth,
      frameHeight,
      anchors,
      confirmed: true,
    });
    const frameIndex = Math.max(0, Math.min(preferredFrameIndex, anchors.length - 1));
    setSelectedFrameIndex(frameIndex);
    setLastMovedAnchor({ spriteId: sprite.id, frameIndex });
  };

  const handleSelectSprite = (sprite: SpriteDefinition) => {
    selectSprite(sprite.id);
    setSelectedFrameIndex(0);
    setDeleteConfirmSpriteId(null);
    if (atlasImage) {
      ensureSpriteDefaults(sprite, 0);
      return;
    }
    setLastMovedAnchor(null);
  };

  const handleAddSprite = () => {
    addSprite();
    setSelectedFrameIndex(0);
    setDeleteConfirmSpriteId(null);
    setLastMovedAnchor(null);
  };

  const handleConfirmDelete = () => {
    if (!selectedSprite) return;
    deleteSprite(selectedSprite.id);
    setDeleteConfirmSpriteId(null);
  };

  const selectedSpriteFrameCount = selectedSprite ? clampPositiveInt(selectedSprite.frameCount, 1) : 0;
  const selectedSpriteFrameWidth = selectedSprite ? clampPositiveInt(selectedSprite.frameWidth, grid.cellWidth) : grid.cellWidth;
  const selectedSpriteFrameHeight = selectedSprite ? clampPositiveInt(selectedSprite.frameHeight, grid.cellHeight) : grid.cellHeight;

  return (
    <div className="devtools-page">
      <header className="devtools-header">
        <div className="devtools-header-brand">
          <a className="devtools-link subtle" href="#/">← В игру</a>
          <h1 className="devtools-title">Atlas Devtool</h1>
        </div>
        <div className="devtools-header-controls">
          <label className="devtools-file-btn">
            PNG
            <input type="file" accept="image/png,image/webp,image/jpeg" onChange={onAtlasFileChange} />
          </label>
          <label className="devtools-file-btn">
            JSON
            <input type="file" accept="application/json,.json" onChange={onImportDocumentChange} />
          </label>
          <button className="devtools-btn tiny" type="button" onClick={exportJson}>Экспорт</button>
          {atlasFileName ? (
            <span className="atlas-meta-text">{atlasFileName}{imageWidth ? ` · ${imageWidth}×${imageHeight}` : ''}</span>
          ) : null}
        </div>
        <div className="devtools-header-actions">
          <button className="devtools-btn tiny danger" onClick={resetTool} type="button">Сброс</button>
        </div>
      </header>

      {errorText ? <div className="devtools-error">{errorText}</div> : null}

      <div className="devtools-viewer">
        <div className="devtools-control-zone">
          <div className="devtools-top-bar">
            <div className="sprite-selector-bar">
              {sprites.map((sprite) => (
                <button
                  key={sprite.id}
                  type="button"
                  className={`sprite-chip${sprite.id === selectedSpriteId ? ' active' : ''}`}
                  onClick={() => handleSelectSprite(sprite)}
                >
                  {sprite.name || 'unnamed'}
                </button>
              ))}
              <button className="devtools-btn tiny" type="button" onClick={handleAddSprite}>+ Спрайт</button>
            </div>
          </div>

          <div className="devtools-edit-row">
            {selectedSprite ? (
              <div className="devtools-edit-split">
                <div className="devtools-edit-controls">
                  <label className="devtools-field compact-name-field">
                    <span>Имя</span>
                    <input
                      value={selectedSprite.name ?? ''}
                      onChange={(e) => updateSprite(selectedSprite.id, { name: e.target.value })}
                      onBlur={() => {
                        const safeName = selectedSprite.name?.trim() ? selectedSprite.name : defaultSpriteName(selectedSprite);
                        updateSprite(selectedSprite.id, { name: safeName });
                        if (atlasImage) ensureSpriteDefaults({ ...selectedSprite, name: safeName }, selectedFrameIndex);
                      }}
                    />
                  </label>
                  <NumberStepperField
                    label="Ширина"
                    value={selectedSpriteFrameWidth}
                    fallbackValue={grid.cellWidth}
                    min={1}
                    onChange={(next) => updateSprite(selectedSprite.id, { frameWidth: clampPositiveInt(next, selectedSpriteFrameWidth), confirmed: false })}
                    onBlurCommit={(next) => {
                      if (atlasImage) ensureSpriteDefaults({ ...selectedSprite, frameWidth: next }, selectedFrameIndex);
                    }}
                  />
                  <NumberStepperField
                    label="Высота"
                    value={selectedSpriteFrameHeight}
                    fallbackValue={grid.cellHeight}
                    min={1}
                    onChange={(next) => updateSprite(selectedSprite.id, { frameHeight: clampPositiveInt(next, selectedSpriteFrameHeight), confirmed: false })}
                    onBlurCommit={(next) => {
                      if (atlasImage) ensureSpriteDefaults({ ...selectedSprite, frameHeight: next }, selectedFrameIndex);
                    }}
                  />
                  <div className="delete-slot">
                    {deleteConfirmSpriteId === selectedSprite.id ? (
                      <>
                        <button className="devtools-btn tiny danger icon-btn delete-confirm-btn" type="button" title="Подтвердить удаление" onClick={handleConfirmDelete}>
                          <i className="fa-solid fa-check" aria-hidden="true" />
                        </button>
                        <button className="devtools-btn tiny icon-btn delete-cancel-btn" type="button" title="Отмена удаления" onClick={() => setDeleteConfirmSpriteId(null)}>
                          <i className="fa-solid fa-xmark" aria-hidden="true" />
                        </button>
                      </>
                    ) : (
                      <button
                        className="devtools-btn tiny danger icon-btn delete-trash-btn"
                        type="button"
                        title="Удалить спрайт"
                        onClick={() => setDeleteConfirmSpriteId(selectedSprite.id)}
                      >
                        <i className="fa-solid fa-trash-can" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="devtools-sprite-preview">
                  {atlasDataUrl && getSpriteAnchors(selectedSprite)[selectedFrameIndex] ? (
                    <div
                      className="sprite-preview-image"
                      style={{
                        width: `${selectedSpriteFrameWidth}px`,
                        height: `${selectedSpriteFrameHeight}px`,
                        backgroundImage: `url(${atlasDataUrl})`,
                        backgroundPosition: `-${getSpriteAnchors(selectedSprite)[selectedFrameIndex].x - selectedSpriteFrameWidth / 2}px -${getSpriteAnchors(selectedSprite)[selectedFrameIndex].y - selectedSpriteFrameHeight / 2}px`,
                        backgroundSize: `${imageWidth}px ${imageHeight}px`
                      }}
                    />
                  ) : <span className="devtools-hint">Нет превью</span>}
                </div>
              </div>
            ) : (
              <div className="devtools-edit-split empty">
                <span className="devtools-hint">Выберите или добавьте спрайт</span>
              </div>
            )}
          </div>

          <div className="frame-selector-bar">
            {selectedSprite ? (
              <>
                {Array.from({ length: selectedSpriteFrameCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`frame-chip${selectedFrameIndex === i ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedFrameIndex(i);
                      if (atlasImage) ensureSpriteDefaults(selectedSprite, i);
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="devtools-btn tiny" type="button" onClick={addFrame}>+ Кадр</button>
              </>
            ) : (
              <span className="devtools-hint">Выберите спрайт для просмотра кадров</span>
            )}
          </div>
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
            />
          ) : (
            <div className="devtools-atlas-placeholder">Загрузите атлас, чтобы включить редактор маркеров.</div>
          )}
        </div>

        <div className="viewer-toolbar under-atlas">
          <button className="devtools-btn tiny" type="button" onClick={() => zoomBy(1.15)}>+</button>
          <button className="devtools-btn tiny" type="button" onClick={() => zoomBy(1 / 1.15)}>−</button>
          <button className="devtools-btn tiny" type="button" onClick={fitView}>Fit</button>
          <span className="viewer-scale">{Math.round(viewScale * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
