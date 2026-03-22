import { useMemo, useState, memo } from 'react';

const defaultAminoAcids = 'A,C,D,E,F,G,H,I,K,L,M,N,P,Q,R,S,T,V,W,Y';
const aminoAcidsStr = (import.meta.env.VITE_VALID_AMINO_ACIDS || defaultAminoAcids).replace(
  /,/g,
  ''
);
const VALID_AMINO_ACIDS = new Set(aminoAcidsStr.split(''));

const SequenceInput = memo(function SequenceInput({ sequence: externalSeq, setSequence: setExternalSeq, onPredict, status }) {
  const [localSeq, setLocalSeq] = useState(externalSeq || '');
  const [prevExternalSeq, setPrevExternalSeq] = useState(externalSeq);

  if (externalSeq !== prevExternalSeq) {
    setPrevExternalSeq(externalSeq);
    setLocalSeq(externalSeq || '');
  }

  const isLoading = status === 'processing';
  const charCount = localSeq.trim().length;

  const invalidChars = useMemo(() => {
    const bad = new Set();
    for (const ch of localSeq) {
      if (!VALID_AMINO_ACIDS.has(ch)) bad.add(ch);
    }
    return [...bad].sort();
  }, [localSeq]);

  const hasInvalid = invalidChars.length > 0;

  const handlePredictClicked = () => {
    setExternalSeq(localSeq);
    onPredict(localSeq);
  };

  return (
    <div className="card" id="sequence-input-card">
      <div className="card__header">
        <div className="card__title">
          <span
            className="card__title-icon"
            style={{ background: 'rgba(74, 108, 247, 0.1)', color: 'var(--accent)' }}
          >
            🧪
          </span>
          Sequence Entry Center
        </div>
        <div className="card__actions">
          <button
            className="card__action-btn"
            title="Paste from clipboard"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) setLocalSeq(text.toUpperCase().replace(/[^A-Z]/g, ''));
              } catch {
                /* clipboard permission denied */
              }
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button className="card__action-btn" title="Clear" onClick={() => setLocalSeq('')}>
            ✕
          </button>
        </div>
      </div>

      <div className="card__body">
        <textarea
          id="sequence-textarea"
          className="sequence-input__textarea"
          placeholder="Paste your amino-acid sequence here (single letter codes: A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y)…"
          value={localSeq}
          onChange={(e) => setLocalSeq(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          spellCheck={false}
          style={hasInvalid ? { borderColor: 'var(--warning)' } : undefined}
        />

        {hasInvalid && (
          <div
            className="sequence-input__validation-warning"
            style={{
              color: 'var(--warning)',
              fontSize: 12,
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ⚠ Invalid amino-acid characters: <strong>{invalidChars.join(', ')}</strong> — these will
            be rejected by the server
          </div>
        )}

        <div className="sequence-input__footer">
          <span className="sequence-input__char-count">
            {charCount} residue{charCount !== 1 ? 's' : ''}
            {charCount < 10 && charCount > 0 && (
              <span style={{ color: 'var(--warning)', marginLeft: 6 }}>Min 10 required</span>
            )}
          </span>
          <button
            id="predict-btn"
            className="sequence-input__predict-btn"
            onClick={handlePredictClicked}
            disabled={isLoading || charCount < 10 || hasInvalid}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Predicting…
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Predict
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default SequenceInput;
