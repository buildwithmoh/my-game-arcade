const GROUND_Y        = 829;
const WATER_TOP       = GROUND_Y + 80;
const PLAYER_SIZE     = 156;
const HITBOX_SIZE     = 112;
const PLAYER_SCREEN_X = 211;
const GAP_BTW         = 130;
const SCROLL_SPEED    = 3.2;
const GRAVITY         = 1.34;
const JUMP_FORCE      = -30.5;
const AIR_BOOST_VY    = -22;
const MAX_AIR_TAPS    = 3;
const SPEED_RAMP_1000 = 0.15;
const SPEED_RAMP_CAP  = 1.6;
const FLOAT_CHANCE    = 0.35;
const OBSTACLE_CHANCE = 0.38;

const sn = (n) => Math.sin(n * 127.1 + 311.7) * 0.5 + 0.5;

const createGroundSegment = (x, width) => ({ x, y: GROUND_Y, width, height: 146 });
const createStartPlatform = () => createGroundSegment(-88, 702);

function loadImg(src) { const i = new Image(); i.src = src; return i; }
function waitImg(img) {
  return new Promise((res) => {
    if (img.complete && img.naturalWidth) { res(); return; }
    img.onload = img.onerror = () => res();
  });
}
function measureBottomInset(img) {
  const mc = document.createElement("canvas");
  mc.width = img.naturalWidth; mc.height = img.naturalHeight;
  const mctx = mc.getContext("2d");
  mctx.drawImage(img, 0, 0);
  const { data, width, height } = mctx.getImageData(0, 0, mc.width, mc.height);
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) return height - 1 - y;
    }
  }
  return 0;
}
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function mountGameplay(character, color, props) {
  const { initialLives, bestScore, onMainMenu, onPlayAgain, onBestScore } = props;
  const charSet = SPRITE_SETS[character] || SPRITE_SETS.female;
  const sprites = charSet[color] || charSet.red;
  const mount = document.getElementById("gameplayMount");
  const mountRect = mount.getBoundingClientRect();

  const H = 1024;
  const MIN_LOGICAL_W = 500;
  const computeScale = (w, h) => {
    let s = h / H;
    if (w / s < MIN_LOGICAL_W) s = w / MIN_LOGICAL_W;
    return s;
  };
  let realW = Math.round(mountRect.width);
  let realH = Math.round(mountRect.height);
  let scale = computeScale(realW, realH);
  let W = realW / scale;

  mount.innerHTML = `
    <canvas id="gameCanvas" class="game-canvas" width="${realW}" height="${realH}"></canvas>

    <div id="prejumpPrompt" class="prejump-prompt">Tap / Space / ↑ to start</div>

    <div id="controlRow" class="control-row">
      <button id="pauseButton" class="icon-button" aria-label="Pause">⏸</button>
      <button id="soundButton" class="icon-button" aria-label="Mute sound">🔊</button>
    </div>

    <div id="pauseOverlay" class="pause-overlay">
      <div class="pause-overlay-text">Paused</div>
    </div>

    <div id="hudRow" class="hud-row hud-row--gameplay">
      ${pillHTML("❤️", `<span id="hudLives">Lives: ${initialLives}</span>`)}
      ${pillHTML("🪙", `<span id="hudCoins">Coins: 0</span>`)}
      ${pillHTML("⭐", `<span id="hudScore">Score: 0</span>`)}
    </div>

    <div id="gameOverOverlay">
      <div class="card">
        <span class="gameover-star gameover-star--1">🌟</span>
        <span class="gameover-star gameover-star--2">✨</span>

        ${cardHeaderHTML()}

        <div id="mainMenuLink" class="main-menu-link">Main Menu</div>

        <div class="card-interior card-interior--gameover">
          <div class="gameover-heading">
            <p class="gameover-title">GAME OVER</p>
            <p class="gameover-subtitle">You gave it your all — try again! 🌿</p>
          </div>

          <img id="goDizzy" alt="Dizzy character" class="gameover-sprite" />

          <div class="stats-row">
            ${pillHTML("🪙", `Coins: <span id="goCoins">0</span>`)}
            ${pillHTML("⭐", `Score: <span id="goScore">0</span>`)}
          </div>
        </div>

        <img id="playAgainImg" src="${IMG.playAgainButton}" alt="Play Again" class="primary-button primary-button--play-again" />
      </div>
    </div>
  `;

  watchCardFrameLoad(mount);

  const hudRow = document.getElementById("hudRow");
  const controlRow = document.getElementById("controlRow");
  const pauseButton = document.getElementById("pauseButton");
  const soundButton = document.getElementById("soundButton");
  const pauseOverlay = document.getElementById("pauseOverlay");

  let edgeInset = Math.round(22 * scale);

  const positionHudChrome = () => {
    edgeInset = Math.round(22 * scale);
    hudRow.style.top = Math.round(18 * scale) + "px";
    hudRow.style.right = edgeInset + "px";
    hudRow.style.gap = Math.round(6 * scale) + "px";
    controlRow.style.top = Math.round(18 * scale) + "px";
    controlRow.style.left = edgeInset + "px";
    controlRow.style.gap = Math.round(6 * scale) + "px";
  };
  positionHudChrome();

  const fitHudChrome = () => {
    hudRow.style.transform = "scale(1)";
    controlRow.style.transform = "scale(1)";
    const hudRect = hudRow.getBoundingClientRect();
    const controlRect = controlRow.getBoundingClientRect();
    const spacing = 12;
    const available = realW - edgeInset * 2 - spacing;
    if (hudRect.width + controlRect.width > available) {
      const shrink = Math.max(0.5, available / (hudRect.width + controlRect.width));
      hudRow.style.transform = `scale(${shrink})`;
      hudRow.style.transformOrigin = "top right";
      controlRow.style.transform = `scale(${shrink})`;
      controlRow.style.transformOrigin = "top left";
    }
  };
  fitHudChrome();

  const syncSoundUI = () => {
    soundButton.textContent = isMuted() ? "🔇" : "🔊";
    soundButton.setAttribute("aria-label", isMuted() ? "Unmute sound" : "Mute sound");
  };
  syncSoundUI();

  soundButton.addEventListener("click", () => {
    const nextMuted = !isMuted();
    setMuted(nextMuted);
    syncSoundUI();
    if (!nextMuted) playClick();
  });

  const gameOverCard = mount.querySelector("#gameOverOverlay .card");
  gameOverCard.addEventListener("animationend", () => {
    gameOverCard.classList.remove("popin");
    fitCards();
  });

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const hudLivesEl = document.getElementById("hudLives");
  const hudCoinsEl = document.getElementById("hudCoins");
  const hudScoreEl = document.getElementById("hudScore");
  const prejumpPrompt = document.getElementById("prejumpPrompt");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const goDizzy = document.getElementById("goDizzy");
  const goCoinsEl = document.getElementById("goCoins");
  const goScoreEl = document.getElementById("goScore");
  const playAgainImg = document.getElementById("playAgainImg");
  const mainMenuLink = document.getElementById("mainMenuLink");
  mainMenuLink.addEventListener("click", () => { playClick(); onMainMenu(); });

  const resizeCanvas = () => {
    const rect = mount.getBoundingClientRect();
    realW = Math.round(rect.width);
    realH = Math.round(rect.height);
    scale = computeScale(realW, realH);
    W = realW / scale;
    canvas.width = realW;
    canvas.height = realH;
    positionHudChrome();
    fitHudChrome();
    fitCards();
  };

  const onOrientationChange = () => setTimeout(resizeCanvas, 50);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("orientationchange", onOrientationChange);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resizeCanvas);
  }

  goDizzy.src = sprites.dizzy;

  playAgainImg.addEventListener("click", () => { playStart(); onPlayAgain(); });

  const spr = {
    idle:  loadImg(sprites.idle),
    jump:  loadImg(sprites.jump),
    fall:  loadImg(sprites.fall),
    dizzy: loadImg(sprites.dizzy),
    idleInset: 0, jumpInset: 0, fallInset: 0,
  };
  const sprReady = { idle: false, jump: false, fall: false };

  const spawnGs = () => ({
    running: false,
    worldX: 0,
    nextSpawnX: 614,
    platforms: [createStartPlatform()],
    obstacles: [],
    coins: [],
    particles: [],
    player: {
      x: PLAYER_SCREEN_X, y: GROUND_Y - PLAYER_SIZE,
      vy: 0, onGround: true, airTapsLeft: 0,
      facingSquash: 1, hurtTimer: 0,
      inWater: false, waterTimer: 0,
    },
    lives: initialLives,
    score: 0, coinsCollected: 0,
    best: bestScore,
  });

  let gsState = spawnGs();
  const gs = () => gsState;

  const syncHUD = () => {
    const g = gs();
    hudLivesEl.textContent = `Lives: ${g.lives}`;
    hudCoinsEl.textContent = `Coins: ${g.coinsCollected}`;
    hudScoreEl.textContent = `Score: ${g.score}`;
  };
  syncHUD();

  const ensureLevelAhead = () => {
    const g = gs();
    const viewRight = g.worldX + W;
    while (g.nextSpawnX < viewRight + 500) {
      const nx = g.nextSpawnX;
      const platW = 280 + Math.floor(Math.random() * 240);

      let holeStart = null, holeEnd = null;
      if (Math.random() < FLOAT_CHANCE) {
        const fW = 180 + Math.floor(Math.random() * 120);
        const fY = GROUND_Y - 230 - Math.floor(Math.random() * 130);
        const fX = nx + Math.floor(Math.random() * (platW - fW - 20));
        g.platforms.push({ x: fX, y: fY, width: fW, height: 28 });
        holeStart = fX;
        holeEnd = fX + fW;
      }

      if (holeStart !== null) {
        if (holeStart > nx) g.platforms.push(createGroundSegment(nx, holeStart - nx));
        if (holeEnd < nx + platW) g.platforms.push(createGroundSegment(holeEnd, nx + platW - holeEnd));
      } else {
        g.platforms.push(createGroundSegment(nx, platW));
      }

      if (Math.random() < OBSTACLE_CHANCE) {
        const oW = 52, oH = 78;
        const oX = nx + 90 + Math.floor(Math.random() * Math.max(10, platW - 200));
        if (holeStart === null || oX + oW < holeStart || oX > holeEnd) {
          g.obstacles.push({ x: oX, y: GROUND_Y - oH, width: oW, height: oH });
        }
      }
      const numCoins = 3 + Math.floor(Math.random() * 4);
      const arcBase = nx + 50;
      const arcSpan = platW * 0.65;
      const arcLift = 110 + Math.random() * 90;
      for (let i = 0; i < numCoins; i++) {
        const fi = numCoins > 1 ? i / (numCoins - 1) : 0.5;
        g.coins.push({
          x: arcBase + fi * arcSpan,
          y: GROUND_Y - arcLift - Math.sin(fi * Math.PI) * 70,
          radius: 16, collected: false,
        });
      }
      g.nextSpawnX = nx + platW + GAP_BTW;
    }
  };

  const cleanupBehindCamera = () => {
    const g = gs();
    const edge = g.worldX - 300;
    g.platforms = g.platforms.filter(p => p.x + p.width > edge);
    g.obstacles = g.obstacles.filter(o => o.x + o.width > edge);
    g.coins = g.coins.filter(c => c.x + c.radius > edge);
    g.particles = g.particles.filter(p => p.life > 0);
  };

  const spawnParticles = (wx, y) => {
    const g = gs();
    for (let i = 0; i < 8; i++) {
      g.particles.push({ x: wx - g.worldX, y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3 - 1, life: 1 });
    }
  };
  const updateParticles = () => {
    const g = gs();
    for (const p of g.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.03; }
  };

  const doJump = () => {
    const g = gs();
    if (!g.running) return;
    const p = g.player;
    if (p.onGround) {
      p.vy = JUMP_FORCE;
      p.onGround = false;
      p.airTapsLeft = MAX_AIR_TAPS;
      p.facingSquash = 0.75;
      playJump();
    } else if (p.airTapsLeft > 0 && p.vy > AIR_BOOST_VY) {
      p.vy = AIR_BOOST_VY;
      p.airTapsLeft -= 1;
      p.facingSquash = 0.85;
      playJump();
    }
  };

  let gameOverFired = false;

  const resetLevelToStart = () => {
    const g = gs();
    g.worldX = 0;
    g.nextSpawnX = 614;
    g.platforms = [createStartPlatform()];
    g.obstacles = [];
    g.coins = [];
    g.particles = [];
    g.running = false;
  };

  const finishLifeLoss = () => {
    const g = gs();
    if (g.lives <= 0) {
      g.running = false;
      if (g.score > g.best) {
        g.best = g.score;
        localStorage.setItem("ahhRunnerBest", String(g.score));
        if (onBestScore) onBestScore(g.score);
      }
      if (!gameOverFired) {
        gameOverFired = true;
        goCoinsEl.textContent = g.coinsCollected;
        goScoreEl.textContent = g.score;
        gameOverOverlay.classList.add("show");
        controlRow.classList.add("is-hidden");
        prepareCardEntrance(gameOverCard);
        gameOverCard.classList.add("popin");
        playGameOver();
      }
    } else {
      resetLevelToStart();
      resetPlayerPos();
      prejumpPrompt.classList.remove("is-hidden");
    }
    syncHUD();
  };

  const loseLife = () => {
    const g = gs();
    if (!g.running) return;
    g.player.hurtTimer = 40;
    g.lives -= 1;
    playHurt();
    finishLifeLoss();
  };

  const WATER_STRUGGLE_FRAMES = 180;

  const fallIntoWater = () => {
    const g = gs();
    if (!g.running || g.player.inWater) return;
    const p = g.player;
    p.inWater = true;
    p.waterTimer = WATER_STRUGGLE_FRAMES;
    p.vy = 0;
    p.y = GROUND_Y + 60;
    g.lives -= 1;
    g.running = false;
    playHurt();
    syncHUD();
  };

  const updateWaterCountdown = () => {
    const g = gs();
    const p = g.player;
    if (!p.inWater || paused) return;
    p.waterTimer -= 1;
    if (Math.random() < 0.15) {
      spawnParticles(p.x + g.worldX + PLAYER_SIZE / 2, GROUND_Y + 95);
    }
    if (p.waterTimer <= 0) {
      p.inWater = false;
      finishLifeLoss();
    }
  };

  const resetPlayerPos = () => {
    const g = gs();
    g.player.y = GROUND_Y - PLAYER_SIZE;
    g.player.vy = 0;
    g.player.onGround = true;
    g.player.airTapsLeft = 0;
    g.player.inWater = false;
    g.player.waterTimer = 0;
  };

  const updatePlayer = () => {
    const g = gs();
    const p = g.player;
    const playerWorldX = p.x + g.worldX;
    p.vy += GRAVITY;
    p.y += p.vy;
    p.onGround = false;
    for (const plat of g.platforms) {
      const withinX = playerWorldX + HITBOX_SIZE > plat.x && playerWorldX < plat.x + plat.width;
      const feetY = p.y + PLAYER_SIZE;
      const wasAbove = feetY - p.vy <= plat.y + 2;
      const landing = p.vy >= 0 && feetY >= plat.y && feetY <= plat.y + plat.height + 14;
      if (withinX && landing && wasAbove) {
        p.y = plat.y - PLAYER_SIZE; p.vy = 0; p.onGround = true;
        p.airTapsLeft = 0; p.facingSquash = 1.25; break;
      }
    }
    if (p.y > GROUND_Y + 90) { fallIntoWater(); return; }
    p.facingSquash += (1 - p.facingSquash) * 0.2;
    if (p.hurtTimer > 0) p.hurtTimer -= 1;

    if (p.hurtTimer === 0) {
      const hOff = (PLAYER_SIZE - HITBOX_SIZE) / 2;
      for (const o of g.obstacles) {
        if (rectsOverlap(playerWorldX + hOff, p.y + hOff, HITBOX_SIZE, HITBOX_SIZE, o.x, o.y, o.width, o.height)) {
          loseLife(); break;
        }
      }
    }
    for (const c of g.coins) {
      if (c.collected) continue;
      const dx = playerWorldX + PLAYER_SIZE / 2 - c.x;
      const dy = p.y + PLAYER_SIZE / 2 - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < c.radius + HITBOX_SIZE / 2) {
        c.collected = true;
        g.coinsCollected += 1;
        g.score += 10;
        spawnParticles(c.x, c.y);
        playCoin();
        syncHUD();
      }
    }
  };

  const cloudBases = [140, 562, 983, 1335];
  const drawClouds = (worldX) => {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    cloudBases.forEach((base, i) => {
      const loopW = W + 351;
      const cx = (((base - worldX * 0.3) % loopW) + loopW) % loopW - 176;
      const cy = 115 + i * 58;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 56, 40, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 44, cy + 10, 40, 32, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 40, cy + 10, 36, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy - 10, 30, 18, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
    });
  };

  const hillBases = [0, 480, 960];
  const drawHills = (worldX) => {
    const tileW = 480;
    const loopW = tileW * hillBases.length;
    const hillY = GROUND_Y + 40;
    ctx.fillStyle = "#8fd48a";
    hillBases.forEach((base) => {
      const x = (((base - worldX * 0.12) % loopW) + loopW) % loopW - tileW;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.moveTo(x, hillY + 140);
      ctx.quadraticCurveTo(x + tileW * 0.25, hillY - 100, x + tileW * 0.5, hillY + 10);
      ctx.quadraticCurveTo(x + tileW * 0.75, hillY - 115, x + tileW, hillY + 140);
      ctx.lineTo(x + tileW, H); ctx.lineTo(x, H);
      ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = "#6abf64";
    hillBases.forEach((base) => {
      const x = (((base + 240 - worldX * 0.20) % loopW) + loopW) % loopW - tileW;
      ctx.beginPath();
      ctx.moveTo(x, hillY + 160);
      ctx.quadraticCurveTo(x + tileW * 0.3, hillY - 70, x + tileW * 0.5, hillY + 30);
      ctx.quadraticCurveTo(x + tileW * 0.7, hillY - 95, x + tileW, hillY + 160);
      ctx.lineTo(x + tileW, H); ctx.lineTo(x, H);
      ctx.closePath(); ctx.fill();
    });
  };

  const drawWater = (t) => {
    const top = WATER_TOP;
    ctx.fillStyle = "#1B5E8A";
    ctx.fillRect(0, top, W, H - top);
    const passes = [
      [0.018, 1.0, 10, 0.032, 1.3, "#2270AC"],
      [0.024, 0.7, 7, 0.040, 1.0, "#2E88C4"],
    ];
    for (const [f1, t1, a1, f2, t2, col] of passes) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 5) {
        const y = top - 2 + Math.sin(x * f1 + t * t1) * a1 + Math.sin(x * f2 + t * t2) * (a1 * 0.4);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 5) {
      const y = top + Math.sin(x * 0.018 + t) * 10 + Math.sin(x * 0.032 + t * 1.3) * 4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const sharkBases = [700, 1300];
  const drawSharks = (worldX, t) => {
    const waterTop = WATER_TOP;
    sharkBases.forEach((base, i) => {
      const loopW = W + 300;
      const speed = 0.7 + i * 0.06;
      const sx = (((base - worldX * speed) % loopW) + loopW) % loopW - 150;
      const wobble = Math.sin(t * 1.2 + i * 3) * 14;
      const sy = waterTop + 6;
      ctx.fillStyle = "#4A5560";
      ctx.beginPath();
      ctx.moveTo(sx + wobble - 10, sy + 10);
      ctx.quadraticCurveTo(sx + wobble, sy - 22, sx + wobble + 10, sy + 10);
      ctx.quadraticCurveTo(sx + wobble, sy + 4, sx + wobble - 10, sy + 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + wobble - 22, sy + 12);
      ctx.quadraticCurveTo(sx + wobble, sy + 6, sx + wobble + 22, sy + 12);
      ctx.stroke();
    });
  };

  const drawCanopy = () => {
    const FLAT = 34, R = 23, STEP = 45;
    ctx.fillStyle = "#175D18";
    ctx.fillRect(0, 0, W, FLAT);
    ctx.fillStyle = "#1D7320";
    for (let x = 0; x <= W + STEP; x += STEP) { ctx.beginPath(); ctx.arc(x, FLAT, R, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#249E28";
    for (let x = STEP / 2; x <= W + STEP; x += STEP) { ctx.beginPath(); ctx.arc(x, FLAT - 5, R - 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#175D18";
    ctx.fillRect(0, 0, W, FLAT - 2);
  };

  const drawVine = (sx) => {
    const topY = 56;
    const len = 82 + sn(sx) * 44;
    const sway = (sn(sx * 1.7) - 0.5) * 24;
    ctx.strokeStyle = "#3A8C28"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx, topY);
    ctx.bezierCurveTo(sx + sway * 0.3, topY + len * 0.3, sx + sway * 0.8, topY + len * 0.7, sx + sway * 0.6, topY + len);
    ctx.stroke();
    ctx.fillStyle = "#4CAF50";
    for (let i = 0; i < 3; i++) {
      const fi = 0.22 + i * 0.30;
      const lx = sx + sway * fi;
      const ly = topY + len * fi;
      const lr = 4.5 + sn(sx + i * 9) * 3;
      const side = i % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(lx + side * 9, ly, lr, lr * 0.55, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3A8C28"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + side * 9, ly); ctx.stroke();
    }
  };
  const vineClusters = [[150, 186, 222], [695, 728, 760, 792], [1246, 1278, 1310]];
  const drawVines = () => vineClusters.forEach(cl => cl.forEach(vx => drawVine(vx)));

  const drawStartSign = () => {
    const sx = 14, sy = GROUND_Y - 58;
    ctx.fillStyle = "#7A4A18";
    ctx.fillRect(sx + 5, sy, 8, 52);
    ctx.fillRect(sx + 33, sy, 8, 52);
    ctx.fillStyle = "#C48A38";
    ctx.fillRect(sx, sy - 28, 52, 28);
    ctx.strokeStyle = "#7A4A18"; ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy - 28, 52, 28);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px monospace";
    ctx.textBaseline = "middle"; ctx.textAlign = "center";
    ctx.fillText("START", sx + 26, sy - 14);
    ctx.textAlign = "left";
  };

  const drawPlatforms = () => {
    const g = gs();
    for (const p of g.platforms) {
      const sx = p.x - g.worldX;
      if (sx + p.width < 0 || sx > W) continue;
      ctx.fillStyle = "#5B3A29";
      ctx.fillRect(sx, p.y, p.width, p.height);
      ctx.fillStyle = "#7BC86C";
      ctx.fillRect(sx, p.y, p.width, 24);
    }
  };

  const drawObstacles = () => {
    const g = gs();
    ctx.fillStyle = "#E03030";
    for (const o of g.obstacles) {
      const sx = o.x - g.worldX;
      if (sx + o.width < 0 || sx > W) continue;
      ctx.beginPath();
      ctx.moveTo(sx + o.width / 2, o.y);
      ctx.lineTo(sx, o.y + o.height);
      ctx.lineTo(sx + o.width, o.y + o.height);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#FF5050";
      ctx.beginPath();
      ctx.moveTo(sx + o.width / 2 - 4, o.y + 10);
      ctx.lineTo(sx + o.width / 2, o.y + 2);
      ctx.lineTo(sx + o.width / 2 + 4, o.y + 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#E03030";
    }
  };

  const drawCoins = () => {
    const g = gs();
    for (const c of g.coins) {
      if (c.collected) continue;
      const sx = c.x - g.worldX;
      if (sx + c.radius < 0 || sx - c.radius > W) continue;
      ctx.beginPath(); ctx.arc(sx, c.y, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD23F"; ctx.fill();
      ctx.strokeStyle = "#C9930A"; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, c.y, c.radius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = "#FFEC80"; ctx.fill();
    }
  };

  const drawParticles = () => {
    const g = gs();
    for (const p of g.particles) {
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = "#FFD23F";
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const drawFittedSprite = (sprite, inset, boxX, boxY) => {
    const ratio = Math.min(PLAYER_SIZE / sprite.naturalWidth, PLAYER_SIZE / sprite.naturalHeight);
    const sw = sprite.naturalWidth * ratio;
    const sh = sprite.naturalHeight * ratio;
    const spriteScale = sh / sprite.naturalHeight;
    const footShift = inset * spriteScale;
    ctx.drawImage(sprite, boxX + (PLAYER_SIZE - sw) / 2, boxY + PLAYER_SIZE - sh + footShift, sw, sh);
  };

  const drawPlayer = () => {
    const g = gs();
    const p = g.player;

    if (p.inWater) {
      const bobY = Math.sin(frame * 0.25) * 6;
      const wobble = Math.sin(frame * 0.18) * 0.09;
      const boxX = p.x;
      const boxY = p.y + bobY;
      if (sprReady.fall) {
        const cx = boxX + PLAYER_SIZE / 2;
        const cy = boxY + PLAYER_SIZE / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(wobble);
        ctx.translate(-cx, -cy);
        drawFittedSprite(spr.fall, spr.fallInset, boxX, boxY);
        ctx.restore();
        ctx.fillStyle = "rgba(27, 94, 138, 0.5)";
        ctx.fillRect(boxX - 12, boxY + PLAYER_SIZE * 0.6, PLAYER_SIZE + 24, PLAYER_SIZE * 0.55);
      }
      return;
    }

    const hurt = p.hurtTimer > 0;
    const air = !p.onGround;
    let sprite = spr.idle, ready = sprReady.idle, inset = spr.idleInset;
    if (hurt) { sprite = spr.fall; ready = sprReady.fall; inset = spr.fallInset; }
    else if (air) { sprite = p.vy < 0 ? spr.jump : spr.fall; ready = sprReady.jump; inset = spr.jumpInset; }
    const bob = (1 - p.facingSquash) * 34;
    const boxX = p.x;
    const boxY = p.y + bob;
    if (ready) {
      drawFittedSprite(sprite, inset, boxX, boxY);
    } else {
      ctx.fillStyle = "#2f6fed";
      ctx.fillRect(boxX, boxY, PLAYER_SIZE, PLAYER_SIZE);
    }
  };

  const handleJumpInput = () => {
    if (gameOverFired || paused) return;
    const g = gs();
    if (g.player.inWater) return;
    if (!g.running) { g.running = true; prejumpPrompt.classList.add("is-hidden"); }
    doJump();
  };
  const onKey = (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); handleJumpInput(); }
  };
  const onTouch = (e) => { e.preventDefault(); handleJumpInput(); };

  window.addEventListener("keydown", onKey);
  canvas.addEventListener("mousedown", handleJumpInput);
  canvas.addEventListener("touchstart", onTouch, { passive: false });

  let frame = 0;
  let rafId = 0;
  let stopped = false;
  let paused = false;
  let tabHidden = false;
  let userPaused = false;

  const syncPauseUI = () => {
    pauseButton.textContent = userPaused ? "▶" : "⏸";
    pauseButton.setAttribute("aria-label", userPaused ? "Resume" : "Pause");
    pauseOverlay.classList.toggle("show", userPaused);
  };

  pauseButton.addEventListener("click", () => {
    if (gameOverFired) return;
    playClick();
    userPaused = !userPaused;
    paused = tabHidden || userPaused;
    syncPauseUI();
  });

  pauseOverlay.addEventListener("click", () => {
    if (!userPaused) return;
    playClick();
    userPaused = false;
    paused = tabHidden || userPaused;
    syncPauseUI();
  });

  const loop = () => {
    if (stopped) return;
    frame++;
    const t = frame * 0.05;
    const g = gs();

    if (g.running && !paused) {
      const ramp = Math.min(SPEED_RAMP_CAP, 1 + (g.worldX / 1000) * SPEED_RAMP_1000);
      g.worldX += SCROLL_SPEED * ramp;
      ensureLevelAhead();
      cleanupBehindCamera();
      updatePlayer();
      updateParticles();
    }
    updateWaterCountdown();
    if (g.player.inWater) updateParticles();

    const letterboxGap = realH - scale * H;
    if (letterboxGap > 0.5) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#4BBCD8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.setTransform(scale, 0, 0, scale, 0, letterboxGap / 2);
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, "#4BBCD8");
    sky.addColorStop(0.55, "#86CEEC");
    sky.addColorStop(1, "#B4E2F5");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    drawClouds(g.worldX);
    drawHills(g.worldX);
    drawWater(t);
    drawSharks(g.worldX, t);
    drawPlatforms();
    drawObstacles();
    drawCoins();
    drawParticles();
    drawPlayer();
    if (!g.running && g.worldX === 0) drawStartSign();
    drawCanopy();
    drawVines();

    rafId = requestAnimationFrame(loop);
  };

  Promise.all([spr.idle, spr.jump, spr.fall, spr.dizzy].map(waitImg)).then(() => {
    sprReady.idle = true; spr.idleInset = measureBottomInset(spr.idle);
    sprReady.jump = true; spr.jumpInset = measureBottomInset(spr.jump);
    sprReady.fall = true; spr.fallInset = measureBottomInset(spr.fall);
    if (!stopped) rafId = requestAnimationFrame(loop);
  });

  return {
    cleanup() {
      stopped = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", onOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", resizeCanvas);
      }
    },
    setPaused(value) {
      tabHidden = value;
      paused = tabHidden || userPaused;
      syncPauseUI();
    },
  };
}
