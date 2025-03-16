const container = document.getElementById('gameContainer');
const tapButton = document.getElementById('tapButton');
let activeSquare = null;
let squares = [];
let score = 0;

const triviaData = [
    { text: "This band broke up in 1970", correctY: 400 },
    { text: "This console launched in 2006", correctY: 300 },
    { text: "This movie won Best Picture in 2004", correctY: 200 },
    { text: "This gadget launched in 1997", correctY: 100 }
];

function startGame() {
    addSquare(0);
}

function addSquare(index) {
    if (index >= triviaData.length) return;

    const square = document.createElement('div');
    square.classList.add('square', 'active');
    square.innerText = triviaData[index].text;
    square.dataset.index = index;
    square.style.left = `${(window.innerWidth - 300) / 2}px`;
    square.style.top = `${100}px`;
    container.appendChild(square);
    squares.push(square);
    activeSquare = square;

    square.addEventListener('touchstart', onTouchStart);
    square.addEventListener('touchmove', onTouchMove);
    square.addEventListener('touchend', onTouchEnd);
}

function onTouchStart(e) {
    e.preventDefault();
    activeSquare.style.transition = 'none';
}

function onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX - activeSquare.offsetWidth / 2;
    const y = touch.clientY - activeSquare.offsetHeight / 2;
    activeSquare.style.left = `${x}px`;
    activeSquare.style.top = `${y}px`;
}

function onTouchEnd(e) {
    e.preventDefault();
    tapButton.classList.add('visible');
    tapButton.onclick = () => placeSquare();
}

function placeSquare() {
    tapButton.classList.remove('visible');
    const index = parseInt(activeSquare.dataset.index);
    const correctY = triviaData[index].correctY;
    const currentY = parseInt(activeSquare.style.top);

    const tolerance = 50;
    const isCorrect = Math.abs(currentY - correctY) <= tolerance;

    showScore(isCorrect, activeSquare);
    activeSquare.classList.remove('active');
    activeSquare.classList.add('locked');

    if (!isCorrect) {
        activeSquare.style.transition = 'top 0.5s ease-in-out';
        activeSquare.style.top = `${correctY}px`;
    }

    activeSquare = null;
    setTimeout(() => addSquare(index + 1), 1000);
}

function showScore(isCorrect, square) {
    const scoreEl = document.createElement('div');
    scoreEl.classList.add('score');
    scoreEl.classList.add(isCorrect ? 'correct' : 'incorrect');
    scoreEl.innerText = isCorrect ? '+10' : '0';
    scoreEl.style.left = `${parseInt(square.style.left) + square.offsetWidth / 2 - 20}px`;
    scoreEl.style.top = `${parseInt(square.style.top) + square.offsetHeight / 2 - 20}px`;
    container.appendChild(scoreEl);

    if (isCorrect) score += 10;

    setTimeout(() => scoreEl.remove(), 1000);
}

startGame();
