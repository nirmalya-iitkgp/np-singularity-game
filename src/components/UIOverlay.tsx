import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../types';
import { Zap, Thermometer, RefreshCw, PlayCircle, Trophy, XCircle } from 'lucide-react';

interface UIOverlayProps {
  gameState: GameState;
  isWaveState: boolean;
  onToggleState: () => void;
  onReset: () => void;
  onNextLevel: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  isWaveState,
  onToggleState,
  onReset,
  onNextLevel,
}) => {
  const { level, epoch, heat, status, timeScale } = gameState;
  
  // Calculate mock relativistic velocity for display
  const velocityC = ((1.0 - timeScale) / 0.6).toFixed(2); // 0.6 is the max reduction (1.0 - 0.4)

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-12 md:p-16 font-mono text-[#f0f0f0] select-none">
      {/* Top Left: Level/Epoch Info */}
      <div className="flex flex-col gap-1 pointer-events-auto">
        <div className="flex items-center gap-4">
          <span className="text-[#555] text-xs uppercase tracking-widest">
            Epoch {Math.floor((level - 1) / 10) + 1}
          </span>
          <span className="text-[#00F0FF] text-xl font-bold tracking-tighter italic uppercase">
            {epoch}
          </span>
          <button 
            onClick={onReset}
            className="ml-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors group"
            title="Reset Level"
          >
            <RefreshCw className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[#555]">LEVEL {String(level).padStart(2, '0')} / 40</span>
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-1 ${i < Math.floor((level - 1) % 10 / 2.5) + 1 ? 'bg-[#00F0FF]' : 'bg-[#333]'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top Right: Environmental Stats (Hidden on small screens) */}
      <div className="absolute top-16 right-16 text-right pointer-events-auto hidden md:block">
        <div className={`text-[#00F0FF] text-[10px] uppercase tracking-[0.2em] mb-1 transition-opacity duration-500 ${timeScale < 1 ? 'opacity-100' : 'opacity-0'}`}>
          Time Dilation Active
        </div>
        <div className="text-3xl font-light tracking-tighter">
          v = {timeScale < 1 ? velocityC : '0.00'}<span className="text-sm text-[#555]">c</span>
        </div>
        <div className="text-[10px] text-[#555] mt-1 uppercase">
          TIMESCALE: {timeScale.toFixed(2)}x
        </div>
      </div>

      {/* Center Messages */}
      <div className="absolute inset-x-0 top-1/3 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {status === 'preview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="text-xs opacity-40 uppercase tracking-[0.3em] font-bold">AWAITING_LAUNCH</div>
              <div className="flex gap-2 items-center justify-center text-[#00F0FF]/50">
                <PlayCircle className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-[#555]">Drag Probe to start</span>
              </div>
            </motion.div>
          )}

          {status === 'won' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#00F0FF]/30 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(0,240,255,0.1)] pointer-events-auto"
            >
              <Trophy className="w-12 h-12 text-[#FF00FF] mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-1 tracking-tighter uppercase">Goal Reached</h2>
              <p className="text-[10px] text-[#555] mb-6 uppercase tracking-[0.2em]">Sequence clear_ Heat at {Math.floor(heat)}%</p>
              <button 
                onClick={onNextLevel}
                className="w-full bg-[#00F0FF] hover:brightness-110 text-black font-bold py-3 rounded-xl transition-all active:scale-95 text-xs tracking-widest"
              >
                NEXT LEVEL
              </button>
            </motion.div>
          )}

          {status === 'lost' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-red-500/30 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(255,0,0,0.1)] pointer-events-auto"
            >
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-1 tracking-tighter uppercase">Crashed</h2>
              <p className="text-[10px] text-[#555] mb-6 uppercase tracking-[0.2em]">Contact detected_ Probe reset required</p>
              <button 
                onClick={onReset}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-xs tracking-widest"
              >
                RETRY
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Left: Progress Bars */}
      <div className="flex items-end gap-12 pointer-events-auto">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[10px] tracking-widest text-[#555] font-bold">
            <span>OVERHEAT</span>
            <span className="text-orange-500">{Math.floor(heat)}%</span>
          </div>
          <div className="w-64 h-2 bg-[#111] rounded-full overflow-hidden border border-[#222]">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-900 to-orange-500"
              animate={{ width: `${heat}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Right: State Module */}
      <div className="absolute bottom-16 right-12 md:right-16 flex items-center gap-6 pointer-events-auto">
        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] text-[#555] tracking-[0.3em] uppercase font-bold hidden md:block text-center whitespace-nowrap">Shift State</div>
          <button 
            onClick={onToggleState}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center relative group active:scale-95 transition-transform"
          >
            <div className="absolute inset-0 rounded-full bg-[#111] shadow-[10px_10px_20px_#000,-5px_-5px_15px_#1a1a1a]" />
            <div className={`absolute inset-2 rounded-full border transition-all duration-500 ${isWaveState ? 'border-[#FF00FF] shadow-[0_0_20px_#FF00FF44]' : 'border-[#00F0FF22] shadow-[0_0_15px_#00F0FF22]'}`} />
            <div className={`z-10 font-bold text-xs md:text-sm tracking-tighter transition-colors duration-500 ${isWaveState ? 'text-[#FF00FF]' : 'text-[#00F0FF] opacity-60'}`}>
              {isWaveState ? 'WAVE' : 'PARTICLE'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
