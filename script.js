// Initialize score
let score = 0;
const scoreDisplay = document.getElementById("score");
const feedbackDisplay = document.getElementById("feedback");

// Get the draggable event and timeline
const draggableEvent = document.getElementById("draggable-event");
const timeline = document.querySelector(".timeline");

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
    showFeedback("+10", "green");
    score += 10;
    scoreDisplay.textContent = score;
    draggableEvent.style.backgroundColor = "#444"; // Lock color
    draggableEvent.style.cursor = "default";
    draggableEvent.removeEventListener("touchstart", startDrag);
    draggableEvent.removeEventListener("mousedown", startDrag);
  } else {
    showFeedback("0", "red");
    setTimeout(() => {
      draggableEvent.style.top = "-60px";
      draggableEvent.style.left = "50%";
      draggableEvent.style.transform = "translateX(-50%)";
    }, 500);
  }
}

function showFeedback(text, color) {
  feedbackDisplay.textContent = text;
  feedbackDisplay.style.color = color;
  feedbackDisplay.style.opacity = "1";
  setTimeout(() => {
    feedbackDisplay.style.opacity = "0";
  }, 1000);
}
