import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import GameCanvas from '@/components/game/GameCanvas';
import GameHUD from '@/components/game/GameHUD';
import MainMenu from '@/components/game/MainMenu';
import GameOver from '@/components/game/GameOver';
import Leaderboard from '@/components/game/Leaderboard';
import TouchControls from '@/components/game/TouchControls';

export default function InfiniteForge() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameover, leaderboard
  const [playerName, setPlayerName] = useState('');
  const [currentMode, setCurrentMode] = useState('fire');
  const [isPaused, setIsPaused] = useState(false);
  const [health, setHealth] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [abilities, setAbilities] = useState([]);
  const [gameStats, setGameStats] = useState({
    enemiesDefeated: 0,
    crystalsCollected: 0,
    secretsFound: 0,
    timePlayed: 0
  });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const gameStartTime = useRef(null);
  const queryClient = useQueryClient();

  // Detect touch device
  useEffect(() => {
    const detect = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    detect();
    window.addEventListener('touchstart', detect, { once: true });
    return () => window.removeEventListener('touchstart', detect);
  }, []);

  const handleTouchInput = useCallback((key, isDown) => {
    // Dispatch synthetic keyboard events the game already listens to
    if (isDown) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: key }));
    } else {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: key }));
    }
  }, []);

  // Fetch leaderboard scores
  const { data: scores = [], isLoading: scoresLoading } = useQuery({
    queryKey: ['gameScores'],
    queryFn: () => base44.entities.GameScore.list('-score', 20)
  });

  // Save score mutation
  const saveScoreMutation = useMutation({
    mutationFn: (scoreData) => base44.entities.GameScore.create(scoreData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameScores'] });
    }
  });

  // Handle keyboard events for pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Escape' && gameState === 'playing') {
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Game timer
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && !isPaused) {
      interval = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          timePlayed: prev.timePlayed + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, isPaused]);

  const handleStartGame = useCallback(() => {
    setGameState('playing');
    setHealth(100);
    setEnergy(100);
    setScore(0);
    setLevel(1);
    setIsPaused(false);
    setAbilities([]);
    setGameStats({
      enemiesDefeated: 0,
      crystalsCollected: 0,
      secretsFound: 0,
      timePlayed: 0
    });
    gameStartTime.current = Date.now();
  }, []);

  const handleGameOver = useCallback(async (finalScore, finalLevel) => {
    setGameState('gameover');
    
    // Check if new high score
    const highScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
    const isNew = finalScore > highScore;
    setIsNewHighScore(isNew);

    // Save score
    try {
      await saveScoreMutation.mutateAsync({
        player_name: playerName || 'Anonymous',
        score: finalScore,
        level_reached: finalLevel,
        time_seconds: gameStats.timePlayed,
        crystals_collected: gameStats.crystalsCollected,
        secrets_discovered: gameStats.secretsFound,
        enemies_defeated: gameStats.enemiesDefeated,
        abilities_unlocked: abilities
      });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  }, [playerName, scores, gameStats, abilities, saveScoreMutation]);

  const handleScoreUpdate = useCallback((newScore) => {
    setScore(newScore);
  }, []);

  const handleHealthUpdate = useCallback((newHealth) => {
    setHealth(Math.max(0, newHealth));
  }, []);

  const handleEnergyUpdate = useCallback((newEnergy) => {
    setEnergy(Math.max(0, Math.min(100, newEnergy)));
  }, []);

  const handleAbilityUse = useCallback((ability) => {
    // Track ability usage
  }, []);

  const handleCollectItem = useCallback((type, value) => {
    if (type === 'crystal') {
      setGameStats(prev => ({
        ...prev,
        crystalsCollected: prev.crystalsCollected + 1
      }));
    } else if (type === 'relic') {
      setAbilities(prev => [...new Set([...prev, value])]);
    } else if (type === 'secret') {
      setGameStats(prev => ({
        ...prev,
        secretsFound: prev.secretsFound + 1
      }));
    }
  }, []);

  const handleEnemyDefeat = useCallback((enemyType) => {
    setGameStats(prev => ({
      ...prev,
      enemiesDefeated: prev.enemiesDefeated + 1
    }));
  }, []);

  const handleLevelComplete = useCallback((completedLevel, currentScore) => {
    setLevel(completedLevel + 1);
  }, []);

  const handleModeChange = useCallback((mode) => {
    setCurrentMode(mode);
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[950px] aspect-video relative max-h-[100vh]">
        {gameState === 'menu' && (
          <MainMenu
            onStartGame={handleStartGame}
            onShowLeaderboard={() => setGameState('leaderboard')}
            playerName={playerName}
            setPlayerName={setPlayerName}
          />
        )}

        {gameState === 'playing' && (
          <div className="relative w-full h-full">
            <GameCanvas
              gameState={gameState}
              setGameState={setGameState}
              onScoreUpdate={handleScoreUpdate}
              onHealthUpdate={handleHealthUpdate}
              onEnergyUpdate={handleEnergyUpdate}
              onAbilityUse={handleAbilityUse}
              onCollectItem={handleCollectItem}
              onEnemyDefeat={handleEnemyDefeat}
              onLevelComplete={handleLevelComplete}
              onGameOver={handleGameOver}
              currentMode={currentMode}
              isPaused={isPaused}
            />
            <GameHUD
              health={health}
              energy={energy}
              score={score}
              level={level}
              currentMode={currentMode}
              onModeChange={handleModeChange}
              abilities={abilities}
              isPaused={isPaused}
              onPause={handlePause}
            />
            {isTouchDevice && gameState === 'playing' && !isPaused && (
              <TouchControls onInput={handleTouchInput} />
            )}
          </div>
        )}

        {gameState === 'gameover' && (
          <GameOver
            score={score}
            level={level}
            stats={gameStats}
            onRestart={handleStartGame}
            onMainMenu={() => setGameState('menu')}
            onShowLeaderboard={() => setGameState('leaderboard')}
            isNewHighScore={isNewHighScore}
          />
        )}

        {gameState === 'leaderboard' && (
          <Leaderboard
            scores={scores}
            isLoading={scoresLoading}
            onBack={() => setGameState('menu')}
            currentPlayerName={playerName}
          />
        )}
      </div>
    </div>
  );
}