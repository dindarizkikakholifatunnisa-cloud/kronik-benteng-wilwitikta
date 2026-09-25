import React, { useRef, useEffect } from 'react';
import { Player, StageData, Checkpoint, Enemy, Projectile, Particle, FloatingText, ItemDrop, Platform, HistoricalArtifact, CastleBarricade, DeathReason } from '../types';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  stage: StageData;
  player: Player;
  onUpdatePlayer: (updater: (prev: Player) => Player) => void;
  onActivateCheckpoint: (checkpoint: Checkpoint) => void;
  onOpenCheckpointMenu: (checkpoint: Checkpoint) => void;
  onPlayerDeath: (reason: DeathReason) => void;
  onStageClear: () => void;
  onAddScore: (points: number) => void;
  isPaused: boolean;
  virtualInputRef: React.MutableRefObject<{
    left: boolean;
    right: boolean;
    jump: boolean;
    attack: boolean;
    shoot: boolean;
    block: boolean;
    dash: boolean;
    interact: boolean;
  }>;
  onNearArtifact: (artifact: HistoricalArtifact | null) => void;
  onOpenArtifactModal: (artifact: HistoricalArtifact) => void;
  barricade?: CastleBarricade;
  onUpdateBarricade?: (updater: (prev: CastleBarricade) => CastleBarricade) => void;
  solvedArtifactIds: string[];
  onPause?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stage,
  player,
  onUpdatePlayer,
  onActivateCheckpoint,
  onOpenCheckpointMenu,
  onPlayerDeath,
  onStageClear,
  onAddScore,
  isPaused,
  virtualInputRef,
  onNearArtifact,
  onOpenArtifactModal,
  barricade,
  onUpdateBarricade,
  solvedArtifactIds,
  onPause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable game state inside canvas loop for 60fps performance
  const gameStateRef = useRef<{
    enemies: Enemy[];
    projectiles: Projectile[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    itemDrops: ItemDrop[];
    checkpoints: Checkpoint[];
    cameraX: number;
    shake: number;
    activeBoss: Enemy | null;
    barricade: CastleBarricade | null;
    blackoutTimer: number;
    lanternWarningTimer: number;
    stageClearedTriggered: boolean;
  }>({
    enemies: JSON.parse(JSON.stringify(stage.enemies)),
    projectiles: [],
    particles: [],
    floatingTexts: [],
    itemDrops: [],
    checkpoints: JSON.parse(JSON.stringify(stage.checkpoints)),
    cameraX: 0,
    shake: 0,
    activeBoss: null,
    barricade: stage.barricade ? JSON.parse(JSON.stringify(stage.barricade)) : null,
    blackoutTimer: 0,
    lanternWarningTimer: 0,
    stageClearedTriggered: false,
  });

  // Track keyboard inputs & physics buffers
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const justPressedJumpRef = useRef<boolean>(false);
  const jumpBufferRef = useRef<number>(0);
  const coyoteTimerRef = useRef<number>(0);
  const healCooldownRef = useRef<number>(0);
  const justPressedHealRef = useRef<boolean>(false);
  const playerRef = useRef(player);
  playerRef.current = player;

  // Reset or reload stage entities when stage changes
  useEffect(() => {
    gameStateRef.current = {
      enemies: JSON.parse(JSON.stringify(stage.enemies)),
      projectiles: [],
      particles: [],
      floatingTexts: [],
      itemDrops: [],
      checkpoints: JSON.parse(JSON.stringify(stage.checkpoints)),
      cameraX: Math.max(0, player.x - 400),
      shake: 0,
      activeBoss: null,
      barricade: stage.barricade ? JSON.parse(JSON.stringify(stage.barricade)) : null,
      blackoutTimer: 0,
      lanternWarningTimer: 0,
      stageClearedTriggered: false,
    };
  }, [stage.id]);

  // Sync checkpoints prop with internal state if updated externally
  useEffect(() => {
    if (stage.checkpoints) {
      gameStateRef.current.checkpoints = stage.checkpoints;
    }
  }, [stage.checkpoints]);

  // Keyboard listeners: responsive and versatile bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default scrolling on navigation keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Responsive Jump: Space, ArrowUp, KeyW with jump buffer
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && !e.repeat && !keysRef.current[e.code]) {
        justPressedJumpRef.current = true;
        jumpBufferRef.current = 0.15;
      }

      // Quick Jamu Healing Shortcut: 'H' or '1'
      if ((e.code === 'KeyH' || e.code === 'Digit1') && !e.repeat) {
        justPressedHealRef.current = true;
      }

      // Pause toggle: Escape or 'P'
      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
        onPause?.();
      }

      keysRef.current[e.code] = true;

      // Interact key 'E', 'Enter', or 'F' (when near checkpoint or artifact)
      if (e.code === 'KeyE' || e.code === 'Enter') {
        const p = playerRef.current;
        // 1. Checkpoint check
        const currentCheckpoints = gameStateRef.current.checkpoints;
        let interacted = false;
        for (const cp of currentCheckpoints) {
          const dist = Math.hypot(p.x - (cp.x + cp.width / 2), p.y - (cp.y + cp.height / 2));
          if (dist < 100) {
            onOpenCheckpointMenu(cp);
            interacted = true;
            break;
          }
        }

        // 2. Historical Artifact check
        if (!interacted && stage.artifacts) {
          for (const art of stage.artifacts) {
            const dist = Math.hypot(p.x - (art.x + art.width / 2), p.y - (art.y + art.height / 2));
            if (dist < 100 && !solvedArtifactIds.includes(art.id)) {
              onOpenArtifactModal(art);
              break;
            }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onOpenCheckpointMenu, onOpenArtifactModal, stage.artifacts, solvedArtifactIds, onPause]);

  // Main 60fps game loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper functions for particles and floating text
    const spawnParticles = (x: number, y: number, color: string, count = 8, speed = 3) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = (Math.random() * 0.7 + 0.3) * speed;
        gameStateRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1,
          color,
          size: Math.random() * 3 + 2,
          life: 1,
          maxLife: 1,
        });
      }
    };

    const addFloatingText = (text: string, x: number, y: number, color = '#fef08a', size = 14) => {
      gameStateRef.current.floatingTexts.push({
        id: Math.random().toString(),
        text,
        x,
        y,
        color,
        life: 1,
        maxLife: 1,
        fontSize: size,
      });
    };

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.08); // cap dt at 80ms
      lastTime = currentTime;

      if (!isPaused && player.state !== 'dead') {
        const vInput = virtualInputRef.current;
        const keys = keysRef.current;

        // Determine input states with extensive keyboard support
        const moveLeft = keys['ArrowLeft'] || keys['KeyA'] || vInput.left;
        const moveRight = keys['ArrowRight'] || keys['KeyD'] || vInput.right;
        const wantsDrop = keys['ArrowDown'] || keys['KeyS'];
        const wantsJump = justPressedJumpRef.current || jumpBufferRef.current > 0 || vInput.jump;
        const wantsAttack = keys['KeyJ'] || keys['KeyZ'] || keys['KeyF'] || vInput.attack;
        const wantsShoot = keys['KeyK'] || keys['KeyX'] || keys['KeyR'] || vInput.shoot;
        const wantsBlock = keys['KeyL'] || keys['KeyC'] || vInput.block;
        const wantsDash = keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyQ'] || keys['KeyV'] || vInput.dash;
        const wantsHeal = justPressedHealRef.current;

        // Reset single-fire jump, heal, and virtual buttons
        justPressedJumpRef.current = false;
        justPressedHealRef.current = false;
        if (vInput.jump) vInput.jump = false;
        if (vInput.attack) vInput.attack = false;
        if (vInput.shoot) vInput.shoot = false;
        if (vInput.dash) vInput.dash = false;

        // Update physics buffer timers
        if (jumpBufferRef.current > 0) {
          jumpBufferRef.current = Math.max(0, jumpBufferRef.current - dt);
        }
        if (healCooldownRef.current > 0) {
          healCooldownRef.current = Math.max(0, healCooldownRef.current - dt);
        }

        // --- UPDATE PLAYER ---
        onUpdatePlayer((prev) => {
          let p = { ...prev };
          const stats = p.stats;

          // Invulnerability countdown
          if (p.invulnerableTimer > 0) {
            p.invulnerableTimer -= dt;
          }

          // Attack timer countdown
          if (p.attackTimer > 0) {
            p.attackTimer -= dt;
          }

          // Combo window countdown
          if (p.comboResetTimer > 0) {
            p.comboResetTimer -= dt;
          }

          // Prana energy auto-regeneration (14 per sec)
          if (p.stats.energy < p.stats.maxEnergy) {
            p.stats.energy = Math.min(p.stats.maxEnergy, p.stats.energy + 14 * dt);
          }

          // Jamu Usadha Quick Healing (Press 'H' or '1' or tap Jamu button)
          if (wantsHeal && healCooldownRef.current <= 0 && p.state !== 'dead') {
            if (p.stats.hp < p.stats.maxHp) {
              healCooldownRef.current = 3.5;
              const healAmount = 35;
              p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + healAmount);
              sound.playHeal();
              spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#4ade80', 16, 3);
              addFloatingText(`+${healAmount} HP (Jamu Usadha)`, p.x + p.width / 2, p.y - 15, '#22c55e', 16);
            } else {
              addFloatingText('Darah Sudah Penuh!', p.x + p.width / 2, p.y - 15, '#a3e635', 13);
            }
          }

          // Survival Mechanic: Lantern Fuel Depletion (Generous rate for enjoyable exploration)
          p.stats.lanternFuel = Math.max(0, p.stats.lanternFuel - dt * 0.2);

          // Survival Horror Death Condition: Lentera Padam Total
          if (p.stats.lanternFuel <= 0) {
            gameStateRef.current.blackoutTimer += dt;
            if (gameStateRef.current.blackoutTimer > 2.5 && p.state !== 'dead') {
              sound.playShadowCurse();
              onPlayerDeath('lantern_extinguished');
              return { ...p, state: 'dead', stats: { ...p.stats, hp: 0 } };
            }
          } else {
            gameStateRef.current.blackoutTimer = 0;
          }

          // Lantern Low Warning Audio (< 20%)
          if (p.stats.lanternFuel < 20 && p.stats.lanternFuel > 0) {
            gameStateRef.current.lanternWarningTimer = (gameStateRef.current.lanternWarningTimer || 0) + dt;
            if (gameStateRef.current.lanternWarningTimer > 4.2) {
              gameStateRef.current.lanternWarningTimer = 0;
              sound.playLanternWarning();
            }
          }

          // Dash logic (Consumes Prana Energy + Stamina)
          if (wantsDash && !p.isDashing && p.stats.energy >= 15 && p.stats.stamina >= 12 && p.dashTimer <= 0) {
            p.isDashing = true;
            p.dashTimer = 0.25;
            p.stats.energy -= 15;
            p.stats.stamina = Math.max(0, p.stats.stamina - 12);
            p.invulnerableTimer = 0.35;
            p.vx = (p.direction === 'right' ? 1 : -1) * 12;
            sound.playDash();
            spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#fbbf24', 12, 4);
          }

          if (p.dashTimer > 0) {
            p.dashTimer -= dt;
            if (p.dashTimer <= 0) {
              p.isDashing = false;
            }
          }

          // Block logic (Drains stamina continuously while holding)
          p.blockActive = wantsBlock;
          if (p.blockActive) {
            p.stats.stamina = Math.max(0, p.stats.stamina - 10 * dt);
          }

          // Natural Stamina Regeneration (Rapid recovery so player is never locked out of combat)
          const isConsumingStamina = wantsAttack || p.blockActive || p.isDashing;
          if (!isConsumingStamina && p.stats.stamina < p.stats.maxStamina) {
            p.stats.stamina = Math.min(p.stats.maxStamina, p.stats.stamina + 26 * dt);
          }

          // Attack logic (Keris 3-hit combo - Costs only 5 Stamina per swing with generous 75px reach)
          if (wantsAttack && p.attackTimer <= 0 && !p.blockActive && !p.isDashing) {
            if (p.stats.stamina < 5) {
              addFloatingText('STAMINA KURANG!', p.x + p.width / 2, p.y - 15, '#f97316', 13);
            } else {
              p.stats.stamina = Math.max(0, p.stats.stamina - 5);
              p.attackCombo = (p.attackCombo % 3) + 1;
              p.attackTimer = 0.22;
              p.comboResetTimer = 0.8;
              p.state = `attack${p.attackCombo}` as any;
              sound.playSlash();

              // Hit detection in front of player with wider 75px reach
              const attackRange = 75;
              const attackBox = {
                x: p.direction === 'right' ? p.x + p.width : p.x - attackRange,
                y: p.y - 10,
                width: attackRange,
                height: p.height + 20,
              };

              const comboMultiplier = p.attackCombo === 3 ? 1.6 : p.attackCombo === 2 ? 1.25 : 1.0;
              const finalDamage = Math.round(stats.attackPower * comboMultiplier);

              let hitCount = 0;
              gameStateRef.current.enemies.forEach((enemy) => {
                if (enemy.hp <= 0) return;
                if (
                  attackBox.x < enemy.x + enemy.width &&
                  attackBox.x + attackBox.width > enemy.x &&
                  attackBox.y < enemy.y + enemy.height &&
                  attackBox.y + attackBox.height > enemy.y
                ) {
                  hitCount++;
                  enemy.hp -= finalDamage;
                  enemy.hurtTimer = 0.25;
                  enemy.vx = (p.direction === 'right' ? 1 : -1) * 4.5;
                  enemy.vy = -3;

                  sound.playHit();
                  gameStateRef.current.shake = 3;
                  spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#f59e0b', 10, 4);

                  const isCrit = p.attackCombo === 3;
                  addFloatingText(
                    `${finalDamage}${isCrit ? '!' : ''}`,
                    enemy.x + enemy.width / 2,
                    enemy.y - 15,
                    isCrit ? '#facc15' : '#ffffff',
                    isCrit ? 18 : 14
                  );
                }
              });
            }
          }

          // Shoot Gandewa Bow / Cetbang skill
          if (wantsShoot && p.attackTimer <= 0 && p.stats.energy >= 14 && !p.blockActive) {
            p.stats.energy -= 14;
            p.attackTimer = 0.32;
            sound.playShoot();

            const projSpeed = 14;
            const projVx = p.direction === 'right' ? projSpeed : -projSpeed;
            gameStateRef.current.projectiles.push({
              id: Math.random().toString(),
              x: p.direction === 'right' ? p.x + p.width + 10 : p.x - 10,
              y: p.y + p.height / 2 - 5,
              vx: projVx,
              vy: 0,
              radius: 6,
              damage: stats.rangedPower,
              isPlayer: true,
              color: '#38bdf8',
              life: 1.2,
              maxLife: 1.2,
            });
          }

          // Movement Physics: Smooth, responsive WASD/Arrow walking
          if (!p.isDashing) {
            if (p.blockActive) {
              p.vx *= 0.5; // slow down while blocking
            } else if (p.stats.stamina <= 0) {
              // Mild exhaustion slowdown (no instant death, fair to player)
              if (moveLeft) {
                p.vx = -stats.speed * 0.65;
                p.direction = 'left';
              } else if (moveRight) {
                p.vx = stats.speed * 0.65;
                p.direction = 'right';
              } else {
                p.vx *= 0.7;
              }
            } else if (moveLeft) {
              p.vx = -stats.speed;
              p.direction = 'left';
            } else if (moveRight) {
              p.vx = stats.speed;
              p.direction = 'right';
            } else {
              p.vx *= 0.75;
            }
          }

          // Coyote time management (allows jumping 0.12s after leaving a ledge)
          if (p.isGrounded) {
            coyoteTimerRef.current = 0.12;
          } else {
            coyoteTimerRef.current = Math.max(0, coyoteTimerRef.current - dt);
          }

          // Controlled Jump Physics: Clean, non-floaty jump height that comfortably lands on platforms without overshooting
          if (wantsJump && !p.blockActive) {
            if (coyoteTimerRef.current > 0 || p.isGrounded) {
              p.vy = -11.0; // Compact, balanced initial jump (reaches ~125px, perfect for 440px platforms)
              p.isGrounded = false;
              p.canDoubleJump = true;
              coyoteTimerRef.current = 0;
              jumpBufferRef.current = 0;
              sound.playJump();
              spawnParticles(p.x + p.width / 2, p.y + p.height, '#e2e8f0', 5, 2);
            } else if (p.canDoubleJump) {
              p.vy = -8.5; // Controlled double jump boost (+65px height)
              p.canDoubleJump = false;
              jumpBufferRef.current = 0;
              sound.playJump();
              spawnParticles(p.x + p.width / 2, p.y + p.height, '#38bdf8', 8, 3);
            }
          }

          // Variable Jump Height: Tapping lightly gives a short hop; holding gives a full leap
          const isHoldingJump = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || vInput.jump;
          if (!isHoldingJump && p.vy < -3.0) {
            p.vy *= 0.65;
          }

          // Snappy Gravity: Faster downward acceleration prevents slow floatiness
          const gravity = p.vy < 0 ? 30 : 36;
          p.vy += gravity * dt;
          if (p.vy > 14) p.vy = 14;

          // Record feet position BEFORE moving vertically
          const prevFeetY = p.y + p.height;

          // Apply velocity
          p.x += p.vx;
          p.y += p.vy;

          const currFeetY = p.y + p.height;

          // Platform collisions
          p.isGrounded = false;
          for (const plat of stage.platforms) {
            // Hazard spikes check (Forgiving damage and safe bounce)
            if (plat.isHazard) {
              if (
                p.x + p.width > plat.x &&
                p.x < plat.x + plat.width &&
                currFeetY >= plat.y &&
                currFeetY <= plat.y + plat.height + 15
              ) {
                if (p.invulnerableTimer <= 0) {
                  const hazardDamage = 15; // Reduced from 35 so player isn't unfairly eliminated
                  p.stats.hp -= hazardDamage;
                  p.invulnerableTimer = 1.2;
                  p.vy = -7.5; // Safe upward bounce
                  p.vx = p.direction === 'right' ? -5 : 5;
                  sound.playHit();
                  gameStateRef.current.shake = 4;
                  addFloatingText(`-${hazardDamage}`, p.x + p.width / 2, p.y - 10, '#ef4444', 16);

                  if (p.stats.hp <= 0 && p.state !== 'dead') {
                    p.stats.hp = 0;
                    p.state = 'dead';
                    sound.playGameOver();
                    onPlayerDeath('health_depleted');
                  }
                }
              }
              continue;
            }

            // Normal solid platform collision:
            // 1. Horizontally overlapping with platform
            // 2. Was moving downwards or neutral (p.vy >= 0)
            // 3. Feet in previous frame were AT OR ABOVE the platform surface (prevFeetY <= plat.y + 8)
            // 4. Feet in current frame have reached or penetrated the surface (currFeetY >= plat.y)
            // 5. Holding Down/S lets player drop down through elevated platforms (plat.y < 560)
            const isDroppingThrough = wantsDrop && plat.y < 560 && plat.type !== 'altar';
            if (
              !isDroppingThrough &&
              p.x + p.width > plat.x + 2 &&
              p.x < plat.x + plat.width - 2 &&
              prevFeetY <= plat.y + 8 &&
              currFeetY >= plat.y &&
              currFeetY <= plat.y + Math.max(16, p.vy + 8) &&
              p.vy >= 0
            ) {
              p.y = plat.y - p.height;
              p.vy = 0;
              p.isGrounded = true;
              p.canDoubleJump = true;
            }
          }

          // Main fortress ground floor clamp (Floor level 560)
          // Solid bedrock: player walks completely flat without ever ascending or sinking
          if (p.y + p.height >= 560 && p.y <= 620) {
            p.y = 560 - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.canDoubleJump = true;
          }

          // World boundaries
          if (p.x < 0) p.x = 0;
          if (p.x > stage.worldWidth - p.width) p.x = stage.worldWidth - p.width;

          // Pit death fallback
          if (p.y > stage.worldHeight && p.state !== 'dead') {
            p.stats.hp = 0;
            p.state = 'dead';
            sound.playGameOver();
            onPlayerDeath('health_depleted');
          }

          // Animation state resolution
          if (!p.isGrounded) {
            p.state = p.vy < 0 ? 'jump' : 'fall';
          } else if (p.blockActive) {
            p.state = 'block';
          } else if (p.attackTimer > 0) {
            // keep attack state
          } else if (Math.abs(p.vx) > 0.5) {
            p.state = 'run';
          } else {
            p.state = 'idle';
          }

          // Checkpoint Proximity & Auto-Activation
          gameStateRef.current.checkpoints.forEach((cp) => {
            const dist = Math.hypot(p.x - cp.x, p.y - cp.y);
            if (dist < 80 && !cp.activated) {
              cp.activated = true;
              // Checkpoint sacred fire recharges HP, lantern, and stamina to full!
              p.stats.hp = p.stats.maxHp;
              p.stats.lanternFuel = p.stats.maxLanternFuel;
              p.stats.stamina = p.stats.maxStamina;
              sound.playCheckpoint();
              spawnParticles(cp.x + cp.width / 2, cp.y + cp.height / 2, '#fbbf24', 24, 5);
              addFloatingText('SUAKA SUCI AKTIF! (DARAH & LENTERA PULIH)', cp.x + cp.width / 2, cp.y - 25, '#f59e0b', 15);
              onActivateCheckpoint(cp);
            }
          });

          // Artifact Proximity Detection (Nearest unsolved artifact within reach)
          let closestArtifact: HistoricalArtifact | null = null;
          let minArtDist = 90;
          if (stage.artifacts) {
            for (const art of stage.artifacts) {
              const dist = Math.hypot(p.x - (art.x + art.width / 2), p.y - (art.y + art.height / 2));
              if (dist < minArtDist && !solvedArtifactIds.includes(art.id)) {
                minArtDist = dist;
                closestArtifact = art;
              }
            }
          }
          onNearArtifact(closestArtifact);

          // Candi Gate & End-of-Stage Portal Detection (For Floors 1 to 4)
          if (stage.floorNumber < 5) {
            const gateProp = stage.props.find((pr) => pr.type === 'candi_gate');
            const distToGate = gateProp
              ? Math.hypot(p.x - (gateProp.x + gateProp.width / 2), p.y - (gateProp.y + gateProp.height / 2))
              : 999;

            if ((distToGate < 80 || p.x >= stage.worldWidth - 140) && !gameStateRef.current.stageClearedTriggered) {
              gameStateRef.current.stageClearedTriggered = true;
              sound.playVictory();
              addFloatingText('GERBANG CANDI DIBUKA! LANTAI DITEMBUS!', p.x, p.y - 35, '#facc15', 20);
              spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#fbbf24', 30, 6);
              setTimeout(() => {
                onStageClear();
              }, 500);
            }
          }

          return p;
        });

        // --- UPDATE PROJECTILES ---
        const projs = gameStateRef.current.projectiles;
        for (let i = projs.length - 1; i >= 0; i--) {
          const pr = projs[i];
          pr.x += pr.vx;
          pr.y += pr.vy;
          pr.life -= dt;

          // Trail particles
          if (Math.random() < 0.4) {
            gameStateRef.current.particles.push({
              x: pr.x,
              y: pr.y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              color: pr.color,
              size: 2,
              life: 0.3,
              maxLife: 0.3,
            });
          }

          // Player projectile hitting enemy
          if (pr.isPlayer) {
            for (const enemy of gameStateRef.current.enemies) {
              if (enemy.hp <= 0) continue;
              if (
                pr.x > enemy.x &&
                pr.x < enemy.x + enemy.width &&
                pr.y > enemy.y &&
                pr.y < enemy.y + enemy.height
              ) {
                enemy.hp -= pr.damage;
                enemy.hurtTimer = 0.2;
                enemy.vx = (pr.vx > 0 ? 1 : -1) * 3;
                sound.playHit();
                spawnParticles(pr.x, pr.y, '#38bdf8', 10, 4);
                addFloatingText(`${pr.damage}`, enemy.x + enemy.width / 2, enemy.y - 10, '#38bdf8', 15);
                pr.life = 0;
                break;
              }
            }
          } else {
            // Enemy projectile hitting player
            const p = player;
            if (
              p.invulnerableTimer <= 0 &&
              pr.x > p.x &&
              pr.x < p.x + p.width &&
              pr.y > p.y &&
              pr.y < p.y + p.height
            ) {
              let takenDamage = pr.damage;
              if (p.blockActive) {
                takenDamage = Math.max(1, Math.round(takenDamage * 0.2));
                sound.playBlock();
                spawnParticles(pr.x, pr.y, '#60a5fa', 8, 3);
                addFloatingText('TANGKIS!', p.x + p.width / 2, p.y - 15, '#93c5fd', 14);
              } else {
                sound.playHit();
                spawnParticles(pr.x, pr.y, '#ef4444', 8, 3);
                addFloatingText(`-${takenDamage}`, p.x + p.width / 2, p.y - 15, '#ef4444', 15);
              }

              onUpdatePlayer((prev) => {
                const nextHp = Math.max(0, prev.stats.hp - takenDamage);
                if (nextHp <= 0 && prev.state !== 'dead') {
                  sound.playGameOver();
                  onPlayerDeath('health_depleted');
                  return { ...prev, stats: { ...prev.stats, hp: 0 }, state: 'dead' };
                }
                return {
                  ...prev,
                  stats: { ...prev.stats, hp: nextHp },
                  invulnerableTimer: p.blockActive ? 0.2 : 0.6,
                };
              });
              pr.life = 0;
            }
          }

          if (pr.life <= 0) {
            projs.splice(i, 1);
          }
        }

        // --- UPDATE ENEMIES ---
        const enemies = gameStateRef.current.enemies;
        let foundBoss: Enemy | null = null;

        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          if (e.isBoss && e.hp > 0) foundBoss = e;

          if (e.hurtTimer > 0) e.hurtTimer -= dt;
          if (e.attackTimer > 0) e.attackTimer -= dt;

          if (e.hp <= 0) {
            // Enemy death logic
            sound.playCoin();
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#fbbf24', 16, 4);
            onAddScore(e.coinsValue * 15);

            // Spawn coin drops
            gameStateRef.current.itemDrops.push({
              id: Math.random().toString(),
              type: 'coin',
              x: e.x + e.width / 2,
              y: e.y + e.height / 2,
              vy: -4,
              value: e.coinsValue,
              collected: false,
            });

            // Random chance for health drop
            if (Math.random() < 0.35) {
              gameStateRef.current.itemDrops.push({
                id: Math.random().toString(),
                type: 'health_herbs',
                x: e.x + e.width / 2 + 10,
                y: e.y + e.height / 2,
                vy: -3,
                value: 30,
                collected: false,
              });
            }

            // Survival Horror: Chance for Lantern Oil flask drop (30%)
            if (Math.random() < 0.3) {
              gameStateRef.current.itemDrops.push({
                id: Math.random().toString(),
                type: 'lantern_oil',
                x: e.x + e.width / 2 - 12,
                y: e.y + e.height / 2,
                vy: -3.5,
                value: 25,
                collected: false,
              });
            }

            if (e.isBoss) {
              sound.playVictory();
              const bossDefeatTitle = e.type === 'avatar_angkara_dahana'
                ? 'AVATAR ANGKARA DAHANA DITUMPAS! WILWATIKTA MERDEKA!'
                : 'SENOPATI PEMBERONTAK DIKALAHKAN!';
              addFloatingText(bossDefeatTitle, e.x, e.y - 30, '#facc15', 20);
              onStageClear();
            }

            enemies.splice(i, 1);
            continue;
          }

          // Antagonis Utama: Avatar Angkara Dahana Special Skill (Inferno Wave, Roar & Triple Barrage)
          if (e.type === 'avatar_angkara_dahana') {
            e.specialSkillTimer = (e.specialSkillTimer || 0) + dt;
            const isEnraged = e.hp <= e.maxHp * 0.5;
            const skillCooldown = isEnraged ? 2.4 : 3.6;

            if (e.specialSkillTimer > skillCooldown && e.hp > 0) {
              e.specialSkillTimer = 0;
              sound.playFireRoar();
              const dir = player.x > e.x ? 1 : -1;

              if (isEnraged) {
                // Fase 2: Mode Murka Api Membara (Triple Fireball Spread + Severe Tremor)
                const angles = [-2.4, 0, 2.4];
                angles.forEach((vyOffset) => {
                  gameStateRef.current.projectiles.push({
                    id: Math.random().toString(),
                    x: e.x + e.width / 2,
                    y: e.y + 30,
                    vx: dir * 9.5,
                    vy: vyOffset,
                    radius: 9,
                    damage: 36,
                    isPlayer: false,
                    color: '#ef4444',
                    life: 2.4,
                    maxLife: 2.4,
                  });
                });
                gameStateRef.current.shake = 9;
                spawnParticles(e.x + e.width / 2, e.y + 30, '#ef4444', 28, 7);
                addFloatingText('MURKA RAJA KEJAHATAN DAHANA!', e.x + e.width / 2, e.y - 30, '#dc2626', 18);
              } else {
                // Fase 1: Kobaran Magma Dahana
                gameStateRef.current.projectiles.push({
                  id: Math.random().toString(),
                  x: e.x + e.width / 2,
                  y: e.y + 25,
                  vx: dir * 9,
                  vy: 0,
                  radius: 8,
                  damage: 32,
                  isPlayer: false,
                  color: '#ef4444',
                  life: 2.2,
                  maxLife: 2.2,
                });
                gameStateRef.current.shake = 5;
                spawnParticles(e.x + e.width / 2, e.y + 25, '#ef4444', 18, 5);
                addFloatingText('KOBARAN API DAHANA!', e.x + e.width / 2, e.y - 25, '#ef4444', 16);
              }
            }
          }

          // AI behavior
          const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
          e.direction = player.x > e.x ? 'right' : 'left';

          // Barricade Defense AI (Enemies strike barricade if player is away)
          if (gameStateRef.current.barricade && gameStateRef.current.barricade.hp > 0) {
            const bar = gameStateRef.current.barricade;
            const distToBarricade = Math.abs((e.x + e.width / 2) - (bar.x + bar.width / 2));
            if (distToBarricade < 75 && e.attackTimer <= 0 && distToPlayer > 130) {
              e.attackTimer = (e.attackCooldown / 1000) * 1.3;
              e.state = 'attack';
              const barDmg = Math.round(e.damage * 0.4);
              bar.hp = Math.max(0, bar.hp - barDmg);
              sound.playHit();
              gameStateRef.current.shake = 3;
              spawnParticles(bar.x + bar.width / 2, bar.y + 20, '#b45309', 10, 4);
              addFloatingText(`-${barDmg} Barikade!`, bar.x + bar.width / 2, bar.y - 15, '#ef4444', 15);
              if (onUpdateBarricade) {
                onUpdateBarricade((prev) => ({ ...prev, hp: bar.hp }));
              }
              if (bar.hp <= 0) {
                sound.playGameOver();
                onPlayerDeath('barricade_breached');
              }
            }
          }

          if (distToPlayer < e.detectRadius) {
            // Chase & Attack
            if (distToPlayer <= e.attackRadius && e.attackTimer <= 0) {
              e.attackTimer = e.attackCooldown / 1000;
              e.state = 'attack';

              if (e.type === 'pemanah_gelap' || e.type === 'pemanah_bayangan') {
                sound.playShoot();
                const projVx = e.direction === 'right' ? 8 : -8;
                gameStateRef.current.projectiles.push({
                  id: Math.random().toString(),
                  x: e.direction === 'right' ? e.x + e.width + 5 : e.x - 5,
                  y: e.y + 20,
                  vx: projVx,
                  vy: 0,
                  radius: 4,
                  damage: e.damage,
                  isPlayer: false,
                  color: e.type === 'pemanah_bayangan' ? '#a855f7' : '#f87171',
                  life: 1.5,
                  maxLife: 1.5,
                });
              } else {
                // Melee strike on player
                if (player.invulnerableTimer <= 0) {
                  let dmg = e.damage;
                  if (player.blockActive) {
                    dmg = Math.max(1, Math.round(dmg * 0.2));
                    sound.playBlock();
                    spawnParticles(player.x + player.width / 2, player.y + 20, '#60a5fa', 8, 3);
                    addFloatingText('TANGKIS!', player.x + player.width / 2, player.y - 15, '#93c5fd', 14);
                  } else {
                    sound.playHit();
                    gameStateRef.current.shake = 4;
                    spawnParticles(player.x + player.width / 2, player.y + 20, '#ef4444', 8, 3);
                    addFloatingText(`-${dmg}`, player.x + player.width / 2, player.y - 15, '#ef4444', 16);
                  }

                  onUpdatePlayer((prev) => {
                    const nextHp = Math.max(0, prev.stats.hp - dmg);
                    if (nextHp <= 0 && prev.state !== 'dead') {
                      sound.playGameOver();
                      onPlayerDeath('health_depleted');
                      return { ...prev, stats: { ...prev.stats, hp: 0 }, state: 'dead' };
                    }
                    return {
                      ...prev,
                      stats: { ...prev.stats, hp: nextHp },
                      invulnerableTimer: player.blockActive ? 0.2 : 0.6,
                      vx: (e.direction === 'right' ? 1 : -1) * 3,
                    };
                  });
                }
              }
            } else {
              // Move towards player
              e.state = 'chase';
              const speed = e.isBoss ? 1.4 : 1.8;
              e.vx = e.direction === 'right' ? speed : -speed;
            }
          } else {
            // Patrol
            e.state = 'patrol';
            if (e.x <= e.patrolLeft) {
              e.vx = 1.2;
              e.direction = 'right';
            } else if (e.x >= e.patrolRight) {
              e.vx = -1.2;
              e.direction = 'left';
            } else if (!e.vx) {
              e.vx = 1.2;
            }
          }

          // Apply physics
          e.x += e.vx;
          e.vx *= 0.8;
        }

        gameStateRef.current.activeBoss = foundBoss;

        // --- UPDATE ITEM DROPS ---
        const drops = gameStateRef.current.itemDrops;
        for (let i = drops.length - 1; i >= 0; i--) {
          const item = drops[i];
          item.vy += 15 * dt;
          item.y += item.vy;

          // Ground bounce
          if (item.y > 550) {
            item.y = 550;
            item.vy = 0;
          }

          // Magnetic pull towards player when within 85px
          const dist = Math.hypot(player.x + player.width / 2 - item.x, player.y + player.height / 2 - item.y);
          if (dist < 85 && dist > 10) {
            const pullSpeed = 4.5;
            item.x += ((player.x + player.width / 2 - item.x) / dist) * pullSpeed;
            item.y += ((player.y + player.height / 2 - item.y) / dist) * pullSpeed;
          }

          // Pickup check (Generous 55px radius)
          if (dist < 55) {
            if (item.type === 'coin') {
              sound.playCoin();
              onUpdatePlayer((prev) => ({
                ...prev,
                stats: { ...prev.stats, coins: prev.stats.coins + item.value },
              }));
              addFloatingText(`+${item.value} Koin`, item.x, item.y - 10, '#facc15', 14);
            } else if (item.type === 'health_herbs') {
              sound.playHeal();
              onUpdatePlayer((prev) => ({
                ...prev,
                stats: {
                  ...prev.stats,
                  hp: Math.min(prev.stats.maxHp, prev.stats.hp + item.value),
                },
              }));
              addFloatingText(`+${item.value} HP`, item.x, item.y - 10, '#4ade80', 14);
            } else if (item.type === 'lantern_oil') {
              sound.playSparkle();
              onUpdatePlayer((prev) => ({
                ...prev,
                stats: {
                  ...prev.stats,
                  lanternFuel: Math.min(prev.stats.maxLanternFuel, prev.stats.lanternFuel + item.value),
                },
              }));
              addFloatingText(`+${item.value}% Minyak Lentera!`, item.x, item.y - 10, '#f59e0b', 14);
            }
            drops.splice(i, 1);
          }
        }

        // --- UPDATE PARTICLES ---
        const parts = gameStateRef.current.particles;
        for (let i = parts.length - 1; i >= 0; i--) {
          const pt = parts[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life -= dt * 1.5;
          if (pt.life <= 0) {
            parts.splice(i, 1);
          }
        }

        // --- UPDATE FLOATING TEXTS ---
        const texts = gameStateRef.current.floatingTexts;
        for (let i = texts.length - 1; i >= 0; i--) {
          const ft = texts[i];
          ft.y -= 30 * dt;
          ft.life -= dt * 0.9;
          if (ft.life <= 0) {
            texts.splice(i, 1);
          }
        }

        // Camera follow
        const targetCamX = Math.max(0, Math.min(stage.worldWidth - canvas.width, player.x - canvas.width * 0.4));
        gameStateRef.current.cameraX += (targetCamX - gameStateRef.current.cameraX) * 0.1;

        // Screen shake decay
        if (gameStateRef.current.shake > 0) {
          gameStateRef.current.shake = Math.max(0, gameStateRef.current.shake - dt * 15);
        }
      }

      // ==========================================
      // RENDERING SECTION
      // ==========================================
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Screen shake offset
      if (gameStateRef.current.shake > 0) {
        const sx = (Math.random() - 0.5) * gameStateRef.current.shake * 4;
        const sy = (Math.random() - 0.5) * gameStateRef.current.shake * 4;
        ctx.translate(sx, sy);
      }

      const camX = Math.round(gameStateRef.current.cameraX);

      // 1. SKY & CELESTIAL BACKGROUND (Twilight of Wilwatikta)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0c0a09'); // deep warm stone black
      skyGrad.addColorStop(0.5, '#292524'); // smoky brick ember
      skyGrad.addColorStop(1, '#441d13'); // terracotta dusk
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant stars / crescent moon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(canvas.width - 120, 90, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0c0a09';
      ctx.beginPath();
      ctx.arc(canvas.width - 108, 84, 22, 0, Math.PI * 2);
      ctx.fill();

      // 2. PARALLAX LAYER 1: Distant Gunung Penanggungan & Welirang (speed 0.2)
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      const p1Offset = (camX * 0.15) % canvas.width;
      for (let x = -p1Offset - 300; x < canvas.width + 300; x += 450) {
        ctx.moveTo(x, canvas.height - 180);
        ctx.lineTo(x + 220, 220);
        ctx.lineTo(x + 450, canvas.height - 180);
      }
      ctx.fill();

      // 3. PARALLAX LAYER 2: Ancient Candi Gates & Palm Groves (speed 0.4)
      ctx.fillStyle = '#261b17';
      const p2Offset = (camX * 0.35) % 600;
      for (let x = -p2Offset; x < canvas.width + 600; x += 300) {
        // Candi Bentar split silhouette
        ctx.fillRect(x, canvas.height - 240, 28, 120);
        ctx.fillRect(x + 38, canvas.height - 240, 28, 120);
        ctx.fillRect(x - 6, canvas.height - 260, 40, 24);
        ctx.fillRect(x + 32, canvas.height - 260, 40, 24);
      }

      // WORLD SPACE RENDERING (apply camera translation)
      ctx.translate(-camX, 0);

      // 4. DECORATIVE PROPS
      stage.props.forEach((prop) => {
        if (prop.type === 'candi_gate') {
          // Grand Majapahit Candi Bentar Gate
          ctx.fillStyle = '#7c2d12'; // terracotta red brick
          ctx.fillRect(prop.x, prop.y, prop.width * 0.45, prop.height);
          ctx.fillRect(prop.x + prop.width * 0.55, prop.y, prop.width * 0.45, prop.height);

          // Carved stone trims
          ctx.fillStyle = '#b45309';
          ctx.fillRect(prop.x - 4, prop.y + 15, prop.width * 0.5, 12);
          ctx.fillRect(prop.x + prop.width * 0.52, prop.y + 15, prop.width * 0.5, 12);
          ctx.fillRect(prop.x - 2, prop.y + 40, prop.width * 0.48, 8);
          ctx.fillRect(prop.x + prop.width * 0.54, prop.y + 40, prop.width * 0.48, 8);

          // Glowing Gateway Portal between the Candi Bentar split towers
          const portalGlow = Math.sin(Date.now() * 0.005) * 0.2 + 0.5;
          const portalGrad = ctx.createLinearGradient(prop.x + prop.width * 0.45, prop.y, prop.x + prop.width * 0.55, prop.y + prop.height);
          portalGrad.addColorStop(0, `rgba(251, 191, 36, ${portalGlow * 0.8})`);
          portalGrad.addColorStop(0.5, `rgba(245, 158, 11, ${portalGlow})`);
          portalGrad.addColorStop(1, `rgba(217, 119, 6, ${portalGlow * 0.3})`);
          ctx.fillStyle = portalGrad;
          ctx.fillRect(prop.x + prop.width * 0.42, prop.y + 20, prop.width * 0.16, prop.height - 20);

          // Gateway Label
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GERBANG LANTAI ➔', prop.x + prop.width / 2, prop.y - 12);
        } else if (prop.type === 'torch') {
          // Obor Benteng with flickering flame
          ctx.fillStyle = '#78350f';
          ctx.fillRect(prop.x + prop.width / 2 - 3, prop.y + 18, 6, prop.height - 18);

          // Flame flicker
          const flicker = Math.sin(Date.now() * 0.01 + prop.x) * 4;
          const flameGrad = ctx.createRadialGradient(
            prop.x + prop.width / 2,
            prop.y + 10,
            2,
            prop.x + prop.width / 2,
            prop.y + 10,
            18 + flicker
          );
          flameGrad.addColorStop(0, '#fef08a');
          flameGrad.addColorStop(0.4, '#f97316');
          flameGrad.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.arc(prop.x + prop.width / 2, prop.y + 10, 20 + flicker, 0, Math.PI * 2);
          ctx.fill();
        } else if (prop.type === 'majapahit_banner') {
          // Panji Gula Kelapa (Red & White Majapahit stripes)
          ctx.fillStyle = '#57534e';
          ctx.fillRect(prop.x, prop.y, 4, prop.height); // pole

          // Flag stripes
          const wave = Math.sin(Date.now() * 0.005 + prop.x) * 3;
          ctx.fillStyle = '#dc2626'; // red
          ctx.fillRect(prop.x + 4, prop.y, 30 + wave, 14);
          ctx.fillStyle = '#f8fafc'; // white
          ctx.fillRect(prop.x + 4, prop.y + 14, 30 + wave, 14);
        }
      });

      // 5. CHECKPOINTS (PRASASTI & SURYA MAJAPAHIT)
      gameStateRef.current.checkpoints.forEach((cp) => {
        const isNear = Math.hypot(player.x - cp.x, player.y - cp.y) < 90;

        // Base stone plinth
        ctx.fillStyle = '#44403c';
        ctx.fillRect(cp.x, cp.y + 55, cp.width, 35);
        ctx.fillStyle = '#292524';
        ctx.fillRect(cp.x + 6, cp.y + 58, cp.width - 12, 28);

        // Ancient Inscribed Stone (Prasasti)
        ctx.fillStyle = cp.activated ? '#78350f' : '#3f3f46';
        ctx.beginPath();
        ctx.roundRect(cp.x + 8, cp.y + 15, cp.width - 16, 45, [10, 10, 0, 0]);
        ctx.fill();

        // 8-Pointed Golden Sun (Surya Majapahit)
        const sunCenterX = cp.x + cp.width / 2;
        const sunCenterY = cp.y + 35;
        const sunRadius = 14;

        if (cp.activated) {
          // Radiating golden aura
          const auraGrad = ctx.createRadialGradient(sunCenterX, sunCenterY, 4, sunCenterX, sunCenterY, 40);
          auraGrad.addColorStop(0, 'rgba(250, 204, 21, 0.9)');
          auraGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
          auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sunCenterX, sunCenterY, 40, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Surya Sunburst Rays
        ctx.fillStyle = cp.activated ? '#facc15' : '#71717a';
        ctx.beginPath();
        ctx.arc(sunCenterX, sunCenterY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // 8 Rays
        for (let r = 0; r < 8; r++) {
          const angle = (r * Math.PI) / 4 + (cp.activated ? Date.now() * 0.001 : 0);
          const rayLen = cp.activated ? 22 : 18;
          ctx.strokeStyle = cp.activated ? '#f59e0b' : '#71717a';
          ctx.lineWidth = cp.activated ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(sunCenterX, sunCenterY);
          ctx.lineTo(sunCenterX + Math.cos(angle) * rayLen, sunCenterY + Math.sin(angle) * rayLen);
          ctx.stroke();
        }

        // Checkpoint Name Badge above it
        ctx.fillStyle = cp.activated ? '#fef08a' : '#a1a1aa';
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(cp.name, sunCenterX, cp.y - 12);

        // Status badge
        ctx.fillStyle = cp.activated ? '#22c55e' : '#71717a';
        ctx.font = '9px Plus Jakarta Sans, sans-serif';
        ctx.fillText(cp.activated ? '✓ CHECKPOINT AKTIF' : 'BELUM AKTIF', sunCenterX, cp.y - 2);

        // Near Checkpoint prompt
        if (isNear) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
          ctx.fillText('[E] Istirahat & Tingkatkan', sunCenterX, cp.y - 26);
        }
      });

      // 6. PLATFORMS & FORTRESS WALLS
      stage.platforms.forEach((plat) => {
        if (plat.isHazard) {
          // Sharp bamboo / iron spikes (Ranjau Perangkap Benteng)
          ctx.fillStyle = '#71717a';
          const spikeWidth = 14;
          const spikeCount = Math.floor(plat.width / spikeWidth);
          for (let s = 0; s < spikeCount; s++) {
            const sx = plat.x + s * spikeWidth;
            ctx.beginPath();
            ctx.moveTo(sx, plat.y + plat.height);
            ctx.lineTo(sx + spikeWidth / 2, plat.y);
            ctx.lineTo(sx + spikeWidth, plat.y + plat.height);
            ctx.fill();
            // Blood tip hint
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(sx + spikeWidth / 2 - 1, plat.y, 2, 4);
            ctx.fillStyle = '#71717a';
          }
        } else {
          // Majapahit terracotta red-brick masonry
          ctx.fillStyle = plat.type === 'stone' ? '#57534e' : '#991b1b'; // terracotta brick
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

          // Brick pattern lines
          ctx.strokeStyle = plat.type === 'stone' ? '#292524' : '#7f1d1d';
          ctx.lineWidth = 1;
          for (let py = plat.y; py < plat.y + plat.height; py += 12) {
            ctx.beginPath();
            ctx.moveTo(plat.x, py);
            ctx.lineTo(plat.x + plat.width, py);
            ctx.stroke();
          }

          // Top stone molding / decorative edge
          ctx.fillStyle = '#b45309';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
        }
      });

      // 6.5. CASTLE BARRICADE (Pertahanan Gerbang Benteng - Lantai 2)
      if (gameStateRef.current.barricade) {
        const bar = gameStateRef.current.barricade;
        const hpPct = Math.max(0, bar.hp / bar.maxHp);

        // Fortified Wooden Palisade Beams
        ctx.fillStyle = '#5c2b14';
        ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

        // Heavy Iron Brackets & Rivets
        ctx.fillStyle = '#292524';
        ctx.fillRect(bar.x - 2, bar.y + 12, bar.width + 4, 8);
        ctx.fillRect(bar.x - 2, bar.y + 40, bar.width + 4, 8);

        // Defensive Iron Spikes
        ctx.fillStyle = '#71717a';
        for (let sp = 0; sp < bar.width; sp += 10) {
          ctx.beginPath();
          ctx.moveTo(bar.x + sp, bar.y);
          ctx.lineTo(bar.x + sp + 5, bar.y - 12);
          ctx.lineTo(bar.x + sp + 10, bar.y);
          ctx.fill();
        }

        // Majapahit Defense Sigil on Barricade
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(bar.x + bar.width / 2, bar.y + bar.height / 2, 9, 0, Math.PI * 2);
        ctx.fill();

        // Barricade Health Bar
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(bar.x - 10, bar.y - 28, bar.width + 20, 7);
        ctx.fillStyle = hpPct > 0.4 ? '#3b82f6' : '#ef4444';
        ctx.fillRect(bar.x - 10, bar.y - 28, (bar.width + 20) * hpPct, 7);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(bar.x - 10, bar.y - 28, bar.width + 20, 7);

        // Barricade Label
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`BARIKADE BENTENG: ${bar.hp}/${bar.maxHp}`, bar.x + bar.width / 2, bar.y - 34);
      }

      // 6.6. HISTORICAL ARTIFACTS (Altar Prasasti & Pusaka Majapahit)
      if (stage.artifacts) {
        stage.artifacts.forEach((art) => {
          const isSolved = solvedArtifactIds.includes(art.id);
          const isNear = Math.hypot(player.x - (art.x + art.width / 2), player.y - (art.y + art.height / 2)) < 90;

          // Ancient Stone Pedestal
          ctx.fillStyle = '#44403c';
          ctx.fillRect(art.x, art.y + 45, art.width, 35);
          ctx.fillStyle = '#292524';
          ctx.fillRect(art.x + 4, art.y + 48, art.width - 8, 28);

          // Sacred Aura
          const artCenterX = art.x + art.width / 2;
          const artCenterY = art.y + 24;
          const auraGrad = ctx.createRadialGradient(artCenterX, artCenterY, 3, artCenterX, artCenterY, 32);
          if (isSolved) {
            auraGrad.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
            auraGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
          } else {
            auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
            auraGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.4)');
            auraGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          }
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(artCenterX, artCenterY, 32, 0, Math.PI * 2);
          ctx.fill();

          // Floating Relic Sprite representation based on type
          const hoverOffset = Math.sin(Date.now() * 0.004 + art.x) * 4;
          ctx.save();
          ctx.translate(artCenterX, artCenterY + hoverOffset);

          if (art.imageType === 'prasasti') {
            // Ancient Inscribed Stone Tablet
            ctx.fillStyle = isSolved ? '#166534' : '#0284c7';
            ctx.beginPath();
            ctx.roundRect(-12, -16, 24, 30, [6, 6, 2, 2]);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Inscription glyphs
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(-8, -10, 16, 2);
            ctx.fillRect(-8, -5, 12, 2);
            ctx.fillRect(-8, 0, 14, 2);
            ctx.fillRect(-8, 5, 10, 2);
          } else if (art.imageType === 'surya') {
            // Golden 8-Ray Surya Majapahit
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 2;
            for (let r = 0; r < 8; r++) {
              const ang = (r * Math.PI) / 4;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
              ctx.stroke();
            }
          } else if (art.imageType === 'keris') {
            // Keris Luk Pusaka
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 14);
            ctx.lineTo(-3, 6);
            ctx.lineTo(3, -2);
            ctx.lineTo(-3, -10);
            ctx.lineTo(0, -18);
            ctx.stroke();
            ctx.fillStyle = '#b45309';
            ctx.fillRect(-4, 12, 8, 5);
          } else if (art.imageType === 'arca') {
            // Sacred Golden/Stone Deity Statuette
            ctx.fillStyle = isSolved ? '#15803d' : '#f59e0b';
            ctx.beginPath();
            ctx.arc(0, -8, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-8, -1, 16, 16);
          } else {
            // Ancient Lontar Manuscript Scroll
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.roundRect(-14, -8, 28, 16, 4);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-10, -4, 20, 2);
            ctx.fillRect(-10, 1, 16, 2);
          }
          ctx.restore();

          // Title & Hint above pedestal
          ctx.fillStyle = isSolved ? '#86efac' : '#bae6fd';
          ctx.font = 'bold 11px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText(art.name, artCenterX, art.y - 12);

          // Interaction Status
          if (isSolved) {
            ctx.fillStyle = '#4ade80';
            ctx.font = '9px Plus Jakarta Sans, sans-serif';
            ctx.fillText('✓ ARTEFAK TERUNGKAP (+10 KOIN)', artCenterX, art.y - 1);
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.font = '9px Plus Jakarta Sans, sans-serif';
            ctx.fillText('HARTA KARUN SEJARAH', artCenterX, art.y - 1);

            if (isNear) {
              ctx.fillStyle = '#facc15';
              ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
              ctx.fillText('[E] Pecahkan Kuis (+10 Koin)', artCenterX, art.y - 25);
            }
          }
        });
      }

      // 7. ITEM DROPS
      gameStateRef.current.itemDrops.forEach((item) => {
        if (item.type === 'coin') {
          // Gold coin with Majapahit Surya pattern
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
          ctx.stroke();
        } else if (item.type === 'lantern_oil') {
          // Glowing Amber Lantern Oil Flask (Minyak Lentera)
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(item.x, item.y + 2, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#78350f';
          ctx.fillRect(item.x - 3, item.y - 6, 6, 4);
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(item.x, item.y + 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Health herbs
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('+', item.x, item.y + 3);
        }
      });

      // 8. PROJECTILES
      gameStateRef.current.projectiles.forEach((pr) => {
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
        ctx.fill();

        // Projectile glow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 9. ENEMIES (Prajurit Bayangan, Pemanah, Pasukan Tombak, Avatar Angkara Dahana)
      gameStateRef.current.enemies.forEach((enemy) => {
        const isHurt = enemy.hurtTimer > 0;
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Facing flip if needed
        if (enemy.direction === 'left') {
          ctx.scale(-1, 1);
          ctx.translate(-enemy.width, 0);
        }

        // Draw Enemy Body based on type
        if (enemy.type === 'avatar_angkara_dahana') {
          // Antagonis Utama: Avatar Angkara Dahana (Giant Fiery Demon Overlord)
          const flameFlicker = Math.sin(Date.now() * 0.015) * 4;

          // Magma Aura
          const bossAura = ctx.createRadialGradient(
            enemy.width / 2,
            enemy.height / 2,
            10,
            enemy.width / 2,
            enemy.height / 2,
            enemy.width + flameFlicker
          );
          bossAura.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
          bossAura.addColorStop(0.6, 'rgba(185, 28, 28, 0.2)');
          bossAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = bossAura;
          ctx.beginPath();
          ctx.arc(enemy.width / 2, enemy.height / 2, enemy.width + flameFlicker, 0, Math.PI * 2);
          ctx.fill();

          // Demonic Armored Torso
          ctx.fillStyle = isHurt ? '#ffffff' : '#450a0a';
          ctx.fillRect(10, 20, enemy.width - 20, enemy.height - 30);
          ctx.fillStyle = '#dc2626'; // Burning magma fissures
          ctx.fillRect(14, 30, enemy.width - 28, 6);
          ctx.fillRect(18, 45, enemy.width - 36, 6);

          // Head & Horned War Helm
          ctx.fillStyle = isHurt ? '#ffffff' : '#1c1917';
          ctx.beginPath();
          ctx.arc(enemy.width / 2, 14, 15, 0, Math.PI * 2);
          ctx.fill();

          // Fiery Demonic Horns
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(enemy.width / 2 - 12, 10);
          ctx.lineTo(enemy.width / 2 - 24, -10);
          ctx.lineTo(enemy.width / 2 - 4, 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(enemy.width / 2 + 12, 10);
          ctx.lineTo(enemy.width / 2 + 24, -10);
          ctx.lineTo(enemy.width / 2 + 4, 2);
          ctx.fill();

          // Blazing Red Eyes
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(enemy.width / 2 + 2, 10, 4, 4);

          // Massive Greatsword of Angkara Dahana
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(enemy.width - 6, -8, 10, 75);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.strokeRect(enemy.width - 6, -8, 10, 75);
        } else if (enemy.isBoss) {
          // Towering Senopati Boss
          ctx.fillStyle = isHurt ? '#ffffff' : '#7f1d1d';
          ctx.fillRect(10, 15, enemy.width - 20, enemy.height - 25); // torso
          ctx.fillStyle = '#d97706'; // heavy bronze armor plates
          ctx.fillRect(8, 25, enemy.width - 16, 20);

          // Head & fierce battle crown
          ctx.fillStyle = isHurt ? '#ffffff' : '#451a03';
          ctx.beginPath();
          ctx.arc(enemy.width / 2, 12, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24'; // golden mahkota
          ctx.fillRect(enemy.width / 2 - 10, -2, 20, 8);

          // Massive Gada / Mace Weapon
          ctx.fillStyle = '#57534e';
          ctx.fillRect(enemy.width - 10, 10, 8, 55);
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.arc(enemy.width - 6, 8, 14, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === 'prajurit_bayangan') {
          // Musuh Patroli: Prajurit Zirah Bayangan (Shadow Warrior)
          ctx.fillStyle = isHurt ? '#ffffff' : '#0f172a';
          ctx.fillRect(6, 12, enemy.width - 12, enemy.height - 22);

          // Shadow Armor trim
          ctx.fillStyle = '#6b21a8'; // Dark shadow violet trim
          ctx.fillRect(8, 22, enemy.width - 16, 14);

          // Shadow Helm with glowing amethyst visor
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(enemy.width / 2, 10, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(enemy.width / 2 + 1, 8, 4, 3);

          // Shadow Blade
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(enemy.width - 4, 16, 18, 4);
          ctx.strokeStyle = '#e9d5ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(enemy.width - 4, 16, 18, 4);
        } else if (enemy.type === 'pemanah_gelap' || enemy.type === 'pemanah_bayangan') {
          // Dark/Shadow Archer
          ctx.fillStyle = isHurt ? '#ffffff' : '#3f3f46';
          ctx.fillRect(8, 14, enemy.width - 16, enemy.height - 24);
          ctx.fillStyle = '#71717a';
          ctx.beginPath();
          ctx.arc(enemy.width / 2, 10, 8, 0, Math.PI * 2);
          ctx.fill();
          // Bow
          ctx.strokeStyle = enemy.type === 'pemanah_bayangan' ? '#a855f7' : '#92400e';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(enemy.width - 4, 25, 16, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        } else if (enemy.type === 'pasukan_tombak') {
          // Spear Guard
          ctx.fillStyle = isHurt ? '#ffffff' : '#1e293b';
          ctx.fillRect(8, 14, enemy.width - 16, enemy.height - 24);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(enemy.width / 2, 10, 8, 0, Math.PI * 2);
          ctx.fill();
          // Long Spear
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(enemy.width - 4, -10);
          ctx.lineTo(enemy.width - 4, 55);
          ctx.stroke();
          // Spear tip
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(enemy.width - 7, -10);
          ctx.lineTo(enemy.width - 4, -22);
          ctx.lineTo(enemy.width - 1, -10);
          ctx.fill();
        } else {
          // Standard Prajurit
          ctx.fillStyle = isHurt ? '#ffffff' : '#831843';
          ctx.fillRect(6, 12, enemy.width - 12, enemy.height - 22);
          ctx.fillStyle = '#450a0a';
          ctx.beginPath();
          ctx.arc(enemy.width / 2, 10, 8, 0, Math.PI * 2);
          ctx.fill();
          // Sword
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(enemy.width - 4, 18, 18, 5);
        }

        ctx.restore();

        // Health bar above enemy
        const enemyHpPercent = Math.max(0, enemy.hp / enemy.maxHp);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(enemy.x - 5, enemy.y - 14, enemy.width + 10, 5);
        ctx.fillStyle = enemy.type === 'avatar_angkara_dahana' ? '#dc2626' : enemy.isBoss ? '#f59e0b' : '#ef4444';
        ctx.fillRect(enemy.x - 5, enemy.y - 14, (enemy.width + 10) * enemyHpPercent, 5);

        // Enemy Name
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.name, enemy.x + enemy.width / 2, enemy.y - 18);
      });

      // 10. PLAYER (Ksatria Bhayangkara Wilwatikta)
      const p = player;
      ctx.save();
      ctx.translate(p.x, p.y);

      // Invulnerability blink
      if (p.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Flip player when facing left
      if (p.direction === 'left') {
        ctx.scale(-1, 1);
        ctx.translate(-p.width, 0);
      }

      // Torso & Royal Jarik (Batik Parang)
      ctx.fillStyle = '#78350f'; // bronze chest plate
      ctx.fillRect(8, 14, p.width - 16, 22);

      // Jarik / lower wrap
      ctx.fillStyle = '#b45309';
      ctx.fillRect(6, 34, p.width - 12, 18);

      // Bhayangkara Leggings & Leather Sandals (Grounded at y = 52 to 60)
      ctx.fillStyle = '#292524';
      if (p.state === 'run') {
        const legSwing = Math.sin(Date.now() * 0.018) * 3;
        ctx.fillRect(10 + legSwing, 52, 6, 8);
        ctx.fillRect(22 - legSwing, 52, 6, 8);
      } else {
        ctx.fillRect(10, 52, 6, 8);
        ctx.fillRect(22, 52, 6, 8);
      }

      // Head & Golden Udeng (Headcloth)
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(p.width / 2, 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24'; // golden udeng crest
      ctx.fillRect(p.width / 2 - 8, 2, 16, 5);

      // Weapon: Keris Luk 9 Pusaka
      const isAttacking = p.state.startsWith('attack');
      ctx.save();
      if (isAttacking) {
        ctx.translate(p.width - 4, 20);
        ctx.rotate(p.attackCombo === 2 ? 0.8 : p.attackCombo === 3 ? 1.4 : 0.4);
      } else {
        ctx.translate(p.width - 6, 26);
      }

      // Glowing Golden Keris Luk 9 blade
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(8, -4);
      ctx.lineTo(16, 2);
      ctx.lineTo(24, -4);
      ctx.lineTo(30, 0);
      ctx.stroke();

      // Blade hilt
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, -2, 6, 6);
      ctx.restore();

      // Shield (if blocking)
      if (p.blockActive) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.width + 2, 26, 22, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Majapahit Sun symbol on shield
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(p.width + 6, 26, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Arya Sena's Lentera Obor (Lantern attached to hip)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(p.direction === 'right' ? -3 : p.width - 1, 26, 4, 10);
      const lanternFuelRatio = Math.max(0, p.stats.lanternFuel / p.stats.maxLanternFuel);
      const lanternGlowAlpha = lanternFuelRatio > 0 ? (lanternFuelRatio < 0.2 ? 0.3 + Math.random() * 0.6 : 0.9) : 0;
      if (lanternGlowAlpha > 0) {
        ctx.fillStyle = `rgba(251, 191, 36, ${lanternGlowAlpha})`;
        ctx.beginPath();
        ctx.arc(p.direction === 'right' ? -1 : p.width + 1, 32, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 11. PARTICLES RENDERING
      gameStateRef.current.particles.forEach((pt) => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 12. FLOATING TEXTS (Damage, Checkpoint, Heals)
      gameStateRef.current.floatingTexts.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.fontSize || 14}px Cinzel, serif`;
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1.0;

      // 12.5. SURVIVAL HORROR DARKNESS & LANTERN ILLUMINATION
      // Atmospheric dynamic shadows of Benteng Wilwatikta
      const fuelPct = Math.max(0, player.stats.lanternFuel / player.stats.maxLanternFuel);
      const isBlackout = fuelPct <= 0;
      const flicker = (Math.sin(Date.now() * 0.01) + Math.cos(Date.now() * 0.023)) * (fuelPct < 0.2 ? 18 : 5);
      const lanternRadius = isBlackout ? 0 : Math.max(40, 225 * fuelPct + flicker);

      ctx.save();
      const darkAlpha = isBlackout ? 0.98 : Math.min(0.86, 0.58 + (1 - fuelPct) * 0.3);
      const pCenterX = player.x + player.width / 2;
      const pCenterY = player.y + player.height / 2;

      // Dark radial vignette around player's lantern
      const vignetteGrad = ctx.createRadialGradient(
        pCenterX,
        pCenterY,
        lanternRadius * 0.35,
        pCenterX,
        pCenterY,
        lanternRadius
      );
      vignetteGrad.addColorStop(0, 'rgba(10, 9, 8, 0)');
      vignetteGrad.addColorStop(0.65, `rgba(10, 9, 8, ${darkAlpha * 0.5})`);
      vignetteGrad.addColorStop(1, `rgba(10, 9, 8, ${darkAlpha})`);

      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(camX, 0, canvas.width, stage.worldHeight);

      // Deep darkness beyond lantern reach
      ctx.fillStyle = `rgba(10, 9, 8, ${darkAlpha})`;
      if (pCenterX - lanternRadius > camX) {
        ctx.fillRect(camX, 0, pCenterX - lanternRadius - camX, stage.worldHeight);
      }
      if (pCenterX + lanternRadius < camX + canvas.width) {
        ctx.fillRect(pCenterX + lanternRadius, 0, (camX + canvas.width) - (pCenterX + lanternRadius), stage.worldHeight);
      }

      // Checkpoints sacred light halos
      gameStateRef.current.checkpoints.forEach((cp) => {
        if (cp.activated) {
          const cpHalo = ctx.createRadialGradient(cp.x + cp.width / 2, cp.y + 35, 8, cp.x + cp.width / 2, cp.y + 35, 110);
          cpHalo.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
          cpHalo.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = cpHalo;
          ctx.beginPath();
          ctx.arc(cp.x + cp.width / 2, cp.y + 35, 110, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Low fuel warning border pulse
      if (fuelPct < 0.2 && !isBlackout) {
        const pulse = (Math.sin(Date.now() * 0.008) + 1) / 2;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.12 + pulse * 0.22})`;
        ctx.lineWidth = 12;
        ctx.strokeRect(camX, 0, canvas.width, stage.worldHeight);
      }

      ctx.restore();

      // 13. BOSS HEALTH BAR (HUD overlay in world coordinates or screen space)
      if (gameStateRef.current.activeBoss) {
        const boss = gameStateRef.current.activeBoss;
        ctx.restore(); // switch back to screen coordinates for top boss bar
        ctx.save();

        const barWidth = Math.min(520, canvas.width - 40);
        const barX = (canvas.width - barWidth) / 2;
        const barY = 65;

        // Frame
        ctx.fillStyle = 'rgba(28, 25, 23, 0.95)';
        ctx.fillRect(barX - 10, barY - 24, barWidth + 20, 48);
        ctx.strokeStyle = boss.type === 'avatar_angkara_dahana' ? '#ef4444' : '#b45309';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 10, barY - 24, barWidth + 20, 48);

        // Boss Title
        ctx.fillStyle = boss.type === 'avatar_angkara_dahana' ? '#fca5a5' : '#fef08a';
        ctx.font = 'bold 13px Cinzel, serif';
        ctx.textAlign = 'center';
        const bossTitle = boss.type === 'avatar_angkara_dahana'
          ? '☠ ANTAGONIS UTAMA: AVATAR ANGKARA DAHANA ☠'
          : `★ SENOPATI MUSUH: ${boss.name.toUpperCase()} ★`;
        ctx.fillText(bossTitle, canvas.width / 2, barY - 6);

        // Bar fill
        const hpPercent = Math.max(0, boss.hp / boss.maxHp);
        ctx.fillStyle = '#441d13';
        ctx.fillRect(barX, barY + 2, barWidth, 14);
        ctx.fillStyle = boss.type === 'avatar_angkara_dahana' ? '#dc2626' : '#ea580c';
        ctx.fillRect(barX, barY + 2, barWidth * hpPercent, 14);

        // HP numbers
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`${boss.hp} / ${boss.maxHp}`, canvas.width / 2, barY + 13);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    stage,
    player,
    isPaused,
    onUpdatePlayer,
    onActivateCheckpoint,
    onOpenCheckpointMenu,
    onPlayerDeath,
    onStageClear,
    onAddScore,
    onNearArtifact,
    onOpenArtifactModal,
    onUpdateBarricade,
    solvedArtifactIds,
  ]);

  // Handle dynamic canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      id="game-canvas"
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block bg-stone-950 cursor-crosshair touch-none"
    />
  );
};
