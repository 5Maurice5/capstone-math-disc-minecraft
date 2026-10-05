
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


const TILE_SIZE = 40;
const COLS = 20;
const ROWS = 15;

// Estado del Juego
let gameState = {
    crystals: [false, false, false],
    zone3Unlocked: false,
    portalOpen: false,
    player: { x: 1, y: 1, dir: 'down' },
    z1BaseValid: null
};


// 0: Camino, 1: Muro (Tierra con Pasto), 2: Piedra, 3: Faro/Inducción
// 4: Cofre/Conjuntos, 5: Puerta Relaciones, 6:Mochila/Combinatoria
// 7: Portal Final, 8: Ore de Diamante, 9: Ore de Oro, 10: Creeper, 11: Antorcha

const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,11,0,1,0,8,0,0,1,0,0,0,0,0,1,0,0,6,1],
    [1,0,3,0,1,0,1,1,0,1,0,1,2,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,4,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,9,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1],
    [1,0,1,0,1,1,0,1,1,1,2,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,11,0,0,1,0,0,0,1],
    [1,0,1,1,1,0,0,0,5,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,11,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,7,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];


function drawGrassBlock(px, py) {
    ctx.fillStyle = '#866043';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#5c3d26';
    ctx.fillRect(px + 4, py + 16, 6, 6);
    ctx.fillRect(px + 24, py + 26, 8, 6);
    ctx.fillRect(px + 14, py + 30, 6, 4);

    ctx.fillStyle = '#59981A';
    ctx.fillRect(px, py, TILE_SIZE, 10);

    ctx.fillStyle = '#3d6e11';
    for (let i = 0; i < TILE_SIZE; i += 8) {
        ctx.fillRect(px + i, py + 8, 4, 4);
    }

    ctx.strokeStyle = '#2d4a0a';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
}

function drawStoneBlock(px, py) {
    ctx.fillStyle = '#737373';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#525252';
    ctx.fillRect(px + 4, py + 6, 12, 4);
    ctx.fillRect(px + 20, py + 18, 14, 6);
    ctx.fillRect(px + 8, py + 28, 10, 5);

    ctx.fillStyle = '#a3a3a3';
    ctx.fillRect(px + 18, py + 4, 10, 3);
    ctx.fillRect(px + 6, py + 20, 8, 3);

    ctx.strokeStyle = '#373737';
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
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#866043';
    ctx.fillRect(px + 18, py + 16, 4, 16);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px + 16, py + 8, 8, 8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 18, py + 10, 4, 4);
}

function drawCreeper(px, py) {
    drawGrassBlock(px, py);
    const cx = px + 10;
    const cy = py + 10;

    ctx.fillStyle = '#000000';
    ctx.fillRect(cx, cy, 6, 6);
    ctx.fillRect(cx + 14, cy, 6, 6);
    ctx.fillRect(cx + 6, cy + 6, 8, 10);
    ctx.fillRect(cx + 3, cy + 10, 14, 6);
}

function drawEmoji(px, py, symbol) {
    ctx.font = '22px VT323';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, px + TILE_SIZE / 2, py + TILE_SIZE / 2);
}

function drawTile(x, y, type) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    function drawPath() {
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#2a2a2a';
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
            drawEmoji(px, py, '🚨');
            break;

        case 4:
            drawPath();
            drawEmoji(px, py, '📦');
            break;

        case 5:
            drawPath();
            drawEmoji(px, py, gameState.zone3Unlocked ? '🔓' : '🔒');
            break;

        case 6:
            drawPath();
            drawEmoji(px, py, '🎒');
            break;

        case 7:
            drawPath();
            drawEmoji(px, py, gameState.portalOpen ? '🌀' : '⬛');
            break;

        case 8:
            drawOreBlock(px, py, '#38bdf8');
            break;

        case 9:
            drawOreBlock(px, py, '#facc15');
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
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(px + 8, py + 4, 24, 8);

    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(px + 8, py + 12, 24, 12);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 10, py + 14, 6, 4);
    ctx.fillRect(px + 24, py + 14, 6, 4);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(px + 12, py + 14, 4, 4);
    ctx.fillRect(px + 24, py + 14, 4, 4);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(px + 6, py + 24, 28, 12);

    ctx.fillStyle = '#1e3a8a';
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
    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;

    if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
        const targetTile = map[newY][newX];

        if ([1, 2, 8, 9, 10].includes(targetTile)) return;

        if (targetTile === 5 && !gameState.zone3Unlocked) {
            showToast("¡Puerta de Relaciones bloqueada! Interactúa primero.");
            openModal('modal-z3');
            return;
        }

        // Exigir tanto los 3 cristales como haber desbloqueado la Zona 3 (candado)
        if (targetTile === 7 && (!gameState.portalOpen || !gameState.zone3Unlocked)) {
            showToast("¡Necesitas los 3 cristales Y desbloquear el candado de Relaciones!");
            return;
        }

        gameState.player.x = newX;
        gameState.player.y = newY;
        renderMap();

        checkZoneTrigger(targetTile);
    }
}


window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            movePlayer(1, 0);
            break;
    }
});

function checkZoneTrigger(tileType) {
    switch (tileType) {
        case 3:
            if (!gameState.crystals[0]) openModal('modal-z1');
            else showToast("Faro de Inducción ya completado.");
            break;
        case 4:
            if (!gameState.crystals[1]) openModal('modal-z2');
            else showToast("Cofres de Conjuntos ya completados.");
            break;
        case 5:
            if (!gameState.zone3Unlocked) openModal('modal-z3');
            break;
        case 6:
            if (!gameState.crystals[2]) openModal('modal-z4');
            else showToast("Bolsa Combinatoria ya completada.");
            break;
        case 7:
            if (gameState.portalOpen) openModal('modal-victory');
            break;
    }
}

