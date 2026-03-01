import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MolViewer from './components/MolViewer';
import PredictionStatus from './components/PredictionStatus';
import ConfidenceBar from './components/ConfidenceBar';
import SequenceInput from './components/SequenceInput';
import PldtMetrics from './components/PldtMetrics';
import ProteinMetrics from './components/ProteinMetrics';
import GeneInfo from './components/GeneInfo';
import ActionsCard from './components/ActionsCard';

const API_BASE = 'http://localhost:8000';

const DEFAULT_SEQ =
  'MGSSHHHHHHSSGLVPRGSHMRGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALRQVASLNGTSSSPIYGKVDTARMGVMGWSMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCSLEDPAANKARKEAELAAATAEQ';

export default function App() {
  // ---- state ----
  const [sequence, setSequence] = useState(DEFAULT_SEQ);
  const [pdbData, setPdbData] = useState(null);
  const [plddtData, setPlddtData] = useState(null);
  const [seqLength, setSeqLength] = useState(0);
  const [status, setStatus] = useState('ready'); // ready | processing | complete | error
  const [error, setError] = useState(null);

  // ---- predict ----
  const handlePredict = useCallback(async () => {
    if (!sequence.trim() || sequence.trim().length < 10) return;

    setStatus('processing');
    setError(null);
    setPdbData(null);
    setPlddtData(null);

    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: sequence.trim() }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setPdbData(data.pdb);
      setPlddtData(data.plddt);
      setSeqLength(data.sequence_length);
      setStatus('complete');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('error');
    }
  }, [sequence]);

  // ---- download PDB ----
  const handleDownload = useCallback(() => {
    if (!pdbData) return;
    const blob = new Blob([pdbData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predicted.pdb';
    a.click();
    URL.revokeObjectURL(url);
  }, [pdbData]);

  return (
    <div className="app-layout">
      {/* ---- Sidebar ---- */}
      <Sidebar />

      {/* ---- Main ---- */}
      <div className="main-wrapper">
        <TopBar />

        <div className="page-header">
          <div className="page-header__row">
            <div>
              <h1>Overview</h1>
              <h2>Protein Structure</h2>
            </div>
            <div className="page-header__actions">
              <div className="page-header__date">
                <span>🕐</span>
                <span>24H</span>
                <span style={{ marginLeft: 8 }}>📅</span>
                <span>
                  {new Date().toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <button
                className="btn btn--primary"
                onClick={handlePredict}
                disabled={status === 'processing'}
              >
                Prediction Request
                <span style={{ fontSize: 18 }}>→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* ---- Left Column ---- */}
          <div className="left-column">
            <div className="mol-viewer-card">
              <MolViewer pdbData={pdbData} status={status} />
              <PredictionStatus status={status} error={error} />
              <ConfidenceBar plddtData={plddtData} />
            </div>
          </div>

          {/* ---- Right Column ---- */}
          <div className="right-column">
            <SequenceInput
              sequence={sequence}
              setSequence={setSequence}
              onPredict={handlePredict}
              status={status}
            />

            <PldtMetrics plddtData={plddtData} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <ProteinMetrics plddtData={plddtData} seqLength={seqLength} />
              <GeneInfo status={status} />
            </div>

            <ActionsCard
              pdbData={pdbData}
              onDownload={handleDownload}
              status={status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
