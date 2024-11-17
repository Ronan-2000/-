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
        // 为新游戏按钮添加多个事件监听
        ['click', 'touchstart'].forEach(eventType => {
            startBtn.addEventListener(eventType, function(e) {
                e.preventDefault();
                score = 0;
                currentLevel = 1;
                direction = 'right';
                isPaused = false;
                initGame();
            });
        });
    }
    
    if (pauseBtn) {
        pauseBtn.onclick = togglePause;
    }
    
    if (difficultySelect) {
        difficultySelect.onchange = handleDifficultyChange;
    }
    
    // 添��虚拟控制
    addVirtualControls();
    
    // 开始游戏
    initGame();
};

function restartGame(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation(); // 阻止事件冒泡
    }
    score = 0;
    currentLevel = 1;
    direction = 'right';
    isPaused = false;
    initGame();
} 