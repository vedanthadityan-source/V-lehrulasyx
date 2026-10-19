import React, { useEffect, useRef, useCallback } from 'react';

const GRAVITY = 0.5;
const FRICTION = 0.85;
const PLAYER_SPEED = 5;
const JUMP_FORCE = -12;
const DASH_FORCE = 18;
const DASH_COOLDOWN = 800;
const TELEPORT_RANGE = 150;
const TELEPORT_COOLDOWN = 2000;

export default function GameCanvas({ 
  gameState, 
  setGameState, 
  onScoreUpdate,
  onHealthUpdate,
  onEnergyUpdate,
  onAbilityUse,
  onCollectItem,
  onEnemyDefeat,
  onLevelComplete,
  onGameOver,
  currentMode,
  isPaused
}) {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysRef = useRef({});
  const playerRef = useRef({
    x: 100,
    y: 340,
    vx: 0,
    vy: 0,
    width: 32,
    height: 48,
    onGround: true,
    onWall: false,
    wallSide: null,
    facing: 1,
    health: 100,
    energy: 100,
    isDashing: false,
    dashCooldown: 0,
    teleportCooldown: 0,
    isInvincible: false,
    invincibleTimer: 0,
    animFrame: 0,
    animTimer: 0
  });
  const levelRef = useRef({ platforms: [], enemies: [], collectibles: [], hazards: [], secrets: [], portals: [] });
  const particlesRef = useRef([]);
  const cameraRef = useRef({ x: 0, y: 0 });
  const scoreRef = useRef(0);
  const levelNumRef = useRef(1);

  const generateLevel = useCallback((levelNum) => {
    const platforms = [];
    const enemies = [];
    const collectibles = [];
    const hazards = [];
    const secrets = [];
    const portals = [];

    // Starting platform (solid, non-moving)
    platforms.push({
      x: 0,
      y: 400,
      width: 300,
      height: 30,
      type: 'static',
      color: `hsl(280, 70%, 25%)`
    });

    // Ground platforms
    const groundY = 450;
    for (let i = 0; i < 15 + levelNum * 3; i++) {
      const width = 100 + Math.random() * 150;
      platforms.push({
        x: i * 300 + 200,
        y: groundY - (i % 3) * 40,
        width,
        height: 20,
        type: 'static',
        color: `hsl(${260 + Math.random() * 40}, 70%, ${20 + Math.random() * 15}%)`
      });
    }

    // Floating platforms
    for (let i = 0; i < 20 + levelNum * 5; i++) {
      const width = 60 + Math.random() * 80;
      platforms.push({
        x: 200 + i * 250,
        y: 150 + (i % 4) * 60,
        width,
        height: 15,
        type: 'static',
        color: `hsl(${280 + Math.random() * 30}, 60%, ${25 + Math.random() * 10}%)`
      });
    }

    // Wall-run surfaces
    for (let i = 0; i < 8 + levelNum * 2; i++) {
      platforms.push({
        x: 400 + i * 400,
        y: 100 + Math.random() * 200,
        width: 20,
        height: 150 + Math.random() * 100,
        type: 'wall',
        color: `hsl(${200 + Math.random() * 40}, 80%, 30%)`
      });
    }

    // Enemies
    for (let i = 0; i < 5 + levelNum * 2; i++) {
      const enemyType = Math.random() > 0.7 ? 'drone' : 'sentinel';
      enemies.push({
        id: `enemy_${i}`,
        x: 500 + i * 350 + Math.random() * 200,
        y: 300 + Math.random() * 100,
        vx: 0,
        vy: 0,
        width: enemyType === 'drone' ? 28 : 36,
        height: enemyType === 'drone' ? 28 : 44,
        type: enemyType,
        health: enemyType === 'drone' ? 30 : 50,
        maxHealth: enemyType === 'drone' ? 30 : 50,
        patrol: { start: 500 + i * 350, end: 700 + i * 350 },
        direction: 1,
        state: 'patrol',
        attackCooldown: 0,
        detectionRange: enemyType === 'drone' ? 200 : 150,
        alertTimer: 0
      });
    }

    // Collectibles - Energy Crystals
    for (let i = 0; i < 15 + levelNum * 3; i++) {
      collectibles.push({
        id: `crystal_${i}`,
        x: 300 + i * 200 + Math.random() * 150,
        y: 200 + Math.random() * 200,
        width: 20,
        height: 24,
        type: 'crystal',
        value: 10 + Math.floor(Math.random() * 20),
        collected: false,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // Relics
    for (let i = 0; i < 3 + levelNum; i++) {
      collectibles.push({
        id: `relic_${i}`,
        x: 800 + i * 600 + Math.random() * 300,
        y: 100 + Math.random() * 150,
        width: 28,
        height: 28,
        type: 'relic',
        value: 100,
        collected: false,
        bobOffset: Math.random() * Math.PI * 2,
        ability: ['dash_boost', 'energy_regen', 'double_jump', 'shield'][Math.floor(Math.random() * 4)]
      });
    }

    // Hazards
    for (let i = 0; i < 8 + levelNum * 2; i++) {
      const hazardType = ['spikes', 'laser', 'crusher'][Math.floor(Math.random() * 3)];
      hazards.push({
        id: `hazard_${i}`,
        x: 600 + i * 300 + Math.random() * 150,
        y: hazardType === 'laser' ? 200 + Math.random() * 200 : 430,
        width: hazardType === 'laser' ? 150 : 80,
        height: hazardType === 'crusher' ? 60 : 20,
        type: hazardType,
        damage: 20,
        active: true,
        timer: Math.random() * Math.PI * 2,
        cycleSpeed: 0.02 + Math.random() * 0.02
      });
    }

    // Secret areas
    for (let i = 0; i < 2 + Math.floor(levelNum / 2); i++) {
      secrets.push({
        id: `secret_${i}`,
        x: 1000 + i * 800 + Math.random() * 400,
        y: 50 + Math.random() * 100,
        width: 100,
        height: 80,
        discovered: false,
        reward: 500 + levelNum * 100
      });
    }

    // Level end portal
    portals.push({
      x: (15 + levelNum * 3) * 250,
      y: 350,
      width: 60,
      height: 80,
      type: 'exit'
    });

    return { platforms, enemies, collectibles, hazards, secrets, portals };
  }, []);

  const spawnParticle = useCallback((x, y, type, count = 5) => {
    const colors = {
      dash: ['#00f0ff', '#00aaff'],
      teleport: ['#ff00aa', '#ff66cc'],
      fire: ['#ff6600', '#ffaa00'],
      ice: ['#00ffff', '#aaffff'],
      magnetic: ['#ffaa00', '#ffff00'],
      hit: ['#ff0066', '#ff3388'],
      collect: ['#00ff88', '#88ffcc'],
      death: ['#ff0000', '#880000']
    };
    
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        size: 3 + Math.random() * 6,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        color: colors[type]?.[Math.floor(Math.random() * 2)] || '#ffffff'
      });
    }
  }, []);

  const handleKeyDown = useCallback((e) => {
    keysRef.current[e.code] = true;
  }, []);

  const handleKeyUp = useCallback((e) => {
    keysRef.current[e.code] = false;
  }, []);

  const checkCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const updatePlayer = useCallback((deltaTime) => {
    const player = playerRef.current;
    const keys = keysRef.current;
    const level = levelRef.current;

    // Cooldowns
    if (player.dashCooldown > 0) player.dashCooldown -= deltaTime;
    if (player.teleportCooldown > 0) player.teleportCooldown -= deltaTime;
    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer <= 0) player.isInvincible = false;
    }

    // Horizontal movement
    if (!player.isDashing) {
      if (keys['KeyA'] || keys['ArrowLeft']) {
        player.vx = -PLAYER_SPEED;
        player.facing = -1;
      } else if (keys['KeyD'] || keys['ArrowRight']) {
        player.vx = PLAYER_SPEED;
        player.facing = 1;
      } else {
        player.vx *= FRICTION;
      }
    }

    // Jump
    if ((keys['KeyW'] || keys['ArrowUp'] || keys['Space']) && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      spawnParticle(player.x + player.width / 2, player.y + player.height, 'dash', 8);
    }

    // Wall jump
    if ((keys['KeyW'] || keys['ArrowUp'] || keys['Space']) && player.onWall && !player.onGround) {
      player.vy = JUMP_FORCE * 0.9;
      player.vx = player.wallSide === 'left' ? PLAYER_SPEED * 2 : -PLAYER_SPEED * 2;
      player.onWall = false;
      spawnParticle(player.x + player.width / 2, player.y + player.height / 2, 'dash', 10);
    }

    // Dash
    if (keys['ShiftLeft'] && player.dashCooldown <= 0 && player.energy >= 15) {
      player.isDashing = true;
      player.vx = DASH_FORCE * player.facing;
      player.vy = 0;
      player.dashCooldown = DASH_COOLDOWN;
      player.energy -= 15;
      player.isInvincible = true;
      player.invincibleTimer = 200;
      onEnergyUpdate(player.energy);
      onAbilityUse('dash');
      spawnParticle(player.x + player.width / 2, player.y + player.height / 2, 'dash', 15);
      setTimeout(() => { player.isDashing = false; }, 150);
    }

    // Teleport
    if (keys['KeyE'] && player.teleportCooldown <= 0 && player.energy >= 25) {
      player.x += TELEPORT_RANGE * player.facing;
      player.teleportCooldown = TELEPORT_COOLDOWN;
      player.energy -= 25;
      onEnergyUpdate(player.energy);
      onAbilityUse('teleport');
      spawnParticle(player.x + player.width / 2, player.y + player.height / 2, 'teleport', 20);
    }

    // Mode-specific abilities
    if (keys['KeyQ'] && player.energy >= 10) {
      if (currentMode === 'fire') {
        spawnParticle(player.x + player.width / 2 + player.facing * 30, player.y + player.height / 2, 'fire', 12);
        // Damage nearby enemies
        level.enemies.forEach(enemy => {
          const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          if (dist < 100) {
            enemy.health -= 15;
            if (enemy.health <= 0) {
              onEnemyDefeat(enemy.type);
              scoreRef.current += enemy.type === 'drone' ? 100 : 150;
              onScoreUpdate(scoreRef.current);
            }
          }
        });
      } else if (currentMode === 'ice') {
        spawnParticle(player.x + player.width / 2, player.y + player.height / 2, 'ice', 15);
        // Slow nearby enemies
        level.enemies.forEach(enemy => {
          const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          if (dist < 120) {
            enemy.direction *= 0.5;
          }
        });
      }
      player.energy -= 10;
      onEnergyUpdate(player.energy);
      keys['KeyQ'] = false;
    }

    // Gravity
    player.vy += GRAVITY;
    if (player.vy > 15) player.vy = 15;

    // Wall slide
    if (player.onWall && player.vy > 2) {
      player.vy = 2;
    }

    // Move
    player.x += player.vx;
    player.y += player.vy;

    // Platform collisions
    player.onGround = false;
    player.onWall = false;

    level.platforms.forEach(platform => {
      const platX = platform.x;
      const platY = platform.y;

      if (platform.type === 'wall') {
        // Wall collision
        if (checkCollision(player, { x: platX, y: platY, width: platform.width, height: platform.height })) {
          if (player.x < platX) {
            player.x = platX - player.width;
            player.onWall = true;
            player.wallSide = 'right';
          } else {
            player.x = platX + platform.width;
            player.onWall = true;
            player.wallSide = 'left';
          }
          player.vx = 0;
        }
      } else {
        // Ground collision
        if (player.vy > 0 &&
            player.x + player.width > platX &&
            player.x < platX + platform.width &&
            player.y + player.height > platY &&
            player.y + player.height < platY + platform.height + player.vy + 5) {
          player.y = platY - player.height;
          player.vy = 0;
          player.onGround = true;
        }
      }
    });

    // Collectibles
    level.collectibles.forEach(item => {
      if (!item.collected && checkCollision(player, item)) {
        item.collected = true;
        if (item.type === 'crystal') {
          player.energy = Math.min(100, player.energy + 20);
          onEnergyUpdate(player.energy);
          scoreRef.current += item.value;
        } else if (item.type === 'relic') {
          scoreRef.current += item.value;
          onCollectItem('relic', item.ability);
        }
        onScoreUpdate(scoreRef.current);
        spawnParticle(item.x, item.y, 'collect', 12);
      }
    });

    // Hazards
    if (!player.isInvincible) {
      level.hazards.forEach(hazard => {
        if (hazard.active && checkCollision(player, hazard)) {
          player.health -= hazard.damage;
          player.isInvincible = true;
          player.invincibleTimer = 1000;
          onHealthUpdate(player.health);
          spawnParticle(player.x + player.width / 2, player.y + player.height / 2, 'hit', 10);
          if (player.health <= 0) {
            onGameOver(scoreRef.current, levelNumRef.current);
          }
        }
      });
    }

    // Secrets
    level.secrets.forEach(secret => {
      if (!secret.discovered && checkCollision(player, secret)) {
        secret.discovered = true;
        scoreRef.current += secret.reward;
        onScoreUpdate(scoreRef.current);
        onCollectItem('secret', secret.id);
        spawnParticle(secret.x + secret.width / 2, secret.y + secret.height / 2, 'collect', 25);
      }
    });

    // Portal
    level.portals.forEach(portal => {
      if (checkCollision(player, portal)) {
        levelNumRef.current += 1;
        levelRef.current = generateLevel(levelNumRef.current);
        playerRef.current.x = 100;
        playerRef.current.y = 300;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;
        onLevelComplete(levelNumRef.current - 1, scoreRef.current);
        spawnParticle(player.x + player.width / 2, player.y + player.height / 2, 'teleport', 30);
      }
    });

    // Energy regen
    if (player.energy < 100) {
      player.energy += 0.05;
      if (Math.floor(player.energy) % 5 === 0) onEnergyUpdate(Math.floor(player.energy));
    }

    // Animation
    player.animTimer += deltaTime;
    if (player.animTimer > 100) {
      player.animFrame = (player.animFrame + 1) % 4;
      player.animTimer = 0;
    }

    // Boundary check
    if (player.y > 600) {
      player.health -= 25;
      onHealthUpdate(player.health);
      spawnParticle(player.x + player.width / 2, player.y, 'hit', 15);
      if (player.health <= 0) {
        onGameOver(scoreRef.current, levelNumRef.current);
      } else {
        player.x = 100;
        player.y = 340;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }, [currentMode, generateLevel, onAbilityUse, onCollectItem, onEnemyDefeat, onEnergyUpdate, onGameOver, onHealthUpdate, onLevelComplete, onScoreUpdate, spawnParticle]);

  const updateEnemies = useCallback(() => {
    const player = playerRef.current;
    const level = levelRef.current;

    level.enemies = level.enemies.filter(enemy => {
      if (enemy.health <= 0) return false;

      const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);

      // AI behavior
      if (enemy.type === 'sentinel') {
        if (distToPlayer < enemy.detectionRange) {
          enemy.state = 'chase';
          enemy.direction = player.x > enemy.x ? 1 : -1;
          enemy.x += enemy.direction * 2;
        } else {
          enemy.state = 'patrol';
          if (enemy.x <= enemy.patrol.start) enemy.direction = 1;
          if (enemy.x >= enemy.patrol.end) enemy.direction = -1;
          enemy.x += enemy.direction * 1.5;
        }
      } else if (enemy.type === 'drone') {
        // Drones hover and swoop
        enemy.y += Math.sin(Date.now() * 0.003) * 0.8;
        if (distToPlayer < enemy.detectionRange) {
          enemy.state = 'attack';
          const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
          enemy.x += Math.cos(angle) * 3;
          enemy.y += Math.sin(angle) * 2;
        } else {
          enemy.state = 'patrol';
          enemy.x += Math.sin(Date.now() * 0.002 + enemy.id.charCodeAt(enemy.id.length - 1)) * 1.5;
        }
      }

      // Damage player on collision
      if (!player.isInvincible && checkCollision(player, enemy)) {
        player.health -= 15;
        player.isInvincible = true;
        player.invincibleTimer = 800;
        onHealthUpdate(player.health);
        spawnParticle(player.x + player.width / 2, player.y + player.height / 2, 'hit', 8);
        if (player.health <= 0) {
          onGameOver(scoreRef.current, levelNumRef.current);
        }
      }

      // Player can damage enemies by dashing into them
      if (player.isDashing && checkCollision(player, enemy)) {
        enemy.health -= 25;
        spawnParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'hit', 12);
        if (enemy.health <= 0) {
          onEnemyDefeat(enemy.type);
          scoreRef.current += enemy.type === 'drone' ? 100 : 150;
          onScoreUpdate(scoreRef.current);
          spawnParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'death', 20);
        }
      }

      return enemy.health > 0;
    });
  }, [onEnemyDefeat, onGameOver, onHealthUpdate, onScoreUpdate, spawnParticle]);

  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= p.decay;
      return p.life > 0;
    });
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const player = playerRef.current;
    const level = levelRef.current;

    // Camera follow
    cameraRef.current.x += (player.x - canvas.width / 3 - cameraRef.current.x) * 0.08;
    cameraRef.current.y += (player.y - canvas.height / 2 - cameraRef.current.y) * 0.05;

    ctx.save();
    ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(cameraRef.current.x, 0, cameraRef.current.x, canvas.height);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(0.5, '#1a0a2e');
    bgGrad.addColorStop(1, '#0a1a2a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(cameraRef.current.x, cameraRef.current.y, canvas.width, canvas.height);

    // Stars background
    for (let i = 0; i < 80; i++) {
      const starX = ((i * 137) % 2000) + Math.floor(cameraRef.current.x / 3) * 0.3;
      const starY = ((i * 89) % 500) + cameraRef.current.y * 0.1;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() * 0.002 + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(starX, starY, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Platforms
    level.platforms.forEach(platform => {
      const platY = platform.y;

      const grad = ctx.createLinearGradient(platform.x, platY, platform.x, platY + platform.height);
      grad.addColorStop(0, platform.color);
      grad.addColorStop(1, '#0a0a15');
      ctx.fillStyle = grad;
      ctx.fillRect(platform.x, platY, platform.width, platform.height);

      // Glow effect
      ctx.shadowColor = platform.type === 'wall' ? '#00aaff' : '#8844ff';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = platform.type === 'wall' ? '#00aaff44' : '#8844ff44';
      ctx.lineWidth = 2;
      ctx.strokeRect(platform.x, platY, platform.width, platform.height);
      ctx.shadowBlur = 0;
    });

    // Secrets (hidden areas - show subtle hint)
    level.secrets.forEach(secret => {
      if (!secret.discovered) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(secret.x, secret.y, secret.width, secret.height);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(secret.x, secret.y, secret.width, secret.height);
        ctx.setLineDash([]);
      }
    });

    // Hazards
    level.hazards.forEach(hazard => {
      hazard.timer += hazard.cycleSpeed;
      
      if (hazard.type === 'spikes') {
        ctx.fillStyle = '#ff3366';
        for (let i = 0; i < hazard.width / 10; i++) {
          ctx.beginPath();
          ctx.moveTo(hazard.x + i * 10, hazard.y + hazard.height);
          ctx.lineTo(hazard.x + i * 10 + 5, hazard.y);
          ctx.lineTo(hazard.x + i * 10 + 10, hazard.y + hazard.height);
          ctx.fill();
        }
      } else if (hazard.type === 'laser') {
        hazard.active = Math.sin(hazard.timer) > 0;
        if (hazard.active) {
          ctx.strokeStyle = '#ff0066';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#ff0066';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.moveTo(hazard.x, hazard.y);
          ctx.lineTo(hazard.x + hazard.width, hazard.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = 'rgba(255, 0, 102, 0.3)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(hazard.x, hazard.y);
          ctx.lineTo(hazard.x + hazard.width, hazard.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (hazard.type === 'crusher') {
        const crushY = hazard.y + Math.abs(Math.sin(hazard.timer)) * 100;
        ctx.fillStyle = '#666688';
        ctx.fillRect(hazard.x, crushY, hazard.width, hazard.height);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.strokeRect(hazard.x, crushY, hazard.width, hazard.height);
      }
    });

    // Collectibles
    level.collectibles.forEach(item => {
      if (item.collected) return;
      
      const bobY = item.y + Math.sin(Date.now() * 0.003 + item.bobOffset) * 5;
      
      if (item.type === 'crystal') {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(item.x + item.width / 2, bobY);
        ctx.lineTo(item.x + item.width, bobY + item.height / 2);
        ctx.lineTo(item.x + item.width / 2, bobY + item.height);
        ctx.lineTo(item.x, bobY + item.height / 2);
        ctx.closePath();
        ctx.fill();
      } else if (item.type === 'relic') {
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, bobY + item.height / 2, item.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✦', item.x + item.width / 2, bobY + item.height / 2 + 4);
      }
      ctx.shadowBlur = 0;
    });

    // Portal
    level.portals.forEach(portal => {
      const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      ctx.save();
      ctx.translate(portal.x + portal.width / 2, portal.y + portal.height / 2);
      ctx.scale(pulseScale, pulseScale);
      
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.width / 2);
      grad.addColorStop(0, '#ff00ff');
      grad.addColorStop(0.5, '#8800ff');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, portal.width / 2, portal.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Enemies
    level.enemies.forEach(enemy => {
      const pulse = Math.sin(Date.now() * 0.004) * 0.1 + 1;
      
      if (enemy.type === 'sentinel') {
        // Body with gradient
        const bodyGrad = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + enemy.height);
        bodyGrad.addColorStop(0, enemy.state === 'chase' ? '#ff5555' : '#aa4444');
        bodyGrad.addColorStop(1, enemy.state === 'chase' ? '#cc2222' : '#662222');
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = enemy.state === 'chase' ? '#ff0000' : '#880000';
        ctx.shadowBlur = 15 * pulse;
        
        // Rounded body
        ctx.beginPath();
        ctx.roundRect(enemy.x, enemy.y, enemy.width, enemy.height, 6);
        ctx.fill();
        
        // Armor plates
        ctx.fillStyle = '#222222';
        ctx.fillRect(enemy.x + 4, enemy.y + 8, enemy.width - 8, 3);
        ctx.fillRect(enemy.x + 4, enemy.y + 15, enemy.width - 8, 3);
        
        // Visor/Eye
        const eyeGrad = ctx.createRadialGradient(
          enemy.x + enemy.width / 2, enemy.y + 12, 0,
          enemy.x + enemy.width / 2, enemy.y + 12, 8
        );
        eyeGrad.addColorStop(0, '#ff0000');
        eyeGrad.addColorStop(0.5, '#ff3333');
        eyeGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.ellipse(enemy.x + enemy.width / 2, enemy.y + 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye core
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        
      } else if (enemy.type === 'drone') {
        // Outer shell with glow
        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        ctx.rotate(Date.now() * 0.002);
        
        // Outer ring
        const ringGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, enemy.width / 2);
        ringGrad.addColorStop(0, 'transparent');
        ringGrad.addColorStop(0.7, enemy.state === 'attack' ? '#ff8800' : '#cc6600');
        ringGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = ringGrad;
        ctx.shadowColor = enemy.state === 'attack' ? '#ff8800' : '#cc6600';
        ctx.shadowBlur = 20 * pulse;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Four propellers
        ctx.fillStyle = enemy.state === 'attack' ? '#ffaa33' : '#aa7722';
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 2);
          ctx.beginPath();
          ctx.ellipse(0, -enemy.width / 3, 8, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        
        ctx.restore();
        
        // Central core
        const coreGrad = ctx.createRadialGradient(
          enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 0,
          enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8
        );
        coreGrad.addColorStop(0, '#ffff00');
        coreGrad.addColorStop(0.5, '#ffaa00');
        coreGrad.addColorStop(1, '#ff6600');
        ctx.fillStyle = coreGrad;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy lines
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Health bar
      if (enemy.health < enemy.maxHealth) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#111111';
        ctx.fillRect(enemy.x - 2, enemy.y - 12, enemy.width + 4, 5);
        const healthGrad = ctx.createLinearGradient(enemy.x, 0, enemy.x + enemy.width, 0);
        healthGrad.addColorStop(0, '#ff3333');
        healthGrad.addColorStop(1, '#ff6666');
        ctx.fillStyle = healthGrad;
        ctx.fillRect(enemy.x, enemy.y - 11, (enemy.width * (enemy.health / enemy.maxHealth)), 3);
      }

      ctx.shadowBlur = 0;
    });

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player
    const modeColors = {
      fire: '#ff6600',
      ice: '#00ffff',
      magnetic: '#ffaa00',
      stealth: '#666688'
    };
    
    ctx.save();
    if (player.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    // Player body
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
    playerGrad.addColorStop(0, modeColors[currentMode] || '#00f0ff');
    playerGrad.addColorStop(1, '#004466');
    ctx.fillStyle = playerGrad;
    
    // Shape-shifting effect
    const shapeOffset = Math.sin(Date.now() * 0.01) * 2;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width + shapeOffset, player.y + player.height * 0.3);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x - shapeOffset, player.y + player.height * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Glow
    ctx.shadowColor = modeColors[currentMode] || '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.stroke();
    
    // Face/visor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 8, player.y + 10, 16, 6);
    
    // Direction indicator
    ctx.fillStyle = modeColors[currentMode] || '#00f0ff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 + player.facing * 8, player.y + 13, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    ctx.restore();
  }, [currentMode]);

  const gameLoop = useCallback((timestamp) => {
    if (isPaused || gameState !== 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = 16; // ~60fps
    
    updatePlayer(deltaTime);
    updateEnemies();
    updateParticles();
    render();

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, isPaused, render, updateEnemies, updateParticles, updatePlayer]);

  useEffect(() => {
    levelRef.current = generateLevel(1);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop, generateLevel, handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (gameState === 'playing') {
      playerRef.current = {
        x: 100,
        y: 340,
        vx: 0,
        vy: 0,
        width: 32,
        height: 48,
        onGround: true,
        onWall: false,
        wallSide: null,
        facing: 1,
        health: 100,
        energy: 100,
        isDashing: false,
        dashCooldown: 0,
        teleportCooldown: 0,
        isInvincible: false,
        invincibleTimer: 0,
        animFrame: 0,
        animTimer: 0
      };
      scoreRef.current = 0;
      levelNumRef.current = 1;
      levelRef.current = generateLevel(1);
      cameraRef.current = { x: 0, y: 0 };
    }
  }, [gameState, generateLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={500}
      className="w-full h-full rounded-xl"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}