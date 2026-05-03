import type {
  AtlasDocument,
  AtlasGridConfig,
  BackgroundRemovalConfig,
  SpriteDefinition,
} from './devtoolsTypes';

export interface AtlasFrame {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParsedFrameSpec {
  frameIndices: number[];
  error?: string;
}

const distanceSq = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
};

const toUniqueSorted = (values: number[]): number[] => {
  return [...new Set(values)].sort((a, b) => a - b);
};

export const parseFrameSpec = (value: string, maxFrameIndex: number): ParsedFrameSpec => {
  if (!value.trim()) {
    return { frameIndices: [], error: 'Укажите хотя бы один номер кадра.' };
  }

  const pieces = value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (pieces.length === 0) {
    return { frameIndices: [], error: 'Укажите хотя бы один номер кадра.' };
  }

  const result: number[] = [];

  for (const piece of pieces) {
    const rangeMatch = piece.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start > end) {
        return { frameIndices: [], error: `Неверный диапазон: ${piece}` };
      }
      for (let n = start; n <= end; n += 1) {
        result.push(n);
      }
      continue;
    }

    const singleMatch = piece.match(/^\d+$/);
    if (singleMatch) {
      result.push(Number(piece));
      continue;
    }

    return { frameIndices: [], error: `Не удалось разобрать часть: ${piece}` };
  }

  const normalized = toUniqueSorted(result);

  const invalid = normalized.find((n) => n < 1 || n > maxFrameIndex);
  if (invalid !== undefined) {
    return {
      frameIndices: [],
      error: `Кадр ${invalid} вне диапазона 1..${maxFrameIndex}.`,
    };
  }

  return { frameIndices: normalized };
};

export const buildFrames = (grid: AtlasGridConfig): AtlasFrame[] => {
  const frames: AtlasFrame[] = [];
  const total = grid.columns * grid.rows;

  for (let idx = 0; idx < total; idx += 1) {
    const col = idx % grid.columns;
    const row = Math.floor(idx / grid.columns);
    const x = grid.offsetX + col * (grid.cellWidth + grid.gapX);
    const y = grid.offsetY + row * (grid.cellHeight + grid.gapY);
    frames.push({
      index: idx + 1,
      x,
      y,
      width: grid.cellWidth,
      height: grid.cellHeight,
    });
  }

  return frames;
};

export const getBackgroundColorAtTopLeft = (imageData: ImageData): [number, number, number] => {
  const d = imageData.data;
  return [d[0], d[1], d[2]];
};

export const removeBackground = (
  imageData: ImageData,
  config: BackgroundRemovalConfig
): ImageData => {
  if (!config.enabled || config.tolerance <= 0) {
    return imageData;
  }

  const [bgR, bgG, bgB] = getBackgroundColorAtTopLeft(imageData);
  const maxDistanceSq = config.tolerance * config.tolerance;

  const copy = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const data = copy.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    if (distanceSq(r, g, b, bgR, bgG, bgB) <= maxDistanceSq) {
      data[i + 3] = 0;
    }
  }

  return copy;
};

export const clampPositiveInt = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : fallback;
};

export const createSpriteLabel = (index: number): string => `sprite_${String(index).padStart(2, '0')}`;

export const createDefaultSprite = (index: number): SpriteDefinition => ({
  id: `sprite-${index}`,
  name: createSpriteLabel(index),
  frameSpec: String(index),
  fps: 6,
  loop: true,
});

export const toAtlasDocument = (
  atlasFileName: string,
  imageSize: { width: number; height: number },
  grid: AtlasGridConfig,
  backgroundRemoval: BackgroundRemovalConfig,
  sprites: SpriteDefinition[]
): AtlasDocument => {
  const maxFrameIndex = grid.columns * grid.rows;
  return {
    schemaVersion: 1,
    atlasFileName,
    imageWidth: imageSize.width,
    imageHeight: imageSize.height,
    grid,
    backgroundRemoval,
    sprites: sprites.map((sprite) => {
      const parsed = parseFrameSpec(sprite.frameSpec, maxFrameIndex);
      const frames = parsed.error ? [] : parsed.frameIndices;
      return {
        id: sprite.id,
        name: sprite.name,
        frameSpec: sprite.frameSpec,
        frameIndices: frames,
        fps: sprite.fps,
        loop: sprite.loop,
        type: frames.length > 1 ? 'animated' : 'static',
      };
    }),
    createdAt: new Date().toISOString(),
  };
};