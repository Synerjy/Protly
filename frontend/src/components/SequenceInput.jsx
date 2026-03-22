import { useMemo } from 'react';

const VALID_AMINO_ACIDS = new Set('ACDEFGHIKLMNPQRSTVWY'.split(''));
const MAX_SEQUENCE_LENGTH = 2000;

export default function SequenceInput({ sequence, setSequence, onPredict, status }) {
    const isLoading = status === 'processing';
    const charCount = sequence.trim().length;

    const invalidChars = useMemo(() => {
        const bad = new Set();
        for (const ch of sequence) {
            if (!VALID_AMINO_ACIDS.has(ch)) bad.add(ch);
        }
        return [...bad].sort();
    }, [sequence]);

    const hasInvalid = invalidChars.length > 0;
    const isTooLong = charCount > MAX_SEQUENCE_LENGTH;

    return (
        <div className="card" id="sequence-input-card" role="region" aria-label="Sequence entry">
            <div className="card__header">
                <div className="card__title">
                    <span className="card__title-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <span aria-hidden="true">🧪</span>
                    </span>
                    Sequence Entry Center
                </div>
                <div className="card__actions">
                    <button
                        className="card__action-btn"
                        title="Paste from clipboard"
                        aria-label="Paste sequence from clipboard"
                        onClick={async () => {
                            try {
                                const text = await navigator.clipboard.readText();
                                if (text) setSequence(text.toUpperCase().replace(/[^A-Z]/g, ''));
                            } catch {
                                /* clipboard permission denied */
                            }
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    </button>
                    <button
                        className="card__action-btn"
                        title="Clear sequence"
                        aria-label="Clear sequence"
                        onClick={() => setSequence('')}
                    >
                        <span aria-hidden="true">✕</span>
                    </button>
                </div>
            </div>

            <div className="card__body">
                <label htmlFor="sequence-textarea" className="sr-only">Amino acid sequence</label>
                <textarea
                    id="sequence-textarea"
                    className="sequence-input__textarea"
                    placeholder="Paste your amino-acid sequence here (single letter codes: A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y)…"
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    spellCheck={false}
                    maxLength={MAX_SEQUENCE_LENGTH + 100}
                    aria-describedby="seq-validation-msg seq-char-count"
                    aria-invalid={hasInvalid || isTooLong ? 'true' : undefined}
                    style={hasInvalid || isTooLong ? { borderColor: 'var(--warning)' } : undefined}
                />

                {hasInvalid && (
                    <div id="seq-validation-msg" className="sequence-input__validation-warning" role="alert" style={{
                        color: 'var(--warning)',
                        fontSize: 12,
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        ⚠ Invalid amino-acid characters: <strong>{invalidChars.join(', ')}</strong> — these will be rejected by the server
                    </div>
                )}

                {isTooLong && (
                    <div role="alert" style={{
                        color: 'var(--error)',
                        fontSize: 12,
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        ⚠ Sequence exceeds {MAX_SEQUENCE_LENGTH} residues — ESMFold limit. Trim the sequence before predicting.
                    </div>
                )}

                <div className="sequence-input__footer">
                    <span className="sequence-input__char-count" id="seq-char-count">
                        {charCount.toLocaleString()} residue{charCount !== 1 ? 's' : ''}
                        {charCount < 10 && charCount > 0 && (
                            <span style={{ color: 'var(--warning)', marginLeft: 6 }}>Min 10 required</span>
                        )}
                        {isTooLong && (
                            <span style={{ color: 'var(--error)', marginLeft: 6 }}>Max {MAX_SEQUENCE_LENGTH}</span>
                        )}
                    </span>
                    <button
                        id="predict-btn"
                        className="sequence-input__predict-btn"
                        onClick={onPredict}
                        disabled={isLoading || charCount < 10 || hasInvalid || isTooLong}
                        aria-label={isLoading ? 'Prediction in progress' : 'Predict protein structure'}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner" aria-hidden="true" />
                                Predicting…
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                Predict
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
