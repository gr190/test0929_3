const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const HUMAN = BLACK;
const AI = WHITE;

let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let aiLevel = 'medium';
let timeLimit = 0;
let timer;
let remainingTime;

// Initialize the board with starting positions
function initializeBoard() {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    const mid = BOARD_SIZE / 2;
    board[mid-1][mid-1] = WHITE;
    board[mid-1][mid] = BLACK;
    board[mid][mid-1] = BLACK;
    board[mid][mid] = WHITE;
}

// Render the board on the webpage
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.onclick = () => makeMove(i, j);
            if (board[i][j] !== EMPTY) {
                const disc = document.createElement('div');
                disc.className = `disc ${board[i][j] === BLACK ? 'black' : 'white'}`;
                cell.appendChild(disc);
            }
            boardElement.appendChild(cell);
        }
    }
    updateScore();
    updateStatus();
}

// Update the score display
function updateScore() {
    let blackCount = 0;
    let whiteCount = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === BLACK) blackCount++;
            if (board[i][j] === WHITE) whiteCount++;
        }
    }
    document.getElementById('black-score').textContent = `黒: ${blackCount}`;
    document.getElementById('white-score').textContent = `白: ${whiteCount}`;
}

// Update the game status
function updateStatus() {
    const statusElement = document.getElementById('status');
    if (gameOver) {
        const blackCount = board.flat().filter(cell => cell === BLACK).length;
        const whiteCount = board.flat().filter(cell => cell === WHITE).length;
        if (blackCount > whiteCount) {
            showResult('プレイヤーの勝利!');
        } else if (whiteCount > blackCount) {
            showResult('AIの勝利!');
        } else {
            showResult('引き分け!');
        }
    } else {
        statusElement.textContent = `現在の手番: ${currentPlayer === HUMAN ? 'プレイヤー' : 'AI'}`;
    }
}

// Show the result modal with animation
function showResult(message) {
    gameOver = true;
    const modal = document.getElementById('result-modal');
    const messageElement = document.getElementById('result-message');
    messageElement.textContent = message;
    modal.classList.remove('hidden');
}

// Hide the result modal
function hideResult() {
    const modal = document.getElementById('result-modal');
    modal.classList.add('hidden');
}

// Check if a move is valid for a player
function isValidMove(row, col, player, boardState = board) {
    if (boardState[row][col] !== EMPTY) return false;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        let flipped = false;

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (boardState[x][y] === EMPTY) break;
            if (boardState[x][y] === player) {
                if (flipped) return true;
                break;
            }
            flipped = true;
            x += dx;
            y += dy;
        }
    }

    return false;
}

// Make a move for the current player
function makeMove(row, col) {
    if (gameOver || currentPlayer !== HUMAN || !isValidMove(row, col, currentPlayer)) return;

    flipDiscs(row, col, currentPlayer);
    if (canMove(AI)) {
        currentPlayer = AI;
        renderBoard();
        clearInterval(timer);
        setTimeout(makeAIMove, 500);
    } else {
        if (canMove(HUMAN)) {
            currentPlayer = HUMAN;
            renderBoard();
            startTimer();
            alert('AIがパスしました。プレイヤーの手番です。');
        } else {
            gameOver = true;
            renderBoard();
        }
    }
}

// Flip the discs based on the move
function flipDiscs(row, col, player, boardState = board) {
    boardState[row][col] = player;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        const toFlip = [];

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (boardState[x][y] === EMPTY) break;
            if (boardState[x][y] === player) {
                for (const [fx, fy] of toFlip) {
                    boardState[fx][fy] = player;
                }
                break;
            }
            toFlip.push([x, y]);
            x += dx;
            y += dy;
        }
    }
}

// Check if a player can make any move
function canMove(player, boardState = board) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (isValidMove(i, j, player, boardState)) {
                return true;
            }
        }
    }
    return false;
}

// AI makes a move based on the selected difficulty
function makeAIMove() {
    if (gameOver) return;

    const move = getBestMove(AI, aiLevel);
    if (move) {
        flipDiscs(move.row, move.col, AI);
    }

    if (canMove(HUMAN)) {
        currentPlayer = HUMAN;
        renderBoard();
        startTimer();
    } else {
        if (canMove(AI)) {
            currentPlayer = AI;
            renderBoard();
            alert('プレイヤーがパスしました。AIの手番です。');
            setTimeout(makeAIMove, 500);
        } else {
            gameOver = true;
            renderBoard();
        }
    }
}

