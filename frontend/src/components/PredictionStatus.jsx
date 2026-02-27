export default function PredictionStatus({ status, error }) {
    const config = {
        ready: { label: 'Ready', cssClass: 'ready', text: 'Awaiting protein sequence input' },
        processing: { label: 'Processing', cssClass: 'processing', text: 'Running ESMFold prediction…' },
        complete: { label: 'Complete', cssClass: 'complete', text: 'Protein structure predicted successfully' },
        error: { label: 'Error', cssClass: 'error', text: error || 'An error occurred' },
    };

    const c = config[status] || config.ready;

    return (
        <>
            {/* Status bar */}
            <div className="prediction-status">
                <div className="prediction-status__badge-row">
                    <span className="prediction-status__label">Prediction Status</span>
                    <span className={`prediction-status__badge prediction-status__badge--${c.cssClass}`}>
                        <span className={`prediction-status__badge-dot${status === 'processing' ? ' animate-pulse' : ''}`} />
                        {c.label}
                    </span>
                </div>
                <p className="prediction-status__text">{c.text}</p>
            </div>

            {/* Condition-detected style card */}
            <div className="status-card">
                <div
                    className="status-card__icon"
                    style={{
                        background:
                            status === 'complete'
                                ? 'rgba(74, 108, 247, 0.1)'
                                : status === 'error'
                                    ? 'rgba(238, 93, 80, 0.1)'
                                    : 'rgba(143, 155, 186, 0.1)',
                    }}
                >
                    {status === 'complete' ? '🧬' : status === 'error' ? '⚠️' : '🔬'}
                </div>
                <div className="status-card__content">
                    <div className="status-card__title">
                        {status === 'complete'
                            ? 'Structure Predicted'
                            : status === 'error'
                                ? 'Prediction Failed'
                                : status === 'processing'
                                    ? 'Folding in Progress…'
                                    : 'No Prediction Yet'}
                    </div>
                    <div className="status-card__subtitle">
                        {status === 'complete'
                            ? 'ESMFold estimation complete'
                            : status === 'error'
                                ? 'Check sequence validity or try again'
                                : status === 'processing'
                                    ? 'This may take a minute'
                                    : 'Enter a sequence to begin'}
                    </div>
                </div>
                <span className="status-card__chevron">›</span>
            </div>
        </>
    );
}
