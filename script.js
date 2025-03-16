// List of historical events (you can edit this)
const events = [
  { event: "The Fall of the Berlin Wall", year: 1989 },
  { event: "The Moon Landing", year: 1969 },
  { event: "The Signing of the Declaration of Independence", year: 1776 },
  { event: "The End of World War II", year: 1945 },
  { event: "The Invention of the Internet", year: 1983 },
];

// Shuffle the events for the game
const shuffledEvents = events.sort(() => Math.random() - 0.5);

// Get the DOM elements
const sourceList = document.getElementById("source-list");
const eventsList = document.getElementById("events-list");
const scoreDisplay = document.getElementById("score");
const feedbackDisplay = document.getElementById("feedback");

// Initialize score and drop count
let score = 0;
let dropCount = 0;

// Add the first event to the game area
const initialEvent = shuffledEvents.pop();
const initialLi = createEventElement(initialEvent);
eventsList.appendChild(initialLi);

// Add the remaining events to the source area
shuffledEvents.forEach((event) => {
  const li = createEventElement(event);
  sourceList.appendChild(li);
});

// Helper function to create a draggable event element
function createEventElement(event) {
  const li = document.createElement("li");
  li.textContent = event.event;
  li.draggable = true;
  li.dataset.year = event.year; // Store the year for validation
  return li;
}

// Add drag-and-drop functionality
let draggedItem = null;

sourceList.addEventListener("dragstart", (e) => {
  draggedItem = e.target;
  setTimeout(() => e.target.style.opacity = "0.4", 0);
});

eventsList.addEventListener("dragover", (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(eventsList, e.clientY);
  const currentElement = e.target.closest("li");

  if (afterElement == null) {
    eventsList.appendChild(draggedItem);
  } else {
    eventsList.insertBefore(draggedItem, afterElement);
  }
});

eventsList.addEventListener("drop", (e) => {
  e.preventDefault();
  setTimeout(() => draggedItem.style.opacity = "1", 0);

  // Validate the order
  const orderedEvents = [...eventsList.querySelectorAll("li")].map((li) => parseInt(li.dataset.year));
  const isCorrect = orderedEvents.every((year, index, array) => !index || year >= array[index - 1]);

  // Update score and feedback
  dropCount++;
  let points = 0;
  if (isCorrect) {
    points = dropCount === 1 ? 10 : dropCount === 2 ? 20 : dropCount === 5 ? 50 : 0;
    score += points;
    feedbackDisplay.textContent = `Correct! +${points} points`;
    feedbackDisplay.style.color = "lightgreen";
  } else {
    feedbackDisplay.textContent = "Incorrect. 0 points";
    feedbackDisplay.style.color = "red";

    // Move the tile to the correct position with animation
    const correctPosition = findCorrectPosition(draggedItem);
    eventsList.insertBefore(draggedItem, correctPosition);
    draggedItem.style.animation = "slide 0.3s ease";
  }

  // Update score display
  scoreDisplay.textContent = score;

  // Disable further dragging if all events are placed
  if (dropCount === 4) {
    feedbackDisplay.textContent += " Game Over!";
    sourceList.querySelectorAll("li").forEach((li) => (li.draggable = false));
  }
});

// Helper function to find the correct position for an event
function findCorrectPosition(item) {
  const year = parseInt(item.dataset.year);
  const events = [...eventsList.querySelectorAll("li")];
  for (let i = 0; i < events.length; i++) {
    if (year < parseInt(events[i].dataset.year)) {
      return events[i];
    }
  }
  return null;
}

// Helper function to determine where to insert the dragged item
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
