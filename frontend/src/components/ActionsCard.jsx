import { useCallback } from 'react';

export default function ActionsCard({ pdbData, onDownload, status, sequence }) {
  const handleDownloadFasta = useCallback(() => {
    if (!sequence) return;
    const header = `>predicted_protein|length=${sequence.length}\n`;
    const wrapped = sequence.match(/.{1,80}/g)?.join('\n') || sequence;
    const blob = new Blob([header + wrapped + '\n'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predicted.fasta';
    a.click();
    URL.revokeObjectURL(url);
  }, [sequence]);

  return (
    <div className="card" id="actions-card">
      <div className="card__header">
        <div className="card__title">
          <span
            className="card__title-icon"
            style={{ background: 'rgba(5, 205, 153, 0.1)', color: 'var(--success)' }}
          >
            z<sup style={{ fontSize: 8 }}>Z</sup>
          </span>
          Export &amp; Actions
        </div>
        <div className="card__actions">
          <button className="card__action-btn" title="Help">
            ?
          </button>
          <button className="card__action-btn" title="More">
            ⋮
          </button>
        </div>
      </div>

      <div className="card__body">
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Structure Export
        </p>
        <p className="actions-card__info">
          Download the predicted structure or sequence for use in molecular dynamics, visualization
          tools like PyMOL, or further analysis.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          <button
            id="download-pdb-btn"
            className="actions-card__main-btn"
            onClick={onDownload}
            disabled={!pdbData}
            style={{ flex: 1 }}
          >
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            PDB
          </button>
          <button
            id="download-fasta-btn"
            className="actions-card__main-btn actions-card__main-btn--secondary"
            onClick={handleDownloadFasta}
            disabled={!sequence || status !== 'complete'}
            style={{ flex: 1 }}
          >
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            FASTA
          </button>
        </div>

        {/* Decorative slider mimicking the 'Sleep Schedule' UI */}
        <div className="actions-card__slider-row">
          <span className="actions-card__slider-label">
            {pdbData ? `${(pdbData.length / 1024).toFixed(1)} KB` : '0 KB'}
          </span>
          <div className="actions-card__slider">
            <div
              className="actions-card__slider-track"
              style={{
                width: status === 'complete' ? '100%' : '0%',
                transition: 'width 0.6s ease',
              }}
            >
              <span className="actions-card__slider-thumb" />
            </div>
          </div>
          <span className="actions-card__slider-label">PDB file</span>
        </div>
      </div>
    </div>
  );
}
