import React from 'react';

interface LevelTimelineProps {
  currentLevel: number;
  maxLevelReached: number;
  onSelectLevel: (level: number) => void;
}

export const LevelTimeline: React.FC<LevelTimelineProps> = ({ 
  currentLevel, 
  maxLevelReached, 
  onSelectLevel 
}) => {
  const epochs = [
    { name: 'Classical', start: 1, end: 10, color: '#00F0FF' },
    { name: 'Quantum', start: 11, end: 20, color: '#FF00FF' },
    { name: 'Relativity', start: 21, end: 30, color: '#FFD700' },
    { name: 'Thermal', start: 31, end: 40, color: '#FF4500' },
  ];

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 pointer-events-auto z-[300]">
      <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex items-center gap-1 overflow-x-auto no-scrollbar mask-fade-edges shadow-2xl">
        {Array.from({ length: 40 }).map((_, i) => {
          const levelNum = i + 1;
          const currentEpoch = epochs.find(e => levelNum >= e.start && levelNum <= e.end);
          const isActive = currentLevel === levelNum;
          const isCompleted = (maxLevelReached >= levelNum) && (currentLevel !== levelNum);
          const isLocked = levelNum > maxLevelReached;

          return (
            <button
              key={levelNum}
              type="button"
              onClick={() => !isLocked && onSelectLevel(levelNum)}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black transition-all group relative ${isActive ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)] border-2 border-white/60' : isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
              style={{ 
                backgroundColor: isActive ? currentEpoch?.color : isCompleted ? `${currentEpoch?.color}33` : '#111',
                color: isActive ? '#000' : isCompleted ? currentEpoch?.color : '#666',
                borderColor: isActive ? '#fff' : isLocked ? '#222' : `${currentEpoch?.color}44`
              }}
            >
              {levelNum}
              {levelNum % 10 === 0 && levelNum < 40 && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-white/10 rounded-full" />
              )}
              {!isLocked && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-black/90 px-3 py-1 rounded text-[8px] whitespace-nowrap border border-white/10 pointer-events-none z-50 shadow-xl translate-y-1 group-hover:translate-y-0">
                  {currentEpoch?.name} Sequence
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
