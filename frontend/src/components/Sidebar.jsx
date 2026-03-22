import { useState } from 'react';

export default function Sidebar({ activeView, onViewChange, user, onSignOut }) {
  const [showMenu, setShowMenu] = useState(false);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <aside className="sidebar">
      <div className="sidebar__logo" title="Protly">
        P
      </div>

      <nav className="sidebar__nav">
        <button
          className={`sidebar__nav-item${activeView === 'dashboard' ? ' sidebar__nav-item--active' : ''}`}
          title="Dashboard"
          onClick={() => onViewChange('dashboard')}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
        <button
          className={`sidebar__nav-item${activeView === 'discovery' || activeView === 'analysis' ? ' sidebar__nav-item--active' : ''}`}
          title="Search & Discovery"
          onClick={() => onViewChange('discovery')}
        >
          <svg
            width="20"
            height="20"
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
        </button>
        <button className="sidebar__nav-item" title="History">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
        <button className="sidebar__nav-item" title="Taxonomy">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </button>
        <button className="sidebar__nav-item" title="Settings">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </nav>

      <div className="sidebar__bottom">
        <button className="sidebar__nav-item" title="Help">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        <div className="sidebar__user-menu-wrapper">
          <button
            className="sidebar__avatar-btn"
            title={user?.user_metadata?.full_name || user?.email || 'User'}
            onClick={() => setShowMenu(!showMenu)}
            id="sidebar-user-btn"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User avatar"
                className="sidebar__avatar-img"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="sidebar__avatar" title="User Profile">
                {initials}
              </div>
            )}
          </button>

          {showMenu && (
            <div className="sidebar__user-popup" id="user-popup-menu">
              <div className="sidebar__user-popup-header">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="sidebar__popup-avatar"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <div className="sidebar__popup-name">
                    {user?.user_metadata?.full_name || 'User'}
                  </div>
                  <div className="sidebar__popup-email">{user?.email}</div>
                </div>
              </div>
              <button
                className="sidebar__signout-btn"
                onClick={() => {
                  setShowMenu(false);
                  onSignOut();
                }}
                id="signout-btn"
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
    </aside>
  );
}
