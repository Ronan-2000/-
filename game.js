// 游戏配置
const config = {
    canvasWidth: 400,
    canvasHeight: 400,
    gridSize: 20,
    snakeColor: {
        head: '#007AFF', // Apple 蓝
        body: '#5856D6',  // 深紫色
        gradient: true    // 启用渐变效果
    },
    foodColor: {
        normal: '#FF2D55',    // Apple 粉红
        power: '#5AC8FA'      // Apple 浅蓝
    },
    powerUpColor: '#5AC8FA', // Apple 浅蓝
    powerUpDuration: 5000,
    difficulties: {
        easy: { speed: 150, scoreMultiplier: 1 },
        medium: { speed: 100, scoreMultiplier: 2 },
        hard: { speed: 70, scoreMultiplier: 3 }
    },
    background: {
        grid: '#f0f0f0',      // 网格颜色
        gridOpacity: 0.5      // 网格透明度
    },
    effects: {
        glow: true,           // 发光效果
        smooth: true,         // 平滑移动
        particles: true       // 粒子效果
    }
};

// 游戏状态变量
let snake = [];
let food = {};
let direction = 'right';
let score = 0;
let gameLoop;
let isPaused = false;
let currentLevel = 1;
let highScore = localStorage.getItem('highScore') || 0;
let powerUp = null;
let currentDifficulty = 'easy';

// 添加粒子系统
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 4 - 2;
        this.life = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

let particles = [];

// 添加音效系统
const sounds = {
    eat: new Audio('data:audio/wav;base64,...'), // 这里需要添加实际的音频数据
    powerUp: new Audio('data:audio/wav;base64,...'),
    gameOver: new Audio('data:audio/wav;base64,...')
};

// 在相应的事件中播放音效
function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {}); // 忽略可能的自动播放限制错误
    }
}

// 初始化游戏
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    
    // 初始化蛇的位置
    snake = [
        {x: 6, y: 10},
        {x: 5, y: 10},
        {x: 4, y: 10}
    ];
    
    direction = 'right';
    score = 0;
    document.getElementById('scoreText').textContent = '0';
    document.getElementById('levelText').textContent = '1';
    
    // 生成第一个食物
    generateFood();
    
    // 清除现有的游戏循环
    if (gameLoop) clearInterval(gameLoop);
    
    // 开始新的游戏循环
    gameLoop = setInterval(gameStep, config.difficulties[currentDifficulty].speed);
    
    // 添加键盘控制
    document.addEventListener('keydown', handleKeyPress);
    
    // 添加触摸控制
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault(); // 防止滚动
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        e.preventDefault(); // 防止滚动
    }, { passive: false });
    
    document.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // 判断滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            if (deltaX > 0 && direction !== 'left') {
                direction = 'right';
            } else if (deltaX < 0 && direction !== 'right') {
                direction = 'left';
            }
        } else {
            // 垂直滑动
            if (deltaY > 0 && direction !== 'up') {
                direction = 'down';
            } else if (deltaY < 0 && direction !== 'down') {
                direction = 'up';
            }
        }
        
        e.preventDefault();
    }, { passive: false });
}

// 生成食物
function generateFood() {
    food = {
        x: Math.floor(Math.random() * (config.canvasWidth / config.gridSize)),
        y: Math.floor(Math.random() * (config.canvasHeight / config.gridSize))
    };
    
    // 确保食物不会出现在蛇身上
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food = {
            x: Math.floor(Math.random() * (config.canvasWidth / config.gridSize)),
            y: Math.floor(Math.random() * (config.canvasHeight / config.gridSize))
        };
    }
}

// 生成特殊食物
function generatePowerUp() {
    if (Math.random() < 0.1 && !powerUp) { // 10%几率生成特殊食物
        powerUp = {
            x: Math.floor(Math.random() * (config.canvasWidth / config.gridSize)),
            y: Math.floor(Math.random() * (config.canvasHeight / config.gridSize)),
            type: Math.random() < 0.5 ? 'speed' : 'points'
        };
    }
}

// 处理键盘输入
function handleKeyPress(event) {
    // 阻止方向键的默认滚动行为
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
    }
    
    switch(event.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
    }
}

