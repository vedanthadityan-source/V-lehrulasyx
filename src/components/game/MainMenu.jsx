import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Trophy, Settings, Info, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MainMenu({ onStartGame, onShowLeaderboard, playerName, setPlayerName }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.2
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2a] rounded-xl">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity]
            }}
            transition={{
              duration: 3 + particle.speed * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: particle.id * 0.1
            }}
          />
        ))}
      </div>

      {/* Glowing Orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '10%', left: '10%' }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full bg-magenta-500/20 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{ bottom: '20%', right: '15%' }}
      />
      <motion.div
        className="absolute w-32 h-32 rounded-full bg-amber-500/20 blur-2xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '40%', right: '30%' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-8 h-8 text-cyan-400" />
            <motion.span
              className="text-xs uppercase tracking-[0.3em] text-cyan-400/80"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Enter the Forge
            </motion.span>
            <Zap className="w-8 h-8 text-cyan-400" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 bg-clip-text text-transparent">
              INFINITE
            </span>
            <br />
            <span className="text-white/90">FORGE</span>
          </h1>
          
          <p className="mt-4 text-gray-400 text-sm max-w-md mx-auto">
            Shape-shift through modular worlds. Master abilities. Conquer challenges.
          </p>
        </motion.div>

        {/* Player Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-xs mb-6"
        >
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name..."
            className="bg-black/40 border-white/20 text-center text-lg placeholder:text-gray-600 
                       focus:border-cyan-500/50 focus:ring-cyan-500/20"
          />
        </motion.div>

        {/* Menu Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Button
            onClick={onStartGame}
            disabled={!playerName.trim()}
            className="group relative h-14 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 
                       text-white font-bold text-lg rounded-xl overflow-hidden transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              START GAME
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </Button>

          <Button
            onClick={onShowLeaderboard}
            variant="outline"
            className="h-12 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60 
                       font-semibold rounded-xl transition-all duration-300"
          >
            <Trophy className="w-4 h-4 mr-2" />
            LEADERBOARD
          </Button>
        </motion.div>

        {/* Controls Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-gray-500 mb-2">CONTROLS</p>
          <div className="flex flex-wrap justify-center gap-2 text-[10px]">
            {['WASD', 'SHIFT', 'E', 'Q'].map((key, i) => (
              <span key={key} className="px-2 py-1 bg-white/5 rounded border border-white/10 text-gray-400">
                {key}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}