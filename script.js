document.addEventListener('DOMContentLoaded', () => {
  // Redefine debugLog to only log to console
  window.debugLog = function(message) {
    // Only log to console, not to the screen
    console.log(message);
  };
  
  // Game variables
  const sourceContainer = document.getElementById('source-container');
  const timelineContainer = document.getElementById('timeline-container');
  const resultDisplay = document.getElementById('result');
  const scoreDisplay = document.getElementById('score');
  const shareContainer = document.getElementById('share-container');
  const shareButton = document.getElementById('share-button');
  const introScreen = document.getElementById('intro-screen');
  const continueButton = document.getElementById('continue-button');
  const gameContent = document.getElementById('game-content');
  
  // Set up intro screen
  continueButton.addEventListener('click', () => {
    introScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');
  });
  
  // Historical events game data
  const historicalEvents = [
    {
      year: 1215,
      event: "King John signed the Magna Carta in England",
      fullText: "<b>1215</b>, King John signed the Magna Carta in England",
      color: "#3498db" // Original blue
    },
    {
      year: 1492,
      event: "Christopher Columbus arrived in the Americas",
      fullText: "<b>1492</b>, Christopher Columbus arrived in the Americas",
      color: "#2980b9" // Darker blue
    },
    {
      year: 1776,
      event: "the United States declared its independence from Britain",
      fullText: "<b>1776</b>, the United States declared its independence from Britain",
      color: "#27ae60" // Green
    },
    {
      year: 1903,
      event: "the Wright Brothers made the first successful airplane flight",
      fullText: "<b>1903</b>, the Wright Brothers made the first successful airplane flight",
      color: "#8e44ad" // Purple
    },
    {
      year: 1969,
      event: "Neil Armstrong became the first person to walk on the Moon",
      fullText: "<b>1969</b>, Neil Armstrong became the first person to walk on the Moon",
      color: "#d35400" // Orange
    }
  ];
  
  // Sort events by year
  const sortedEvents = [...historicalEvents].sort((a, b) => a.year - b.year);
  
  // Score and game state
  let score = 0;
  let currentMode;
  let touchY; // Track touch position
  let remainingEvents = [];
  let placedFirstEvent = false;
  let lastHoveredIndex = -1; // Track the last hovered index for smoother animations
  let draggedElement = null; // The currently dragged element
  let isDraggingActive = false; // Track if we're currently dragging
  let stackedEvents = []; // Track stacked events in source
  
  // Initialize drag and drop
  function initDragAndDrop() {
    const draggables = document.querySelectorAll('.item:not(.placed)');
    
    // For desktop drag and drop
    draggables.forEach(draggable => {
      draggable.addEventListener('dragstart', (e) => {
        draggedElement = draggable;
        isDraggingActive = true;
        draggable.classList.add('dragging');
        
        // Create a semi-transparent ghost image for better visual feedback
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          // Make the drag image a bit transparent to see underneath
          draggable.style.opacity = '0.4';
        }
        
        // Add visual indicator to possible drop targets
        if (draggable.parentNode === sourceContainer) {
          timelineContainer.classList.add('highlight-dropzone');
        }
        
        // Remember original sizes for animation
        rememberOriginalSizes();
      });
      
      draggable.addEventListener('dragend', () => {
        // If we dropped outside the timeline, return to stack
        if (draggedElement && draggedElement.parentNode !== timelineContainer && 
            draggedElement.parentNode !== sourceContainer) {
          returnToStack(draggedElement);
        }
        
        draggedElement = null;
        isDraggingActive = false;
        draggable.classList.remove('dragging');
        draggable.style.opacity = '1';
        timelineContainer.classList.remove('highlight-dropzone');
        lastHoveredIndex = -1;
        
        // Reset all animations
        resetItemsAnimation();
        checkEmpty();
      });
      
      // Add touch events for mobile
      draggable.addEventListener('touchstart', handleTouchStart, { passive: false });
      draggable.addEventListener('touchmove', handleTouchMove, { passive: false });
      draggable.addEventListener('touchend', handleTouchEnd);
    });
    
    // For desktop
    sourceContainer.addEventListener('dragover', e => {
      e.preventDefault();
    });
    
    timelineContainer.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (!isDraggingActive) return;
      timelineContainer.classList.add('active-dropzone');
    });
    
    timelineContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!isDraggingActive) return;
      
      // Only remove the active class if we're leaving the container
      const relatedTarget = e.relatedTarget;
      if (!timelineContainer.contains(relatedTarget)) {
        timelineContainer.classList.remove('active-dropzone');
      }
    });
    
    timelineContainer.addEventListener('dragover', e => {
      e.preventDefault();
      if (!draggedElement) return;
      
      const afterElement = getDragAfterElement(timelineContainer, e.clientY);
      const draggable = draggedElement;
      
      // Find the index we're hovering over
      const timelineItems = [...timelineContainer.querySelectorAll('.item:not(.dragging)')];
      let hoverIndex = afterElement ? timelineItems.indexOf(afterElement) : timelineItems.length;
      
      // Only animate if we're hovering at a different position
      if (hoverIndex !== lastHoveredIndex) {
        animateItemsToMakeSpace(hoverIndex, timelineItems);
        lastHoveredIndex = hoverIndex;
      }
      
      if (draggable && draggable.parentNode === sourceContainer) {
        // Moving from source to timeline
        if (timelineItems.length === 1 && timelineContainer.querySelector('.timeline-centering-wrapper')) {
          // If there's only one item in a wrapper, remove the wrapper and add items directly
          const wrapper = timelineContainer.querySelector('.timeline-centering-wrapper');
          const firstItem = wrapper.querySelector('.item');
          
          // Move the first item out of the wrapper
          timelineContainer.appendChild(firstItem);
          wrapper.remove();
          
          // Then add the new item
          if (afterElement == null) {
            timelineContainer.appendChild(draggable);
          } else {
            timelineContainer.insertBefore(draggable, afterElement);
          }
        } else {
          // Normal case - just add to the timeline
          if (afterElement == null) {
            timelineContainer.appendChild(draggable);
          } else {
            timelineContainer.insertBefore(draggable, afterElement);
          }
        }
        
        placedFirstEvent = true;
        
        // Add a class to identify items in the timeline
        draggable.classList.add('timeline-item');
        
        // Add the TAP TO PLACE button
        addTapToPlaceButton(draggable);
      } else if (draggable && draggable.parentNode === timelineContainer) {
        // Reordering within timeline - no additional points for this
        if (afterElement == null) {
          timelineContainer.appendChild(draggable);
        } else {
          timelineContainer.insertBefore(draggable, afterElement);
        }
      }
    });
    
    timelineContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      timelineContainer.classList.remove('active-dropzone');
      timelineContainer.classList.remove('highlight-dropzone');
      
      // Reset animations after drop
      resetItemsAnimation();
      
      // We already moved the element in dragover, so just cleanup here
      if (draggedElement) {
        draggedElement.style.opacity = '1';
        draggedElement = null;
        isDraggingActive = false;
      }
    });
  }

  // Reveals the next event in the stack
  function revealNextInStack() {
    if (stackedEvents.length > 0) {
      const nextEvent = stackedEvents.shift();
      const topItemElement = document.createElement('div');
      topItemElement.className = 'item top-of-stack';
      topItemElement.textContent = nextEvent.event;
      topItemElement.draggable = true;
      topItemElement.dataset.year = nextEvent.year;
      topItemElement.dataset.fullText = nextEvent.fullText;
      topItemElement.dataset.color = nextEvent.color;
      topItemElement.style.backgroundColor = nextEvent.color;
      sourceContainer.appendChild(topItemElement);
      
      // Initialize drag for this new element
      initDragForItem(topItemElement);
    }
  }

  // Initialize drag events for a single item
  function initDragForItem(item) {
    // Skip if already placed
    if (item.classList.contains('placed')) return;
    
    item.addEventListener('dragstart', (e) => {
      draggedElement = item;
      isDraggingActive = true;
      item.classList.add('dragging');
      
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        item.style.opacity = '0.4';
      }
      
      timelineContainer.classList.add('highlight-dropzone');
      rememberOriginalSizes();
    });
    
    item.addEventListener('dragend', () => {
      if (draggedElement && draggedElement.parentNode !== timelineContainer && 
          draggedElement.parentNode !== sourceContainer) {
        returnToStack(draggedElement);
      }
      
      draggedElement = null;
      isDraggingActive = false;
      item.classList.remove('dragging');
      item.style.opacity = '1';
      timelineContainer.classList.remove('highlight-dropzone');
      lastHoveredIndex = -1;
      
      resetItemsAnimation();
      checkEmpty();
    });
    
    item.addEventListener('touchstart', handleTouchStart, { passive: false });
    item.addEventListener('touchmove', handleTouchMove, { passive: false });
    item.addEventListener('touchend', handleTouchEnd);
  }

  // Add the TAP TO PLACE button to an item
  function addTapToPlaceButton(item) {
    // Only add if it doesn't already have one
    if (!item.querySelector('.tap-button')) {
      debugLog("Adding TAP TO PLACE button");
      
      const tapButton = document.createElement('div');
      tapButton.className = 'tap-button';
      tapButton.textContent = 'TAP TO PLACE';
      
      // Ensure the button is properly styled
      tapButton.style.position = 'absolute';
      tapButton.style.right = '0';
      tapButton.style.top = '50%';
      tapButton.style.transform = 'translateY(-50%)';
      tapButton.style.zIndex = '100';
      tapButton.style.opacity = '1';
      tapButton.style.visibility = 'visible';
      
      // Use both click and touchend events for better mobile compatibility
      const handleTap = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        debugLog("TAP TO PLACE button tapped");
        
        // Immediate visual feedback
        tapButton.style.backgroundColor = '#4CAF50';
        
        // Fix the iOS 300ms delay by using setTimeout
        setTimeout(() => {
          finalizeItemPlacement(item);
        }, 10);
      };
      
      tapButton.addEventListener('click', handleTap);
      tapButton.addEventListener('touchend', handleTap);
      
      item.appendChild(tapButton);
      
      // Make sure the button is visible
      setTimeout(() => {
        tapButton.style.opacity = '1';
        tapButton.style.visibility = 'visible';
      }, 50);
    }
  }

  // Handle finalizing the placement of an item
  function finalizeItemPlacement(item) {
    debugLog("Finalizing placement of item");
    
    // Safety checks
    if (!item || !item.parentNode) {
      debugLog("Error: Invalid item or item not in DOM");
      return;
    }
    
    // Make sure item is in the timeline
    if (!timelineContainer.contains(item)) {
      debugLog("Error: Item not in timeline container");
      return;
    }
    
    // Get the current position in the timeline
    const timelineItems = [...timelineContainer.querySelectorAll('.item')];
    const placedIndex = timelineItems.indexOf(item);
    
    if (placedIndex === -1) {
      debugLog("Error: Item not found in timeline items collection");
      return;
    }
    
    // Find the correct position for this item
    const yearToCheck = parseInt(item.dataset.year);
    let isCorrect = false;
    
    // Determine if placement is correct
    if (timelineItems.length === 1) {
      // If it's the only item, it's correct
      isCorrect = true;
    } else {
      // Check if the current position is correct
      if (placedIndex === 0) {
        // If it's at the beginning, check if it's before the next item
        const nextItemYear = parseInt(timelineItems[1].dataset.year);
        isCorrect = yearToCheck < nextItemYear;
      } else if (placedIndex === timelineItems.length - 1) {
        // If it's at the end, check if it's after the previous item
        const prevItemYear = parseInt(timelineItems[placedIndex - 1].dataset.year);
        isCorrect = yearToCheck > prevItemYear;
      } else {
        // If it's in the middle, check both sides
        const prevItemYear = parseInt(timelineItems[placedIndex - 1].dataset.year);
        const nextItemYear = parseInt(timelineItems[placedIndex + 1].dataset.year);
        isCorrect = yearToCheck > prevItemYear && yearToCheck < nextItemYear;
      }
    }
    
    debugLog("Placement correct? " + isCorrect);
    
    // Remove the timeline-item class which enabled the tap button
    item.classList.remove('timeline-item');
    
    // Remove the button immediately
    const tapButton = item.querySelector('.tap-button');
    if (tapButton) {
      tapButton.remove();
    }
    
    // Mark the item as placed and disable dragging
    item.classList.add('placed');
    item.draggable = false;
    
    // Ensure all positioning styles are reset so the item stays in place
    item.style.position = '';
    item.style.top = '';
    item.style.left = '';
    item.style.width = '';
    item.style.height = '';
    item.style.transform = '';
    item.style.zIndex = '';
    item.style.webkitTransform = '';
    
    // Force styles to be applied (helps with Safari)
    void item.offsetWidth;
    
    // Replace the text with full version including bold year
    item.innerHTML = item.dataset.fullText;
    
    // Ensure the color is preserved
    item.style.backgroundColor = item.dataset.color;
    
    // Force another style application
    void item.offsetWidth;
    
    // Safari-specific fix: Ensure the item is visible
    item.style.opacity = '1';
    item.style.display = 'block';
    
    // Update score and display feedback
    if (isCorrect) {
      score += 100;
      updateScore();
      debugLog("Showing correct feedback");
      
      // Safari-friendly way of showing feedback
      showFeedback('Correct! +100 points', 'correct');
      
      // Small delay for Safari
      setTimeout(() => {
        // Add fireworks animation - Safari friendly approach
        const fireworksElement = document.createElement('div');
        fireworksElement.className = 'fireworks-container';
        item.appendChild(fireworksElement);
        
        debugLog("Creating fireworks");
        createSimplifiedFireworks(fireworksElement);
        
        // Remove fireworks after animation
        setTimeout(() => {
          if (fireworksElement.parentNode) {
            fireworksElement.parentNode.removeChild(fireworksElement);
          }
        }, 1500);
      }, 50);
      
    } else {
      debugLog("Showing incorrect feedback");
      
      // Safari-friendly way of showing feedback
      showFeedback('Incorrect placement! No points', 'incorrect');
      
      // Small delay for Safari
      setTimeout(() => {
        // Create thumbs down element - Safari friendly
        debugLog("Creating thumbs down");
        const thumbsElement = document.createElement('div');
        thumbsElement.className = 'thumbs-down';
        thumbsElement.innerHTML = '👎';
        thumbsElement.style.position = 'absolute';
        thumbsElement.style.fontSize = '40px';
        thumbsElement.style.top = '50%';
        thumbsElement.style.left = '50%';
        thumbsElement.style.transform = 'translate(-50%, -50%)';
        thumbsElement.style.zIndex = '100';
        thumbsElement.style.color = '#e74c3c';
        item.appendChild(thumbsElement);
        
        // Manually animate the thumbs down for Safari
        setTimeout(() => { thumbsElement.style.opacity = '1'; }, 50);
        
        // Remove thumbs down after animation
        setTimeout(() => {
          if (thumbsElement.parentNode) {
            thumbsElement.parentNode.removeChild(thumbsElement);
          }
          
          // Move to correct position after feedback
          moveItemToCorrectPosition(item, timelineItems);
        }, 1000);
      }, 50);
    }
    
    // Now that we've finalized the placement, reveal the next item if this was from the source
    if (item.classList.contains('top-of-stack')) {
      item.classList.remove('top-of-stack');
      
      // Wait a bit before revealing the next item for better visual feedback
      setTimeout(() => {
        revealNextInStack();
        updateStackCount();
      }, 300);
    }
    
    // Check if this was the last item to be placed
    setTimeout(() => {
      checkGameCompletion();
    }, 1500);
  }

  // Simplified fireworks for Safari
  function createSimplifiedFireworks(container) {
    const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const firework = document.createElement('div');
      firework.style.position = 'absolute';
      firework.style.width = '8px';
      firework.style.height = '8px';
      firework.style.borderRadius = '50%';
      firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      firework.style.opacity = '0';
      
      // Random position
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 40;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      // Set initial position
      firework.style.top = '50%';
      firework.style.left = '50%';
      
      container.appendChild(firework);
      
      // Manually animate for Safari
      setTimeout(() => {
        firework.style.opacity = '1';
        firework.style.transform = `translate(${x}px, ${y}px)`;
        firework.style.transition = 'all 0.5s ease-out';
        
        // Fade out
        setTimeout(() => {
          firework.style.opacity = '0';
        }, 300);
      }, Math.random() * 200);
    }
  }

  // Update score display
  function updateScore() {
    scoreDisplay.textContent = score;
    
    // Add glowing effect when score increases
    scoreDisplay.classList.add('score-glow');
    
    // Remove the glow effect after animation completes
    setTimeout(() => {
      scoreDisplay.classList.remove('score-glow');
    }, 1000);
  }

  // Show feedback briefly
  function showFeedback(message, className) {
    debugLog("Showing feedback: " + message);
    
    resultDisplay.textContent = message;
    resultDisplay.className = className;
    
    // Ensure the feedback is visible
    resultDisplay.style.display = 'block';
    resultDisplay.style.opacity = '1';
    
    // Clear after 2 seconds
    setTimeout(() => {
      // Fade out slowly
      resultDisplay.style.transition = 'opacity 0.5s';
      resultDisplay.style.opacity = '0';
      
      // Then clear text
      setTimeout(() => {
        resultDisplay.textContent = '';
        resultDisplay.className = '';
        resultDisplay.style.transition = '';
        resultDisplay.style.opacity = '1';
      }, 500);
    }, 2000);
  }

  // Return an item to the stack if dropped outside a valid container
  function returnToStack(item) {
    // Create an event object to put back in the stack
    const returnedEvent = {
      year: item.dataset.year,
      event: item.textContent,
      fullText: item.dataset.fullText,
      color: item.dataset.color
    };
    
    // Add at beginning to be next up
    stackedEvents.unshift(returnedEvent);
    
    // Remove the dragged element
    if (item.parentNode) {
      item.parentNode.removeChild(item);
    }
    
    // Ensure there's always a top item visible
    if (sourceContainer.querySelectorAll('.item').length === 0 && stackedEvents.length > 0) {
      revealNextInStack();
    }
  }
  
  // Remember original positions of items for smooth animations
  function rememberOriginalSizes() {
    const timelineItems = [...timelineContainer.querySelectorAll('.item')];
    timelineItems.forEach(item => {
      if (!item.dataset.originalHeight) {
        item.dataset.originalHeight = `${item.offsetHeight}px`;
      }
    });
  }
  
  // Animate items to make space for dragged item
  function animateItemsToMakeSpace(hoverIndex, items) {
    debugLog("Animating items to make space at index: " + hoverIndex);
    
    // Reset any previous animations first
    resetItemsAnimation();
    
    // Apply animation to items
    items.forEach((item, index) => {
      // Skip the item being dragged itself
      if (item === draggedElement) return;
      
      // Skip special animation states
      if (item.classList.contains('shrinking') || 
          item.classList.contains('expanding')) {
        return;
      }
      
      // Set transition for smoother animation - use a faster transition for mobile
      const isMobile = 'ontouchstart' in window;
      const transitionSpeed = isMobile ? '0.1s' : '0.2s'; // Even faster on mobile
      item.style.transition = `transform ${transitionSpeed} ease-out`;
      
      if (index >= hoverIndex) {
        // Move items below hover point down
        // Use a larger gap for better visibility on mobile
        const moveDistance = isMobile ? 30 : 15; // Increased distance for mobile
        item.style.transform = `translateY(${moveDistance}px)`;
        debugLog(`Moving item ${index} down by ${moveDistance}px`);
      } else {
        // Ensure items above hover point are reset
        item.style.transform = '';
      }
    });
  }
  
  // Reset all animation styles
  function resetItemsAnimation() {
    const allItems = [
      ...sourceContainer.querySelectorAll('.item'),
      ...timelineContainer.querySelectorAll('.item')
    ];
    
    const isMobile = 'ontouchstart' in window;
    const resetDelay = isMobile ? 100 : 200; // Even faster reset on mobile
    
    allItems.forEach(item => {
      // Skip the item being dragged
      if (item === draggedElement) return;
      
      // Skip special animation states
      if (item.classList.contains('shrinking') || 
          item.classList.contains('expanding')) {
        return;
      }
      
      // Ensure transition is set for smooth reset
      if (!item.style.transition) {
        const transitionSpeed = isMobile ? '0.1s' : '0.2s';
        item.style.transition = `transform ${transitionSpeed} ease-out`;
      }
      
      item.style.transform = '';
      
      // Use a shorter delay before removing transition
      setTimeout(() => {
        if (!item.classList.contains('dragging')) {
          item.style.transition = '';
        }
      }, resetDelay);
    });
  }
  
  // Touch event handlers for mobile
  function handleTouchStart(e) {
    e.preventDefault();
    
    // Only handle touch events if this isn't a placed item
    if (this.classList.contains('placed')) return;
    
    const touch = e.touches[0];
    touchY = touch.clientY;
    
    draggedElement = this;
    isDraggingActive = true;
    this.classList.add('dragging');
    
    // Create a ghost image for better visual feedback
    this.style.opacity = '0.6';
    
    // Highlight potential drop zone
    if (this.parentNode === sourceContainer) {
      timelineContainer.classList.add('highlight-dropzone');
    }
    
    // Store offsets for centered dragging - simpler calculation
    const rect = this.getBoundingClientRect();
    this.dataset.offsetX = touch.clientX - rect.left;
    this.dataset.offsetY = touch.clientY - rect.top;
    
    // Store element's dimensions
    this.dataset.width = rect.width;
    this.dataset.height = rect.height;
    
    // Remember original sizes for animation
    rememberOriginalSizes();
  }
  
  function handleTouchMove(e) {
    // Don't do anything if no drag is active
    if (!isDraggingActive || !draggedElement) return;
    
    e.preventDefault();
    
    // Skip if this is a placed item or not the dragging element
    if (draggedElement.classList.contains('placed') || 
        !draggedElement.classList.contains('dragging')) return;
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    // Get the stored offsets - where in the element the user initially touched
    const offsetX = parseFloat(draggedElement.dataset.offsetX) || 0;
    const offsetY = parseFloat(draggedElement.dataset.offsetY) || 0;
    
    // Position the element so the touch point is at the same relative position
    // where the user first touched the element
    const newLeft = currentX - offsetX;
    const newTop = currentY - offsetY;
    
    // Use absolute positioning for smoother movement
    draggedElement.style.position = 'fixed';
    draggedElement.style.left = `${newLeft}px`;
    draggedElement.style.top = `${newTop}px`;
    draggedElement.style.zIndex = '1000';
    draggedElement.style.width = `${draggedElement.dataset.width}px`;
    
    // Check if we're hovering over the timeline container
    const timelineRect = timelineContainer.getBoundingClientRect();
    const isOverTimeline = 
      currentY >= timelineRect.top && 
      currentY <= timelineRect.bottom;
    
    if (isOverTimeline) {
      timelineContainer.classList.add('active-dropzone');
      
      // Get the insertion point to animate items
      const afterElement = getDragAfterElement(timelineContainer, currentY);
      
      // Find all timeline items, whether they're placed or not
      // Critical: Include ALL items in the timeline for animation
      const timelineItems = [...timelineContainer.querySelectorAll('.item')];
      
      // Calculate hover index
      let hoverIndex = afterElement ? timelineItems.indexOf(afterElement) : timelineItems.length;
      
      // Always animate items when hovering over timeline
      // Force animation on every touch move for better mobile responsiveness
      debugLog(`Touch move over timeline at position ${currentY}, hover index: ${hoverIndex}`);
      animateItemsToMakeSpace(hoverIndex, timelineItems);
      lastHoveredIndex = hoverIndex;
    } else {
      timelineContainer.classList.remove('active-dropzone');
      // Reset animations when moving away from timeline
      resetItemsAnimation();
      lastHoveredIndex = -1;
    }
    
    touchY = currentY;
  }
  
  function handleTouchEnd(e) {
    // Skip if no active drag
    if (!isDraggingActive || !draggedElement) return;
    
    const touch = e.changedTouches ? e.changedTouches[0] : null;
    const currentY = touch ? touch.clientY : 0;
    
    // Reset positioning to prepare for insertion
    draggedElement.style.position = '';
    draggedElement.style.left = '';
    draggedElement.style.top = '';
    draggedElement.style.zIndex = '';
    draggedElement.style.width = '';
    draggedElement.style.transform = '';
    draggedElement.style.webkitTransform = '';
    
    // Check if we dropped over the timeline
    const timelineRect = timelineContainer.getBoundingClientRect();
    const isOverTimeline = 
      currentY >= timelineRect.top && 
      currentY <= timelineRect.bottom;
    
    if (isOverTimeline) {
      // Place the item in the timeline at the appropriate position
      const afterElement = getDragAfterElement(timelineContainer, currentY);
      
      if (draggedElement.parentNode === sourceContainer) {
        // Moving from source to timeline
        if (timelineContainer.querySelector('.timeline-centering-wrapper')) {
          const wrapper = timelineContainer.querySelector('.timeline-centering-wrapper');
          const firstItem = wrapper.querySelector('.item');
          
          // Move the first item out of the wrapper
          timelineContainer.appendChild(firstItem);
          wrapper.remove();
        }
        
        // Move the element to its new position
        if (afterElement) {
          timelineContainer.insertBefore(draggedElement, afterElement);
        } else {
          timelineContainer.appendChild(draggedElement);
        }
        
        // Add the TAP TO PLACE button
        draggedElement.classList.add('timeline-item');
        addTapToPlaceButton(draggedElement);
        
        placedFirstEvent = true;
      } else if (draggedElement.parentNode === timelineContainer) {
        // Reordering within timeline
        if (afterElement && afterElement !== draggedElement) {
          timelineContainer.insertBefore(draggedElement, afterElement);
        } else if (!afterElement) {
          timelineContainer.appendChild(draggedElement);
        }
      }
    } else {
      // If dropped outside the timeline, return to stack
      if (draggedElement.parentNode !== timelineContainer && 
          draggedElement.parentNode !== sourceContainer) {
        returnToStack(draggedElement);
      } else if (draggedElement.classList.contains('timeline-item')) {
        // If it was already in the timeline but dragged out, return it to its position
        // No need to do anything as it's already in the correct DOM position
      } else if (draggedElement.parentNode === sourceContainer) {
        // If it was from the source and dropped outside, make sure it stays in the source
        // No action needed as it's already in the correct position
      }
    }
    
    // Clean up
    draggedElement.classList.remove('dragging');
    draggedElement.style.opacity = '1';
    
    timelineContainer.classList.remove('active-dropzone');
    timelineContainer.classList.remove('highlight-dropzone');
    
    // Reset animations
    resetItemsAnimation();
    
    draggedElement = null;
    isDraggingActive = false;
    lastHoveredIndex = -1;
    checkEmpty();
  }
  
  // Get element to insert dragged item after
  function getDragAfterElement(container, y) {
    // Get all draggable elements in the container
    // For mobile, we need to be more inclusive to ensure we find the right insertion point
    const isMobile = 'ontouchstart' in window;
    
    // On mobile, include all items for better positioning
    const draggableElements = [...container.querySelectorAll('.item')].filter(item => {
      // Filter out the currently dragged element if it's in the container
      return isMobile ? (item !== draggedElement) : !item.classList.contains('dragging');
    });
    
    // If there are no draggable elements, return null to append at the end
    if (draggableElements.length === 0) return null;
    
    // If there's only one item in the timeline and we're not already dragging within the timeline,
    // maintain the centered appearance by placing new items after the first item
    if (container === timelineContainer && 
        draggableElements.length === 1 && 
        draggedElement && 
        draggedElement.parentNode !== timelineContainer) {
      const firstItem = draggableElements[0];
      const box = firstItem.getBoundingClientRect();
      const midpoint = box.top + box.height / 2;
      
      // If we're dragging above the midpoint of the first item, place before it
      // Otherwise place after it
      if (y < midpoint) {
        return firstItem;
      } else {
        return null;
      }
    }
    
    // Give a stronger bias toward inserting after rather than before items on mobile
    // This helps make the touch interaction feel more natural
    const offsetBias = isMobile ? 10 : 0;
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      // Add a stronger bias for mobile
      const offset = y - box.top - box.height / 2 + offsetBias;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  
  // Check if the timeline is empty and update the class accordingly
  function checkEmpty() {
    if (timelineContainer.querySelectorAll('.item').length === 0) {
      timelineContainer.classList.add('empty');
      placedFirstEvent = false;
    } else {
      timelineContainer.classList.remove('empty');
    }
  }
  
  // Start a new game
  function startNewGame() {
    // Clear previous game
    sourceContainer.innerHTML = '';
    timelineContainer.innerHTML = '';
    resultDisplay.textContent = '';
    resultDisplay.className = '';
    
    // Reset score and variables
    score = 0;
    updateScore();
    lastHoveredIndex = -1;
    draggedElement = null;
    isDraggingActive = false;
    stackedEvents = [];
    
    // Select game mode (no need to update instruction text since it's removed)
    currentMode = {
      name: 'Stack Game',
      displayFormat: (event) => event.fullText
    };
    
    // Add first event to the timeline container (the earliest one)
    const firstEvent = sortedEvents[0];
    const firstEventElement = document.createElement('div');
    firstEventElement.className = 'item placed'; // Already placed and confirmed
    firstEventElement.innerHTML = firstEvent.fullText; // Display with HTML for bold year
    firstEventElement.draggable = true;
    firstEventElement.dataset.year = firstEvent.year;
    firstEventElement.dataset.fullText = firstEvent.fullText;
    firstEventElement.dataset.color = firstEvent.color;
    firstEventElement.style.backgroundColor = firstEvent.color;
    
    // Create a wrapper div for vertical centering (when only one item is present)
    const timelineWrapper = document.createElement('div');
    timelineWrapper.className = 'timeline-centering-wrapper';
    timelineWrapper.appendChild(firstEventElement);
    timelineContainer.appendChild(timelineWrapper);
    
    // Add remaining events to stack in reverse order (so oldest is picked first)
    remainingEvents = [...historicalEvents]
      .filter(event => event.year !== firstEvent.year)
      .sort((a, b) => a.year - b.year);
    
    // Store all remaining events except the top one in stackedEvents
    stackedEvents = remainingEvents.slice(0, remainingEvents.length - 1);
    
    // Create the visible top stack item
    if (remainingEvents.length > 0) {
      const topEvent = remainingEvents[remainingEvents.length - 1];
      const topItemElement = document.createElement('div');
      topItemElement.className = 'item top-of-stack';
      topItemElement.textContent = topEvent.event; // Only show event text, not year
      topItemElement.draggable = true;
      topItemElement.dataset.year = topEvent.year;
      topItemElement.dataset.fullText = topEvent.fullText;
      topItemElement.dataset.color = topEvent.color;
      topItemElement.style.backgroundColor = topEvent.color;
      sourceContainer.appendChild(topItemElement);
      
      // Show stack count
      updateStackCount();
    }
    
    // Make sure timeline doesn't show empty message
    timelineContainer.classList.remove('empty');
    placedFirstEvent = true;
    
    // Initialize drag and drop
    initDragAndDrop();
  }
  
  // Update the stack count indicator
  function updateStackCount() {
    const count = stackedEvents.length + (sourceContainer.querySelectorAll('.item').length);
    if (document.getElementById('stack-count')) {
      document.getElementById('stack-count').textContent = count;
    }
  }
  
  // Fisher-Yates shuffle algorithm
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Check if all events have been placed and show the share button if needed
  function checkGameCompletion() {
    // Count items in the timeline
    const placedItems = timelineContainer.querySelectorAll('.item.placed');
    const unplacedItems = timelineContainer.querySelectorAll('.timeline-item').length;
    
    // If all events have been placed (all historical events minus any unplaced items)
    if (placedItems.length === historicalEvents.length && unplacedItems === 0) {
      // Game is complete - show share button
      showShareButton();
      
      // Also display a success message
      showFeedback('Timeline complete! Great job!', 'correct');
    }
  }
  
  // Show the share button and set up its functionality
  function showShareButton() {
    // Make share button visible
    shareContainer.classList.remove('hidden');
    
    // Add click event listener
    shareButton.addEventListener('click', shareScore);
  }
  
  // Share score via the Web Share API if available
  function shareScore() {
    const shareText = `I scored ${score} points in the Historical Timeline Game! Can you beat my score?`;
    const shareUrl = window.location.href;
    
    // Check if the Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'Historical Timeline Game',
        text: shareText,
        url: shareUrl,
      })
      .then(() => console.log('Share successful'))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for devices that don't support the Web Share API
      // Create a shareable link with the text pre-filled
      const encodedText = encodeURIComponent(shareText);
      const fallbackUrl = `sms:?&body=${encodedText} ${encodeURIComponent(shareUrl)}`;
      
      // Open in a new tab/window
      window.open(fallbackUrl, '_blank');
    }
  }
  
  // Move item to its correct position in the timeline
  function moveItemToCorrectPosition(item, timelineItems) {
    debugLog("Moving item to correct position");
    
    const yearToCheck = parseInt(item.dataset.year);
    
    // Sort items by year, excluding the item we're moving
    const sortedItems = [...timelineItems].filter(i => i !== item)
      .sort((a, b) => parseInt(a.dataset.year) - parseInt(b.dataset.year));
    
    // Find the correct position for this item based on its year
    let targetPosition = null;
    let insertAfterElement = null;
    
    for (let i = 0; i < sortedItems.length; i++) {
      if (parseInt(sortedItems[i].dataset.year) > yearToCheck) {
        // This will be the insertion point - place before this item
        targetPosition = sortedItems[i];
        break;
      }
      insertAfterElement = sortedItems[i];
    }
    
    // Prepare the item for animation
    item.style.transition = 'transform 0.8s ease-out, opacity 0.2s';
    item.style.position = 'relative';
    item.style.zIndex = '100';
    
    // First fade out the item
    item.style.opacity = '0.2';
    
    // After a short delay, move the item to the correct position
    setTimeout(() => {
      // Remove from current position
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
      
      // Insert at the correct position
      if (targetPosition) {
        timelineContainer.insertBefore(item, targetPosition);
      } else if (insertAfterElement) {
        // If no target position but we have an insert after element, place after it
        if (insertAfterElement.nextSibling) {
          timelineContainer.insertBefore(item, insertAfterElement.nextSibling);
        } else {
          timelineContainer.appendChild(item);
        }
      } else {
        // If timeline is empty or no valid position found, just append
        timelineContainer.appendChild(item);
      }
      
      // Show a highlight effect at the new position
      item.style.opacity = '1';
      item.style.boxShadow = '0 0 15px 5px rgba(46, 204, 113, 0.6)';
      
      // Remove the highlight after animation
      setTimeout(() => {
        item.style.boxShadow = '';
        item.style.transition = '';
      }, 1000);
      
    }, 300);
  }
  
  // Call startNewGame directly when page loads instead of hooking up button events
  startNewGame();
}); 
