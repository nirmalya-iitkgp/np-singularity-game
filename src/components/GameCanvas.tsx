import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine, PHYSICS_WIDTH, PHYSICS_HEIGHT } from '../game/GameEngine';
import { Vector2D } from '../types';

interface GameCanvasProps {
  level: number;
  onWin: () => void;
  onLoss: () => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
  isDev?: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, onWin, onLoss, engineRef, isDev }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false); // Only for UI/pointer state
  const dragStartRef = useRef<Vector2D | null>(null);
  const currentDragRef = useRef<Vector2D | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const starsRef = useRef<{x: number, y: number}[]>([]);

  useEffect(() => {
    // Pre-generate stars once
    const stars = [];
    const rng = (seed: number) => {
        let s = seed * 12345.678;
        return (Math.sin(s) * 10000) % 1;
    };
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.abs(rng(i)) * PHYSICS_WIDTH,
            y: Math.abs(rng(i + 0.5)) * PHYSICS_HEIGHT
        });
    }
    starsRef.current = stars;
  }, []);

  const getCanvasCoords = (e: MouseEvent | TouchEvent): Vector2D => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Scale from actual pixels to game physics units
    const x = (clientX - rect.left) * (PHYSICS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (PHYSICS_HEIGHT / rect.height);
    return { x, y };
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, engine: GameEngine, time: number) => {
    ctx.save();
    
    // Screen Shake Implementation - Proportional to heat/collision
    if (engine.collided) {
      const shakeAmt = 5 + (engine.gameState.heat / 20);
      ctx.translate((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt);
    }

    ctx.clearRect(0, 0, PHYSICS_WIDTH, PHYSICS_HEIGHT);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, PHYSICS_WIDTH, PHYSICS_HEIGHT);

    // Draw Particles/Stars in background with Parallax
    const probe = engine.probe;
    const scrollX = (probe.pos.x - PHYSICS_WIDTH / 2) * 0.05;
    const scrollY = (probe.pos.y - PHYSICS_HEIGHT / 2) * 0.05;

    const stars = starsRef.current;
    for (let i = 0; i < stars.length; i++) {
       const star = stars[i];
       // Layer 1: Slow / Distant
       const parallaxX = (star.x - scrollX) % PHYSICS_WIDTH;
       const parallaxY = (star.y - scrollY) % PHYSICS_HEIGHT;
       
       const x = parallaxX < 0 ? parallaxX + PHYSICS_WIDTH : parallaxX;
       const y = parallaxY < 0 ? parallaxY + PHYSICS_HEIGHT : parallaxY;

       ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 240, 255, 0.15)';
       ctx.fillRect(x, y, 1.2, 1.2);

       // Layer 2: Fast / Nearer (only for some stars)
       if (i % 5 === 0) {
          const p2X = (star.x - scrollX * 2.5) % PHYSICS_WIDTH;
          const p2Y = (star.y - scrollY * 2.5) % PHYSICS_HEIGHT;
          const x2 = p2X < 0 ? p2X + PHYSICS_WIDTH : p2X;
          const y2 = p2Y < 0 ? p2Y + PHYSICS_HEIGHT : p2Y;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(x2, y2, 2, 2);
       }
    }

    // Draw Objects
    const objects = engine.levelData.objects;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      
      if (obj.type === 'Planet') {
        const planetColor = obj.color || '#1a1a1a'; 
        const glowColor = obj.color ? `${obj.color}55` : 'rgba(255, 255, 255, 0.05)';
        
        // Gravitational Lensing effect
        ctx.save();
        ctx.beginPath();
        const lensRadius = obj.radius * 1.8;
        const lensGrad = ctx.createRadialGradient(obj.pos.x, obj.pos.y, obj.radius, obj.pos.x, obj.pos.y, lensRadius);
        lensGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        lensGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
        lensGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = lensGrad;
        ctx.arc(obj.pos.x, obj.pos.y, lensRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.shadowBlur = 40;
        ctx.shadowColor = glowColor;
        const gradient = ctx.createRadialGradient(obj.pos.x - obj.radius*0.3, obj.pos.y - obj.radius*0.3, 0, obj.pos.x, obj.pos.y, obj.radius);
        gradient.addColorStop(0, planetColor);
        gradient.addColorStop(0.8, '#000');
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (obj.type === 'Asteroid') {
        ctx.fillStyle = obj.color || '#111';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (obj.type === 'Stardust' && !obj.collected) {
        ctx.fillStyle = '#FFD700';
        const pulse = 1 + Math.sin(time / 200 + obj.pos.x) * 0.5;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'QuantumField') {
        const qTime = time / 500;
        ctx.save();
        ctx.translate(obj.pos.x, obj.pos.y);
        ctx.rotate(qTime);
        
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        for(let j=0; j<6; j++) {
            const angle = (j / 6) * Math.PI * 2;
            const x = Math.cos(angle) * (obj.radius * (0.8 + Math.sin(qTime * 5 + j) * 0.1));
            const y = Math.sin(angle) * (obj.radius * (0.8 + Math.sin(qTime * 5 + j) * 0.1));
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 240, 150, 0.05)';
        ctx.fill();
        ctx.restore();
        ctx.setLineDash([]);
      } else if (obj.type === 'Portal') {
        const portalTime = time / 1000;
        ctx.save();
        ctx.translate(obj.pos.x, obj.pos.y);
        ctx.rotate(portalTime * -1.5); // Rebranded as Wormhole (Vortex)
        
        for(let j=0; j<5; j++) {
          ctx.rotate(Math.PI * 2 / 5);
          const gradient = ctx.createLinearGradient(0, 0, obj.radius, 0);
          gradient.addColorStop(0, 'rgba(150, 0, 255, 0.8)'); // Purple wormhole
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, obj.radius * (1 - j*0.15), 0, Math.PI);
          ctx.stroke();
        }
        ctx.restore();
      } else if (obj.type === 'Nebula') {
        const nTime = time / 2000;
        const pulse = Math.sin(nTime * 2) * 0.05 + 0.1;
        const nColor = obj.color || '#ff3200';
        
        const gradient = ctx.createRadialGradient(obj.pos.x, obj.pos.y, 0, obj.pos.x, obj.pos.y, obj.radius);
        gradient.addColorStop(0, `${nColor}${Math.floor((pulse + 0.2) * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.6, `${nColor}${Math.floor((pulse * 0.5) * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Gaseous particles
        ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
        for (let k = 0; k < 15; k++) {
            const angle = (nTime * 0.3 + k * (Math.PI / 7.5)) % (Math.PI * 2);
            const r = (obj.radius * 0.7) * (1 + 0.2 * Math.sin(nTime + k));
            ctx.beginPath();
            ctx.arc(obj.pos.x + Math.cos(angle) * r, obj.pos.y + Math.sin(angle) * r, 2, 0, Math.PI * 2);
            ctx.fill();
        }
      } else if (obj.type === 'DataFragment' && !obj.collected) {
        ctx.save();
        ctx.translate(obj.pos.x, obj.pos.y);
        ctx.rotate(time / 400);
        
        ctx.fillStyle = '#00F0FF';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00F0FF';
        
        ctx.beginPath();
        ctx.moveTo(0, -obj.radius);
        ctx.lineTo(obj.radius, 0);
        ctx.lineTo(0, obj.radius);
        ctx.lineTo(-obj.radius, 0);
        ctx.closePath();
        ctx.fill();
        
        // Inner diamond
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-obj.radius/3, -obj.radius/3, obj.radius/1.5, obj.radius/1.5);
        
        ctx.restore();
      }
    }

    // Draw Goal (The Eye of the Singularity)
    const goal = engine.levelData.goalPos;
    const goalCollected = engine.gameState.goalCollected;
    const quotaMet = engine.gameState.stardust >= engine.gameState.requiredStardust;
    ctx.save();
    ctx.translate(goal.x, goal.y);
    const rotation = time / 600;
    
    // 1. Sclera / Outer Glow
    const eyeRadius = 60;
    const scleraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, eyeRadius * 1.5);
    scleraGrad.addColorStop(0, goalCollected ? 'rgba(255,255,255,0.2)' : 'rgba(255, 200, 0, 0.15)');
    scleraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = scleraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, eyeRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Eye Shape (Eyelids)
    ctx.strokeStyle = quotaMet ? '#00f0ff' : '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Top eyelid
    ctx.moveTo(- eyeRadius, 0);
    ctx.quadraticCurveTo(0, - eyeRadius * 0.8, eyeRadius, 0);
    // Bottom eyelid
    ctx.quadraticCurveTo(0, eyeRadius * 0.8, - eyeRadius, 0);
    ctx.stroke();
    
    // 3. Iris (Pulsing / Multi-colored)
    const irisRadius = 25 + Math.sin(time / 300) * 3;
    const irisGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, irisRadius);
    if (quotaMet) {
        irisGrad.addColorStop(0, '#fff');
        irisGrad.addColorStop(0.3, '#00f0ff');
        irisGrad.addColorStop(1, '#0055ff');
    } else {
        irisGrad.addColorStop(0, '#fff');
        irisGrad.addColorStop(0.3, '#FFD700');
        irisGrad.addColorStop(1, '#ff4400');
    }
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(0, 0, irisRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Pupil (Black Hole Center)
    ctx.fillStyle = '#000';
    ctx.shadowBlur = quotaMet ? 15 : 5;
    ctx.shadowColor = quotaMet ? '#00f0ff' : '#FFD700';
    ctx.beginPath();
    // Vertical slit pupil
    ctx.ellipse(0, 0, 8, irisRadius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. Veins / Neural lines
    ctx.strokeStyle = quotaMet ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4 + rotation * 0.2);
        ctx.beginPath();
        ctx.moveTo(irisRadius, 0);
        ctx.lineTo(eyeRadius - 10, 0);
        ctx.stroke();
    }

    ctx.restore();

    // Trajectory Visualization
    const dStart = dragStartRef.current;
    const cDrag = currentDragRef.current;

    if (dStart && cDrag && !engine.probe.launched) {
      const launchVelocity = {
        x: (dStart.x - cDrag.x) * 0.04,
        y: (dStart.y - cDrag.y) * 0.04
      };
      
      // Calculate pull vector for visual "rubber band"
      const pullX = (cDrag.x - dStart.x);
      const pullY = (cDrag.y - dStart.y);
      
      // Draw "Rubber Band"
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([2, 4]);
      ctx.moveTo(engine.probe.pos.x, engine.probe.pos.y);
      ctx.lineTo(engine.probe.pos.x + pullX, engine.probe.pos.y + pullY);
      ctx.stroke();
      
      // Draw Aim Circle at touch point
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.arc(engine.probe.pos.x + pullX, engine.probe.pos.y + pullY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Get trajectory points
      const trajectory = engine.getTrajectory(launchVelocity);
      
      // Animated Trajectory (Moving Dots)
      const dashOffset = (-time / 10) % 36;
      
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.setLineDash([2, 10]);
      ctx.lineDashOffset = dashOffset;
      ctx.lineWidth = 3;
      for (let pIdx = 0; pIdx < trajectory.length; pIdx++) {
        const pt = trajectory[pIdx];
        if (pIdx % 2 === 0) {
            if (pIdx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();
      ctx.restore();
      
      // Target marker
      if (trajectory.length > 0) {
        const last = trajectory[trajectory.length - 1];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Developer Solved Path
    if (isDev && engine.levelData.solvedTrajectory) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        const solved = engine.levelData.solvedTrajectory;
        for (let sIdx = 0; sIdx < solved.length; sIdx++) {
            const pt = solved[sIdx];
            if (sIdx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    // Draw Probe (The Neural-Link Vessel)
    const { pos, prevPos, radius, isWaveState } = probe;
    const velocity = { x: pos.x - prevPos.x, y: pos.y - prevPos.y };
    const probeAngle = Math.atan2(velocity.y, velocity.x);
    const heatFactor = engine.gameState.heat / 100;
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(probeAngle);

    if (!isWaveState) {
        // Mode: Particle (Sleek Spaceship)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15 + heatFactor * 20;
        ctx.shadowColor = heatFactor > 0.5 ? '#ff4400' : '#00f0ff';
        
        // Body
        ctx.beginPath();
        ctx.moveTo(14, 0);       // Nose
        ctx.lineTo(-10, -10);   // Back wing tip
        ctx.lineTo(-6, 0);       // Back notch
        ctx.lineTo(-10, 10);    // Back wing tip
        ctx.closePath();
        ctx.fill();

        // Cockpit Glow
        ctx.fillStyle = heatFactor > 0.5 ? '#ff4400' : '#00f0ff';
        ctx.beginPath();
        ctx.arc(3, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Mode: Wave (Laser Tip / Needle)
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 25 + heatFactor * 20;
        ctx.shadowColor = heatFactor > 0.7 ? '#ffffff' : '#ff00ff';
        
        // Needle Head
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-8, -3);
        ctx.lineTo(-8, 3);
        ctx.closePath();
        ctx.fill();

        // Core Photon
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // Wave Mode Trail (Drawn behind the vessel in global space)
    if (isWaveState) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prevPos.x, prevPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        // Inner core trail
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prevPos.x, prevPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
  }, [level]); // Stable, only rebuild if level (bg stars/objects) changes substantially

  const animate = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 16.67; // Normalized dt
    lastTimeRef.current = time;

    if (engineRef.current) {
        engineRef.current.update(dt);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) draw(ctx, engineRef.current, time);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [engineRef, draw, onWin, onLoss]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (engineRef.current?.probe.launched) return;
    const pos = getCanvasCoords(e.nativeEvent);
    dragStartRef.current = pos;
    currentDragRef.current = pos;
    setDragActive(true);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const pos = getCanvasCoords(e.nativeEvent);
    currentDragRef.current = pos;
  };

  const handleMouseUp = () => {
    if (!dragStartRef.current || !currentDragRef.current) return;
    const dStart = dragStartRef.current;
    const cDrag = currentDragRef.current;
    const launchVelocity = {
      x: (dStart.x - cDrag.x) * 0.04,
      y: (dStart.y - cDrag.y) * 0.04
    };
    engineRef.current?.launch(launchVelocity);
    dragStartRef.current = null;
    currentDragRef.current = null;
    setDragActive(false);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      <canvas
        id="game-canvas"
        ref={canvasRef}
        width={PHYSICS_WIDTH}
        height={PHYSICS_HEIGHT}
        className="max-w-full max-h-full object-contain cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      />
    </div>
  );
};
