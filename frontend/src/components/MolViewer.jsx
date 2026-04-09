import { useEffect, useRef, useState, useCallback, memo } from 'react';

const VIZ_STYLES = [
  { key: 'cartoon', label: 'Cartoon', icon: '🎨' },
  { key: 'stick', label: 'Stick', icon: '⊥' },
  { key: 'sphere', label: 'Sphere', icon: '●' },
  { key: 'surface', label: 'Surface', icon: '◐' },
];

export default memo(function MolViewer({ pdbData, status }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [vizStyle, setVizStyle] = useState('cartoon');

  const applyStyle = useCallback((style) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const styleMap = {
      cartoon: { cartoon: { color: 'spectrum' } },
      stick: { stick: { colorscheme: 'Jmol' } },
      sphere: { sphere: { colorscheme: 'Jmol', scale: 0.3 } },
      surface: { cartoon: { color: 'spectrum', opacity: 0.5 } },
    };
    viewer.setStyle({}, styleMap[style] || styleMap.cartoon);
    if (style === 'surface') {
      viewer.addSurface(window.$3Dmol?.SurfaceType?.VDW ?? 1, {
        opacity: 0.7,
        color: 'white',
        colorscheme: { prop: 'b', gradient: 'rwb', min: 0, max: 100 },
      });
    } else {
      viewer.removeAllSurfaces();
    }
    viewer.render();
  }, []);

  useEffect(() => {
    // Only initialize once we have data and 3Dmol is available
    if (!pdbData || !containerRef.current) return;

    // Dynamically import 3Dmol
    import('3dmol/build/3Dmol-min.js').then(($3Dmol) => {
      const $3D = window.$3Dmol || $3Dmol;

      // Clear previous viewer
      if (viewerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const viewer = $3D.createViewer(containerRef.current, {
        backgroundColor: 'white',
        antialias: true,
      });

      viewer.addModel(pdbData, 'pdb');
      viewer.setStyle(
        {},
        {
          cartoon: { color: 'spectrum' },
        }
      );
      viewer.zoomTo();
      viewer.zoom(1.2, 600);
      viewer.spin(true);
      viewer.render();

      viewerRef.current = viewer;
      setVizStyle('cartoon');
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current = null;
      }
    };
  }, [pdbData]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (viewerRef.current) {
        viewerRef.current.resize();
        viewerRef.current.render();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="mol-viewer__container" ref={!pdbData ? null : undefined}>
      {!pdbData ? (
        <div className="mol-viewer__placeholder">
          <div className="mol-viewer__placeholder-icon">
            {status === 'processing' ? (
              <div
                className="spinner spinner--dark"
                style={{ width: 48, height: 48, borderWidth: 3 }}
              />
            ) : (
              '🧬'
            )}
          </div>
          <p>
            {status === 'processing'
              ? 'Predicting protein structure…'
              : 'Enter a protein sequence and click Predict to visualize the 3D structure'}
          </p>
        </div>
      ) : (
        <>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          {/* Visualization style selector */}
          <div className="mol-viewer__style-bar">
            {VIZ_STYLES.map((s) => (
              <button
                key={s.key}
                className={`mol-viewer__style-btn${vizStyle === s.key ? ' mol-viewer__style-btn--active' : ''}`}
                title={s.label}
                aria-label={s.label}
                onClick={() => {
                  setVizStyle(s.key);
                  applyStyle(s.key);
                }}
              >
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                <span style={{ fontSize: 11 }}>{s.label}</span>
              </button>
            ))}
          </div>
          <div className="mol-viewer__overlay-controls">
            <button
              className="mol-viewer__overlay-btn"
              title="Fullscreen"
              aria-label="Fullscreen"
              onClick={() => containerRef.current?.requestFullscreen?.()}
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
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
            <button
              className="mol-viewer__overlay-btn"
              title="Reset view"
              aria-label="Reset view"
              onClick={() => {
                if (viewerRef.current) {
                  viewerRef.current.zoomTo();
                  viewerRef.current.render();
                }
              }}
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
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
});
