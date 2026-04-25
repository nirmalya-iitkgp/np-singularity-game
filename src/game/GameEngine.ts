import { GameState, LevelData, ProbeState, GameObject, Vector2D, Epoch } from '../types';

// Deterministic PRNG
export function createPRNG(seed: number) {
  let s = seed;
  return function() {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Constants
export const PHYSICS_WIDTH = 1600;
export const PHYSICS_HEIGHT = 900;
export const G = 8;
const TRAJECTORY_POINTS = 80;
const SWITCH_COOLDOWN_TIME = 2.0;
const SOFTENING_RADIUS = 20;
const MAX_VELOCITY_STEP = 25;

export class GameEngine {
  gameState: GameState;
  probe: ProbeState;
  levelData: LevelData;
  timeScale: number = 1.0;
  lastDt: number = 1.0;
  lastTeleportTime: number = 0;
  
  // Optimization: Cache trajectory
  private cachedTrajectoryVelocity: Vector2D = { x: 0, y: 0 };
  private cachedTrajectory: Vector2D[] = [];

  constructor(level: number = 1) {
    this.gameState = {
      level,
      epoch: this.getEpochForLevel(level),
      integrity: 100,
      status: 'preview',
      score: 0,
      stardust: 0,
      requiredStardust: 15 + (level * 5),
      optimumScore: 0,
      timeScale: 1.0,
      heat: 0,
      switchCooldown: 0,
      goalCollected: false,
      launches: 0,
      fragmentsCollected: 0,
      totalFragments: 0,
      levelStartTime: Date.now(),
      sessionTimeLeft: 60,
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
    if (level <= 20) return 'Relativity';
    return 'Thermal';
  }

  generateLevel(level: number): LevelData {
    const rng = createPRNG(level * 4321 + 7);
    
    // Explicit Goal Target
    const goalPos = {
      x: PHYSICS_WIDTH * 0.85,
      y: PHYSICS_HEIGHT * (0.2 + rng() * 0.6),
    };

    let objects: GameObject[] = [];
    let dustPlaced = 0;

    // Simplified logic: Only Planets and Portals
    const planetCount = 3 + Math.min(3, Math.floor(level / 4));
    const portalCount = level > 5 ? Math.min(2, Math.floor((level - 5) / 5)) : 0;

    const requiredDust = 15 + (level * 5);
    const targetDust = requiredDust * 2;

    // Place Planets
    for (let i = 0; i < planetCount; i++) {
        const x = PHYSICS_WIDTH * (0.15 + (i/planetCount) * 0.7) + (rng() - 0.5) * 100;
        const y = PHYSICS_HEIGHT * (0.15 + rng() * 0.7);
        
        const radius = 45 + rng() * 35;
        const mass = 1200 + rng() * 2000;
        const planetColors = ['#4444ff', '#ff4444', '#44ff44', '#ff8844', '#00f0ff', '#f000ff'];
        
        objects.push({ 
            id: `planet-${i}`, 
            pos: { x, y }, 
            radius, 
            type: 'Planet', 
            mass,
            color: planetColors[Math.floor(rng() * planetColors.length)]
        });

        // Dust rings: ensure we put plenty of dust
        const dustInRing = Math.floor(targetDust / planetCount) + 5;
        for (let j = 0; j < dustInRing; j++) {
            const angle = (j / dustInRing) * Math.PI * 2 + rng();
            const dist = radius + 40 + rng() * 60;
            objects.push({
                id: `dust-${i}-${j}`,
                pos: { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist },
                radius: 4, type: 'Stardust', collected: false
            });
            dustPlaced++;
        }
    }

    // Place Portals (Wormholes)
    for (let i = 0; i < portalCount; i++) {
        const idA = `portal-${i}-a`; 
        const idB = `portal-${i}-b`;
        const xA = PHYSICS_WIDTH * (0.2 + rng() * 0.2);
        const yA = PHYSICS_HEIGHT * (0.2 + rng() * 0.6);
        const xB = PHYSICS_WIDTH * (0.6 + rng() * 0.2);
        const yB = PHYSICS_HEIGHT * (0.2 + rng() * 0.6);

        objects.push({ id: idA, pos: { x: xA, y: yA }, radius: 35, type: 'Portal', targetId: idB });
        objects.push({ id: idB, pos: { x: xB, y: yB }, radius: 35, type: 'Portal', targetId: idA });
    }

    // Place Data Fragments
    const fragmentCount = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < fragmentCount; i++) {
      const fx = PHYSICS_WIDTH * (0.2 + rng() * 0.6);
      const fy = PHYSICS_HEIGHT * (0.1 + rng() * 0.8);
      objects.push({
        id: `fragment-${i}`,
        pos: { x: fx, y: fy },
        radius: 12,
        type: 'DataFragment',
        collected: false
      });
    }

    this.gameState.totalFragments = fragmentCount;
    this.gameState.requiredStardust = requiredDust;
    this.gameState.optimumScore = (dustPlaced * 10) + (fragmentCount * 5000) + 5000;

    return {
      objects,
      startPos: { x: 80, y: PHYSICS_HEIGHT / 2 },
      goalPos,
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

    // Handle session timer
    if (this.gameState.status === 'playing') {
      this.gameState.sessionTimeLeft -= dt / 60; // dt is approx 1, so divide by 60 frames
      if (this.gameState.sessionTimeLeft <= 0) {
        this.gameState.sessionTimeLeft = 0;
        this.gameState.status = 'lost';
        this.gameState.failureReason = 'Session Timeout: Loop Synchronization Failed';
      }
    }

    // Heat and Cooldown Logic
    if (this.gameState.switchCooldown > 0) {
      this.gameState.switchCooldown -= dt / 60; 
    }

    // Natural Cooling (Faster in Wave State)
    const cooldownRate = this.probe.isWaveState ? 0.3 * dt : 0.08 * dt;
    this.gameState.heat = Math.max(0, this.gameState.heat - cooldownRate);

    if (this.gameState.heat >= 100) {
        this.gameState.status = 'lost';
        this.gameState.failureReason = 'overheated';
        return;
    }

    // Fixed internal physics step for stability
    const effectiveDt = dt * 1.0; 
    const dtRatio = effectiveDt / this.lastDt;

    // Verlet Step
    const currentX = this.probe.pos.x;
    const currentY = this.probe.pos.y;
    
    let accX = 0;
    let accY = 0;

    // Gravity
    const objects = this.levelData.objects;
    const len = objects.length;
    for (let i = 0; i < len; i++) {
        const obj = objects[i];
        if (obj.type === 'Planet' && obj.mass) {
            const dx = obj.pos.x - currentX;
            const dy = obj.pos.y - currentY;
            const distSq = dx * dx + dy * dy;
            
            // Gravity with softening to prevent infinite acceleration near core
            const dist = Math.sqrt(distSq + SOFTENING_RADIUS * SOFTENING_RADIUS);
            const force = (G * obj.mass) / (dist * dist * dist); 
            accX += dx * force;
            accY += dy * force;
        }
    }

    const dtSq = effectiveDt * effectiveDt;
    // Time-Corrected Verlet
    let nextX = currentX + (currentX - this.probe.prevPos.x) * dtRatio + accX * dtSq;
    let nextY = currentY + (currentY - this.probe.prevPos.y) * dtRatio + accY * dtSq;

    // Velocity Capping for stability
    const dx = nextX - currentX;
    const dy = nextY - currentY;
    const stepDistSq = dx * dx + dy * dy;
    if (stepDistSq > MAX_VELOCITY_STEP * MAX_VELOCITY_STEP) {
        const stepDist = Math.sqrt(stepDistSq);
        nextX = currentX + (dx / stepDist) * MAX_VELOCITY_STEP;
        nextY = currentY + (dy / stepDist) * MAX_VELOCITY_STEP;
    }

    this.probe.prevPos = { x: currentX, y: currentY };
    this.probe.pos = { x: nextX, y: nextY };
    this.lastDt = effectiveDt;

    // Collisions
    this.checkCollisions(effectiveDt);
    
    // Boundaries
    const { pos } = this.probe;

    // ALL BORDERS REFLECT (Elastic, no speed change)
    if (pos.y < 0) {
        this.reflectProbe(0, -1, 1.0); 
        this.probe.pos.y = 1;
        this.gameState.heat += 2;
    } else if (pos.y > PHYSICS_HEIGHT) {
        this.reflectProbe(0, 1, 1.0); 
        this.probe.pos.y = PHYSICS_HEIGHT - 1;
        this.gameState.heat += 2;
    } else if (pos.x < 0) {
        this.reflectProbe(-1, 0, 1.0); 
        this.probe.pos.x = 1;
        this.gameState.heat += 2;
    } else if (pos.x > PHYSICS_WIDTH) {
        this.reflectProbe(1, 0, 1.0); 
        this.probe.pos.x = PHYSICS_WIDTH - 1;
        this.gameState.heat += 2;
    }
  }

  reflectProbe(nx: number, ny: number, multiplier: number = 1.0) {
    const vx = this.probe.pos.x - this.probe.prevPos.x;
    const vy = this.probe.pos.y - this.probe.prevPos.y;
    
    const dot = vx * nx + vy * ny;
    
    // Reflect velocity: v' = v - 2(v.n)n
    const rvx = (vx - 2 * dot * nx) * multiplier;
    const rvy = (vy - 2 * dot * ny) * multiplier;
    
    // In Verlet, velocity is pos - prevPos.
    // If we want new velocity to be rvx, rvy, we must set prevPos relative to current pos.
    this.probe.prevPos = {
        x: this.probe.pos.x - rvx,
        y: this.probe.pos.y - rvy
    };
  }

  calcDistSq(p1: Vector2D, p2: Vector2D) {
    return Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
  }

  checkCollisions(dt: number = 1) {
    const { pos, radius } = this.probe;

    const distToGoalSq = this.calcDistSq(pos, this.levelData.goalPos);
    
    // Win check
    if (distToGoalSq < 48 * 48) {
       if (this.gameState.stardust >= this.gameState.requiredStardust) {
           this.gameState.status = 'won';
           
           const timeTaken = (Date.now() - this.gameState.levelStartTime) / 1000;
           const timeBonus = Math.max(0, 10000 - Math.floor(timeTaken * 50));
           const launchBonus = Math.max(0, 5000 - (this.gameState.launches - 1) * 1000);
           const fragmentMultiplier = 1.0 + (this.gameState.fragmentsCollected * 0.5);
           
           this.gameState.score = Math.floor((this.gameState.score + timeBonus + launchBonus) * fragmentMultiplier);
       } else {
           // Eye Magnetism or slow collection if hovering near
           this.gameState.stardust += 2 * dt / 60;
           this.gameState.score += 2;

           if (distToGoalSq < 35 * 35 && this.gameState.stardust < this.gameState.requiredStardust) {
              this.gameState.status = 'lost';
              this.gameState.failureReason = 'insufficient_yield';
           }
       }
       return;
    }

    const objects = this.levelData.objects;
    const len = objects.length;
    for (let i = 0; i < len; i++) {
        const obj = objects[i];
        const dx = pos.x - obj.pos.x;
        const dy = pos.y - obj.pos.y;
        const distSq = dx * dx + dy * dy;
        const combinedRadius = radius + obj.radius;

        if (distSq < combinedRadius * combinedRadius) {
            // Data Fragment Collection
            if (obj.type === 'DataFragment' && !obj.collected) {
               obj.collected = true;
               this.gameState.fragmentsCollected++;
               this.gameState.score += 1000;
               // Bonus Stardust system: +15 stardust per fragment to help overcome quota
               this.gameState.stardust += 15;
            }

            // Stardust Collection
            if (obj.type === 'Stardust' && !obj.collected) {
               obj.collected = true;
               this.gameState.stardust += 1;
               this.gameState.score += 10;
            }

            // Planet Collision
            if (obj.type === 'Planet') {
              if (distSq < (combinedRadius * 0.95) * (combinedRadius * 0.95)) {
                 const dist = Math.sqrt(distSq);
                 this.reflectProbe(dx/dist, dy/dist, 1.0);
                 this.triggerCollision();
                 this.gameState.heat += this.probe.isWaveState ? 2 : 8;

                 const overstep = combinedRadius - dist + 2;
                 const invDist = 1 / dist;
                 this.probe.pos.x += dx * invDist * overstep;
                 this.probe.pos.y += dy * invDist * overstep;
                 return;
              }
            }

            // Portal Logic
            if (obj.type === 'Portal' && obj.targetId) {
                const now = Date.now();
                if (now - this.lastTeleportTime > 800) {
                    const target = objects.find(o => o.id === obj.targetId);
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
    }
  }

  // Effect Trigger for Visual Interface
  collided: boolean = false;
  triggerCollision() {
    this.collided = true;
    setTimeout(() => { this.collided = false; }, 200);
  }

  toggleState() {
    if (this.gameState.switchCooldown > 0) return;
    this.probe.isWaveState = !this.probe.isWaveState;
    this.gameState.switchCooldown = SWITCH_COOLDOWN_TIME;
  }

  launch(velocity: Vector2D) {
    if (!this.probe.launched) {
      this.gameState.levelStartTime = Date.now();
    }
    this.gameState.launches++;
    this.probe.launched = true;
    this.gameState.status = 'playing';
    this.probe.prevPos = {
      x: this.probe.pos.x - velocity.x,
      y: this.probe.pos.y - velocity.y,
    };
  }

  getTrajectory(velocity: Vector2D, points: number = TRAJECTORY_POINTS): Vector2D[] {
    // Optimization: Check if velocity changed significantly
    const dvx = Math.abs(velocity.x - this.cachedTrajectoryVelocity.x);
    const dvy = Math.abs(velocity.y - this.cachedTrajectoryVelocity.y);
    
    if (dvx < 0.001 && dvy < 0.001 && this.cachedTrajectory.length > 0) {
      return this.cachedTrajectory;
    }

    const trajectory: Vector2D[] = [];
    let tempX = this.probe.pos.x;
    let tempY = this.probe.pos.y;
    let prevX = tempX - velocity.x;
    let prevY = tempY - velocity.y;

    const objects = this.levelData.objects;
    const len = objects.length;
    const goalX = this.levelData.goalPos.x;
    const goalY = this.levelData.goalPos.y;

    const dt = 1.6;
    const dtSq = dt * dt;

    for (let i = 0; i < points; i++) {
        let accX = 0;
        let accY = 0;

        for (let j = 0; j < len; j++) {
            const obj = objects[j];
            if (obj.type === 'Planet' && obj.mass) {
                const dx = obj.pos.x - tempX;
                const dy = obj.pos.y - tempY;
                const distSq = dx * dx + dy * dy;
                
                const dist = Math.sqrt(distSq + SOFTENING_RADIUS * SOFTENING_RADIUS);
                const force = (G * obj.mass) / (distSq * dist);
                accX += dx * force;
                accY += dy * force;
            }
        }

        const nextX = tempX + (tempX - prevX) + accX * dtSq;
        const nextY = tempY + (tempY - prevY) + accY * dtSq;

        prevX = tempX;
        prevY = tempY;
        tempX = nextX;
        tempY = nextY;
        
        trajectory.push({ x: tempX, y: tempY });

        if (tempX < -200 || tempX > PHYSICS_WIDTH + 200 || tempY < -200 || tempY > PHYSICS_HEIGHT + 200) break;
        
        const dxGoal = tempX - goalX;
        const dyGoal = tempY - goalY;
        if (dxGoal * dxGoal + dyGoal * dyGoal < 900) break;
    }

    this.cachedTrajectoryVelocity = { ...velocity };
    this.cachedTrajectory = trajectory;
    return trajectory;
  }

  reset() {
    this.gameState.status = 'preview';
    this.gameState.integrity = 100;
    this.gameState.heat = 0;
    this.gameState.stardust = 0;
    this.gameState.score = 0;
    this.gameState.launches = 0;
    this.gameState.fragmentsCollected = 0;
    this.gameState.sessionTimeLeft = 60;
    this.gameState.goalCollected = false;
    this.gameState.switchCooldown = 0;
    this.levelData.objects.forEach(obj => {
      if ('collected' in obj) obj.collected = false;
    });
    this.probe = {
      pos: { ...this.levelData.startPos },
      prevPos: { ...this.levelData.startPos },
      radius: 8,
      isWaveState: false,
      launched: false,
    };
  }

  getHint(): string {
    const level = this.gameState.level;
    const hints = [
      "Use gravitational slingshots from planets to gain momentum.",
      "The eye portal requires a high stardust yield to stabilize.",
      "Portals connect disparate points in space; look for their twin.",
      "Wave mode allows passage through planetary hulls but builds heat.",
      "Fragment collection exponentially increases your final score.",
      "Conserve launches to maximize your efficiency bonus.",
      "Planetary gravity works even in wave mode—don't lose control.",
      "The session window is closing; speed is your ally here.",
      "Large planets have deep gravity wells; enter with enough speed.",
      "Data fragments are often hidden behind orbits; look closely."
    ];
    return hints[level % hints.length];
  }
}
