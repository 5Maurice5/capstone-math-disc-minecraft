const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 40;
const COLS = 20;
const ROWS = 15;

// Estado del Juego
let gameState = {
  crystals: [false, false, false],
  zone3Unlocked: false,
  portalOpen: false,
  player: { x: 1, y: 1, dir: "down" },
  z1BaseValid: null,
};

// Estado de la pantalla de inicio
let playerName = "";
let gameStarted = false;

// Cambia entre las sub-pantallas del inicio: 'title-menu', 'name-screen', 'help-screen'
function showScreen(id) {
  ["title-menu", "name-screen", "help-screen"].forEach((s) => {
    document.getElementById(s).classList.toggle("screen-hidden", s !== id);
  });
  if (id === "name-screen") {
    setTimeout(() => document.getElementById("username-input").focus(), 0);
  }
}

function startGame() {
  const input = document.getElementById("username-input");
  const error = document.getElementById("username-error");
  const name = input.value.trim();

  if (name.length < 2) {
    error.innerText = "Ingresa un nombre (mínimo 2 caracteres)";
    return;
  }

  error.innerText = "";
  playerName = name;
  gameStarted = true;

  document.getElementById("start-screen").classList.add("screen-hidden");
  document.getElementById("game-container").classList.remove("screen-hidden");

  // textContent evita que se inyecte HTML desde el nombre
  document.getElementById("hud-username").textContent = playerName;
  document.getElementById("victory-username").textContent = playerName;

  renderMap();
  showToast(`¡Bienvenido, ${playerName}!`);
}

// Enter en el input inicia el juego
document.getElementById("username-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") startGame();
});

// Escape vuelve al menú principal desde las sub-pantallas
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !gameStarted) showScreen("title-menu");
});

/* ===== PANORAMA PIXELADO DEL MENÚ (atardecer con árboles de cerezo) ===== */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixColor(a, b, t) {
  const A = hexToRgb(a),
    B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
}