// 游戏主循环
function gameStep() {
    if (isPaused) return;
    
    // 移动蛇
    const head = {x: snake[0].x, y: snake[0].y};
    
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        const multiplier = config.difficulties[currentDifficulty].scoreMultiplier;
        score += 10 * multiplier;
        document.getElementById('scoreText').textContent = score;
        generateFood();
        generatePowerUp();
        addParticles(food.x, food.y, config.foodColor.normal);
        playSound('eat');
    } else {
        snake.pop();
    }
    
    // 检查是否吃到特殊食物
    if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
        if (powerUp.type === 'speed') {
            temporarySpeedBoost();
        } else {
            score += 30;
            document.getElementById('scoreText').textContent = score;
        }
        powerUp = null;
        playSound('powerUp');
    }
    
    // 更新等级
    currentLevel = Math.floor(score / 100) + 1;
    document.getElementById('levelText').textContent = currentLevel;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('highScoreText').textContent = highScore;
    }
    
    // 绘制游戏画面
    drawGame();
}

// 碰撞检测
function checkCollision(head) {
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= config.canvasWidth / config.gridSize ||
        head.y < 0 || head.y >= config.canvasHeight / config.gridSize) {
        return true;
    }
    
    // 检查自身碰撞
    return snake.some((segment, index) => index > 0 && segment.x === head.x && segment.y === head.y);
}

// 绘制游戏画面
function drawGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
    
    // 绘制网格背景
    drawGrid(ctx);
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        const radius = config.gridSize / 2 - 1;
        
        // 添加平移动效果
        let x = segment.x * config.gridSize + radius + 1;
        let y = segment.y * config.gridSize + radius + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // 创建渐变
        if (config.snakeColor.gradient) {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            const baseColor = index === 0 ? config.snakeColor.head : config.snakeColor.body;
            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(1, baseColor + '88');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = index === 0 ? config.snakeColor.head : config.snakeColor.body;
        }
        
        // 添加发光效果
        if (config.effects.glow) {
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = index === 0 ? 15 : 10;
        }
        
        ctx.fill();
    });
    ctx.shadowBlur = 0; // 重置阴影
    
    // 绘制食物
    drawFood(ctx, food, config.foodColor.normal);
    
    // 绘制特殊食物
    if (powerUp) {
        drawFood(ctx, powerUp, config.foodColor.power);
    }
    
    // 更新和绘制粒子
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
}

// 添加网格绘制函数
function drawGrid(ctx) {
    ctx.strokeStyle = config.background.grid;
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= config.canvasWidth; x += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, config.canvasHeight);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= config.canvasHeight; y += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(config.canvasWidth, y);
        ctx.stroke();
    }
}

