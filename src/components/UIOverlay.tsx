import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../types';
import confetti from 'canvas-confetti';

// Custom SVG Icons
const SVGRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const SVGThermometer = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
  </svg>
);

const SVGTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-[#FFD700] mx-auto mb-6">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const SVGAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-red-500 mx-auto mb-6">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SVGTimer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-cyan-400">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

interface UIOverlayProps {
  gameState: GameState;
  isWaveState: boolean;
  onToggleState: () => void;
  onReset: () => void;
  onNextLevel: () => void;
  onJumpLevel: (level: number) => void;
  getHint?: () => string;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  isWaveState,
  onToggleState,
  onReset,
  onNextLevel,
  onJumpLevel,
  getHint,
}) => {
  const { 
    level, 
    status, 
    score,
    stardust, 
    requiredStardust, 
    heat, 
    switchCooldown,
    failureReason,
    launches,
    fragmentsCollected,
    totalFragments,
    sessionTimeLeft
  } = gameState;

  const [showHint, setShowHint] = React.useState(false);
  const hintText = getHint ? getHint() : "";

  // Trigger confetti on win
  useEffect(() => {
    if (status === 'won') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [status]);

  const formatTime = (seconds: number) => {
    const s = Math.ceil(seconds);
    return s.toString().padStart(2, '0');
  };

  // Generate last 10 levels
  const startLvl = Math.max(1, level - 5);
  const endLvl = Math.min(40, level + 4);
  const levelSelection = [];
  for (let i = startLvl; i <= endLvl; i++) {
    levelSelection.push(i);
  }

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col font-mono text-[#f0f0f0] select-none p-4 sm:p-8 lg:p-12 transition-colors duration-1000 ${status === 'lost' ? 'bg-red-900/20' : ''}`}>
      
      {/* Top Header Bar */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full flex flex-col sm:flex-row justify-between items-center bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 pointer-events-auto shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] relative z-[500] gap-4 sm:gap-0 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none"
      >
        
        {/* Left: Level & Nav */}
        <div className="flex flex-col items-center sm:items-start gap-1 w-full sm:w-auto overflow-hidden">
          <div className="flex items-center gap-3 w-full">
             <span className="text-[#00F0FF] text-xl sm:text-2xl font-black italic shrink-0">{String(level).padStart(2, '0')}</span>
             <div className="h-4 w-px bg-white/10 shrink-0" />
             <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 px-1 mask-linear-fade">
                {levelSelection.map(l => (
                  <button 
                    key={l}
                    onClick={() => onJumpLevel(l)}
                    className={`text-[7px] sm:text-[8px] font-black transition-all shrink-0 px-1 ${l === level ? 'text-cyan-400 scale-125' : 'text-[#444] hover:text-[#777]'}`}
                  >
                    {l}
                  </button>
                ))}
             </div>
          </div>
          <div className="text-[6px] sm:text-[7px] text-[#555] uppercase tracking-[0.2em] font-black">Singularity Sequence</div>
        </div>

        {/* Center: Progress & Quota */}
        <div className="flex flex-col items-center gap-1 group order-last sm:order-none">
           <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              <span className="text-cyan-400">{score.toLocaleString()}</span>
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/20" />
              <span className="text-fuchsia-400">{fragmentsCollected}/{totalFragments}</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-24 sm:w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                    className="h-full bg-[#FFD700] shadow-[0_0_10px_#FFD700]" 
                    animate={{ width: `${Math.min(100, (stardust / requiredStardust) * 100)}%` }}
                 />
              </div>
              <span className="text-[8px] sm:text-[9px] text-[#FFD700] font-black">{Math.floor(stardust)}/{requiredStardust}</span>
           </div>
        </div>

        {/* Right: Time & Heat */}
        <div className="flex items-center gap-4 sm:gap-8">
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 sm:gap-2">
                 <SVGTimer />
                 <span className={`text-lg sm:text-xl font-black tabular-nums tracking-tighter ${sessionTimeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                    {formatTime(sessionTimeLeft)}s
                 </span>
              </div>
              <span className="text-[6px] sm:text-[7px] text-[#555] uppercase tracking-widest font-black">Sync Window</span>
           </div>
           
           <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                 <SVGThermometer className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${heat > 80 ? 'text-red-500 animate-pulse' : 'text-[#555]'}`} />
                 <div className="w-12 sm:w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                       className={`h-full ${heat > 80 ? 'bg-red-500' : 'bg-orange-500'}`} 
                       animate={{ width: `${Math.min(100, heat)}%` }}
                    />
                 </div>
              </div>
              <span className="text-[6px] sm:text-[7px] text-[#555] uppercase tracking-widest font-black">Core Heat</span>
           </div>

           <button onClick={onReset} className="p-1.5 sm:p-2 border border-white/5 rounded-lg hover:bg-white/5 transition-all active:scale-90">
             <SVGRefresh />
           </button>
        </div>
      </motion.div>

      {/* Center Messages (Wins/Loss) */}
      <div className="flex-1 flex items-center justify-center pointer-events-none p-4 sm:p-8 z-[200]">
        <AnimatePresence mode="wait">
          {status === 'won' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-[#FFD700]/30 p-8 sm:p-12 rounded-[40px] text-center shadow-[0_0_100px_rgba(255,215,0,0.1)] pointer-events-auto max-w-[90vw] sm:max-w-md relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#FFD700]/10 to-transparent pointer-events-none" />
              <SVGTrophy />
              <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tighter uppercase text-[#FFD700] italic leading-tight drop-shadow-2xl">Stabilized</h2>
              
              <div className="mb-8 text-center space-y-1">
                <div className="text-[10px] text-[#FFD700] font-black tracking-[0.4em] uppercase">Sector Clear</div>
                <div className="text-2xl font-black text-white tabular-nums tracking-tighter">{score.toLocaleString()} PTS</div>
              </div>

              <button 
                onClick={onNextLevel}
                className="w-full bg-[#FFD700] hover:bg-[#FFE55C] hover:scale-[1.02] active:scale-95 text-black font-black py-4 rounded-full transition-all text-xs sm:text-sm tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(255,215,0,0.4)]"
              >
                Proceed
              </button>
            </motion.div>
          )}

          {status === 'lost' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-red-950/20 backdrop-blur-3xl border border-red-500/30 p-8 sm:p-12 rounded-[40px] text-center shadow-[0_0_100px_rgba(255,0,0,0.15)] pointer-events-auto max-w-[90vw] sm:max-w-md relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
              <SVGAlert />
              <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tighter uppercase italic leading-tight text-white drop-shadow-2xl">Breached</h2>
              <div className="mb-10">
                <p className="text-[10px] sm:text-xs text-red-400 font-black uppercase tracking-widest leading-relaxed">
                  {failureReason === 'overheated' ? 'Thermal Collapse' : 
                   failureReason === 'insufficient_yield' ? 'Yield Extraction Failure' : 
                   failureReason === 'time_out' ? 'Synchronization Window Lost' :
                   failureReason || 'Critical Failure'}
                </p>
              </div>
              <button 
                onClick={onReset}
                className="w-full bg-red-600 hover:bg-red-500 hover:scale-[1.02] text-white font-black py-4 rounded-full transition-all active:scale-95 text-[10px] sm:text-xs tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              >
                Reinitialize
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Interface */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="flex justify-between items-end w-full pointer-events-none mt-auto gap-4"
      >
        
        {/* Bottom Left: Decorative Info */}
        <div className="text-left hidden lg:block">
           <div className="text-[10px] font-black text-[#333] uppercase tracking-[0.3em] italic">The Singularity Loop</div>
           <div className="text-[8px] font-black text-[#222] tracking-widest">PROXIMA-B // NEURAL-LINK-ACTIVE</div>
        </div>

        {/* Bottom Center: Hint Module */}
        <div className="flex flex-col items-center gap-2 sm:gap-4 pointer-events-auto flex-1">
           <AnimatePresence>
              {showHint && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="bg-[#0a0a0a]/90 border border-white/5 p-3 sm:p-4 rounded-2xl max-w-[240px] sm:max-w-xs text-center backdrop-blur-xl shadow-2xl"
                >
                   <p className="text-[8px] sm:text-[10px] text-cyan-400 font-black leading-relaxed uppercase tracking-wider italic">
                      " {hintText} "
                   </p>
                </motion.div>
              )}
           </AnimatePresence>
           <button 
             onClick={() => setShowHint(!showHint)}
             className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full border transition-all text-[8px] sm:text-[10px] font-black tracking-[0.2em] uppercase ${showHint ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-[#555] hover:text-white hover:border-white/20'}`}
           >
             {showHint ? 'Close Hint' : 'Advice'}
           </button>
        </div>

        {/* Bottom Right: Phase Shift / Sync */}
        <div className="pointer-events-auto">
          <button 
            disabled={switchCooldown > 0}
            onClick={onToggleState}
            className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center relative active:scale-95 transition-all shadow-2xl overflow-hidden group ${switchCooldown > 0 ? 'opacity-40 grayscale' : 'hover:scale-105'}`}
          >
            <div className={`absolute inset-0 transition-colors duration-700 ${isWaveState ? 'bg-[#FF00FF]/20' : 'bg-cyan-500/10'}`} />
            <div className={`absolute inset-2 border-2 rounded-full transition-all duration-700 ${isWaveState ? 'border-[#FF00FF] shadow-[0_0_20px_rgba(255,0,255,0.4)]' : 'border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.2)]'}`} />
            
            {/* Sync Inner Content */}
            <div className="z-10 text-center">
               <div className={`text-[10px] sm:text-[12px] font-black italic tracking-widest uppercase transition-colors duration-500 ${isWaveState ? 'text-[#FF00FF]' : 'text-cyan-400'}`}>Sync</div>
               <div className="text-[7px] sm:text-[8px] text-white/40 font-black uppercase mt-0.5">{isWaveState ? 'Wave' : 'Particle'}</div>
            </div>

            {/* Switch Cooldown Progress - Fill Effect */}
            {switchCooldown > 0 && (
              <motion.div 
                className={`absolute bottom-0 left-0 right-0 z-0 ${isWaveState ? 'bg-[#FF00FF]/40' : 'bg-cyan-500/30'}`}
                animate={{ height: `${(switchCooldown / 2.0) * 100}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
