import { GameState, LevelData, ProbeState, GameObject, Vector2D, Epoch } from '../types';

// Deterministic PRNG
export function createPRNG(seed: number) {
  let s = seed;
  return function() {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const G = 15; // Extremely reduced for near-perfect straight lines
export const PHYSICS_WIDTH = 1600;
export const PHYSICS_HEIGHT = 900;

export class GameEngine {
  gameState: GameState;
  probe: ProbeState;
  levelData: LevelData;
  timeScale: number = 1.0;
  lastTeleportTime: number = 0;

  constructor(level: number = 1) {
    this.gameState = {
      level,
      epoch: this.getEpochForLevel(level),
      heat: 0,
      integrity: 100,
      status: 'preview',
      score: 0,
      timeScale: 1.0,
    };

    this.levelData = this.generateLevel(level);
    this.probe = {
      pos: { ...this.levelData.startPos },
      prevPos: { ...this.levelData.startPos },
      radius: 8,
      isWaveState: false,
      launched: false,
    };
  }

  getEpochForLevel(level: number): Epoch {
    if (level <= 10) return 'Classical';
    if (level <= 20) return 'Quantum';
    if (level <= 30) return 'Relativity';
    return 'Thermal';
  }

  generateLevel(level: number): LevelData {
    const rng = createPRNG(level * 1337 + 42);
    const epoch = this.getEpochForLevel(level);
    
    // Position Goal - Semi-Fixed for better solve rates
    const goalPos = {
      x: PHYSICS_WIDTH * 0.82,
      y: PHYSICS_HEIGHT * (0.3 + rng() * 0.4),
    };

    let objects: GameObject[] = [];
    let solvedTrajectory: Vector2D[] = [];

    // Attempt to generate a solvable level
    for (let attempt = 0; attempt < 20; attempt++) {
        objects = [];
        // Determine obstacle count: progressive 2-5 within the epoch
        const progressionIndex = (level - 1) % 10; // 0..9
        const obstacleCount = Math.min(5, 2 + Math.floor(progressionIndex / 3));

        // Create epoch-specific focused list
        for (let i = 0; i < obstacleCount; i++) {
            const typeValue = rng();
            let type: GameObject['type'] = 'Planet';

            if (epoch === 'Classical') {
                type = 'Planet';
            } else if (epoch === 'Quantum') {
                type = typeValue < 0.7 ? 'Sensor' : 'Asteroid';
            } else if (epoch === 'Relativity') {
                type = typeValue < 0.8 ? 'Portal' : 'Planet';
            } else { // Thermal
                type = typeValue < 0.7 ? 'Planet' : 'ColdSink';
            }

            const x = PHYSICS_WIDTH * (0.3 + i * 0.12) + rng() * 50;
            const y = PHYSICS_HEIGHT * (0.15 + rng() * 0.7);

            if (type === 'Planet') {
                const isSingularity = i === 0 && level % 10 === 0;
                objects.push({
                    id: `obj-${i}`,
                    pos: { x, y },
                    radius: isSingularity ? 70 : 35 + rng() * 20,
                    type,
                    mass: isSingularity ? 4000 : 800 + rng() * 1200
                });
            } else if (type === 'Sensor') {
                objects.push({
                    id: `obj-${i}`,
                    pos: { x, y },
                    radius: 12,
                    type,
                    angle: rng() * Math.PI * 2,
                    beamWidth: Math.PI / 6
                });
            } else if (type === 'Asteroid') {
                objects.push({
                    id: `obj-${i}`,
                    pos: { x, y },
                    radius: 20 + rng() * 15,
                    type
                });
            } else if (type === 'Portal') {
                // Portals need pairs
                const idA = `portal-${i}-a`;
                const idB = `portal-${i}-b`;
                objects.push({ id: idA, pos: { x, y }, radius: 25, type: 'Portal', targetId: idB });
                objects.push({ id: idB, pos: { x: x + 150, y: PHYSICS_HEIGHT - y }, radius: 25, type: 'Portal', targetId: idA });
                i++; // Consumes 2 slots
            } else if (type === 'ColdSink') {
                objects.push({ id: `obj-${i}`, pos: { x, y }, radius: 140, type });
            }
        }

        // --- SOLVER ---
        // Brute force check: can we hit the goal?
        // We test a sweep of angles and powers
        let foundSolution = false;
        const startPos = { x: 120, y: PHYSICS_HEIGHT / 2 };
        
        for (let angle = -0.6; angle < 0.6; angle += 0.1) {
            for (let power = 10; power < 25; power += 2) {
                const vel = { x: Math.cos(angle) * power, y: Math.sin(angle) * power };
                const traj = this.simulateTrajectory(startPos, vel, objects, goalPos);
                if (traj.success) {
                   solvedTrajectory = traj.points;
                   foundSolution = true;
                   break;
                }
            }
            if (foundSolution) break;
        }

        if (foundSolution) break;
        // If we reach here without a solution, we loop again and regenerate shapes
    }

    return {
      objects,
      startPos: { x: 120, y: PHYSICS_HEIGHT / 2 },
      goalPos,
      solvedTrajectory
    };
  }

  // Pure simulation for the generator
  simulateTrajectory(start: Vector2D, velocity: Vector2D, objects: GameObject[], goal: Vector2D): { success: boolean, points: Vector2D[] } {
    let p = { ...start };
    let prev = { x: p.x - velocity.x, y: p.y - velocity.y };
    const points: Vector2D[] = [];
    
    for (let i = 0; i < 400; i++) {
        let ax = 0; let ay = 0;
        for (const obj of objects) {
            if (obj.type === 'Planet' && obj.mass) {
                const dx = obj.pos.x - p.x;
                const dy = obj.pos.y - p.y;
                const dSq = dx*dx + dy*dy;
                const d = Math.sqrt(dSq);
                if (d < obj.radius) return { success: false, points }; // Crash
                const f = (G * obj.mass) / dSq;
                ax += (dx/d) * f; ay += (dy/d) * f;
            }
            if (obj.type === 'Asteroid') {
                const d = Math.sqrt(Math.pow(obj.pos.x - p.x, 2) + Math.pow(obj.pos.y - p.y, 2));
                if (d < obj.radius + 8) return { success: false, points }; // Crash (assuming particle state)
            }
        }

        const nextX = p.x + (p.x - prev.x) + ax;
        const nextY = p.y + (p.y - prev.y) + ay;
        prev = { ...p };
        p = { x: nextX, y: nextY };
        points.push({ ...p });

        if (p.x < 0 || p.x > PHYSICS_WIDTH || p.y < 0 || p.y > PHYSICS_HEIGHT) return { success: false, points };

        const dGoal = Math.sqrt(Math.pow(p.x - goal.x, 2) + Math.pow(p.y - goal.y, 2));
        if (dGoal < 30) return { success: true, points };
    }
    return { success: false, points };
  }

  update(dt: number) {
    if (this.gameState.status !== 'playing' || !this.probe.launched) return;

    // Apply Relativity time dilation
    if (this.gameState.epoch === 'Relativity' || this.gameState.epoch === 'Thermal') {
      const vx = this.probe.pos.x - this.probe.prevPos.x;
      const vy = this.probe.pos.y - this.probe.prevPos.y;
      const speed = Math.sqrt(vx * vx + vy * vy) / dt;
      const c = 800; // Mock speed of light
      this.timeScale = Math.max(0.4, 1.0 - (speed / c));
    } else {
      this.timeScale = 1.0;
    }

    const effectiveDt = dt * this.timeScale;

    // Verlet Step
    const currentX = this.probe.pos.x;
    const currentY = this.probe.pos.y;
    
    let accX = 0;
    let accY = 0;

    // Gravity
    for (const obj of this.levelData.objects) {
        if (obj.type === 'Planet' && obj.mass) {
            const dx = obj.pos.x - currentX;
            const dy = obj.pos.y - currentY;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);
            
            if (dist > obj.radius) {
            const force = (G * obj.mass) / distSq;
            accX += (dx / dist) * force;
            accY += (dy / dist) * force;
            }
        }
    }

    // Verlet Integration
    const nextX = currentX + (currentX - this.probe.prevPos.x) + accX * effectiveDt * effectiveDt;
    const nextY = currentY + (currentY - this.probe.prevPos.y) + accY * effectiveDt * effectiveDt;

    this.probe.prevPos = { x: currentX, y: currentY };
    this.probe.pos = { x: nextX, y: nextY };

    // Update Sensors
    for (const obj of this.levelData.objects) {
        if (obj.type === 'Sensor' && obj.angle !== undefined) {
            obj.angle += 0.02 * effectiveDt;
        }
    }

    // Thermal Logic
    if (this.gameState.epoch === 'Thermal') {
      if (this.probe.isWaveState) {
        this.gameState.heat += 0.12 * effectiveDt;
      }
      
      // Area based cooling for Cold Sinks
      for (const obj of this.levelData.objects) {
        if (obj.type === 'ColdSink') {
          const dx = currentX - obj.pos.x;
          const dy = currentY - obj.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < obj.radius) {
            this.gameState.heat = Math.max(0, this.gameState.heat - 0.35 * effectiveDt);
          }
        }
      }
    }

    // Collisions and Triggers
    this.checkCollisions();
    
    // Boundaries
    if (this.probe.pos.x < 0 || this.probe.pos.x > PHYSICS_WIDTH || 
        this.probe.pos.y < 0 || this.probe.pos.y > PHYSICS_HEIGHT) {
      this.gameState.status = 'lost';
    }
  }

  checkCollisions() {
    const { pos, radius, isWaveState } = this.probe;

    // Goal
    const distToGoal = Math.sqrt(
      Math.pow(pos.x - this.levelData.goalPos.x, 2) + 
      Math.pow(pos.y - this.levelData.goalPos.y, 2)
    );
    if (distToGoal < radius + 20) {
      this.gameState.status = 'won';
      return;
    }

    for (const obj of this.levelData.objects) {
      const dx = pos.x - obj.pos.x;
      const dy = pos.y - obj.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius + obj.radius) {
        if (obj.type === 'Planet') {
          this.gameState.status = 'lost';
        }
        if (obj.type === 'Asteroid') {
          if (!isWaveState) {
            this.gameState.status = 'lost';
          }
        }
        if (obj.type === 'Portal' && obj.targetId) {
            const now = Date.now();
            if (now - this.lastTeleportTime > 1000) {
                const target = this.levelData.objects.find(o => o.id === obj.targetId);
                if (target) {
                    const vx = this.probe.pos.x - this.probe.prevPos.x;
                    const vy = this.probe.pos.y - this.probe.prevPos.y;
                    this.probe.pos = { x: target.pos.x, y: target.pos.y };
                    this.probe.prevPos = { x: target.pos.x - vx, y: target.pos.y - vy };
                    this.lastTeleportTime = now;
                }
            }
        }
      }
      
      // Observer Sensor logic - FIX: Only detects particles (Waves pass through)
      if (obj.type === 'Sensor' && !isWaveState && obj.angle !== undefined && obj.beamWidth !== undefined) {
        const angleToProbe = Math.atan2(dy, dx);
        let diff = Math.abs(angleToProbe - obj.angle) % (Math.PI * 2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        
        if (dist < 400 && diff < obj.beamWidth / 2) {
          this.gameState.status = 'lost';
        }
      }
    }

    if (this.gameState.heat >= 100) {
      this.gameState.status = 'lost';
    }
  }

  toggleState() {
    this.probe.isWaveState = !this.probe.isWaveState;
    if (this.gameState.epoch === 'Thermal') {
      this.gameState.heat += 10;
    }
  }

  launch(velocity: Vector2D) {
    this.probe.launched = true;
    this.gameState.status = 'playing';
    this.probe.prevPos = {
      x: this.probe.pos.x - velocity.x,
      y: this.probe.pos.y - velocity.y,
    };
  }

  getTrajectory(velocity: Vector2D, points: number = 200): Vector2D[] {
    const trajectory: Vector2D[] = [];
    let tempPos = { ...this.probe.pos };
    let tempPrevPos = {
      x: tempPos.x - velocity.x,
      y: tempPos.y - velocity.y,
    };

    for (let i = 0; i < points; i++) {
        let accX = 0;
        let accY = 0;

        for (const obj of this.levelData.objects) {
            if (obj.type === 'Planet' && obj.mass) {
                const dx = obj.pos.x - tempPos.x;
                const dy = obj.pos.y - tempPos.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                if (dist > obj.radius) {
                    const force = (G * obj.mass) / distSq;
                    accX += (dx / dist) * force;
                    accY += (dy / dist) * force;
                }
            }
        }

        const nextX = tempPos.x + (tempPos.x - tempPrevPos.x) + accX;
        const nextY = tempPos.y + (tempPos.y - tempPrevPos.y) + accY;

        tempPrevPos = { ...tempPos };
        tempPos = { x: nextX, y: nextY };
        
        trajectory.push({ ...tempPos });

        if (tempPos.x < -200 || tempPos.x > PHYSICS_WIDTH + 200 || tempPos.y < -200 || tempPos.y > PHYSICS_HEIGHT + 200) break;
        
        const distToGoal = Math.sqrt(
            Math.pow(tempPos.x - this.levelData.goalPos.x, 2) + 
            Math.pow(tempPos.y - this.levelData.goalPos.y, 2)
        );
        if (distToGoal < 30) break;
    }

    return trajectory;
  }

  reset() {
    this.gameState.status = 'preview';
    this.gameState.heat = 0;
    this.gameState.integrity = 100;
    this.probe = {
      pos: { ...this.levelData.startPos },
      prevPos: { ...this.levelData.startPos },
      radius: 8,
      isWaveState: false,
      launched: false,
    };
  }
}
