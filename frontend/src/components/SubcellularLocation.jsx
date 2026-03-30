/**
 * SubcellularLocation.jsx
 *
 * Displays subcellular localization data fetched from the UniProt REST API.
 * The data lives in the `comments` array of a UniProtKB entry where
 * `commentType === "SUBCELLULAR LOCATION"`.
 *
 * Place this component in: frontend/src/components/SubcellularLocation.jsx
 */

// Icon map — maps common UniProt location names to emoji glyphs
const LOCATION_ICONS = {
  nucleus: '🔵',
  cytoplasm: '🟡',
  'cell membrane': '🟠',
  'plasma membrane': '🟠',
  mitochondrion: '🔴',
  'endoplasmic reticulum': '🟣',
  'golgi apparatus': '🟤',
  lysosome: '🔶',
  peroxisome: '🔷',
  secreted: '⬆️',
  extracellular: '⬆️',
  'cell junction': '🔗',
  cilium: '🌀',
  cytosol: '🟡',
  'endosome membrane': '🔵',
  vesicle: '⚪',
};

function getIcon(locationName = '') {
  const key = locationName.toLowerCase();
  for (const [k, v] of Object.entries(LOCATION_ICONS)) {
    if (key.includes(k)) return v;
  }
  return '📍';
}

// Color coding for compartment families
function getCompartmentColor(locationName = '') {
  const loc = locationName.toLowerCase();
  if (loc.includes('nucleus') || loc.includes('nucleol') || loc.includes('chromatin'))
    return { bg: 'rgba(74, 108, 247, 0.1)', border: 'rgba(74, 108, 247, 0.35)', text: '#4a6cf7' };
  if (loc.includes('mitochondri'))
    return { bg: 'rgba(238, 93, 80, 0.1)', border: 'rgba(238, 93, 80, 0.35)', text: '#ee5d50' };
  if (loc.includes('membrane') || loc.includes('plasma'))
    return { bg: 'rgba(255, 181, 71, 0.1)', border: 'rgba(255, 181, 71, 0.35)', text: '#ffb547' };
  if (loc.includes('secreted') || loc.includes('extracellular'))
    return { bg: 'rgba(5, 205, 153, 0.1)', border: 'rgba(5, 205, 153, 0.35)', text: '#05cd99' };
  if (loc.includes('endoplasmic') || loc.includes('golgi'))
    return { bg: 'rgba(124, 58, 237, 0.1)', border: 'rgba(124, 58, 237, 0.35)', text: '#7c3aed' };
  if (loc.includes('cytoplasm') || loc.includes('cytosol'))
    return {
      bg: 'rgba(255, 219, 19, 0.1)',
      border: 'rgba(255, 219, 19, 0.35)',
      text: '#b8860b',
    };
  return {
    bg: 'rgba(163, 174, 208, 0.12)',
    border: 'rgba(163, 174, 208, 0.4)',
    text: '#8f9bba',
  };
}

function LocationBadge({ item }) {
  const colors = getCompartmentColor(item.location);
  const icon = getIcon(item.location);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1.3,
          }}
        >
          {item.location}
        </span>
      </div>

      {(item.topology || item.orientation) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          {item.topology && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: colors.text,
                background: colors.border,
                padding: '1px 7px',
                borderRadius: 'var(--radius-full)',
                opacity: 0.9,
              }}
            >
              {item.topology}
            </span>
          )}
          {item.orientation && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: colors.text,
                background: colors.border,
                padding: '1px 7px',
                borderRadius: 'var(--radius-full)',
                opacity: 0.9,
              }}
            >
              {item.orientation}
            </span>
          )}
        </div>
      )}

      {item.note && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginTop: 4,
            fontStyle: 'italic',
          }}
        >
          {item.note.length > 120 ? item.note.slice(0, 120) + '…' : item.note}
        </p>
      )}
    </div>
  );
}

export default function SubcellularLocation({ locations, isLoading }) {
  if (isLoading) {
    return (
      <div className="card" id="subcellular-location-card">
        <div className="card__header">
          <div className="card__title">
            <span
              className="card__title-icon"
              style={{ background: 'rgba(74, 108, 247, 0.1)', color: 'var(--accent)' }}
            >
              🗺️
            </span>
            Subcellular Localization
          </div>
        </div>
        <div className="card__body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 'var(--space-sm)',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 72, borderRadius: 'var(--radius-md)' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!locations || locations.length === 0) return null;

  return (
    <div className="card" id="subcellular-location-card">
      <div className="card__header">
        <div className="card__title">
          <span
            className="card__title-icon"
            style={{ background: 'rgba(74, 108, 247, 0.1)', color: 'var(--accent)' }}
          >
            🗺️
          </span>
          Subcellular Localization
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 400,
              marginLeft: 6,
              background: 'var(--bg)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {locations.length} location{locations.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="card__actions">
          <button className="card__action-btn" title="Info">
            ⓘ
          </button>
        </div>
      </div>

      <div className="card__body">
        {/* Cell diagram legend strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 14,
            padding: '8px 12px',
            background: 'var(--bg)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <span>📚</span>
          <span>
            Source: <strong>UniProtKB</strong> · Experimental &amp; predicted annotations
          </span>
        </div>

        {/* Location badges grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 'var(--space-sm)',
          }}
        >
          {locations.map((item, i) => (
            <LocationBadge key={i} item={item} />
          ))}
        </div>

        <p
          style={{
            marginTop: 14,
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          Subcellular localization describes where within the cell this protein is found. Locations
          are annotated from experimental evidence and sequence-based predictions.
        </p>
      </div>
    </div>
  );
}
