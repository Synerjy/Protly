export default function TopBar({ onSearch, searchQuery, setSearchQuery, view, onBackToSearch }) {
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
        <header className="topbar" role="banner">
            <div className="topbar__left">
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', letterSpacing: -0.5 }}>
                    Protly<span style={{ color: 'var(--accent)' }}>.</span>
                </span>

                <nav className="topbar__nav" aria-label="Top navigation">
                    <a href="#" className={`topbar__nav-link${view === 'dashboard' ? ' topbar__nav-link--active' : ''}`} aria-current={view === 'dashboard' ? 'page' : undefined}>
                        <span style={{ marginRight: 6 }} aria-hidden="true">🏠</span>
                        Dashboard
                    </a>
                    {(view === 'discovery' || view === 'analysis') && (
                        <span className="topbar__nav-link topbar__nav-link--active" aria-current="page">
                            <span style={{ marginRight: 6 }} aria-hidden="true">🔍</span>
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
                        aria-label="Back to search results"
                    >
                        ← Back to Results
                    </button>
                )}

                {/* Only show the compact search bar outside of discovery view */}
                {view !== 'discovery' && (
                    <div className="topbar__search" role="search" aria-label="Quick protein search">
                        <span className="topbar__search-icon" onClick={handleSearchClick} style={{ cursor: 'pointer' }} role="button" aria-label="Submit search" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleSearchClick(); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        </span>
                        <input
                            type="search"
                            placeholder="Search proteins…"
                            id="global-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            aria-label="Search proteins by name, gene, or accession"
                        />
                        {searchQuery && (
                            <button
                                className="topbar__search-clear"
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                                aria-label="Clear search query"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                <div className="sidebar__avatar" style={{ width: 34, height: 34, fontSize: 12 }} title="Profile" role="img" aria-label="User profile avatar">
                    R
                </div>
            </div>
        </header>
    );
}
