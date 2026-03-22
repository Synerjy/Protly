export default function ProteinMetrics({ plddtData, seqLength }) {
    return (
        <div className="card" id="protein-metrics-card" role="region" aria-label="Protein analytics">
            <div className="card__header">
                <div className="card__title">
                    <span className="card__title-icon" style={{ background: 'var(--navy-bg)', color: 'var(--navy)' }}>
                        <span aria-hidden="true">📊</span>
                    </span>
                    Protein Analytics
                </div>
            </div>

            <div className="card__body">
                <div className="protein-metrics">
                    <div className="protein-metrics__tile">
                        <span className="protein-metrics__tile-label">Sequence Length</span>
                        <span className="protein-metrics__tile-value">{seqLength || '—'}</span>
                        <span className="protein-metrics__tile-unit">residues</span>
                    </div>
                    <div className="protein-metrics__tile">
                        <span className="protein-metrics__tile-label">Avg Confidence</span>
                        <span className="protein-metrics__tile-value">
                            {plddtData ? plddtData.mean.toFixed(1) : '—'}
                        </span>
                        <span className="protein-metrics__tile-unit">pLDDT</span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 90,
                    marginTop: 'var(--space-md)',
                    position: 'relative',
                }}>
                    {/* Circular gauge */}
                    <svg width="90" height="90" viewBox="0 0 120 120" role="img" aria-label={`pLDDT gauge: ${plddtData ? Math.round(plddtData.mean) : 'No data'}`}>
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="8" strokeDasharray="6 4" />
                        {plddtData && (
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="var(--navy)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${(plddtData.mean / 100) * 314} 314`}
                                transform="rotate(-90 60 60)"
                                style={{ transition: 'stroke-dasharray 0.8s ease' }}
                            />
                        )}
                        <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--navy)">
                            {plddtData ? Math.round(plddtData.mean) : '—'}
                        </text>
                        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                            pLDDT
                        </text>
                    </svg>
                </div>
            </div>
        </div>
    );
}
