window.onload = function() {
    // 显示最高分
    document.getElementById('highScoreText').textContent = highScore;
    
    // 初始化难度选择
    const difficultySelect = document.getElementById('difficultySelect');
    if (difficultySelect) {
        difficultySelect.value = currentDifficulty;
        difficultySelect.addEventListener('change', handleDifficultyChange);
    }
    
    // 绑定按钮事件
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', restartGame);
        startBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            restartGame();
        });
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
        pauseBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            togglePause();
        });
    }
    
    // 添加虚拟控制
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