function drawTitlePanorama() {
  const c = document.getElementById("title-bg");
  if (!c) return;
  const W = 640,
    H = 180;
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const rnd = mulberry32(20);

  // Cielo en franjas (atardecer)
  const stops = [
    [0, "#1d2c55"],
    [0.45, "#5b4b86"],
    [0.72, "#c8647c"],
    [1, "#f58d3a"],
  ];
  for (let y = 0; y < H; y += 2) {
    const t = Math.min(1, y / 118);
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    g.fillStyle = mixColor(
      c0,
      c1,
      Math.min(1, Math.max(0, (t - t0) / (t1 - t0))),
    );
    g.fillRect(0, y, W, 2);
  }

  // Sol cuadrado con halo
  g.fillStyle = "rgba(255, 190, 110, 0.25)";
  g.fillRect(206, 84, 44, 44);
  g.fillStyle = "rgba(255, 210, 140, 0.4)";
  g.fillRect(212, 90, 32, 32);
  g.fillStyle = "#ffe9a8";
  g.fillRect(218, 96, 20, 20);

  // Nubes
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(rnd() * W);
    const y = 14 + Math.floor(rnd() * 70);
    const w = 30 + Math.floor(rnd() * 60);
    g.fillStyle = "rgba(70, 45, 100, 0.55)";
    g.fillRect(x, y, w, 4);
    g.fillRect(x + 6, y - 4, w - 14, 4);
    g.fillStyle = "rgba(255, 150, 110, 0.35)";
    g.fillRect(x + 2, y + 4, w - 6, 2);
  }

  // Colinas por capas
  function hillY(base, waves, x) {
    let y = base;
    waves.forEach(([amp, freq, ph]) => {
      y += Math.sin(x * freq + ph) * amp;
    });
    return Math.round(y / 2) * 2;
  }

  function drawHill(base, waves, color, topColor, dirtColor) {
    for (let x = 0; x < W; x += 2) {
      const y = hillY(base, waves, x);
      g.fillStyle = color;
      g.fillRect(x, y, 2, H - y);
      if (topColor) {
        g.fillStyle = topColor;
        g.fillRect(x, y, 2, 3);
      }
      if (dirtColor) {
        g.fillStyle = dirtColor;
        g.fillRect(x, y + 3, 2, H - y);
      }
    }
  }

  function drawTree(x, gy, s, pal) {
    const th = Math.round((9 + rnd() * 5) * s);
    const tw = Math.max(2, Math.round(s * 1.2));
    g.fillStyle = pal.trunk;
    g.fillRect(x, gy - th, tw, th + 1);

    const cx = x + tw / 2;
    const cy = gy - th;
    const r = Math.round((5 + rnd() * 3) * s);
    const step = Math.max(2, Math.round(s * 1.5));
    for (let dy = -Math.round(r * 0.8); dy <= Math.round(r * 0.5); dy += step) {
      for (let dx = -r; dx <= r; dx += step) {
        const inside = (dx * dx) / (r * r) + (dy * dy) / (r * 0.7 * (r * 0.7));
        if (inside < 1 + (rnd() - 0.5) * 0.4) {
          g.fillStyle = pal.leaf[Math.floor(rnd() * pal.leaf.length)];
          g.fillRect(Math.round(cx + dx), Math.round(cy + dy), step, step);
        }
      }
    }
  }

  const farWaves = [
    [6, 0.018, 0],
    [4, 0.045, 1.3],
    [2, 0.11, 2],
  ];
  const midWaves = [
    [5, 0.022, 1],
    [3, 0.06, 0.4],
    [2, 0.13, 2.2],
  ];
  const nearWaves = [
    [4, 0.017, 2],
    [3, 0.05, 1],
    [1.5, 0.12, 0.5],
  ];

  // Capa lejana (morada)
  drawHill(112, farWaves, "#3a2858");
  const farPal = { trunk: "#2a1f3d", leaf: ["#6e4a86", "#7d5595", "#5f3f78"] };
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(rnd() * W);
    drawTree(x, hillY(112, farWaves, x) + 2, 1, farPal);
  }

  // Capa media
  drawHill(130, midWaves, "#25392a", "#3b5a2c");
  const midPal = { trunk: "#3b2630", leaf: ["#c97aa8", "#b9689a", "#d58ab5"] };
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(rnd() * W);
    drawTree(x, hillY(130, midWaves, x) + 2, 2, midPal);
  }

  // Capa cercana (pasto y tierra)
  drawHill(150, nearWaves, "#1c2b1a", "#2f4d22", "#3a2818");

  // Flores rosadas
  for (let i = 0; i < 220; i++) {
    const x = Math.floor(rnd() * W);
    const y = hillY(150, nearWaves, x) - 1 + Math.floor(rnd() * 4) * 2;
    g.fillStyle = rnd() > 0.5 ? "#e58ab8" : "#f4b6d2";
    g.fillRect(x, y, 2, 2);
  }

  // Árboles grandes en primer plano
  const nearPal = {
    trunk: "#2e1f26",
    leaf: ["#e39bc4", "#d17fb0", "#f2b6d3", "#bd6a9d"],
  };
  [24, 420, 560].forEach((x, i) => {
    drawTree(x, hillY(150, nearWaves, x) + 2, i === 0 ? 5 : 3, nearPal);
  });
}

// 0: Camino, 1: Muro (Tierra con Pasto), 2: Piedra, 3: Faro/Inducción
// 4: Cofre/Conjuntos, 5: Puerta Relaciones, 6:Mochila/Combinatoria
// 7: Portal Final, 8: Ore de Diamante, 9: Ore de Oro, 10: Creeper, 11: Antorcha

