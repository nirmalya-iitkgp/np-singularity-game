export type Epoch = 'Classical' | 'Quantum' | 'Relativity' | 'Thermal';

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  pos: Vector2D;
  radius: number;
  type: 'Planet' | 'Asteroid' | 'Goal' | 'Sensor' | 'ColdSink' | 'Portal';
  mass?: number; // For gravity
  angle?: number; // For sensors
  beamWidth?: number; // For sensors
  targetId?: string; // For Portals
}

export interface ProbeState {
  pos: Vector2D;
  prevPos: Vector2D;
  radius: number;
  isWaveState: boolean;
  launched: boolean;
}

export interface GameState {
  level: number;
  epoch: Epoch;
  heat: number;
  integrity: number;
  status: 'playing' | 'preview' | 'won' | 'lost';
  score: number;
  timeScale: number;
}

export interface LevelData {
  objects: GameObject[];
  startPos: Vector2D;
  goalPos: Vector2D;
  solvedTrajectory?: Vector2D[];
}
