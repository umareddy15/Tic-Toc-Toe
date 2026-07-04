/* ==========================================================================
   Tic-Tac-Toe Neo - Core Logic & Sound Synthesizer
   ========================================================================== */

// --- Global Error Fallback Overlay for Easy Debugging ---
window.addEventListener('error', function(e) {
  // Prevent duplicate overlays
  if (document.getElementById('debug-error-overlay')) return;
  
  const errDiv = document.createElement('div');
  errDiv.id = 'debug-error-overlay';
  errDiv.style.position = 'fixed';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.width = '100%';
  errDiv.style.background = 'rgba(239, 68, 68, 0.95)';
  errDiv.style.color = 'white';
  errDiv.style.padding = '16px';
  errDiv.style.zIndex = '99999';
  errDiv.style.fontFamily = 'monospace';
  errDiv.style.fontSize = '14px';
  errDiv.style.lineHeight = '1.4';
  errDiv.innerHTML = `<strong>JavaScript Error Caught:</strong><br>${e.message}<br>at ${e.filename}:${e.lineno}:${e.colno}`;
  
  // Create a close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Dismiss';
  closeBtn.style.marginTop = '10px';
  closeBtn.style.padding = '4px 8px';
  closeBtn.style.background = 'white';
  closeBtn.style.color = '#ef4444';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '4px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => errDiv.remove();
  
  errDiv.appendChild(closeBtn);
  document.body.appendChild(errDiv);
});

