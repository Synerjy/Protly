import { useState } from 'react';

const ORGANISMS = [
  { label: 'Any Organism', value: '' },
  { label: 'Human', value: 'human' },
  { label: 'Mouse', value: 'mouse' },
  { label: 'E. Coli', value: 'ecoli' },
];

export default function SearchPanel({
  searchQuery,
  setSearchQuery,
  onSearch,
  filters,
  setFilters,
  totalResults,
  hasSearched,
}) {
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleReviewedToggle = () => {
    setFilters((prev) => ({ ...prev, reviewed: !prev.reviewed }));
  };

  const handleOrganismChange = (value) => {
    setFilters((prev) => ({ ...prev, organism: value }));
  };

  const handleLengthChange = (e) => {
    setFilters((prev) => ({ ...prev, lengthMax: parseInt(e.target.value, 10) }));
  };

  return (
    <div className="search-panel" id="search-panel">
      {/* Hero heading */}
      {!hasSearched && (
        <div className="search-panel__hero">
          <h1 className="search-panel__title">Discover Proteins</h1>
          <p className="search-panel__subtitle">
            Search by protein name, gene name, or UniProt accession ID
          </p>
        </div>
      )}

      {/* Big search bar */}
      <div className={`search-panel__bar${focused ? ' search-panel__bar--focused' : ''}`}>
        <div className="search-panel__bar-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          className="search-panel__input"
          placeholder="Search proteins, genes, or UniProt IDs…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          id="discovery-search-input"
        />
        {searchQuery && (
          <button className="search-panel__clear" onClick={() => setSearchQuery('')} title="Clear">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <button
          className="search-panel__submit"
          onClick={handleSearchClick}
          disabled={!searchQuery.trim()}
          id="discovery-search-btn"
        >
          Search
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* Filter chips row */}
      <div className="search-panel__filters">
        {/* Reviewed toggle chip */}
        <button
          className={`search-panel__chip${filters.reviewed ? ' search-panel__chip--active' : ''}`}
          onClick={handleReviewedToggle}
          id="filter-reviewed-chip"
          title={filters.reviewed ? 'Showing reviewed (Swiss-Prot) only' : 'Showing all entries'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Reviewed (Swiss-Prot)
        </button>

        {/* Organism chips */}
        <div className="search-panel__divider" />
        {ORGANISMS.map((o) => (
          <button
            key={o.value}
            className={`search-panel__chip${filters.organism === o.value ? ' search-panel__chip--active' : ''}`}
            onClick={() => handleOrganismChange(o.value)}
            id={`filter-organism-${o.value || 'any'}`}
          >
            {o.value === 'human' && '🧬'}
            {o.value === 'mouse' && '🐭'}
            {o.value === 'ecoli' && '🦠'}
            {o.value === '' && '🌐'} {o.label}
          </button>
        ))}

        {/* Length slider */}
        <div className="search-panel__divider" />
        <div className="search-panel__length-filter">
          <label className="search-panel__length-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Max Length
          </label>
          <input
            type="range"
            className="search-panel__range"
            min={50}
            max={2000}
            step={50}
            value={filters.lengthMax}
            onChange={handleLengthChange}
            id="filter-length-range"
          />
          <span className="search-panel__length-value">{filters.lengthMax} AA</span>
        </div>
      </div>

      {/* Result summary line */}
      {hasSearched && totalResults > 0 && (
        <div className="search-panel__result-summary">
          Found <strong>{totalResults.toLocaleString()}</strong> proteins matching "
          <strong>{searchQuery}</strong>"
        </div>
      )}
    </div>
  );
}