// Evaluate the board from AI's perspective
function evaluateBoard(boardState, player) {
    let score = 0;
    const weights = [
        [100, -20, 10, 5, 5, 10, -20, 100],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [10, -2, -1, -1, -1, -1, -2, 10],
        [5, -2, -1, -1, -1, -1, -2, 5],
        [5, -2, -1, -1, -1, -1, -2, 5],
        [10, -2, -1, -1, -1, -1, -2, 10],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [100, -20, 10, 5, 5, 10, -20, 100]
    ];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (boardState[i][j] === player) {
                score += weights[i][j];
            } else if (boardState[i][j] === (player === BLACK ? WHITE : BLACK)) {
                score -= weights[i][j];
            }
        }
    }
    return score;
}

// Check if the game is over
function isGameOver(boardState) {
    return !canMove(HUMAN, boardState) && !canMove(AI, boardState);
}

// Minimax algorithm with alpha-beta pruning
function minimax(boardState, depth, maximizingPlayer, alpha, beta, player) {
    if (depth === 0 || isGameOver(boardState)) {
        return evaluateBoard(boardState, AI);
    }

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        const validMoves = getValidMoves(boardState, player);
        for (const move of validMoves) {
            const newBoard = JSON.parse(JSON.stringify(boardState));
            flipDiscs(move.row, move.col, player, newBoard);
            const eval = minimax(newBoard, depth - 1, false, alpha, beta, HUMAN);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const opponent = (player === AI) ? HUMAN : AI;
        const validMoves = getValidMoves(boardState, opponent);
        for (const move of validMoves) {
            const newBoard = JSON.parse(JSON.stringify(boardState));
            flipDiscs(move.row, move.col, opponent, newBoard);
            const eval = minimax(newBoard, depth - 1, true, alpha, beta, player);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Get the best move based on AI level
function getBestMove(player, level) {
    const validMoves = getValidMoves(board, player);
    if (validMoves.length === 0) return null;

    let bestMove = null;
    let bestScore = -Infinity;
    let depth = 3; // Default depth

    switch (level) {
        case 'god':
            depth = 6; // Increased depth for "God" level
            break;
        case 'very-hard':
            depth = 5;
            break;
        case 'hard':
            depth = 4;
            break;
        case 'medium':
            depth = 3;
            break;
        case 'easy':
            depth = 2;
            break;
        default:
            depth = 3;
    }

    for (const move of validMoves) {
        const newBoard = JSON.parse(JSON.stringify(board));
        flipDiscs(move.row, move.col, player, newBoard);
        const score = minimax(newBoard, depth - 1, false, -Infinity, Infinity, HUMAN);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove || validMoves[Math.floor(Math.random() * validMoves.length)];
}

// Get all valid moves for a player
function getValidMoves(boardState, player) {
    const moves = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (isValidMove(i, j, player, boardState)) {
                moves.push({ row: i, col: j });
            }
        }
    }
    return moves;
}

// Start the game timer
function startTimer() {
    clearInterval(timer);
    if (timeLimit > 0 && !gameOver) {
        remainingTime = timeLimit;
        updateTimerDisplay();
        timer = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime <= 0) {
                clearInterval(timer);
                alert('時間切れです。パスとなります。');
                if (currentPlayer === HUMAN) {
                    currentPlayer = AI;
                    if (canMove(AI)) {
                        setTimeout(makeAIMove, 500);
                    } else {
                        gameOver = true;
                        renderBoard();
                    }
                } else {
                    currentPlayer = HUMAN;
                    if (canMove(HUMAN)) {
                        renderBoard();
                        startTimer();
                    } else {
                        gameOver = true;
                        renderBoard();
                    }
                }
            }
        }, 1000);
    } else {
        document.getElementById('timer').textContent = '';
    }
}

// Update the timer display
function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `残り時間: ${remainingTime}秒`;
}

// Handle random move when time runs out
function makeRandomMove() {
    const validMoves = getValidMoves(board, HUMAN);
    if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        makeMove(randomMove.row, randomMove.col);
    }
}

// Event listener for starting the game
document.getElementById('start-game').addEventListener('click', () => {
    aiLevel = document.getElementById('ai-level').value;
    timeLimit = parseInt(document.getElementById('time-limit').value);
    initializeBoard();
    renderBoard();
    gameOver = false;
    currentPlayer = HUMAN;
    hideResult();
    startTimer();
});

// Event listener for restarting the game
document.getElementById('restart-game').addEventListener('click', () => {
    initializeBoard();
    renderBoard();
    gameOver = false;
    currentPlayer = HUMAN;
    hideResult();
    startTimer();
});

// Initial setup
initializeBoard();
renderBoard();
