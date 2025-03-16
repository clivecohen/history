// List of historical events (you can edit this)
const events = [
  { event: "1668: Benedictine monk improves Champagne wines", year: 1668 },
  { event: "1943: Los Angeles experiences first smog", year: 1943 },
  { event: "1969: Moon Landing", year: 1969 },
  { event: "1989: Fall of the Berlin Wall", year: 1989 },
];

let currentEventIndex = 0;
let score = 0;
const scoreDisplay = document.getElementById("score");
const feedbackDisplay = document.getElementById("feedback");
const timeline = document.getElementById("timeline");
const draggableEvent = document.getElementById("draggable-event");

// Initialize the game
function initGame() {
  if (currentEventIndex < events.length) {
    const event = events[currentEventIndex];
    draggableEvent.textContent = event.event;
    draggableEvent.dataset.year = event.year;
    draggableEvent.style.display = "block";
    draggableEvent.style.opacity = "1";
    currentEventIndex++;
  } else {
    draggableEvent.style.display = "none";
    feedbackDisplay.textContent = "Game Over!";
  }
}

// Add touch and mouse event listeners for dragging
draggableEvent.addEventListener("touchstart", startDrag);
draggableEvent.addEventListener("mousedown", startDrag);

let isDragging = false;
let initialX, initialY;

function startDrag(e) {
  e.preventDefault();
  isDragging = true;
  const touch = e.touches ? e.touches[0] : e;
  initialX = touch.clientX - draggableEvent.offsetLeft;
  initialY = touch.clientY - draggableEvent.offsetTop;
  document.addEventListener("touchmove", drag);
  document.addEventListener("mousemove", drag);
  document.addEventListener("touchend", endDrag);
  document.addEventListener("mouseup", endDrag);
}

function drag(e) {
  if (!isDragging) return;
  const touch = e.touches ? e.touches[0] : e;
  const newX = touch.clientX - initialX;
  const newY = touch.clientY - initialY;
  draggableEvent.style.left = `${newX}px`;
  draggableEvent.style.top = `${newY}px`;
}

function endDrag(e) {
  isDragging = false;
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("touchend", endDrag);
  document.removeEventListener("mouseup", endDrag);

  // Check if the event is in the correct position
  const timelineRect = timeline.getBoundingClientRect();
  const eventRect = draggableEvent.getBoundingClientRect();

  if (eventRect.top > timelineRect.top && eventRect.bottom < timelineRect.bottom) {
    const correctPosition = findCorrectPosition(draggableEvent);
    if (correctPosition) {
      timeline.insertBefore(draggableEvent, correctPosition);
      showFeedback("+10", "green");
      score += 10;
      scoreDisplay.textContent = score;
      draggableEvent.style.backgroundColor = "#444"; // Lock color
      draggableEvent.style.cursor = "default";
      draggableEvent.removeEventListener("touchstart", startDrag);
      draggableEvent.removeEventListener("mousedown", startDrag);
      setTimeout(initGame, 1000); // Introduce next event
    }
  } else {
    showFeedback("0", "red");
    setTimeout(() => {
      draggableEvent.style.top = "-60px";
      draggableEvent.style.left = "50%";
      draggableEvent.style.transform = "translateX(-50%)";
    }, 500);
  }
}

function findCorrectPosition(item) {
  const year = parseInt(item.dataset.year);
  const events = [...timeline.querySelectorAll(".event")];
  for (let i = 0; i < events.length; i++) {
    if (year < parseInt(events[i].dataset.year)) {
      return events[i];
    }
  }
  return null;
}

function showFeedback(text, color) {
  feedbackDisplay.textContent = text;
  feedbackDisplay.style.color = color;
  feedbackDisplay.style.opacity = "1";
  setTimeout(() => {
    feedbackDisplay.style.opacity = "0";
  }, 1000);
}

// Start the game
initGame();
