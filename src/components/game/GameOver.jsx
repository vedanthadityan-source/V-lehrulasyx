import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Home, Trophy, Skull, Star, Zap, Target, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GameOver({ 
  score, 
  level, 
  stats, 
  onRestart, 
  onMainMenu, 
  onShowLeaderboard,
  isNewHighScore 
}) {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#2a0a1a] to-[#1a0a2a] rounded-xl">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -100],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-8">
        {/* Skull Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-4"
        >
          <div className="relative">
            <Skull className="w-20 h-20 text-red-500" />
            <motion.div
              className="absolute inset-0 bg-red-500/30 rounded-full blur-xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-black text-red-500 tracking-wider mb-2">
            GAME OVER
          </h1>
          {isNewHighScore && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="flex items-center justify-center gap-2 text-amber-400"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">New High Score!</span>
              <Trophy className="w-5 h-5" />
            </motion.div>
          )}
        </motion.div>

        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Final Score</div>
          <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
            {score.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400 mt-2">Level {level} Reached</div>
        </motion.div>

        {/* Stats Grid */}
        {showStats && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3 mb-6 w-full max-w-xs"
          >
            <StatBox icon={Target} label="Enemies" value={stats.enemiesDefeated} color="text-red-400" />
            <StatBox icon={Star} label="Crystals" value={stats.crystalsCollected} color="text-cyan-400" />
            <StatBox icon={Zap} label="Secrets" value={stats.secretsFound} color="text-amber-400" />
            <StatBox icon={Clock} label="Time" value={formatTime(stats.timePlayed)} color="text-fuchsia-400" />
          </motion.div>
        )}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Button
            onClick={onRestart}
            className="h-12 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 
                       font-bold rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            PLAY AGAIN
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={onShowLeaderboard}
              variant="outline"
              className="flex-1 h-10 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 rounded-xl"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Scores
            </Button>
            <Button
              onClick={onMainMenu}
              variant="outline"
              className="flex-1 h-10 border-white/20 text-gray-400 hover:bg-white/5 rounded-xl"
            >
              <Home className="w-4 h-4 mr-1" />
              Menu
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/5"
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500 uppercase">{label}</span>
      </div>
      <div className="text-xl font-bold text-white mt-1">{value}</div>
    </motion.div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}