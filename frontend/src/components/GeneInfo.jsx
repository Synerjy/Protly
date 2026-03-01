export default function GeneInfo({ status }) {
    const analysisProgress = status === 'complete' ? 100 : status === 'processing' ? 60 : 0;

    return (
        <div className="card" id="gene-info-card">
            <div className="card__header">
                <div className="card__title">
                    <span className="card__title-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                        🧬
                    </span>
                    Gene &amp; Organism
                </div>
                <div className="card__actions">
                    <button className="card__action-btn" title="Edit">✎</button>
                    <button className="card__action-btn" title="More">⋮</button>
                </div>
            </div>

            <div className="card__body">
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Sequence Tracking
                </p>
                <p className="gene-info__description">
                    Track sequence analysis metrics to monitor structural prediction accuracy and confidence.
                </p>

                <span className="gene-info__progress-label">
                    {status === 'complete'
                        ? 'Analysis complete'
                        : status === 'processing'
                            ? 'Analyzing…'
                            : 'Awaiting input'}
                </span>

                <div className="gene-info__progress-bar">
                    <div
                        className="gene-info__progress-fill"
                        style={{ width: `${analysisProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
