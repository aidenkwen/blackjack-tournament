import React, { useEffect, useRef, useState, useCallback } from 'react';

const SearchBar = ({ 
  searchValue, 
  onSearchChange, 
  onSearch, 
  placeholder = "Enter search term or swipe card",
  disabled = false,
  onCardSwipe = null // New callback for card swipe events
}) => {
  const inputRef = useRef(null);
  const [cardBuffer, setCardBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  
  // Card reader detection settings
  const CARD_LENGTH = 14;
  const MAX_TIME_BETWEEN_CHARS = 50; // milliseconds
  const MIN_SWIPE_SPEED = 10; // characters per 100ms

  // *** FIX: Create a safe search wrapper ***
  const safeOnSearch = useCallback(() => {
    // Ensure searchValue is always a string before calling onSearch
    const currentValue = String(searchValue || '');
    if (currentValue.trim() && onSearch) {
      onSearch();
    }
  }, [searchValue, onSearch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only process if the input is focused
      if (document.activeElement !== inputRef.current) return;
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      
      // If too much time has passed, reset the buffer (manual typing)
      if (timeDiff > MAX_TIME_BETWEEN_CHARS && cardBuffer.length > 0) {
        setCardBuffer('');
      }
      
      setLastKeyTime(currentTime);
      
      // Only capture numeric input for card detection
      if (/^\d$/.test(e.key)) {
        const newBuffer = cardBuffer + e.key;
        setCardBuffer(newBuffer);
        
        // Check if we have a complete card number
        if (newBuffer.length === CARD_LENGTH) {
          // Verify it was entered quickly enough to be a swipe
          const avgTimePerChar = timeDiff / newBuffer.length;
          
          if (avgTimePerChar < MIN_SWIPE_SPEED) {
            // This looks like a card swipe
            e.preventDefault(); // Prevent the last digit from appearing in input
            
            if (onCardSwipe) {
              onCardSwipe(newBuffer);
            } else {
              // Default behavior: set as search value and trigger search
              if (onSearchChange) {
                onSearchChange(newBuffer);
              }
              setTimeout(() => safeOnSearch(), 100); // Use safe search wrapper
            }
          }
          
          setCardBuffer(''); // Reset buffer
        }
      } else if (e.key === 'Enter') {
        // Handle manual enter key
        setCardBuffer('');
        safeOnSearch(); // Use safe search wrapper
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Reset card buffer on deletion
        setCardBuffer('');
      }
    };

    // Add event listener when component mounts
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cardBuffer, lastKeyTime, onCardSwipe, onSearchChange, safeOnSearch]); // Updated dependencies

  const handleInputChange = (e) => {
    // Reset card buffer when manually typing
    setCardBuffer('');
    // *** FIX: Add safety check for onSearchChange ***
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleSearchClick = () => {
    safeOnSearch();
  };

  return (
    <div className="mb-4" style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          type="text"
          value={searchValue || ''} // *** FIX: Ensure value is always a string ***
          onChange={handleInputChange}
          className="input-field"
          placeholder={placeholder}
          style={{ flex: 1 }}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          onClick={handleSearchClick} // Use safe search wrapper
          className="btn btn-primary"
          disabled={disabled}
        >
          Search
        </button>
      </div>
      
      {/* Optional: Visual indicator for card reader status */}
      {cardBuffer.length > 0 && (
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          fontStyle: 'italic',
          marginTop: '4px' 
        }}>
          Card reading... ({cardBuffer.length}/{CARD_LENGTH} digits)
        </div>
      )}
    </div>
  );
};

export default SearchBar;