// --- Core Initialization Function ---
function initApp() {
  // --- UI Elements ---
  const cells = document.querySelectorAll('.cell');
  const boardEl = document.getElementById('board');
  const winningLineEl = document.getElementById('winning-line');
  const winLineSvg = document.querySelector('.win-line-svg');
  
  // Scoreboard
  const scoreXEl = document.getElementById('score-x');
  const scoreOEl = document.getElementById('score-o');
  const scoreTiesEl = document.getElementById('score-ties');
  const cardX = document.getElementById('card-x');
  const cardO = document.getElementById('card-o');
  const playerOLabel = document.getElementById('player-o-label');
  
  // Control Buttons
  const soundBtn = document.getElementById('sound-btn');
  const themeBtn = document.getElementById('theme-btn');
  const modePvPBtn = document.getElementById('mode-pvp');
  const modePvEBtn = document.getElementById('mode-pve');
  const aiDiffContainer = document.getElementById('ai-difficulty-container');
  const diffBtns = document.querySelectorAll('.difficulty-btn');
  const undoBtn = document.getElementById('undo-btn');
  const resetBtn = document.getElementById('reset-btn');
  const clearBtn = document.getElementById('clear-btn');
  
  // Modal Overlays
  const gameOverModal = document.getElementById('game-over-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalIcon = document.getElementById('modal-icon');
  const modalPlayAgainBtn = document.getElementById('modal-play-again-btn');

  // --- Safe Icon Creator (Fallback if Lucide CDN is offline) ---
  function safeCreateIcons() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      try {
        lucide.createIcons();
      } catch (e) {
        console.error("Lucide failed to render icons", e);
      }
    } else {
      console.warn("Lucide icons library not loaded. Falling back to plain text.");
    }
  }

  // --- Audio System via Web Audio API ---
  let audioCtx = null;
  let soundEnabled = localStorage.getItem('ttt_sound') !== 'false';
  
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthSound(freqStart, freqEnd, duration, type = 'sine', volume = 0.12) {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
      }
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      console.warn("Audio play blocked or failed: ", err);
    }
  }

  function playMoveSound(player) {
    if (player === 'X') {
      playSynthSound(380, 520, 0.1, 'sine', 0.12);
    } else {
      playSynthSound(320, 240, 0.12, 'sine', 0.14);
    }
  }

  function playWinSound() {
    if (!soundEnabled) return;
    // Arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playSynthSound(freq, freq, idx === 3 ? 0.5 : 0.12, 'triangle', 0.12);
      }, idx * 100);
    });
  }

  function playDrawSound() {
    playSynthSound(220, 110, 0.35, 'sawtooth', 0.08);
  }

  // Soft UI click feedback
  function playClickSound() {
    playSynthSound(800, 600, 0.05, 'sine', 0.06);
  }

  function updateSoundUI() {
    const icon = soundBtn.querySelector('i');
    if (icon) {
      if (soundEnabled) {
        icon.setAttribute('data-lucide', 'volume-2');
      } else {
        icon.setAttribute('data-lucide', 'volume-x');
      }
    }
    safeCreateIcons();
  }

  // Toggle Sound
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('ttt_sound', soundEnabled);
    updateSoundUI();
    if (soundEnabled) {
      playClickSound();
    }
  });

  // --- Theme Management ---
  let theme = localStorage.getItem('ttt_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  function updateThemeUI() {
    const icon = themeBtn.querySelector('i');
    if (icon) {
      if (theme === 'dark') {
        icon.setAttribute('data-lucide', 'sun');
      } else {
        icon.setAttribute('data-lucide', 'moon');
      }
    }
    safeCreateIcons();
  }

  themeBtn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ttt_theme', theme);
    updateThemeUI();
    playClickSound();
  });

  // --- Game State ---
  let board = Array(9).fill(null);
  let currentPlayer = 'X'; // Player X always starts
  let gameActive = true;
  let isAiThinking = false;
  
  // Game Mode Setup with validations
  let gameMode = localStorage.getItem('ttt_mode') || 'pvp';
  if (gameMode !== 'pvp' && gameMode !== 'pve') {
    gameMode = 'pvp';
  }
  
  let difficulty = localStorage.getItem('ttt_diff') || 'medium';
  if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
    difficulty = 'medium';
  }
  
  // History for Undo
  let moveHistory = []; // stores deep copies of { board, currentPlayer, gameActive }

  // Scores default structure
  let scores = {
    pvp: { X: 0, O: 0, ties: 0 },
    pve: { X: 0, O: 0, ties: 0 } // O is AI
  };

  // Safe localStorage scores recovery
  const storedScores = localStorage.getItem('ttt_scores');
  if (storedScores) {
    try {
      const parsed = JSON.parse(storedScores);
      if (parsed && parsed.pvp && parsed.pve) {
        scores = parsed;
      }
    } catch (e) {
      console.error("Failed to parse scores from localStorage, using defaults", e);
    }
  }

  // Winning indices combination patterns
  const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  // Map winning combo index to SVG Line coordinates (%)
  const LINE_COORDINATES = {
    0: { x1: 5, y1: 16.6, x2: 95, y2: 16.6 },
    1: { x1: 5, y1: 50, x2: 95, y2: 50 },
    2: { x1: 5, y1: 83.3, x2: 95, y2: 83.3 },
    3: { x1: 16.6, y1: 5, x2: 16.6, y2: 95 },
    4: { x1: 50, y1: 5, x2: 50, y2: 95 },
    5: { x1: 83.3, y1: 5, x2: 83.3, y2: 95 },
    6: { x1: 5, y1: 5, x2: 95, y2: 95 },
    7: { x1: 95, y1: 5, x2: 5, y2: 95 }
  };

  // SVGs for markers
  const SVG_X = `
    <svg class="marker-svg" viewBox="0 0 100 100">
      <line class="marker-path-x1" x1="22" y1="22" x2="78" y2="78" />
      <line class="marker-path-x2" x1="78" y1="22" x2="22" y2="78" />
    </svg>
  `;

  const SVG_O = `
    <svg class="marker-svg" viewBox="0 0 100 100">
      <circle class="marker-path-o" cx="50" cy="50" r="28" />
    </svg>
  `;

  // --- Initial Setup Execution ---
  updateSoundUI();
  updateThemeUI();
  setGameMode(gameMode);
  setDifficulty(difficulty);
  updateScoreboardUI();
  resetBoard();

  // Set the visual turn in document body to help hover styling
  document.body.setAttribute('data-current-turn', currentPlayer);

  // --- Core Game Functions ---

  function setGameMode(mode) {
    gameMode = mode;
    localStorage.setItem('ttt_mode', mode);
    
    if (mode === 'pvp') {
      modePvPBtn.classList.add('active');
      modePvEBtn.classList.remove('active');
      aiDiffContainer.classList.add('hidden');
      playerOLabel.textContent = "Player O";
    } else {
      modePvPBtn.classList.remove('active');
      modePvEBtn.classList.add('active');
      aiDiffContainer.classList.remove('hidden');
      playerOLabel.textContent = `AI (${capitalize(difficulty)})`;
    }
    updateScoreboardUI();
    resetBoard();
  }

  function setDifficulty(diff) {
    difficulty = diff;
    localStorage.setItem('ttt_diff', diff);
    diffBtns.forEach(btn => {
      if (btn.getAttribute('data-diff') === diff) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (gameMode === 'pve') {
      playerOLabel.textContent = `AI (${capitalize(diff)})`;
    }
    resetBoard();
  }

  function saveHistory() {
    moveHistory.push({
      board: [...board],
      currentPlayer: currentPlayer,
      gameActive: gameActive
    });
    undoBtn.disabled = moveHistory.length === 0;
  }

  function makeMove(index) {
    if (!gameActive || board[index] !== null) return;
    
    saveHistory();
    board[index] = currentPlayer;
    
    const cell = cells[index];
    cell.classList.remove('empty');
    cell.innerHTML = currentPlayer === 'X' ? SVG_X : SVG_O;
    
    playMoveSound(currentPlayer);

    const winInfo = checkWinner(board);

    if (winInfo) {
      endGame(winInfo);
    } else if (board.every(cell => cell !== null)) {
      endGame({ result: 'tie' });
    } else {
      // Toggle player
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      document.body.setAttribute('data-current-turn', currentPlayer);
      updateActivePlayerCard();
      
      // If vs AI and it's O's turn, trigger AI move
      if (gameMode === 'pve' && currentPlayer === 'O' && gameActive) {
        triggerAiMove();
      }
    }
  }

  function undoMove() {
    if (moveHistory.length === 0 || isAiThinking) return;
    
    playClickSound();

    let lastState;
    if (gameMode === 'pve') {
      if (moveHistory.length >= 2) {
        moveHistory.pop(); // Pop AI move
        lastState = moveHistory.pop(); // Pop player move
      } else {
        lastState = moveHistory.pop();
      }
    } else {
      lastState = moveHistory.pop();
    }

    if (lastState) {
      board = lastState.board;
      currentPlayer = lastState.currentPlayer;
      gameActive = lastState.gameActive;

      // Reset cells visual state
      cells.forEach((cell, idx) => {
        cell.className = 'cell';
        if (board[idx] === null) {
          cell.classList.add('empty');
          cell.innerHTML = '';
        } else {
          cell.innerHTML = board[idx] === 'X' ? SVG_X : SVG_O;
        }
      });

      // Clear winner line
      winLineSvg.classList.remove('active');
      winningLineEl.setAttribute('x1', '0');
      winningLineEl.setAttribute('y1', '0');
      winningLineEl.setAttribute('x2', '0');
      winningLineEl.setAttribute('y2', '0');

      document.body.setAttribute('data-current-turn', currentPlayer);
      updateActivePlayerCard();
      undoBtn.disabled = moveHistory.length === 0;
    }
  }

  function checkWinner(tempBoard) {
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
      const [a, b, c] = WINNING_COMBOS[i];
      if (tempBoard[a] && tempBoard[a] === tempBoard[b] && tempBoard[a] === tempBoard[c]) {
        return { result: 'win', player: tempBoard[a], comboIndex: i, cells: [a, b, c] };
      }
    }
    return null;
  }

  function endGame(winInfo) {
    gameActive = false;
    undoBtn.disabled = true; // Disable undo on game over
    
    cardX.classList.remove('active');
    cardO.classList.remove('active');

    const currentScores = scores[gameMode];

    if (winInfo.result === 'win') {
      playWinSound();

      // Highlight winning cells
      winInfo.cells.forEach(idx => {
        cells[idx].classList.add('winning-cell');
      });

      // Draw winning line
      const coords = LINE_COORDINATES[winInfo.comboIndex];
      winningLineEl.setAttribute('x1', `${coords.x1}%`);
      winningLineEl.setAttribute('y1', `${coords.y1}%`);
      winningLineEl.setAttribute('x2', `${coords.x2}%`);
      winningLineEl.setAttribute('y2', `${coords.y2}%`);
      winLineSvg.classList.add('active');

      // Update scores
      if (winInfo.player === 'X') {
        currentScores.X++;
      } else {
        currentScores.O++;
      }
      localStorage.setItem('ttt_scores', JSON.stringify(scores));
      updateScoreboardUI();

      // Present Modal after 800ms
      setTimeout(() => {
        showModal(`${winInfo.player} Wins!`, winInfo.player);
      }, 800);

    } else {
      playDrawSound();
      currentScores.ties++;
      localStorage.setItem('ttt_scores', JSON.stringify(scores));
      updateScoreboardUI();

      setTimeout(() => {
        showModal("It's a Tie!", 'tie');
      }, 600);
    }
  }

  function resetBoard() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    isAiThinking = false;
    moveHistory = [];
    
    undoBtn.disabled = true;
    document.body.setAttribute('data-current-turn', currentPlayer);
    
    // Clear elements
    cells.forEach(cell => {
      cell.className = 'cell empty';
      cell.innerHTML = '';
    });

    winLineSvg.classList.remove('active');
    winningLineEl.setAttribute('x1', '0');
    winningLineEl.setAttribute('y1', '0');
    winningLineEl.setAttribute('x2', '0');
    winningLineEl.setAttribute('y2', '0');

    updateActivePlayerCard();
  }

  function clearStats() {
    playClickSound();
    scores[gameMode] = { X: 0, O: 0, ties: 0 };
    localStorage.setItem('ttt_scores', JSON.stringify(scores));
    updateScoreboardUI();
  }

  // --- Modal Helpers ---
  
  function showModal(title, resultType) {
    modalTitle.textContent = title;
    modalMessage.textContent = "Don't play again.";
    
    if (resultType === 'X') {
      modalIcon.innerHTML = `
        <svg class="marker-svg animate-draw" viewBox="0 0 100 100">
          <line class="marker-path-x1" x1="22" y1="22" x2="78" y2="78" style="animation-delay: 0.1s" />
          <line class="marker-path-x2" x1="78" y1="22" x2="22" y2="78" style="animation-delay: 0.25s" />
        </svg>
      `;
    } else if (resultType === 'O') {
      modalIcon.innerHTML = `
        <svg class="marker-svg animate-draw" viewBox="0 0 100 100">
          <circle class="marker-path-o" cx="50" cy="50" r="28" style="animation-delay: 0.1s" />
        </svg>
      `;
    } else {
      modalIcon.innerHTML = `
        <svg class="tie-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="6" y1="9" x2="18" y2="9"></line>
          <line x1="6" y1="15" x2="18" y2="15"></line>
        </svg>
      `;
    }
    
    gameOverModal.classList.remove('id-hidden');
    safeCreateIcons();
  }

  function hideModal() {
    gameOverModal.classList.add('id-hidden');
  }

  // --- UI Update Helpers ---

  function updateActivePlayerCard() {
    if (!gameActive) {
      cardX.classList.remove('active');
      cardO.classList.remove('active');
      return;
    }
    if (currentPlayer === 'X') {
      cardX.classList.add('active');
      cardO.classList.remove('active');
    } else {
      cardX.classList.remove('active');
      cardO.classList.add('active');
    }
  }

  function updateScoreboardUI() {
    const currentScores = scores[gameMode];
    if (currentScores) {
      scoreXEl.textContent = currentScores.X;
      scoreOEl.textContent = currentScores.O;
      scoreTiesEl.textContent = currentScores.ties;
    }
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // --- AI Opponent Engine ---

  function triggerAiMove() {
    isAiThinking = true;
    boardEl.style.pointerEvents = 'none';

    let delay = 500;
    if (difficulty === 'hard') delay = 600;

    setTimeout(() => {
      if (!gameActive) {
        isAiThinking = false;
        boardEl.style.pointerEvents = 'auto';
        return;
      }
      
      const bestMove = getAiBestMove();
      makeMove(bestMove);
      
      isAiThinking = false;
      boardEl.style.pointerEvents = 'auto';
    }, delay);
  }

  function getAiBestMove() {
    const emptyCells = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    
    // Easy difficulty: Pure Random Move
    if (difficulty === 'easy') {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // Medium difficulty: Balanced AI
    if (difficulty === 'medium') {
      if (Math.random() > 0.45) {
        return minimaxMove();
      } else {
        const winningMove = findImmediateWinningMove('O');
        if (winningMove !== null) return winningMove;

        const blockingMove = findImmediateWinningMove('X');
        if (blockingMove !== null) return blockingMove;

        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    }

    // Unbeatable difficulty: Minimax move
    if (difficulty === 'hard') {
      return minimaxMove();
    }

    return emptyCells[0];
  }

  function findImmediateWinningMove(player) {
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = player;
        const win = checkWinner(board);
        board[i] = null; // Revert
        if (win) return i;
      }
    }
    return null;
  }

  function minimaxMove() {
    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O'; // AI is O
        let score = minimax(board, 0, false);
        board[i] = null; // Revert
        
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  function minimax(tempBoard, depth, isMaximizing) {
    const winInfo = checkWinner(tempBoard);
    if (winInfo) {
      return winInfo.player === 'O' ? (10 - depth) : (depth - 10);
    }
    if (tempBoard.every(cell => cell !== null)) {
      return 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < tempBoard.length; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = 'O';
          let score = minimax(tempBoard, depth + 1, false);
          tempBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < tempBoard.length; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = 'X';
          let score = minimax(tempBoard, depth + 1, true);
          tempBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  // --- Event Listeners ---

  // Cell clicks
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const index = parseInt(cell.getAttribute('data-index'));
      if (!gameActive || board[index] !== null || isAiThinking) return;
      if (gameMode === 'pve' && currentPlayer === 'O') return;
      makeMove(index);
    });
  });

  // Game Mode Toggle
  modePvPBtn.addEventListener('click', () => {
    if (gameMode === 'pvp') return;
    playClickSound();
    setGameMode('pvp');
  });

  modePvEBtn.addEventListener('click', () => {
    if (gameMode === 'pve') return;
    playClickSound();
    setGameMode('pve');
  });

  // AI Difficulty toggles
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const diff = btn.getAttribute('data-diff');
      if (difficulty === diff) return;
      playClickSound();
      setDifficulty(diff);
    });
  });

  // Action Controls
  undoBtn.addEventListener('click', undoMove);
  
  resetBtn.addEventListener('click', () => {
    playClickSound();
    resetBoard();
  });

  clearBtn.addEventListener('click', clearStats);

  // Modal Control
  modalPlayAgainBtn.addEventListener('click', () => {
    playClickSound();
    hideModal();
    resetBoard();
  });

  // Dismiss modal if clicked outside modal content
  gameOverModal.addEventListener('click', (e) => {
    if (e.target === gameOverModal) {
      hideModal();
      resetBoard();
    }
  });

  // Initialize Lucide icons on page load
  safeCreateIcons();
}

// --- Safe DOM Loaded Execution Check ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