// 添加食物绘制函数
function drawFood(ctx, foodItem, color) {
    const radius = config.gridSize / 2 - 2;
    ctx.beginPath();
    ctx.arc(
        foodItem.x * config.gridSize + radius + 1,
        foodItem.y * config.gridSize + radius + 1,
        radius,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = color;
    
    // 添加渐变效果
    const gradient = ctx.createRadialGradient(
        foodItem.x * config.gridSize + radius + 1,
        foodItem.y * config.gridSize + radius + 1,
        0,
        foodItem.x * config.gridSize + radius + 1,
        foodItem.y * config.gridSize + radius + 1,
        radius
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '88');
    ctx.fillStyle = gradient;
    
    // 添加光晕效果
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// 临时速度提升
function temporarySpeedBoost() {
    const originalSpeed = config.difficulties[currentDifficulty].speed;
    clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, originalSpeed / 2);
    
    setTimeout(() => {
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, originalSpeed);
    }, config.powerUpDuration);
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    const finalScore = score;
    
    // 先移除可能存在的旧对话框
    const existingDialog = document.querySelector('.game-over-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'game-over-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        text-align: center;
        z-index: 1000;
        width: 80%;
        max-width: 300px;
    `;
    
    dialog.innerHTML = `
        <h2 style="margin: 0 0 15px; color: #1d1d1f; font-size: 20px;">游戏结束</h2>
        <p style="font-size: 16px; margin: 0 0 20px;">最终得分：${finalScore}</p>
        <button id="restartButton" 
                style="background: #007AFF; color: white; border: none; 
                padding: 12px 25px; border-radius: 8px; cursor: pointer;
                font-size: 16px; font-weight: 600; width: 100%;
                -webkit-tap-highlight-color: transparent;">
            重新开始
        </button>
    `;
    
    // 添加遮罩层和对话框
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // 绑定重启事件
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        // 同时绑定点击和触摸事件
        ['click', 'touchend'].forEach(eventType => {
            restartButton.addEventListener(eventType, function(e) {
                e.preventDefault();
                overlay.remove();
                dialog.remove();
                score = 0;
                currentLevel = 1;
                direction = 'right';
                isPaused = false;
                initGame();
            }, { once: true }); // 确保事件只触发一次
        });
    }
    
    // 防止触摸穿透
    overlay.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    dialog.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
}

// 切换暂停
function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    if (isPaused) {
        clearInterval(gameLoop);
        pauseBtn.textContent = '继续';
    } else {
        gameLoop = setInterval(gameStep, config.difficulties[currentDifficulty].speed);
        pauseBtn.textContent = '暂停';
    }
}

// 处理难度变更
function handleDifficultyChange() {
    currentDifficulty = document.getElementById('difficultySelect').value;
    restartGame();
}

// 修改虚拟方向键的实现
function addVirtualControls() {
    const controlsHTML = `
        <div class="virtual-controls">
            <button id="upBtn" class="control-btn">↑</button>
            <div class="horizontal-controls">
                <button id="leftBtn" class="control-btn">←</button>
                <button id="rightBtn" class="control-btn">→</button>
            </div>
            <button id="downBtn" class="control-btn">↓</button>
        </div>
    `;
    
    document.querySelector('.game-container').insertAdjacentHTML('beforeend', controlsHTML);
    
    // 为每个方向按钮添加事件
    const buttons = {
        'upBtn': 'up',
        'downBtn': 'down',
        'leftBtn': 'left',
        'rightBtn': 'right'
    };
    
    Object.entries(buttons).forEach(([btnId, dir]) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            // 添加多个事件监听器以确保在所有设备上都能工作
            ['touchstart', 'mousedown', 'click'].forEach(eventType => {
                btn.addEventListener(eventType, function(e) {
                    e.preventDefault(); // 阻止默认行为
                    e.stopPropagation(); // 阻止事件冒泡
                    
                    // 更新方向
                    switch(dir) {
                        case 'up':
                            if (direction !== 'down') direction = 'up';
                            break;
                        case 'down':
                            if (direction !== 'up') direction = 'down';
                            break;
                        case 'left':
                            if (direction !== 'right') direction = 'left';
                            break;
                        case 'right':
                            if (direction !== 'left') direction = 'right';
                            break;
                    }
                }, { passive: false });
            });
            
            // 防止长按出现菜单
            btn.addEventListener('contextmenu', function(e) {
                e.preventDefault();
            });
            
            // 防止触摸移动
            btn.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, { passive: false });
        }
    });
}

// 更新 CSS 样式
const mobileStyle = document.createElement('style');
mobileStyle.textContent = `
    .virtual-controls {
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        margin: 10px 0;
        transform: scale(0.8);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
    }

    .horizontal-controls {
        display: flex;
        gap: 40px;
    }

    .control-btn {
        width: 60px;
        height: 60px;
        border-radius: 30px;
        background: rgba(0, 113, 227, 0.9);
        color: white;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
    }

    .control-btn:active {
        background: rgba(0, 113, 227, 0.7);
        transform: scale(0.95);
    }

    @media (max-width: 768px) {
        .virtual-controls {
            display: flex;
            margin-bottom: 20px;
        }
        
        .control-btn {
            width: 50px;
            height: 50px;
            font-size: 20px;
        }
    }
`;

// 在初始化时添加样式
window.onload = function() {
    document.head.appendChild(mobileStyle);
    // 显示最高分
    document.getElementById('highScoreText').textContent = highScore;
    
    // 初始化难度选择
    document.getElementById('difficultySelect').value = currentDifficulty;
    
    // 使用更可靠的事件监听器绑定方式
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const difficultySelect = document.getElementById('difficultySelect');
    
    if (startBtn) {
        startBtn.onclick = restartGame;
    }
    
    if (pauseBtn) {
        pauseBtn.onclick = togglePause;
    }
    
    if (difficultySelect) {
        difficultySelect.onchange = handleDifficultyChange;
    }
    
    // 添加虚拟控制
    addVirtualControls();
    
    // 开始游戏
    initGame();
}; 