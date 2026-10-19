import React from 'react';
import { Heart, Zap, Star, Shield, Flame, Snowflake, Magnet, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const modeConfig = {
  fire: { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/20', border: 'border-orange-500/50' },
  ice: { icon: Snowflake, color: 'text-cyan-400', bg: 'bg-cyan-400/20', border: 'border-cyan-400/50' },
  magnetic: { icon: Magnet, color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/50' },
  stealth: { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-400/20', border: 'border-gray-400/50' }
};

export default function GameHUD({
  health,
  energy,
  score,
  level,
  currentMode,
  onModeChange,
  abilities,
  isPaused,
  onPause
}) {
  const ModeIcon = modeConfig[currentMode]?.icon || Shield;
  const modeStyle = modeConfig[currentMode] || modeConfig.fire;

  return (
    <div className="absolute inset-x-0 top-0 p-4 pointer-events-none">
      <div className="flex items-start justify-between max-w-[900px] mx-auto">
        {/* Left side - Health & Energy */}
        <div className="space-y-2 pointer-events-auto">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <div className="w-32 h-3 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm border border-red-500/30">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 to-red-400"
                initial={{ width: '100%' }}
                animate={{ width: `${health}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
            <span className="text-xs font-mono text-red-400">{health}</span>
          </div>

          {/* Energy Bar */}
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div className="w-32 h-3 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm border border-cyan-500/30">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                initial={{ width: '100%' }}
                animate={{ width: `${energy}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
            <span className="text-xs font-mono text-cyan-400">{Math.floor(energy)}</span>
          </div>
        </div>

        {/* Center - Score & Level */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-400" />
            <motion.span
              key={score}
              initial={{ scale: 1.3, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-2xl font-bold tracking-wider"
            >
              {score.toLocaleString()}
            </motion.span>
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-widest">
            Level {level}
          </div>
        </div>

        {/* Right side - Mode & Pause */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Mode Selector */}
          <div className="flex gap-1">
            {Object.entries(modeConfig).map(([mode, config]) => {
              const Icon = config.icon;
              const isActive = mode === currentMode;
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? `${config.bg} ${config.border} border-2 scale-110` 
                      : 'bg-black/30 border border-white/10 hover:border-white/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? config.color : 'text-gray-500'}`} />
                </button>
              );
            })}
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="px-3 py-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 
                       hover:border-white/40 hover:bg-black/70 transition-all text-xs uppercase tracking-wider"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Bottom - Abilities */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
        <div className="flex gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10">
          <AbilitySlot label="DASH" hotkey="Shift" available={true} />
          <AbilitySlot label="TELEPORT" hotkey="E" available={true} />
          <AbilitySlot label="MODE" hotkey="Q" available={true} icon={<ModeIcon className={`w-4 h-4 ${modeStyle.color}`} />} />
        </div>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4 tracking-wider">PAUSED</h2>
              <p className="text-gray-400 mb-6">Press ESC or click Resume to continue</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>WASD / Arrow Keys - Move & Jump</p>
                <p>Shift - Dash</p>
                <p>E - Teleport</p>
                <p>Q - Mode Ability</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AbilitySlot({ label, hotkey, available, icon }) {
  return (
    <div className={`flex flex-col items-center px-3 py-1 rounded-lg transition-all ${
      available ? 'opacity-100' : 'opacity-40'
    }`}>
      {icon || <div className="w-4 h-4 rounded bg-white/20" />}
      <span className="text-[10px] text-gray-400 mt-1">{label}</span>
      <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded text-gray-500">{hotkey}</span>
    </div>
  );
}