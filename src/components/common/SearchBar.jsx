import React from 'react';

const SearchBar = ({ 
  searchValue, 
  onSearchChange, 
  onSearch, 
  placeholder = "Enter search term",
  disabled = false 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="mb-4" style={{ display: 'flex', gap: '8px' }}>
      <input
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="input-field"
        placeholder={placeholder}
        style={{ flex: 1 }}
        disabled={disabled}
      />
      <button
        onClick={onSearch}
        className="btn btn-primary"
        disabled={disabled}
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;