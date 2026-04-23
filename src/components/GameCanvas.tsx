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
  const [dragStart, setDragStart] = useState<Vector2D | null>(null);
  const [currentDrag, setCurrentDrag] = useState<Vector2D | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

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

  const draw = useCallback((ctx: CanvasRenderingContext2D, engine: GameEngine) => {
    ctx.clearRect(0, 0, PHYSICS_WIDTH, PHYSICS_HEIGHT);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, PHYSICS_WIDTH, PHYSICS_HEIGHT);

    // Draw Particles/Stars in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const rng = (seed: number) => Math.sin(seed) * 10000 % 1;
    for (let i = 0; i < 50; i++) {
       ctx.beginPath();
       ctx.arc(Math.abs(rng(i) * PHYSICS_WIDTH), Math.abs(rng(i+1) * PHYSICS_HEIGHT), 1, 0, Math.PI * 2);
       ctx.fill();
    }

    // Draw Objects
    engine.levelData.objects.forEach(obj => {
      ctx.beginPath();
      
      if (obj.type === 'Planet') {
        const mass = obj.mass || 0;
        let planetColor = '#2a2a2a'; // Default
        let glowColor = 'rgba(0, 0, 0, 0.8)';
        
        if (mass > 2500) {
            planetColor = '#4a1a1a'; // Supermassive (Red/Dark)
            glowColor = 'rgba(255, 0, 0, 0.2)';
        } else if (mass > 1500) {
            planetColor = '#1a2a4a'; // Heavy (Blue)
            glowColor = 'rgba(0, 100, 255, 0.2)';
        } else if (mass > 500) {
            planetColor = '#1a4a2a'; // Medium (Green)
            glowColor = 'rgba(0, 255, 100, 0.1)';
        } else {
            planetColor = '#333'; // Light
            glowColor = 'rgba(255, 255, 255, 0.05)';
        }

        ctx.shadowBlur = 40;
        ctx.shadowColor = glowColor;
        const gradient = ctx.createRadialGradient(obj.pos.x - obj.radius*0.3, obj.pos.y - obj.radius*0.3, 0, obj.pos.x, obj.pos.y, obj.radius);
        gradient.addColorStop(0, planetColor);
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (obj.type === 'Asteroid') {
        ctx.fillStyle = '#111';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (obj.type === 'Sensor') {
        const beamRange = 400;
        const angle = obj.angle || 0;
        const width = obj.beamWidth || 0;
        
        ctx.save();
        ctx.translate(obj.pos.x, obj.pos.y);
        ctx.rotate(angle);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, beamRange);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)'); // Brighter lasers
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, beamRange, -width/2, width/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();

        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'Portal') {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00F0FF';
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.fill();
        
        // Inner swirl
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius * 0.6, level * 0.1, level * 0.1 + Math.PI);
        ctx.stroke();
      } else if (obj.type === 'ColdSink') {
        const time = performance.now() / 1000;
        const pulse = Math.sin(time * 2) * 0.05 + 0.1;
        ctx.strokeStyle = `rgba(0, 240, 255, ${pulse + 0.1})`;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const gradient = ctx.createRadialGradient(obj.pos.x, obj.pos.y, 0, obj.pos.x, obj.pos.y, obj.radius);
        gradient.addColorStop(0, `rgba(0, 240, 255, ${pulse})`);
        gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Ice crystals (dots)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 8; i++) {
            const angle = (time + i) % (Math.PI * 2);
            const r = (obj.radius * 0.8) * Math.abs(Math.sin(time + i));
            ctx.beginPath();
            ctx.arc(obj.pos.x + Math.cos(angle) * r, obj.pos.y + Math.sin(angle) * r, 1, 0, Math.PI * 2);
            ctx.fill();
        }
      }
    });

    // Draw Goal
    const goal = engine.levelData.goalPos;
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Trajectory if dragging
    if (dragStart && currentDrag && !engine.probe.launched) {
      const launchVelocity = {
        x: (dragStart.x - currentDrag.x) * 0.08,
        y: (dragStart.y - currentDrag.y) * 0.08
      };
      
      // Calculate pull vector for visual "rubber band"
      const pullX = (currentDrag.x - dragStart.x);
      const pullY = (currentDrag.y - dragStart.y);
      
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
      const trajectory = engine.getTrajectory(launchVelocity, 200);
      
      // Animated Trajectory (Moving Dots)
      const time = performance.now() / 1000;
      const dashOffset = (-time * 100) % 36;
      
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.setLineDash([2, 10]);
      ctx.lineDashOffset = dashOffset;
      ctx.lineWidth = 3;
      trajectory.forEach((p, i) => {
        if (i % 2 === 0) { // Only draw every other point for spacing
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
      });
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
        engine.levelData.solvedTrajectory.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.restore();
    }

    // Draw Probe
    const probe = engine.probe;
    const probeColor = probe.isWaveState ? '#FF00FF' : '#00F0FF';
    ctx.shadowBlur = 20;
    ctx.shadowColor = probeColor;
    ctx.fillStyle = probeColor;
    ctx.beginPath();
    ctx.arc(probe.pos.x, probe.pos.y, probe.radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (probe.isWaveState) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#FF00FF';
        ctx.beginPath();
        ctx.arc(probe.pos.x, probe.pos.y, probe.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    ctx.shadowBlur = 0;
  }, [dragStart, currentDrag, level]);

  const animate = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 16.67; // Normalized dt
    lastTimeRef.current = time;

    if (engineRef.current) {
        engineRef.current.update(dt);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) draw(ctx, engineRef.current);

        if (engineRef.current.gameState.status === 'won') {
            onWin();
        } else if (engineRef.current.gameState.status === 'lost') {
            onLoss();
        }
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
    // Only start drag if near probe? No, prompt says "Dragging anywhere on the screen creates a vector from the Probe's start position."
    setDragStart(pos);
    setCurrentDrag(pos);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStart) return;
    const pos = getCanvasCoords(e.nativeEvent);
    setCurrentDrag(pos);
  };

  const handleMouseUp = () => {
    if (!dragStart || !currentDrag) return;
    const launchVelocity = {
      x: (dragStart.x - currentDrag.x) * 0.08,
      y: (dragStart.y - currentDrag.y) * 0.08
    };
    engineRef.current?.launch(launchVelocity);
    setDragStart(null);
    setCurrentDrag(null);
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
