export interface AtlasGridConfig {
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  gapX: number;
  gapY: number;
  columns: number;
  rows: number;
}

export interface BackgroundRemovalConfig {
  enabled: boolean;
  tolerance: number;
}

export interface SpriteDefinition {
  id: string;
  name: string;
  frameSpec: string;
  fps: number;
  loop: boolean;
}

export interface AtlasDocument {
  schemaVersion: 1;
  atlasFileName: string;
  imageWidth: number;
  imageHeight: number;
  grid: AtlasGridConfig;
  backgroundRemoval: BackgroundRemovalConfig;
  sprites: Array<{
    id: string;
    name: string;
    frameSpec: string;
    frameIndices: number[];
    fps: number;
    loop: boolean;
    type: 'static' | 'animated';
  }>;
  createdAt: string;
}