const map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 11, 0, 1, 0, 8, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 6, 1],
  [1, 0, 3, 0, 1, 0, 1, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 9, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 11, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 0, 0, 5, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 11, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

function drawGrassBlock(px, py) {
  ctx.fillStyle = "#866043";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = "#5c3d26";
  ctx.fillRect(px + 4, py + 16, 6, 6);
  ctx.fillRect(px + 24, py + 26, 8, 6);
  ctx.fillRect(px + 14, py + 30, 6, 4);

  ctx.fillStyle = "#59981A";
  ctx.fillRect(px, py, TILE_SIZE, 10);

  ctx.fillStyle = "#3d6e11";
  for (let i = 0; i < TILE_SIZE; i += 8) {
    ctx.fillRect(px + i, py + 8, 4, 4);
  }

  ctx.strokeStyle = "#2d4a0a";
  ctx.lineWidth = 1;
  ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
}

function drawStoneBlock(px, py) {
  ctx.fillStyle = "#737373";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = "#525252";
  ctx.fillRect(px + 4, py + 6, 12, 4);
  ctx.fillRect(px + 20, py + 18, 14, 6);
  ctx.fillRect(px + 8, py + 28, 10, 5);

  ctx.fillStyle = "#a3a3a3";
  ctx.fillRect(px + 18, py + 4, 10, 3);
  ctx.fillRect(px + 6, py + 20, 8, 3);

  ctx.strokeStyle = "#373737";
  ctx.lineWidth = 1;
  ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
}

function drawOreBlock(px, py, oreColor) {
  drawStoneBlock(px, py);
  ctx.fillStyle = oreColor;
  ctx.fillRect(px + 8, py + 8, 8, 8);
  ctx.fillRect(px + 22, py + 14, 6, 6);
  ctx.fillRect(px + 12, py + 24, 8, 8);
}

function drawTorch(px, py) {
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = "#866043";
  ctx.fillRect(px + 18, py + 16, 4, 16);

  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(px + 16, py + 8, 8, 8);
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(px + 18, py + 10, 4, 4);
}

function drawCreeper(px, py) {
  drawGrassBlock(px, py);
  const cx = px + 10;
  const cy = py + 10;

  ctx.fillStyle = "#000000";
  ctx.fillRect(cx, cy, 6, 6);
  ctx.fillRect(cx + 14, cy, 6, 6);
  ctx.fillRect(cx + 6, cy + 6, 8, 10);
  ctx.fillRect(cx + 3, cy + 10, 14, 6);
}

function drawEmoji(px, py, symbol) {
  ctx.font = "22px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, px + TILE_SIZE / 2, py + TILE_SIZE / 2);
}

function drawTile(x, y, type) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;

  function drawPath() {
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
  }

  switch (type) {
    case 1:
      drawGrassBlock(px, py);
      break;

    case 2:
      drawStoneBlock(px, py);
      break;

    case 0:
      drawPath();
      break;

    case 3:
      drawPath();
      drawEmoji(px, py, "🚨");
      break;

    case 4:
      drawPath();
      drawEmoji(px, py, "📦");
      break;

    case 5:
      drawPath();
      drawEmoji(px, py, gameState.zone3Unlocked ? "🔓" : "🔒");
      break;

    case 6:
      drawPath();
      drawEmoji(px, py, "🎒");
      break;

    case 7:
      drawPath();
      drawEmoji(px, py, gameState.portalOpen ? "🌀" : "⬛");
      break;

    case 8:
      drawOreBlock(px, py, "#38bdf8");
      break;

    case 9:
      drawOreBlock(px, py, "#facc15");
      break;

    case 10:
      drawCreeper(px, py);
      break;

    case 11:
      drawTorch(px, py);
      break;
  }
}

function drawSteve(px, py) {
  ctx.fillStyle = "#4a2810";
  ctx.fillRect(px + 8, py + 4, 24, 8);

  ctx.fillStyle = "#fbcfe8";
  ctx.fillRect(px + 8, py + 12, 24, 12);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(px + 10, py + 14, 6, 4);
  ctx.fillRect(px + 24, py + 14, 6, 4);
  ctx.fillStyle = "#2563eb";
  ctx.fillRect(px + 12, py + 14, 4, 4);
  ctx.fillRect(px + 24, py + 14, 4, 4);

  ctx.fillStyle = "#0284c7";
  ctx.fillRect(px + 6, py + 24, 28, 12);

  ctx.fillStyle = "#1e3a8a";
  ctx.fillRect(px + 10, py + 34, 20, 6);
}

function renderMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawTile(c, r, map[r][c]);
    }
  }

  drawSteve(gameState.player.x * TILE_SIZE, gameState.player.y * TILE_SIZE);
}

function movePlayer(dx, dy) {
  if (!gameStarted) return;

  const newX = gameState.player.x + dx;
  const newY = gameState.player.y + dy;

  if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
    const targetTile = map[newY][newX];

    if ([1, 2, 8, 9, 10].includes(targetTile)) return;

    if (targetTile === 5 && !gameState.zone3Unlocked) {
      showToast(
        "¡El Cuadrado de las Relaciones está bloqueado! Resuélvelo primero.",
      );
      openModal("modal-z3");
      return;
    }

    // Exigir tanto los 3 cristales como haber desbloqueado la Zona 3 (candado)
    if (
      targetTile === 7 &&
      (!gameState.portalOpen || !gameState.zone3Unlocked)
    ) {
      showToast(
        "¡Necesitas los 3 cristales Y abrir el candado del Cuadrado de las Relaciones!",
      );
      return;
    }

    gameState.player.x = newX;
    gameState.player.y = newY;
    renderMap();

    checkZoneTrigger(targetTile);
  }
}

window.addEventListener("keydown", (e) => {
  // No mover al personaje si el juego no inició o si se está escribiendo en un campo
  if (!gameStarted) return;
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      movePlayer(0, -1);
      break;
    case "ArrowDown":
    case "s":
    case "S":
      movePlayer(0, 1);
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      movePlayer(-1, 0);
      break;
    case "ArrowRight":
    case "d":
    case "D":
      movePlayer(1, 0);
      break;
  }
});

function checkZoneTrigger(tileType) {
  switch (tileType) {
    case 3:
      if (!gameState.crystals[0]) openModal("modal-z1");
      else showToast("Faro de Inducción ya completado.");
      break;
    case 4:
      if (!gameState.crystals[1]) openModal("modal-z2");
      else showToast("Cofres de Conjuntos ya completados.");
      break;
    case 5:
      if (!gameState.zone3Unlocked) openModal("modal-z3");
      break;
    case 6:
      if (!gameState.crystals[2]) openModal("modal-z4");
      else showToast("Bolsa Combinatoria ya completada.");
      break;
    case 7:
      if (gameState.portalOpen) openModal("modal-victory");
      break;
  }
}

function showToast(text) {
  const toast = document.getElementById("zone-toast");
  toast.innerText = text;
  toast.classList.remove("opacity-0");
  setTimeout(() => toast.classList.add("opacity-0"), 2500);
}

/* LÓGICA DE VALIDACIÓN DE LAS ZONAS MATEMÁTICAS */

// ZONA 1: Faro de Inducción
// S(n) = 1² + 2² + ... + n² = n(n+1)(2n+1)/6, con n = 4 → 30 bloques
const Z1_ANSWERS = { formula: 1, base: 0, add: 1, result: 2 };
const Z1_NAMES = {
  formula: "la fórmula",
  base: "el caso base",
  add: "el término que se suma",
  result: "el resultado simplificado",
};
let z1Sel = { formula: null, base: null, add: null, result: null };

function selectZ1(group, idx) {
  z1Sel[group] = idx;
  document
    .querySelectorAll(`#modal-z1 [data-group="${group}"]`)
    .forEach((b, i) => {
      b.classList.toggle("sel", i === idx);
    });
}

