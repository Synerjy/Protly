import { useState } from 'react';

export default function ProteinBio({ protein }) {
    const [expanded, setExpanded] = useState(false);

    if (!protein) return null;

    const functionText = protein.function || '';
    const isLong = functionText.length > 250;
    const displayText = isLong && !expanded ? functionText.slice(0, 250) + '…' : functionText;

    return (
        <div className="card" id="protein-bio-card">
            <div className="card__header">
                <div className="card__title">
                    <span className="card__title-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                        🧬
                    </span>
                    Protein Bio
                </div>
                <div className="card__actions">
                    <span className="protein-bio__badge">{protein.accession}</span>
                </div>
            </div>

            <div className="card__body">
                <h3 className="protein-bio__name">{protein.proteinName || 'Unknown Protein'}</h3>

                {protein.geneName && (
                    <div className="protein-bio__meta-row">
                        <span className="protein-bio__meta-label">Gene</span>
                        <span className="protein-bio__meta-value">{protein.geneName}</span>
                    </div>
                )}

                <div className="protein-bio__meta-row">
                    <span className="protein-bio__meta-label">Organism</span>
                    <span className="protein-bio__organism-badge">{protein.organism}</span>
                </div>

                <div className="protein-bio__meta-row">
                    <span className="protein-bio__meta-label">Length</span>
                    <span className="protein-bio__meta-value">{protein.length} AA</span>
                </div>

                {functionText && (
                    <div className="protein-bio__function">
                        <span className="protein-bio__function-label">Functional Summary</span>
                        <p className="protein-bio__function-text">{displayText}</p>
                        {isLong && (
                            <button
                                className="protein-bio__expand-btn"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
