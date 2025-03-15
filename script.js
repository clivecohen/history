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
const checkOrderButton = document.getElementById("check-order");
const resultText = document.getElementById("result");

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

eventsList.addEventListener("dragend", (e) => {
  setTimeout(() => e.target.style.opacity = "1", 0);
  draggedItem = null;
});

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

// Check the order of events
checkOrderButton.addEventListener("click", () => {
  const orderedEvents = [...eventsList.querySelectorAll("li")].map((li) => parseInt(li.dataset.year));
  const isCorrect = orderedEvents.every((year, index, array) => !index || year >= array[index - 1]);

  if (isCorrect) {
    resultText.textContent = "Correct! You got the order right!";
    resultText.style.color = "green";
  } else {
    resultText.textContent = "Incorrect. Try again!";
    resultText.style.color = "red";
  }
});