function verifyZone1() {
  const ans = parseInt(document.getElementById("z1-answer").value);
  const feedback = document.getElementById("z1-feedback");

  const wrong = Object.keys(Z1_ANSWERS)
    .filter((k) => z1Sel[k] !== Z1_ANSWERS[k])
    .map((k) => Z1_NAMES[k]);
  if (ans !== 30) wrong.push("el valor para n = 4");

  if (wrong.length === 0) {
    feedback.className = "min-h-6 mb-4 text-sm font-bold text-green-700";
    feedback.innerText =
      "¡Correcto! S(4) = 30 bloques. Inducción demostrada. 1er Cristal Obtenido.";
    unlockCrystal(0);
    setTimeout(() => closeModal("modal-z1"), 1500);
  } else {
    feedback.className = "min-h-6 mb-4 text-sm font-bold text-red-600";
    feedback.innerText = "Incorrecto. Revisa: " + wrong.join(", ") + ".";
  }
}

function resetZone1() {
  z1Sel = { formula: null, base: null, add: null, result: null };
  document
    .querySelectorAll("#modal-z1 .opt-btn")
    .forEach((b) => b.classList.remove("sel"));
  document.getElementById("z1-answer").value = "";
  document.getElementById("z1-feedback").innerText = "";
}

// ZONA 2: Cofres de Conjuntos
const Z2_A = [
  "Manzana dorada",
  "Poción morada",
  "Espada de diamante",
  "Casco de diamante",
  "Arco",
  "Flechas",
  "Pechera de diamante",
  "Carne cocida",
  "Poción de curación",
];
const Z2_B = [
  "Manzana dorada",
  "Poción morada",
  "Espada de diamante",
  "Casco de diamante",
  "Arco",
  "Flechas",
  "Pantalones de diamante",
  "Pan",
  "Poción azul",
];
const Z2_UNION = [...Z2_A, ...Z2_B.filter((x) => !Z2_A.includes(x))];
// Objetos mostrados en orden alfabético para no delatar a qué cofre pertenecen
const Z2_POOL = [...Z2_UNION].sort((x, y) => x.localeCompare(y, "es"));

const Z2_STEPS = [
  {
    title: "A − B",
    desc: "Selecciona los elementos que están en el Cofre A pero no en el Cofre B.",
    answer: Z2_A.filter((x) => !Z2_B.includes(x)),
  },
  {
    title: "B − A",
    desc: "Selecciona los elementos que están en el Cofre B pero no en el Cofre A.",
    answer: Z2_B.filter((x) => !Z2_A.includes(x)),
  },
  {
    title: "A ∪ B",
    desc: "Ahora quieres conocer todo lo que hay: selecciona los elementos de ambos cofres, sin repetir.",
    answer: Z2_UNION,
  },
  {
    title: "A ∩ B",
    desc: "¡La horda se acerca! Selecciona los objetos que están en los dos cofres para pelear.",
    answer: Z2_A.filter((x) => Z2_B.includes(x)),
  },
];

let z2Step = 0;
let z2Sel = new Set();

function renderZ2() {
  document.getElementById("z2-chest-a").textContent =
    "A = {" + Z2_A.join(", ") + "}";
  document.getElementById("z2-chest-b").textContent =
    "B = {" + Z2_B.join(", ") + "}";

  const step = Z2_STEPS[Math.min(z2Step, Z2_STEPS.length - 1)];
  document.getElementById("z2-step-title").textContent =
    `Paso ${Math.min(z2Step + 1, Z2_STEPS.length)}/${Z2_STEPS.length}: calcula ${step.title}`;
  document.getElementById("z2-step-desc").textContent = step.desc;

  const box = document.getElementById("z2-items");
  box.innerHTML = "";
  Z2_POOL.forEach((item, idx) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn" + (z2Sel.has(idx) ? " sel" : "");
    btn.textContent = item;
    btn.onclick = () => toggleZ2Item(idx);
    box.appendChild(btn);
  });
}

function toggleZ2Item(idx) {
  if (z2Sel.has(idx)) z2Sel.delete(idx);
  else z2Sel.add(idx);
  renderZ2();
}

