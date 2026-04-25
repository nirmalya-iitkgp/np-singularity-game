import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Custom SVG Icons
const SVGPlay = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const SVGShield = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SVGZap = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SVGActivity = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const SVGTarget = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const SVGPower = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-black">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );

const languages = [
  { word: "LOOP", lang: "English" },
  { word: "BOUCLE", lang: "French" },
  { word: "BUCLE", lang: "Spanish" },
  { word: "ПЕТЛЯ", lang: "Russian" },
  { word: "循环", lang: "Chinese" },
  { word: "ループ", lang: "Japanese" },
  { word: "루프", lang: "Korean" },
  { word: "CICLO", lang: "Italian" },
  { word: ".-.. --- --- .--", lang: "Morse" },
  { word: "आवर्त", lang: "Sanskrit" },
  { word: "पाश", lang: "Hindi" },
  { word: "ବଳୟ", lang: "Odia" },
  { word: "পাক", lang: "Assamese" },
];

interface MenuOverlayProps {
  onStart: () => void;
}

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ onStart }) => {
  const [currentLangIndex, setCurrentLangIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLangIndex(prev => {
        let next = Math.floor(Math.random() * languages.length);
        while (next === prev) next = Math.floor(Math.random() * languages.length);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-[500] bg-[#050505]/60 backdrop-blur-xl overflow-y-auto overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] bg-fuchsia-500/5 rounded-full blur-[100px] animate-pulse transition-all duration-1000" />
      </div>

      <div className="min-h-full flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full flex flex-col items-center gap-12 relative z-10 py-12"
        >
          {/* Title Block */}
          <div className="text-center space-y-4 px-4 w-full">
            <motion.div 
              initial={{ letterSpacing: '0.1em', opacity: 0 }}
              animate={{ letterSpacing: '0.5em', opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="text-[10px] font-black text-cyan-400 uppercase mb-4"
            >
              Temporal Synchronization Active
            </motion.div>
            <h1 className="text-[clamp(1.8rem,12vw,6rem)] font-thin tracking-tighter text-white/90 break-words leading-none flex flex-wrap justify-center items-center gap-x-4">
              <span>SINGULARITY</span>
              <AnimatePresence mode="wait">
                <motion.span 
                  key={languages[currentLangIndex].word}
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="font-black text-cyan-400 inline-block min-w-[3ch] text-center"
                >
                  {languages[currentLangIndex].word}
                </motion.span>
              </AnimatePresence>
            </h1>
            <p className="text-[#888] text-[9px] sm:text-[10px] font-medium tracking-[0.4em] uppercase max-w-md mx-auto leading-relaxed px-4">
              Theoretical Correction of the 4 Universal State Epochs
            </p>
          </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="relative group p-[2px] rounded-full overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 animate-[spin_3s_linear_infinite] opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-[#050505] rounded-full px-8 py-4 sm:px-12 sm:py-6 flex items-center gap-3 sm:gap-4 border border-white/10">
            <SVGZap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
            <span className="text-white text-xs sm:text-sm font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase">Initialize Injection</span>
            <SVGTarget className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>

        {/* How to Play Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <div className="bg-white/[0.03] border border-white/10 p-6 sm:p-8 rounded-[32px] backdrop-blur-md">
            <h2 className="text-cyan-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <SVGPlay className="w-4 h-4" /> Mechanics & Objectives
            </h2>
            <ul className="space-y-4 text-[11px] sm:text-xs text-[#aaa] font-medium leading-relaxed">
              <li className="flex gap-3">
                <span className="text-white font-black">LAUNCH:</span>
                <span>Click and drag behind the probe to set trajectory. Release to launch. Each launch subtracts from your potential bonus score.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white font-black">PHASE SHIFT:</span>
                <span>Press SPACE to toggle modes. Particle mode (Solid) interacts with all objects. Wave mode (Transparent) passes through asteroids and nebulas but overheats carefully.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white font-black">EXTRACTION:</span>
                <span>Collect white stardust by flying near/through them. You must reach the quota shown in the top right to enable the exit portal.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/[0.03] border border-white/10 p-6 sm:p-8 rounded-[32px] backdrop-blur-md">
            <h2 className="text-fuchsia-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <SVGShield className="w-4 h-4" /> Risks & Scoring
            </h2>
            <ul className="space-y-4 text-[11px] sm:text-xs text-[#aaa] font-medium leading-relaxed">
              <li className="flex gap-3">
                <span className="text-white font-black">TIME LIMIT:</span>
                <span>You have 60 seconds to synchronize the loop. If the timer hits zero, the sector destabilizes and the mission fails.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white font-black">THERMAL LOAD:</span>
                <span>Planetary collisions and rapid phase-shifting generate heat. If the core overheats (100%), the probe is neutralized.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white font-black">BONUSES:</span>
                <span>Reach the golden target with higher speed to get a yield boost. Collect cyan Data Fragments to multiply your final score exponentially.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Epoch Timeline - Horizontal Rail */}
        <div className="w-full max-w-3xl border-y border-white/5 py-4 sm:py-6">
          <div className="flex justify-between items-center px-2 sm:px-4 gap-2">
              {[
                { name: 'Classical', range: '01..10' },
                { name: 'Quantum', range: '11..20' },
                { name: 'Relativity', range: '21..30' },
                { name: 'Thermal', range: '31..40' },
              ].map((epoch, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className="text-[7px] sm:text-[8px] font-mono text-[#333] mb-1">{epoch.range}</div>
                  <div className="text-[8px] sm:text-[10px] font-black text-[#555] uppercase tracking-widest sm:tracking-[0.2em]">{epoch.name}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Control Signal Footer */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-12 text-[7px] sm:text-[8px] font-bold text-[#444] uppercase tracking-[0.2em] sm:tracking-[0.3em] px-4 text-center">
          <span>LMB: Trajectory Logic</span>
          <span>SPACE: Phase Synchronize</span>
          <span>R: Reset Sector</span>
        </div>
      </motion.div>
    </div>
  </div>
);
};
