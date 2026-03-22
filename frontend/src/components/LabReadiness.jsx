export default function LabReadiness({ metrics, isLoading }) {
    if (isLoading) {
        return (
            <div className="card" id="lab-readiness-card" role="region" aria-label="Lab readiness metrics">
                <div className="card__header">
                    <div className="card__title">
                        <span className="card__title-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                            <span aria-hidden="true">🔬</span>
                        </span>
                        Lab Readiness
                    </div>
                </div>
                <div className="card__body">
                    <div className="lab-readiness__grid" aria-busy="true" aria-label="Loading lab readiness metrics">
                        <div className="lab-readiness__tile skeleton-tile"><div className="skeleton" /></div>
                        <div className="lab-readiness__tile skeleton-tile"><div className="skeleton" /></div>
                        <div className="lab-readiness__tile skeleton-tile"><div className="skeleton" /></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!metrics) return null;

    const stabilityLabel = metrics.is_stable ? 'Stable' : 'Unstable';
    const stabilityColor = metrics.is_stable ? 'var(--success)' : 'var(--warning)';

    const pI = metrics.isoelectric_point;
    const piLabel = pI < 7 ? 'Acidic' : pI > 7 ? 'Basic' : 'Neutral';
    const piColor = pI < 7 ? 'var(--plddt-low)' : pI > 7 ? 'var(--plddt-confident)' : 'var(--text-secondary)';

    const gravy = metrics.gravy;
    const gravyLabel = gravy > 0 ? 'Hydrophobic' : 'Hydrophilic';
    const gravyColor = gravy > 0 ? 'var(--plddt-very-low)' : 'var(--plddt-very-high)';

    // Safely format numbers to handle edge cases
    const formatNum = (val) => {
        if (val == null || isNaN(val)) return '—';
        return typeof val === 'number' ? val.toFixed(2) : String(val);
    };

    return (
        <div className="card" id="lab-readiness-card" role="region" aria-label="Lab readiness metrics">
            <div className="card__header">
                <div className="card__title">
                    <span className="card__title-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <span aria-hidden="true">🔬</span>
                    </span>
                    Lab Readiness
                </div>
            </div>

            <div className="card__body">
                <div className="lab-readiness__grid">
                    <div className="lab-readiness__tile" aria-label={`Instability Index: ${formatNum(metrics.instability_index)}, ${stabilityLabel}`}>
                        <span className="lab-readiness__tile-label">Stability Index</span>
                        <span className="lab-readiness__tile-value">{formatNum(metrics.instability_index)}</span>
                        <span className="lab-readiness__tile-tag" style={{ background: stabilityColor + '22', color: stabilityColor }}>
                            {stabilityLabel}
                        </span>
                    </div>

                    <div className="lab-readiness__tile" aria-label={`Isoelectric Point: ${formatNum(pI)}, ${piLabel}`}>
                        <span className="lab-readiness__tile-label">Isoelectric Point</span>
                        <span className="lab-readiness__tile-value">{formatNum(pI)}</span>
                        <span className="lab-readiness__tile-tag" style={{ background: piColor + '22', color: piColor }}>
                            {piLabel}
                        </span>
                    </div>

                    <div className="lab-readiness__tile" aria-label={`GRAVY Score: ${formatNum(gravy)}, ${gravyLabel}`}>
                        <span className="lab-readiness__tile-label">GRAVY Score</span>
                        <span className="lab-readiness__tile-value">{formatNum(gravy)}</span>
                        <span className="lab-readiness__tile-tag" style={{ background: gravyColor + '22', color: gravyColor }}>
                            {gravyLabel}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
