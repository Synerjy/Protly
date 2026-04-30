
export default function TopBar({
  onSearch,
  searchQuery,
  setSearchQuery,
  view,
  onBackToSearch,
}) {
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

  return (
    <header className="topbar">
      <div className="topbar__left">
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', letterSpacing: -0.5 }}>
          Protly<span style={{ color: 'var(--accent)' }}>.</span>
        </span>

        <nav className="topbar__nav">
          <a
            href="#"
            className={`topbar__nav-link${view === 'dashboard' ? ' topbar__nav-link--active' : ''}`}
          >
            <span style={{ marginRight: 6 }}>🏠</span>
            Dashboard
          </a>
          {(view === 'discovery' || view === 'analysis') && (
            <span className="topbar__nav-link topbar__nav-link--active">
              <span style={{ marginRight: 6 }}>🔍</span>
              Discovery
            </span>
          )}
        </nav>
      </div>

      <div className="topbar__right">
        {view === 'analysis' && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={onBackToSearch}
            id="back-to-results-btn"
          >
            ← Back to Results
          </button>
        )}

        {/* Only show the compact search bar outside of discovery view */}
        {view !== 'discovery' && (
          <div className="topbar__search">
            <span
              className="topbar__search-icon"
              onClick={handleSearchClick}
              style={{ cursor: 'pointer' }}
            >
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search proteins…"
              id="global-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button
                className="topbar__search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
