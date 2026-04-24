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
  const { 
    level, 
    status, 
    stardust, 
    requiredStardust, 
    heat, 
    switchCooldown,
    failureReason 
  } = gameState;

  const epochs = [
    { name: 'Classical', start: 1, end: 10, color: '#00F0FF' },
    { name: 'Quantum', start: 11, end: 20, color: '#FF00FF' },
    { name: 'Relativity', start: 21, end: 30, color: '#FFD700' },
    { name: 'Thermal', start: 31, end: 40, color: '#FF4500' },
  ];
  
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-12 md:p-16 font-mono text-[#f0f0f0] select-none">
      <div /> {/* Top Spacer */}

      {/* Top Left: Level Info - Shifted up for mobile vertical stacking */}
      <div className="absolute top-28 left-8 md:left-16 flex flex-col gap-1 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#555] uppercase tracking-widest font-black">Sequence</span>
          <span className="text-[#00F0FF] text-3xl font-black italic select-none">{String(level).padStart(2, '0')}</span>
          <div className="hidden sm:block ml-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-[#777] backdrop-blur-md">
            {epochs.find(e => level >= e.start && level <= e.end)?.name} Epoch
          </div>
          <button 
            onClick={onReset}
            className="ml-2 p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all group active:scale-95"
            title="Reset Sector"
          >
            <RefreshCw className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* Top Right: Goal Requirement - Shifted down for mobile vertical stacking */}
      <div className="absolute top-44 sm:top-28 right-8 md:right-16 text-right pointer-events-auto">
        <div className="flex flex-col items-end gap-1">
          <div className="text-[9px] text-[#555] uppercase tracking-widest font-bold">Extraction Quota</div>
          <div className="text-lg font-black tracking-tighter text-[#FFD700]">
            {Math.floor(stardust)} <span className="text-[10px] text-white/20">/</span> {requiredStardust}
          </div>
        </div>
      </div>

      {/* Center Messages */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-[200]">
        <AnimatePresence mode="wait">
          {status === 'won' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0a0a0a]/95 backdrop-blur-3xl border border-[#FFD700]/30 p-10 rounded-[40px] text-center shadow-[0_30px_100px_rgba(255,215,0,0.15)] pointer-events-auto"
            >
              <Trophy className="w-16 h-16 text-[#FFD700] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
              <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase text-[#FFD700] italic">Stabilized</h2>
              <div className="space-y-3 mb-8">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-[#555] uppercase font-bold tracking-widest mb-1">Total Harvest Collected</span>
                  <span className="text-2xl font-black text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">{Math.floor(stardust)}</span>
                </div>
                <div className="h-px w-12 bg-white/10 mx-auto" />
                <p className="text-[10px] text-cyan-400 uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                  Collected all stardust and successfully synchronized through the portal opening.
                </p>
              </div>
              <button 
                onClick={onNextLevel}
                className="w-full bg-[#FFD700] hover:scale-105 active:scale-95 text-black font-black py-4 rounded-full transition-all text-xs tracking-[0.3em] uppercase"
              >
                Next Sequence
              </button>
            </motion.div>
          )}

          {status === 'lost' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-red-500/30 p-10 rounded-[40px] text-center shadow-[0_30px_100px_rgba(255,0,0,0.1)] pointer-events-auto"
            >
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase italic">Neutralized</h2>
              <div className="mb-8">
                <p className="text-[11px] text-[#777] uppercase tracking-[0.3em] mb-2 font-bold">Failure Sequence</p>
                <p className="text-sm text-red-400 font-bold uppercase tracking-widest px-4">
                  {failureReason === 'overheated' ? 'Core Overheated: Thermal Blast detected' : 
                   failureReason === 'insufficient_yield' ? 'Sync Failure: Insufficient stardust at portal' : 
                   'Internal Phase Mismatch'}
                </p>
              </div>
              <button 
                onClick={onReset}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-full transition-all active:scale-95 text-xs tracking-[0.3em] uppercase"
              >
                Re-materialize
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Interface */}
      <div className="flex justify-between items-end w-full pointer-events-none">
        {/* Bottom Left: State Module */}
        <div className="pointer-events-auto mb-4">
          <div className="relative group">
            <button 
              disabled={switchCooldown > 0}
              onClick={onToggleState}
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center relative active:scale-95 transition-all outline-none ${switchCooldown > 0 ? 'opacity-60 grayscale' : 'opacity-100 group-hover:scale-105'}`}
            >
              {/* Background & Ring */}
              <div className="absolute inset-0 rounded-full bg-[#0a0a0a] shadow-[10px_10px_30px_rgba(0,0,0,0.8),-5px_-5px_15px_rgba(255,255,255,0.02)] border border-white/5" />
              
              {/* Cooldown SVG Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  className="fill-none stroke-[#222]"
                  strokeWidth="4"
                />
                {switchCooldown > 0 && (
                  <>
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      className="fill-cyan-500/10 stroke-cyan-500"
                      strokeWidth="4"
                      strokeDasharray="100 100"
                      animate={{ 
                        strokeDashoffset: (1 - Math.max(0, switchCooldown) / 2.0) * 100 
                      }}
                      initial={{ strokeDashoffset: 100 }}
                    />
                  </>
                )}
              </svg>

              <div className={`absolute inset-2 rounded-full border-2 transition-all duration-500 ${isWaveState ? 'border-[#FF00FF] shadow-[0_0_20px_#FF00FF66]' : 'border-cyan-500/30'}`} />
              
              <div className={`z-10 font-black text-[9px] tracking-[0.2em] transition-all duration-500 text-center flex flex-col items-center ${switchCooldown > 0 ? 'opacity-50' : ''}`}>
                <div className={`italic uppercase text-[11px] mb-0.5 ${isWaveState ? 'text-[#FF00FF]' : 'text-cyan-400'}`}>SYNC</div>
                <div className="text-[7px] text-[#555] font-bold">{isWaveState ? 'WAVE' : 'PARTICLE'}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Right: Yield & Heat Bars */}
        <div className="flex flex-col items-end gap-6 pointer-events-auto mb-4">
          <div className="flex flex-col items-end gap-2">
            <div className="text-[9px] tracking-widest text-[#555] font-black uppercase">Harvest Yield</div>
            <div className="w-40 md:w-56 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-200"
                animate={{ width: `${Math.min(100, (stardust / requiredStardust) * 100)}%` }}
                transition={{ type: 'spring', damping: 20 }}
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1">
               <Thermometer className={`w-3 h-3 ${heat > 70 ? 'text-red-500 animate-pulse' : 'text-[#777]'}`} />
               <div className="text-[9px] tracking-widest text-[#555] font-black uppercase">Core Heat</div>
            </div>
            <div className="w-24 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${heat > 80 ? 'bg-red-500' : heat > 50 ? 'bg-orange-500' : 'bg-cyan-500'}`}
                animate={{ width: `${Math.min(100, heat)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
