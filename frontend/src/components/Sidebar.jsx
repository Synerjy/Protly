export default function Sidebar({ activeView, onViewChange }) {
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
      </nav>
    </aside>
  );
}