function verifyZone2() {
  const feedback = document.getElementById("z2-feedback");
  const step = Z2_STEPS[z2Step];
  const chosen = [...z2Sel].map((i) => Z2_POOL[i]);
  const ok =
    chosen.length === step.answer.length &&
    step.answer.every((x) => chosen.includes(x));

  if (!ok) {
    feedback.className = "min-h-6 mb-4 text-sm font-bold text-red-600";
    feedback.innerText = `Incorrecto. Faltan o sobran elementos en ${step.title}. Revisa ambos cofres.`;
    return;
  }

  z2Step++;
  z2Sel = new Set();

  if (z2Step >= Z2_STEPS.length) {
    feedback.className = "min-h-6 mb-4 text-sm font-bold text-green-700";
    feedback.innerText =
      "¡A ∩ B correcto! La horda fue derrotada. 2do Cristal Obtenido.";
    unlockCrystal(1);
    setTimeout(() => closeModal("modal-z2"), 1500);
  } else {
    feedback.className = "min-h-6 mb-4 text-sm font-bold text-green-700";
    feedback.innerText = `¡Correcto! ${step.title} resuelto.`;
  }
  renderZ2();
}

function resetZone2() {
  z2Step = 0;
  z2Sel = new Set();
  document.getElementById("z2-feedback").innerText = "";
  renderZ2();
}

// ZONA 3: El Cuadrado de las Relaciones
// A = {Pico, Hacha, Pala}, B = {Piedra, Madera, Arena}
// Solución: R(A,B) = {(pico, piedra), (hacha, madera), (pala, arena)}
const Z3_SOLUTION = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

function emptyZ3Matrix() {
  return [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
}

let z3Matrix = emptyZ3Matrix();

function toggleZ3Cell(i, j) {
  z3Matrix[i][j] = z3Matrix[i][j] ? 0 : 1;
  renderZ3();
}

// Actualiza la matriz y el grafo bipartito según las casillas marcadas
function renderZ3() {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const on = z3Matrix[i][j] === 1;
      const cell = document.getElementById(`z3-cell-${i}-${j}`);
      cell.textContent = on ? "1" : "0";
      cell.classList.toggle("on", on);
      document.getElementById(`z3-edge-${i}-${j}`).style.opacity = on ? 1 : 0;
    }
  }
}

function verifyZone3() {
  const feedback = document.getElementById("z3-feedback");
  const total = z3Matrix.flat().reduce((s, v) => s + v, 0);
  const oneEach = z3Matrix.every((row) => row.reduce((s, v) => s + v, 0) === 1);
  const correct = z3Matrix.every((row, i) =>
    row.every((v, j) => v === Z3_SOLUTION[i][j]),
  );

  if (correct) {
    feedback.className = "text-sm font-bold text-green-700";
    feedback.innerText =
      "¡R(A,B) correcta! Cuadrado de las Relaciones resuelto. Candado abierto.";
    gameState.zone3Unlocked = true;
    renderMap();
    setTimeout(() => closeModal("modal-z3"), 1500);
  } else {
    feedback.className = "text-sm font-bold text-red-600";
    if (total === 0) {
      feedback.innerText =
        "Marca en la matriz los pares (herramienta, bloque) de la relación.";
    } else if (!oneEach) {
      feedback.innerText =
        "Cada herramienta debe tener un único bloque ideal (un 1 por fila).";
    } else {
      feedback.innerText =
        "Relación incorrecta. Piensa qué herramienta trabaja mejor con cada bloque.";
    }
  }
}

// ZONA 4: Combinatoria
function verifyZone4() {
  const ans = parseInt(document.getElementById("z4-answer").value);
  const feedback = document.getElementById("z4-feedback");

  if (ans === 56) {
    feedback.className = "text-sm font-bold text-green-700";
    feedback.innerText =
      "¡C(8,3) = 56 Correcto! 3er Cristal Obtenido. ¡Portal Activado!";
    unlockCrystal(2);
    setTimeout(() => closeModal("modal-z4"), 1500);
  } else {
    feedback.className = "text-sm font-bold text-red-600";
    feedback.innerText = "Incorrecto. Recalcula C(8,3) = 8! / (3! * 5!) = 56";
  }
}

