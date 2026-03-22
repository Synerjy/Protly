import { useState, useRef, useEffect } from 'react';

export default function TopBar({
  onSearch,
  searchQuery,
  setSearchQuery,
  view,
  onBackToSearch,
  user,
  onSignOut,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

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

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
          <a href="#" className="topbar__nav-link">
            Schedule
          </a>
          <a href="#" className="topbar__nav-link">
            History
          </a>
          <a href="#" className="topbar__nav-link">
            Activity
          </a>
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

        <button className="topbar__icon-btn" title="Notifications" id="notifications-btn">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* User avatar with dropdown */}
        <div className="topbar__user-wrapper" ref={menuRef}>
          <button
            className="topbar__user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={displayName}
            id="topbar-user-btn"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="topbar__user-avatar-img"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="sidebar__avatar"
                style={{ width: 34, height: 34, fontSize: 12 }}
                title="Profile"
              >
                {initials}
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="topbar__user-dropdown" id="topbar-user-dropdown">
              <div className="topbar__dropdown-header">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="topbar__dropdown-avatar"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <div className="topbar__dropdown-name">{displayName}</div>
                  <div className="topbar__dropdown-email">{user?.email}</div>
                </div>
              </div>
              <hr className="topbar__dropdown-divider" />
              <button
                className="topbar__dropdown-item topbar__dropdown-item--danger"
                onClick={() => {
                  setShowUserMenu(false);
                  onSignOut();
                }}
                id="topbar-signout-btn"
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
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
