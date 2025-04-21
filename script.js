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
  
  // Add orientation lock overlay
  const orientationLock = document.createElement('div');
  orientationLock.className = 'orientation-lock';
  
  const orientationIcon = document.createElement('div');
  orientationIcon.className = 'orientation-lock-icon';
  orientationIcon.innerHTML = '📱';
  
  const orientationMessage = document.createElement('div');
  orientationMessage.className = 'orientation-lock-message';
  orientationMessage.textContent = 'Please rotate your device to portrait mode to play the game';
  
  orientationLock.appendChild(orientationIcon);
  orientationLock.appendChild(orientationMessage);
  document.body.appendChild(orientationLock);
  
  // Set up intro screen
  continueButton.addEventListener('click', () => {
    introScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');
    
    // Show the tutorial animation after a short delay
    // Show it every time the game starts
    setTimeout(() => {
      showTutorialAnimation();
    }, 500);
  });
  
  // Function to show the finger swipe tutorial
  function showTutorialAnimation() {
    // Get the top stack item to position the finger directly on it
    const topStackItem = sourceContainer.querySelector('.top-of-stack');
    if (!topStackItem) return; // Exit if there's no stack item yet
    
    // Create the finger element
    const tutorialFinger = document.createElement('div');
    tutorialFinger.className = 'tutorial-finger';
    
    // Create the sparkle effect
    const tutorialSparkle = document.createElement('div');
    tutorialSparkle.className = 'tutorial-sparkle';
    
    // Add elements to the container
    const container = document.querySelector('.container');
    container.appendChild(tutorialFinger);
    container.appendChild(tutorialSparkle);
    
    // Position the finger at the center of the container, directly over the stack item
    tutorialFinger.style.left = '50%';
    tutorialFinger.style.transform = 'translateX(-50%)';
    
    // Highlight the stack item during the animation
    topStackItem.style.transition = 'box-shadow 0.3s ease-in-out';
    topStackItem.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.7)';
    
    // Remove tutorial elements after animation completes
    setTimeout(() => {
      if (tutorialFinger.parentNode) {
        tutorialFinger.parentNode.removeChild(tutorialFinger);
      }
      if (tutorialSparkle.parentNode) {
        tutorialSparkle.parentNode.removeChild(tutorialSparkle);
      }
      
      // Reset the stack item
      topStackItem.style.boxShadow = '';
      setTimeout(() => {
        topStackItem.style.transition = '';
      }, 300);
    }, 2500);
  }
  
  // Historical events game data
  const historicalEvents = [
    {
      year: 3068733,
      event: "BUNNY LAKE (47 WINS)",
      fullText: "<b>BUNNY LAKE (47 WINS) </b> - $3,068,733",
      color: "#FF5252" // Bright red
    },
    {
      year: 578338,
      event: "BAHAMA BUNNY (37 WINS)",
      fullText: "<b>BAHAMA BUNNY (37 WINS) </b> - $578,338",
      color: "#448AFF" // Bright blue
    },
    {
      year: 506027,
      event: "DAUNTLESS BUNNY (28 WINS)",
      fullText: "<b>DAUNTLESS BUNNY (28 WINS) </b> - $506,027",
      color: "#FF9800" // Bright orange
    },
    {
      year: 355720,
      event: "EXPLOSIVE BUNNY (48 WINS)",
      fullText: "<b>EXPLOSIVE BUNNY (48 WINS) </b> - $355,720",
      color: "#4CAF50" // Bright green
    },
    {
      year: 349500,
      event: "MIASBUNNY (18 WINS)",
      fullText: "<b>MIASBUNNY (18 WINS) </b> - $349,500",
      color: "#9C27B0" // Bright purple
    },
    {
      year: 315026,
      event: "BE THE BUNNY (29 WINS)",
      fullText: "<b>BE THE BUNNY (29 WINS) </b> - $315,026",
      color: "#00BCD4" // Bright cyan
    }
  ];
  
  // Sort events by year (descending order for earnings)
  const sortedEvents = [...historicalEvents].sort((a, b) => b.year - a.year);
  
  // Score and game state
  let score = 0;
  let correctAnswerCount = 0; // Track number of correct answers
  let currentMode;
  let touchY; // Track touch position
  let remainingEvents = [];
  let placedFirstEvent = false;
  let lastHoveredIndex = -1; // Track the last hovered index for smoother animations
  let draggedElement = null; // The currently dragged element
  let isDraggingActive = false; // Track if we're currently dragging
  let stackedEvents = []; // Track stacked events in source
  
  // Add a flag to prevent immediate tap after drag on mobile
  let recentlyDragged = false;
  let dragCooldownTimer = null;
  
  // Firebase Statistics Tracking Functions
  
  // Check if Firebase is loaded and available
  function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && firebase.app && firebase.database;
  }

  // Generate or retrieve a unique user ID
  function getUserId() {
    let userId = localStorage.getItem('racing_quiz_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('racing_quiz_user_id', userId);
    }
    return userId;
  }

  // Track when a game starts
  function trackGameStart() {
    try {
      if (!isFirebaseAvailable()) return;
      
      // Log event in Analytics
      firebase.analytics().logEvent('game_started');
      
      // Get or create a unique player ID
      const userId = getUserId();
      
      // Check if this is a new player
      const isNewPlayer = localStorage.getItem('racing_quiz_played') !== 'true';
      if (isNewPlayer) {
        localStorage.setItem('racing_quiz_played', 'true');
        
        // Increment unique player count
        firebase.database().ref('stats/unique_players').transaction(count => (count || 0) + 1);
      }
      
      // Increment total games started
      firebase.database().ref('stats/games_started').transaction(count => (count || 0) + 1);
      
      // Track this specific game session
      const sessionId = 'session_' + Date.now();
      localStorage.setItem('racing_quiz_session', sessionId);
      
      // Add to players online counter
      const playerRef = firebase.database().ref(`online/${userId}`);
      playerRef.set(true);
      playerRef.onDisconnect().remove();
      
      debugLog("Game start tracked successfully");
    } catch (error) {
      console.error("Error tracking game start:", error);
      // Continue without tracking
    }
  }

  // Track when a player places an item
  function trackPlacement(isCorrect, year) {
    try {
      if (!isFirebaseAvailable()) return;
      
      // Log event in Analytics
      firebase.analytics().logEvent('item_placement', {
        correct: isCorrect,
        year: year
      });
      
      // Track placement stats
      if (isCorrect) {
        firebase.database().ref(`stats/placements/${year}/correct`).transaction(count => (count || 0) + 1);
      } else {
        firebase.database().ref(`stats/placements/${year}/incorrect`).transaction(count => (count || 0) + 1);
      }
      
      debugLog(`Placement tracked: year=${year}, correct=${isCorrect}`);
    } catch (error) {
      console.error("Error tracking placement:", error);
      // Continue without tracking
    }
  }

  // Track when a game completes
  function trackGameComplete(finalScore, isPerfectScore) {
    try {
      if (!isFirebaseAvailable()) return;
      
      // Log event in Analytics
      firebase.analytics().logEvent('game_completed', {
        score: finalScore,
        perfect_score: isPerfectScore
      });
      
      // Get today's date in YYYY-MM-DD format for tracking
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Increment games completed counter
      firebase.database().ref('stats/games_completed').transaction(count => (count || 0) + 1);
      
      // Track perfect scores
      if (isPerfectScore) {
        firebase.database().ref('stats/perfect_scores').transaction(count => (count || 0) + 1);
      }
      
      // Add to score distribution
      const scoreKey = Math.floor(finalScore / 100) * 100; // Group scores by hundreds
      firebase.database().ref(`stats/score_distribution/${scoreKey}`).transaction(count => (count || 0) + 1);
      
      // Track total score for average calculation
      firebase.database().ref('stats/total_score').transaction(total => (total || 0) + finalScore);
      
      // Track completion by date
      firebase.database().ref(`stats/completions_by_date/${dateString}`).transaction(count => (count || 0) + 1);
      
      // Get user ID
      const userId = getUserId();
      
      // Create timestamp for when the game was played
      const timestamp = Date.now();
      
      // Update user data with timestamp, perfect score flag, and high score
      firebase.database().ref(`users/${userId}`).update({
        last_played: timestamp,
        perfect_score: isPerfectScore,
        high_score: finalScore,
        games_completed: firebase.database.ServerValue.increment(1)
      });
      
      // Track completion by unique player
      // This transaction is now redundant with the update above, but keeping for backward compatibility
      firebase.database().ref(`users/${userId}/games_completed`).transaction(count => (count || 0) + 1);
      
      // Get all users who have completed at least one game
      firebase.database().ref('users').once('value', snapshot => {
        if (!snapshot.exists()) return;
        
        let uniqueCompletions = 0;
        snapshot.forEach(childSnapshot => {
          if (childSnapshot.hasChild('games_completed') && childSnapshot.child('games_completed').val() > 0) {
            uniqueCompletions++;
          }
        });
        
        // Update unique completions count
        firebase.database().ref('stats/unique_completions').set(uniqueCompletions);
      });
      
      debugLog(`Game completion tracked: score=${finalScore}, perfect=${isPerfectScore}, date=${dateString}, timestamp=${timestamp}`);
    } catch (error) {
      console.error("Error tracking game completion:", error);
      // Continue without tracking
    }
  }
  
  // Add function to adjust timeline height based on item count
  function adjustTimelineHeight() {
    const timelineItems = timelineContainer.querySelectorAll('.item');
    
    if (timelineItems.length >= 3) {
      // Add expanded class for 3+ items
      timelineContainer.classList.add('expanded-timeline');
      
      // Set inline styles for immediate effect
      timelineContainer.style.paddingTop = '10%';
      timelineContainer.style.paddingBottom = '10%';
    } else {
      // Remove expanded class when fewer than 3 items
      timelineContainer.classList.remove('expanded-timeline');
      timelineContainer.style.paddingTop = '';
      timelineContainer.style.paddingBottom = '';
    }
  }
  
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
        
        // Ensure the timeline-item class is maintained during reordering
        if (!draggable.classList.contains('timeline-item') && !draggable.classList.contains('placed')) {
          draggable.classList.add('timeline-item');
          addTapToPlaceButton(draggable);
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
      
      // Adjust timeline height based on number of items
      adjustTimelineHeight();
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

  // Add TAP TO PLACE button to a timeline item
  function addTapToPlaceButton(item) {
    // If the item already has a tap button, don't add another one
    if (item.querySelector('.tap-button')) {
      return;
    }
    
    // Make the entire item clickable
    item.classList.add('tappable');
    
    // Create the TAP TO PLACE text/button
    const tapButton = document.createElement('div');
    tapButton.className = 'tap-button';
    tapButton.textContent = 'TAP TO PLACE';
    
    // Add to item
    item.appendChild(tapButton);
    
    // Remove any existing event listeners to prevent duplicates
    item.removeEventListener('click', handleItemPlacement);
    
    // Add click event for desktop
    item.addEventListener('click', handleItemPlacement);
    
    // For mobile, add a dedicated tap handler to the button itself for more reliable tapping
    tapButton.addEventListener('touchstart', function(e) {
      // Prevent this touchstart from triggering drag
      e.stopPropagation();
    }, { passive: false });
    
    tapButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Only process if parent item is in the timeline and has the tappable class
      if (item.classList.contains('tappable')) {
        // Add visual feedback
        item.style.transform = 'scale(0.98)';
        
        // Small delay for visual feedback
        setTimeout(() => {
          item.style.transform = '';
          finalizeItemPlacement(item);
        }, 100);
      }
    });
  }
  
  // Separate handler for click events
  function handleItemPlacement(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Skip if we recently finished dragging (prevents accidental taps)
    if (recentlyDragged) {
      debugLog("Ignoring click - recent drag detected");
      return;
    }
    
    // Only process if the item is in the timeline and has the tappable class
    if (this.classList.contains('tappable')) {
      // Add visual feedback
      this.style.transform = 'scale(0.98)';
      
      // Small delay for visual feedback
      setTimeout(() => {
        this.style.transform = '';
        finalizeItemPlacement(this);
      }, 100);
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
        isCorrect = yearToCheck > nextItemYear;
      } else if (placedIndex === timelineItems.length - 1) {
        // If it's at the end, check if it's after the previous item
        const prevItemYear = parseInt(timelineItems[placedIndex - 1].dataset.year);
        isCorrect = yearToCheck < prevItemYear;
      } else {
        // If it's in the middle, check both sides
        const prevItemYear = parseInt(timelineItems[placedIndex - 1].dataset.year);
        const nextItemYear = parseInt(timelineItems[placedIndex + 1].dataset.year);
        isCorrect = yearToCheck < prevItemYear && yearToCheck > nextItemYear;
      }
    }
    
    debugLog("Placement correct? " + isCorrect);
    
    // Remove the timeline-item class which enabled the tap button
    item.classList.remove('timeline-item');
    
    // Remove the tappable class to disable clicking
    item.classList.remove('tappable');
    
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
      // Calculate progressive points based on number of correct answers
      correctAnswerCount++;
      
      // Calculate points with the simplified system
      let pointsEarned = 0;
      
      switch(correctAnswerCount) {
        case 1:
          pointsEarned = 50;
          break;
        case 2:
          pointsEarned = 100;
          break;
        case 3:
          pointsEarned = 200;
          break;
        case 4:
          pointsEarned = 300;
          break;
        case 5:
        default:
          pointsEarned = 400;
          break;
      }
      
      score += pointsEarned;
      updateScore();
      updateScoringExplanation(); // Update scoring explanation for next piece
      debugLog(`Showing correct feedback: +${pointsEarned} points`);
      
      // Track correct placement for statistics
      trackPlacement(true, yearToCheck);
      
      // Safari-friendly way of showing feedback
      showFeedback(`Correct! +${pointsEarned} points`, 'correct');
      
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
      
      // Track incorrect placement for statistics
      trackPlacement(false, yearToCheck);
      
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
    
    // Adjust timeline height after finalizing placement
    adjustTimelineHeight();
    
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

  // Update the scoring explanation based on current correct answer count
  function updateScoringExplanation() {
    const scoringExplanation = document.getElementById('scoring-explanation');
    if (!scoringExplanation) return;
    
    let pointsWorth = 0;
    
    // Calculate what the NEXT correct answer will be worth
    // This matches the simplified scoring system
    switch(correctAnswerCount) {
      case 0:
        pointsWorth = 50; // First answer
        break;
      case 1:
        pointsWorth = 100; // Second answer
        break;
      case 2:
        pointsWorth = 200; // Third answer
        break;
      case 3:
        pointsWorth = 300; // Fourth answer
        break;
      case 4:
      default:
        pointsWorth = 400; // Fifth answer and beyond
        break;
    }
    
    scoringExplanation.textContent = `Correct answer is worth ${pointsWorth} points`;
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
    
    // Adjust timeline height after removal
    adjustTimelineHeight();
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
  
  // Move item to its correct position in the timeline
  function moveItemToCorrectPosition(item, timelineItems) {
    debugLog("Moving item to correct position");
    
    const yearToCheck = parseInt(item.dataset.year);
    
    // Sort items by year, excluding the item we're moving
    const sortedItems = [...timelineItems].filter(i => i !== item)
      .sort((a, b) => parseInt(b.dataset.year) - parseInt(a.dataset.year));
    
    // Find the correct position for this item based on its year
    let targetPosition = null;
    let insertAfterElement = null;
    
    for (let i = 0; i < sortedItems.length; i++) {
      if (parseInt(sortedItems[i].dataset.year) < yearToCheck) {
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

  // Touch event handlers for mobile
  function handleTouchStart(e) {
    e.preventDefault();
    
    // Only handle touch events if this isn't a placed item
    if (this.classList.contains('placed')) return;
    
    // Set recently dragged flag to true
    recentlyDragged = true;
    
    // Clear any existing cooldown timer
    if (dragCooldownTimer) {
      clearTimeout(dragCooldownTimer);
      dragCooldownTimer = null;
    }
    
    const touch = e.touches[0];
    touchY = touch.clientY;
    
    // Track initial touch position to determine if this is a drag or tap
    this.dataset.touchStartX = touch.clientX;
    this.dataset.touchStartY = touch.clientY;
    
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
    if (!touch) {
      // Clean up and return if no touch data
      draggedElement.classList.remove('dragging');
      draggedElement.style.opacity = '1';
      draggedElement = null;
      isDraggingActive = false;
      return;
    }
    
    const currentY = touch.clientY;
    
    // Store the dragged element in a variable to use later
    const draggedItem = draggedElement;
    
    // Check if this was a tap rather than a drag
    const startX = parseFloat(draggedItem.dataset.touchStartX || 0);
    const startY = parseFloat(draggedItem.dataset.touchStartY || 0);
    const moveDistance = Math.sqrt(
      Math.pow(touch.clientX - startX, 2) + 
      Math.pow(touch.clientY - startY, 2)
    );
    
    // If moved less than 10px, this was likely intended as a tap
    const wasTap = moveDistance < 10;
    
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
        
        // If this was actually a tap, and we just moved to timeline, immediately place it
        if (wasTap) {
          debugLog("Detected tap during move to timeline, processing immediate placement");
          // Wait a moment for DOM updates to settle
          setTimeout(() => {
            // Verify item is still valid before placement
            if (draggedItem && draggedItem.parentNode === timelineContainer && draggedItem.classList.contains('tappable')) {
              finalizeItemPlacement(draggedItem);
            }
          }, 50);
        }
      } else if (draggedElement.parentNode === timelineContainer) {
        // Reordering within timeline
        if (afterElement && afterElement !== draggedElement) {
          timelineContainer.insertBefore(draggedElement, afterElement);
        } else if (!afterElement) {
          timelineContainer.appendChild(draggedElement);
        }
        
        // Maintain the timeline-item class and ensure tap to place button exists
        if (!draggedElement.classList.contains('placed')) {
          if (!draggedElement.classList.contains('timeline-item')) {
            draggedElement.classList.add('timeline-item');
          }
          
          // Make sure the tap button exists
          if (!draggedElement.querySelector('.tap-button')) {
            addTapToPlaceButton(draggedElement);
          }
          
          // If this was a tap rather than a drag, process placement immediately
          if (wasTap) {
            debugLog("Detected tap during reorder, processing immediate placement");
            // Wait a moment for DOM updates to settle
            setTimeout(() => {
              // Verify item is still valid before placement
              if (draggedItem && draggedItem.parentNode === timelineContainer && draggedItem.classList.contains('tappable')) {
                finalizeItemPlacement(draggedItem);
              }
            }, 50);
          }
        }
      }
      
      // Adjust timeline height based on new item count
      adjustTimelineHeight();
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
    
    // Important: Manually check all items in timeline to ensure they have needed classes
    // This is critical for mobile since touch events can behave differently
    setTimeout(() => {
      const timelineItems = timelineContainer.querySelectorAll('.item:not(.placed)');
      timelineItems.forEach(item => {
        if (!item.classList.contains('placed')) {
          item.classList.add('timeline-item');
          if (!item.querySelector('.tap-button')) {
            addTapToPlaceButton(item);
          }
        }
      });
    }, 50);
    
    // If this wasn't a tap, set the cooldown timer
    if (!wasTap) {
      // Set a timer to re-enable tap to place after a cooldown period
      if (dragCooldownTimer) {
        clearTimeout(dragCooldownTimer);
      }
      
      // Store reference to the dragged item for highlighting after cooldown
      const draggedItemRef = draggedItem;
      
      // Shorter cooldown for better responsiveness on mobile
      dragCooldownTimer = setTimeout(() => {
        recentlyDragged = false;
        dragCooldownTimer = null;
        
        // Add visual hint that the item is now tappable
        if (draggedItemRef && 
            draggedItemRef.parentNode === timelineContainer && 
            !draggedItemRef.classList.contains('placed')) {
          // Flash the tap button to draw attention
          const tapButton = draggedItemRef.querySelector('.tap-button');
          if (tapButton) {
            tapButton.classList.add('tap-highlight');
            setTimeout(() => {
              if (tapButton.parentNode) {
                tapButton.classList.remove('tap-highlight');
              }
            }, 600);
          }
        }
      }, 300); // Reduced cooldown from 500ms to 300ms for better responsiveness
    } else {
      // If it was a tap, we don't need the cooldown
      recentlyDragged = false;
      if (dragCooldownTimer) {
        clearTimeout(dragCooldownTimer);
        dragCooldownTimer = null;
      }
    }
    
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
    // Call our new initGame function that shuffles the game pieces
    initGame();
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
      
      // Replace Event Stack with Final Score display
      displayFinalScore();
    }
  }
  
  // Replace the Event Stack with Final Score display
  function displayFinalScore() {
    // Check if player got a perfect score (all items placed correctly)
    const isPerfectScore = correctAnswerCount === historicalEvents.length - 1;
    
    // Track game completion for statistics
    trackGameComplete(score, isPerfectScore);
    
    // Hide the regular score display
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) {
      scoreContainer.style.display = 'none';
    }
    
    // Clear the source container (Driver Stack)
    sourceContainer.innerHTML = '';
    
    // Hide or remove the area labels
    const sourceLabel = document.querySelector('label[for="source-container"]');
    if (sourceLabel) {
      sourceLabel.style.display = 'none';
    }
    
    const timelineLabel = document.querySelector('label[for="timeline-container"]');
    if (timelineLabel) {
      timelineLabel.style.display = 'none';
    }
    
    // Create final score display
    const finalScoreDisplay = document.createElement('div');
    finalScoreDisplay.className = 'final-score-display';
    
    const finalScoreTitle = document.createElement('h2');
    finalScoreTitle.textContent = isPerfectScore ? 'PERFECT SCORE' : 'FINAL SCORE';
    finalScoreTitle.className = 'final-score-title';
    
    const finalScoreValue = document.createElement('div');
    finalScoreValue.textContent = score;
    finalScoreValue.className = 'final-score-value';
    
    // Assemble the final score display (without trophy icon)
    finalScoreDisplay.appendChild(finalScoreTitle);
    finalScoreDisplay.appendChild(finalScoreValue);
    
    // Move the share button into the final score display
    if (shareContainer) {
      // Hide the original share container
      shareContainer.classList.add('hidden');
      
      // Create a new share button element
      const newShareButton = document.createElement('button');
      newShareButton.id = 'final-share-button';
      newShareButton.className = 'share-button';
      newShareButton.textContent = 'Share Your Score';
      
      // Add to final score display
      finalScoreDisplay.appendChild(newShareButton);
      
      // Add click event listener to the new button
      newShareButton.addEventListener('click', shareScore);
    }
    
    // Add to the source container
    sourceContainer.appendChild(finalScoreDisplay);
    
    // Add a score glow effect for emphasis
    setTimeout(() => {
      finalScoreValue.classList.add('score-glow');
    }, 300);
  }
  
  // Show the share button and set up its functionality
  function showShareButton() {
    // Check if we're showing the final score (if so, don't show the original share button)
    const finalShare = document.getElementById('final-share-button');
    if (finalShare) {
      return;
    }
    
    // Make share button visible
    shareContainer.classList.remove('hidden');
    
    // Add click event listener
    shareButton.addEventListener('click', shareScore);
  }
  
  // Share score via the Web Share API if available
  function shareScore() {
    // Check if player got a perfect score
    const isPerfectScore = correctAnswerCount === historicalEvents.length - 1;
    
    // Different text based on whether score is perfect or not
    const shareText = isPerfectScore
      ? "I got a perfect score in the Racing Quiz game! How will you do?"
      : `I scored ${score} points in the Racing Quiz Game! Can you beat my score?`;
    
    const shareUrl = window.location.href;
    
    // Check if the Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'Racing Quiz Game',
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
  
  // Initialize game
  function initGame() {
    // Track game start for statistics
    trackGameStart();
    
    // Define updateScore function if it doesn't exist
    if (typeof updateScore !== 'function') {
      // Update score display
      window.updateScore = function() {
        scoreDisplay.textContent = score;
        
        // Add glowing effect when score increases
        scoreDisplay.classList.add('score-glow');
        
        // Remove the glow effect after animation completes
        setTimeout(() => {
          scoreDisplay.classList.remove('score-glow');
        }, 1000);
      };
    }
    
    // Define updateScoringExplanation function if it doesn't exist
    if (typeof updateScoringExplanation !== 'function') {
      // Update the scoring explanation based on current correct answer count
      window.updateScoringExplanation = function() {
        const scoringExplanation = document.getElementById('scoring-explanation');
        if (!scoringExplanation) return;
        
        let pointsWorth = 0;
        
        // Calculate what the NEXT correct answer will be worth
        // This matches the simplified scoring system
        switch(correctAnswerCount) {
          case 0:
            pointsWorth = 50; // First answer
            break;
          case 1:
            pointsWorth = 100; // Second answer
            break;
          case 2:
            pointsWorth = 200; // Third answer
            break;
          case 3:
            pointsWorth = 300; // Fourth answer
            break;
          case 4:
          default:
            pointsWorth = 400; // Fifth answer and beyond
            break;
        }
        
        scoringExplanation.textContent = `Correct answer is worth ${pointsWorth} points`;
      };
    }
    
    // Shuffle the historical events to randomize the order
    shuffleArray(historicalEvents);
    
    // Reset score and variables
    score = 0;
    correctAnswerCount = 0; // Reset correct answer counter
    updateScore();
    updateScoringExplanation(); // Initialize scoring explanation
    sourceContainer.innerHTML = '';
    timelineContainer.innerHTML = '';
    resultDisplay.textContent = '';
    resultDisplay.className = '';
    lastHoveredIndex = -1;
    draggedElement = null;
    isDraggingActive = false;
    stackedEvents = [];
    recentlyDragged = false; // Reset drag cooldown flag
    
    // Make sure timeline is at default height
    timelineContainer.classList.remove('expanded-timeline');
    timelineContainer.style.paddingTop = '';
    timelineContainer.style.paddingBottom = '';
    
    // Select game mode
    currentMode = {
      name: 'Stack Game',
      displayFormat: (event) => event.fullText
    };
    
    // Create items for each event
    const shuffledEvents = [...historicalEvents];
    
    // Take the first event from the shuffled array for the timeline starting point
    const firstEvent = shuffledEvents.shift();
    
    // Add first event to the timeline container
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
    
    // Add remaining events to stack
    remainingEvents = shuffledEvents;
    
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
      // Apply background color while preserving gradient
      topItemElement.style.backgroundColor = topEvent.color;
      sourceContainer.appendChild(topItemElement);
      
      // Show stack count
      updateStackCount();
    }
    
    // Make sure timeline doesn't show empty message
    timelineContainer.classList.remove('empty');
    placedFirstEvent = true;
    
    // Initialize drag and drop functionality
    initDragAndDrop();
  }
  
  // Fisher-Yates shuffle algorithm to randomize array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      // Generate random index
      const j = Math.floor(Math.random() * (i + 1));
      // Swap elements
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Call startNewGame directly when page loads instead of hooking up button events
  startNewGame();
}); 