function unlockCrystal(index) {
  gameState.crystals[index] = true;
  const el = document.getElementById(`crystal-${index + 1}`);
  el.classList.remove("opacity-40");
  el.classList.add("bg-yellow-200");

  if (gameState.crystals.every((c) => c === true)) {
    gameState.portalOpen = true;
    document.getElementById("portal-status").innerText = "¡ACTIVADO!";
    document.getElementById("portal-status").className =
      "text-green-600 font-pixel animate-pulse";
    showToast("¡EL PORTAL SE HA ACTIVADO!");
  }
  renderMap();
}

// Control de ventanas Modales
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function toggleModal(id) {
  const modal = document.getElementById(id);
  if (modal.classList.contains("hidden")) {
    openModal(id);
  } else {
    closeModal(id);
  }
}

// Controles Táctiles
function handleTouch(dir) {
  let dx = 0,
    dy = 0;
  if (dir === "Up") dy = -1;
  if (dir === "Down") dy = 1;
  if (dir === "Left") dx = -1;
  if (dir === "Right") dx = 1;

  movePlayer(dx, dy);
}

function handleTouchEnd() {}

function resetGame() {
  gameState = {
    crystals: [false, false, false],
    zone3Unlocked: false,
    portalOpen: false,
    player: { x: 1, y: 1, dir: "down" },
    z1BaseValid: null,
  };

  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`crystal-${i}`);
    el.classList.add("opacity-40");
    el.classList.remove("bg-yellow-200");
  }

  document.getElementById("portal-status").innerText = "BLOQUEADO";
  document.getElementById("portal-status").className =
    "text-red-700 font-pixel";

  z3Matrix = emptyZ3Matrix();
  renderZ3();
  document.getElementById("z3-feedback").innerText = "";

  resetZone1();
  resetZone2();

  closeModal("modal-victory");
  renderMap();

  // Volver al menú principal para elegir jugador
  // (si prefieres reiniciar directo con el mismo jugador, borra este bloque)
  gameStarted = false;
  document.getElementById("game-container").classList.add("screen-hidden");
  document.getElementById("start-screen").classList.remove("screen-hidden");
  showScreen("title-menu");
}

// Cargar visibilidad de código fuente en el modal secundario
function updateSourceCodeViewer() {
  const htmlContent = document.documentElement.outerHTML;
  const textarea = document.getElementById("source-code-textarea");
  if (textarea) {
    textarea.value = htmlContent;
  }
}

function copySourceCode() {
  const textarea = document.getElementById("source-code-textarea");
  if (textarea) {
    textarea.select();
    document.execCommand("copy");
    alert("Código copiado al portapapeles.");
  }
}

/* ===== MÚSICA DE FONDO (toda la página) ===== */
const bgMusic = document.getElementById("bg-music");
let musicEnabled = true;
bgMusic.volume = 0.4;

function playMusic() {
  if (!musicEnabled) return;
  // El navegador puede bloquear el audio hasta que el usuario interactúe
  bgMusic.play().catch(() => {});
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  document.getElementById("music-btn").textContent =
    "Música: " + (musicEnabled ? "Sí" : "No");
  if (musicEnabled) playMusic();
  else bgMusic.pause();
}

// Intenta sonar al cargar; si el navegador lo bloquea, suena en la primera interacción
playMusic();
["pointerdown", "keydown"].forEach((ev) => {
  window.addEventListener(
    ev,
    () => {
      if (bgMusic.paused) playMusic();
    },
    { once: true },
  );
});

// Inicialización
drawTitlePanorama();
renderZ2();
renderZ3();
renderMap();
updateSourceCodeViewer();
