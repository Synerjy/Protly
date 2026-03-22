export default function GeneInfo({ status }) {
    const analysisProgress = status === 'complete' ? 100 : status === 'processing' ? 60 : 0;

    return (
        <div className="card" id="gene-info-card" role="region" aria-label="Gene and organism tracking">
            <div className="card__header">
                <div className="card__title">
                    <span className="card__title-icon" style={{ background: 'var(--secondary-accent-bg)', color: 'var(--secondary-accent)' }}>
                        <span aria-hidden="true">🧬</span>
                    </span>
                    Gene &amp; Organism
                </div>
            </div>

            <div className="card__body">
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Sequence Tracking
                </p>
                <p className="gene-info__description">
                    Track sequence analysis metrics to monitor structural prediction accuracy and confidence.
                </p>

                <span className="gene-info__progress-label" aria-live="polite">
                    {status === 'complete'
                        ? 'Analysis complete'
                        : status === 'processing'
                            ? 'Analyzing…'
                            : 'Awaiting input'}
                </span>

                <div
                    className="gene-info__progress-bar"
                    role="progressbar"
                    aria-valuenow={analysisProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Analysis progress"
                >
                    <div
                        className="gene-info__progress-fill"
                        style={{ width: `${analysisProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
