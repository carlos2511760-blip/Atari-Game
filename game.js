/**
 * Pac-Man Web Edition
 * Powered by Antigravity Engine
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const livesEl = document.getElementById('lives-count');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const restartBtn = document.getElementById('restart-btn');
const mainRestartBtn = document.getElementById('main-restart-btn');

// Constants
const TILE_SIZE = 30;
const GRID_WIDTH = 19;
const GRID_HEIGHT = 21;
canvas.width = TILE_SIZE * GRID_WIDTH;
canvas.height = TILE_SIZE * GRID_HEIGHT;

const COLORS = {
    wall: '#1a1aff',
    dot: '#ffb8ae',
    powerPellet: '#fff',
    pacman: '#ffff00',
    ghosts: ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'],
    frightened: '#0000ff',
    frightenedEnding: '#ffffff'
};

const MAP_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,0,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

class Entity {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.baseSpeed = speed;
        this.speed = speed;
        this.dir = { x: 0, y: 0 };
        this.nextDir = { x: 0, y: 0 };
        this.radius = TILE_SIZE / 2 - 2;
    }

    getGridPos() {
        return {
            x: Math.floor((this.x + TILE_SIZE / 2) / TILE_SIZE),
            y: Math.floor((this.y + TILE_SIZE / 2) / TILE_SIZE)
        };
    }

    canMove(dx, dy) {
        const pos = this.getGridPos();
        const nextX = pos.x + dx;
        const nextY = pos.y + dy;
        if (nextX < 0 || nextX >= GRID_WIDTH) return true;
        return MAP_TEMPLATE[nextY] && MAP_TEMPLATE[nextY][nextX] !== 1;
    }

    update() {
        const centerX = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
        const centerY = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
        const tolerance = this.speed;

        if (Math.abs(this.x - centerX) < tolerance && Math.abs(this.y - centerY) < tolerance) {
            if (this.canMove(this.nextDir.x, this.nextDir.y)) {
                this.x = centerX;
                this.y = centerY;
                this.dir = { ...this.nextDir };
            } else if (!this.canMove(this.dir.x, this.dir.y)) {
                this.x = centerX;
                this.y = centerY;
                this.dir = { x: 0, y: 0 };
            }
        }
        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;
        if (this.x < -TILE_SIZE) this.x = (GRID_WIDTH - 1) * TILE_SIZE;
        if (this.x > GRID_WIDTH * TILE_SIZE) this.x = 0;
    }
}

class Pacman extends Entity {
    constructor(x, y) {
        super(x, y, 1.5);
        this.mouthOpen = 0;
        this.mouthDir = 1;
        this.rotation = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        const angle = 0.2 * Math.PI * this.mouthOpen;
        ctx.arc(0, 0, this.radius, angle, 2 * Math.PI - angle);
        ctx.lineTo(0, 0);
        ctx.fillStyle = COLORS.pacman;
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.pacman;
        ctx.closePath();
        ctx.restore();
    }

    update() {
        super.update();
        if (this.dir.x !== 0 || this.dir.y !== 0) {
            this.mouthOpen += 0.1 * this.mouthDir;
            if (this.mouthOpen > 1 || this.mouthOpen < 0) this.mouthDir *= -1;
            if (this.dir.x > 0) this.rotation = 0;
            if (this.dir.x < 0) this.rotation = Math.PI;
            if (this.dir.y > 0) this.rotation = Math.PI / 2;
            if (this.dir.y < 0) this.rotation = -Math.PI / 2;
        }
    }
}

class Ghost extends Entity {
    constructor(x, y, color) {
        super(x, y, 1.0);
        this.color = color;
        this.frightened = false;
        this.frightenedTimeLeft = 0;
        this.startPos = { x, y };
    }

    draw() {
        ctx.beginPath();
        let drawColor = this.color;
        if (this.frightened) {
            // Blink logic: if less than 2s left, blink every 200ms
            if (this.frightenedTimeLeft < 2000 && Math.floor(Date.now() / 200) % 2 === 0) {
                drawColor = COLORS.frightenedEnding;
            } else {
                drawColor = COLORS.frightened;
            }
        }
        ctx.arc(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2, this.radius, Math.PI, 0);
        ctx.lineTo(this.x + TILE_SIZE / 2 + this.radius, this.y + TILE_SIZE / 2 + this.radius);
        ctx.lineTo(this.x + TILE_SIZE / 2 - this.radius, this.y + TILE_SIZE / 2 + this.radius);
        ctx.fillStyle = drawColor;
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = drawColor;
        
        const eyeOffsetX = TILE_SIZE / 5;
        const eyeOffsetY = TILE_SIZE / 10;
        const eyeRadius = TILE_SIZE / 10;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + TILE_SIZE / 2 - eyeOffsetX, this.y + TILE_SIZE / 2 - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(this.x + TILE_SIZE / 2 + eyeOffsetX, this.y + TILE_SIZE / 2 - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    update() {
        const centerX = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
        const centerY = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
        const tolerance = this.speed;

        if (Math.abs(this.x - centerX) < tolerance && Math.abs(this.y - centerY) < tolerance) {
            const possibleDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
                .filter(d => this.canMove(d.x, d.y) && (d.x !== -this.dir.x || d.y !== -this.dir.y));
            if (possibleDirs.length > 0) {
                this.nextDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            }
        }
        super.update();
    }

    reset() {
        this.x = this.startPos.x;
        this.y = this.startPos.y;
        this.frightened = false;
        this.speed = this.baseSpeed;
        this.dir = { x: 0, y: 0 };
        this.nextDir = { x: 0, y: 0 };
    }
}

class Game {
    constructor() {
        this.pacman = new Pacman(TILE_SIZE * 9, TILE_SIZE * 15);
        this.ghosts = [
            new Ghost(TILE_SIZE * 9, TILE_SIZE * 9, COLORS.ghosts[0]),
            new Ghost(TILE_SIZE * 8, TILE_SIZE * 9, COLORS.ghosts[1]),
            new Ghost(TILE_SIZE * 10, TILE_SIZE * 9, COLORS.ghosts[2]),
            new Ghost(TILE_SIZE * 9, TILE_SIZE * 8, COLORS.ghosts[3])
        ];
        this.score = 0;
        this.highscore = localStorage.getItem('pacman-highscore') || 0;
        this.lives = 4;
        this.level = 1;
        this.dots = [];
        this.powerPellets = [];
        this.state = 'MENU';
        this.frightenedEndTime = 0;
        this.lastExtraLifeScore = 0;
        
        this.initMap();
        this.updateUI();
    }

    initMap() {
        this.dots = [];
        this.powerPellets = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (MAP_TEMPLATE[y][x] === 2) this.dots.push({ x, y });
                if (MAP_TEMPLATE[y][x] === 3) this.powerPellets.push({ x, y });
            }
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (MAP_TEMPLATE[y][x] === 1) {
                    ctx.fillStyle = COLORS.wall;
                    ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
            }
        }
        ctx.fillStyle = COLORS.dot;
        this.dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x * TILE_SIZE + TILE_SIZE / 2, dot.y * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.fillStyle = COLORS.powerPellet;
        this.powerPellets.forEach(pp => {
            ctx.beginPath();
            ctx.arc(pp.x * TILE_SIZE + TILE_SIZE / 2, pp.y * TILE_SIZE + TILE_SIZE / 2, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        this.pacman.draw();
        this.ghosts.forEach(g => g.draw());
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // Frightened timer check
        const now = Date.now();
        this.ghosts.forEach(g => {
            if (g.frightened) {
                g.frightenedTimeLeft = this.frightenedEndTime - now;
                if (g.frightenedTimeLeft <= 0) {
                    g.frightened = false;
                    g.speed = g.baseSpeed;
                }
            }
        });

        this.pacman.update();
        const pPos = this.pacman.getGridPos();
        
        const dotIndex = this.dots.findIndex(d => d.x === pPos.x && d.y === pPos.y);
        if (dotIndex !== -1) {
            this.dots.splice(dotIndex, 1);
            this.score += 10;
            this.checkExtraLife();
            this.updateUI();
        }

        const ppIndex = this.powerPellets.findIndex(p => p.x === pPos.x && p.y === pPos.y);
        if (ppIndex !== -1) {
            this.powerPellets.splice(ppIndex, 1);
            this.score += 50;
            this.activateFrightened();
            this.checkExtraLife();
            this.updateUI();
        }

        this.ghosts.forEach(ghost => {
            ghost.update();
            const dist = Math.hypot(this.pacman.x - ghost.x, this.pacman.y - ghost.y);
            if (dist < TILE_SIZE * 0.8) {
                if (ghost.frightened) {
                    ghost.reset();
                    this.score += 200;
                    this.checkExtraLife();
                    this.updateUI();
                } else {
                    this.handleDeath();
                }
            }
        });

        if (this.dots.length === 0 && this.powerPellets.length === 0) {
            this.handleLevelWin();
        }
    }

    checkExtraLife() {
        if (this.score - this.lastExtraLifeScore >= 10000) {
            this.lives++;
            this.lastExtraLifeScore += 10000;
            this.updateUI();
        }
    }

    activateFrightened() {
        const duration = Math.max(2000, 8000 - (this.level * 1000));
        this.frightenedEndTime = Date.now() + duration;
        this.ghosts.forEach(g => {
            g.frightened = true;
            g.speed = 0.5;
            g.frightenedTimeLeft = duration;
        });
    }

    updateUI() {
        scoreEl.innerText = this.score.toString().padStart(4, '0');
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('pacman-highscore', this.highscore);
        }
        highscoreEl.innerText = this.highscore.toString().padStart(4, '0');
        if (livesEl) livesEl.innerText = this.lives;
    }

    handleDeath() {
        this.lives--;
        this.updateUI();
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Soft reset level
            this.pacman.x = TILE_SIZE * 9;
            this.pacman.y = TILE_SIZE * 15;
            this.pacman.dir = { x: 0, y: 0 };
            this.pacman.nextDir = { x: 0, y: 0 };
            this.ghosts.forEach(g => g.reset());
            this.state = 'PAUSED';
            overlay.classList.remove('hidden');
            overlayTitle.innerText = "OPS!";
            overlayMsg.innerText = `Você ainda tem ${this.lives} vidas`;
            restartBtn.innerText = "CONTINUAR";
        }
    }

    handleLevelWin() {
        this.state = 'PAUSED';
        this.level++;
        // Increase difficulty
        this.ghosts.forEach(g => {
            g.baseSpeed = Math.min(2.0, 1.0 + (this.level * 0.1));
            g.reset();
        });
        this.pacman.x = TILE_SIZE * 9;
        this.pacman.y = TILE_SIZE * 15;
        this.pacman.dir = { x: 0, y: 0 };
        this.pacman.nextDir = { x: 0, y: 0 };
        
        // Blink effect
        overlay.classList.remove('hidden');
        overlayTitle.innerText = "NÍVEL " + this.level;
        overlayMsg.innerText = "Prepare-se!";
        restartBtn.innerText = "PRÓXIMA FASE";
        this.initMap();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        overlay.classList.remove('hidden');
        overlayTitle.innerText = "GAME OVER";
        overlayMsg.innerText = "";
        restartBtn.innerText = "JOGAR NOVAMENTE";
    }

    restart() {
        if (this.state === 'GAMEOVER' || this.state === 'MENU') {
            this.score = 0;
            this.lives = 4;
            this.level = 1;
            this.lastExtraLifeScore = 0;
            this.ghosts.forEach(g => g.baseSpeed = 1.0);
            this.initMap();
        }
        this.pacman.x = TILE_SIZE * 9;
        this.pacman.y = TILE_SIZE * 15;
        this.pacman.dir = { x: 0, y: 0 };
        this.pacman.nextDir = { x: 0, y: 0 };
        this.ghosts.forEach(g => g.reset());
        this.updateUI();
        this.state = 'PLAYING';
        overlay.classList.add('hidden');
    }

    pause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            overlay.classList.remove('hidden');
            overlayTitle.innerText = "PAUSADO";
            overlayMsg.innerText = "";
            restartBtn.innerText = "CONTINUAR";
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            overlay.classList.add('hidden');
        }
    }

    showMenu() {
        this.state = 'MENU';
        overlay.classList.remove('hidden');
        overlayTitle.innerText = "PAC-MAN WEB";
        overlayMsg.innerText = "WASD ou Setas para mover";
        restartBtn.innerText = "INICIAR JOGO";
    }
}

const game = new Game();

window.addEventListener('keydown', e => {
    switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': game.pacman.nextDir = { x: 0, y: -1 }; break;
        case 'arrowdown': case 's': game.pacman.nextDir = { x: 0, y: 1 }; break;
        case 'arrowleft': case 'a': game.pacman.nextDir = { x: -1, y: 0 }; break;
        case 'arrowright': case 'd': game.pacman.nextDir = { x: 1, y: 0 }; break;
        case 'escape': game.pause(); break;
    }
});

restartBtn.addEventListener('click', () => {
    if (game.state === 'PAUSED') {
        game.pause();
    } else {
        game.restart();
    }
});
mainRestartBtn.addEventListener('click', () => {
    game.state = 'GAMEOVER'; 
    game.restart();
});

function loop() {
    game.update();
    game.draw();
    requestAnimationFrame(loop);
}

game.showMenu();
loop();