function showToast(text) {
    const toast = document.getElementById('zone-toast');
    toast.innerText = text;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 2500);
}

/* LÓGICA DE VALIDACIÓN DE LAS ZONAS MATEMÁTICAS */

// ZONA 1: Inducción
function selectZ1Base(val) {
    gameState.z1BaseValid = val;
    document.getElementById('z1-btn-true').style.border = val ? '3px solid #16a34a' : '3px solid #000';
    document.getElementById('z1-btn-false').style.border = !val ? '3px solid #16a34a' : '3px solid #000';
}

function verifyZone1() {
    const ans = parseInt(document.getElementById('z1-answer').value);
    const feedback = document.getElementById('z1-feedback');

    if (ans === 30 && gameState.z1BaseValid === true) {
        feedback.className = "text-sm font-bold text-green-700";
        feedback.innerText = "¡Correcto! Inducción Demostrada. 1er Cristal Obtenido.";
        unlockCrystal(0);
        setTimeout(() => closeModal('modal-z1'), 1500);
    } else {
        feedback.className = "text-sm font-bold text-red-600";
        feedback.innerText = "Incorrecto. Verifica la fórmula n=4 -> (4*5*9)/6 = 30 y el caso base.";
    }
}

// ZONA 2: Conjuntos
function checkZ2Answer(item) {
    const feedback = document.getElementById('z2-feedback');
    if (item === '🍎 Manzana Dorada') {
        feedback.className = "text-sm font-bold text-green-700";
        feedback.innerText = "¡A∩B Correcto! El Zombie fue derrotado. 2do Cristal Obtenido.";
        unlockCrystal(1);
        setTimeout(() => closeModal('modal-z2'), 1500);
    } else {
        feedback.className = "text-sm font-bold text-red-600";
        feedback.innerText = "¡El objeto seleccionado no está en la Intersección (A ∩ B)!";
    }
}

// ZONA 3: Relaciones Binarias
function verifyZone3() {
    const r1 = document.getElementById('z3-rel-1').value;
    const r2 = document.getElementById('z3-rel-2').value;
    const r3 = document.getElementById('z3-rel-3').value;
    const feedback = document.getElementById('z3-feedback');

    if (r1 === 'Diamante' && r2 === 'Madera' && r3 === 'Tierra') {
        feedback.className = "text-sm font-bold text-green-700";
        feedback.innerText = "¡Relaciones Binarias Correctas! Puerta Desbloqueada.";
        gameState.zone3Unlocked = true;
        renderMap();
        setTimeout(() => closeModal('modal-z3'), 1500);
    } else {
        feedback.className = "text-sm font-bold text-red-600";
        feedback.innerText = "Relación incorrecta según la matriz de adyacencia booleana.";
    }
}

// ZONA 4: Combinatoria
function verifyZone4() {
    const ans = parseInt(document.getElementById('z4-answer').value);
    const feedback = document.getElementById('z4-feedback');

    if (ans === 56) {
        feedback.className = "text-sm font-bold text-green-700";
        feedback.innerText = "¡C(8,3) = 56 Correcto! 3er Cristal Obtenido. ¡Portal Activado!";
        unlockCrystal(2);
        setTimeout(() => closeModal('modal-z4'), 1500);
    } else {
        feedback.className = "text-sm font-bold text-red-600";
        feedback.innerText = "Incorrecto. Recalcula C(8,3) = 8! / (3! * 5!) = 56";
    }
}

function unlockCrystal(index) {
    gameState.crystals[index] = true;
    const el = document.getElementById(`crystal-${index + 1}`);
    el.classList.remove('opacity-40');
    el.classList.add('bg-yellow-200');

    if (gameState.crystals.every(c => c === true)) {
        gameState.portalOpen = true;
        document.getElementById('portal-status').innerText = "¡ACTIVADO!";
        document.getElementById('portal-status').className = "text-green-600 font-pixel animate-pulse";
        showToast("¡EL PORTAL SE HA ACTIVADO!");
    }
    renderMap();
}

// Control de ventanas Modales
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function toggleModal(id) {
    const modal = document.getElementById(id);
    if (modal.classList.contains('hidden')) {
        openModal(id);
    } else {
        closeModal(id);
    }
}

// Controles Táctiles
function handleTouch(dir) {
    let dx = 0, dy = 0;
    if (dir === 'Up') dy = -1;
    if (dir === 'Down') dy = 1;
    if (dir === 'Left') dx = -1;
    if (dir === 'Right') dx = 1;

    movePlayer(dx, dy);
}

function handleTouchEnd() {}

function resetGame() {
    gameState = {
        crystals: [false, false, false],
        zone3Unlocked: false,
        portalOpen: false,
        player: { x: 1, y: 1, dir: 'down' },
        z1BaseValid: null
    };

    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`crystal-${i}`);
        el.classList.add('opacity-40');
        el.classList.remove('bg-yellow-200');
    }

    document.getElementById('portal-status').innerText = "BLOQUEADO";
    document.getElementById('portal-status').className = "text-red-700 font-pixel";

    closeModal('modal-victory');
    renderMap();
}

// Cargar visibilidad de código fuente en el modal secundario
function updateSourceCodeViewer() {
    const htmlContent = document.documentElement.outerHTML;
    const textarea = document.getElementById('source-code-textarea');
    if (textarea) {
        textarea.value = htmlContent;
    }
}

function copySourceCode() {
    const textarea = document.getElementById('source-code-textarea');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        alert('Código copiado al portapapeles.');
    }
}

// Inicialización
renderMap();
updateSourceCodeViewer();