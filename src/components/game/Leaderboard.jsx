import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, ArrowLeft, Zap, Target, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Leaderboard({ scores, isLoading, onBack, currentPlayerName }) {
  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-gray-500">{index + 1}</span>;
  };

  const getRankBg = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-amber-700/20 to-amber-800/10 border-amber-700/30';
    return 'bg-black/20 border-white/5';
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2a] rounded-xl">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-amber-500/10 blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{ top: '10%', right: '10%' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold tracking-wider">LEADERBOARD</h2>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Scores List */}
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
            ))
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Star className="w-12 h-12 mb-4 opacity-30" />
              <p>No scores yet</p>
              <p className="text-sm">Be the first to play!</p>
            </div>
          ) : (
            scores.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm
                           ${getRankBg(index)} 
                           ${entry.player_name === currentPlayerName ? 'ring-2 ring-cyan-500/50' : ''}`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(index)}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">
                      {entry.player_name}
                    </span>
                    {entry.player_name === currentPlayerName && (
                      <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Lvl {entry.level_reached || 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {entry.enemies_defeated || 0} kills
                    </span>
                    {entry.time_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(entry.time_seconds)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                    points
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}