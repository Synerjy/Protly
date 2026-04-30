import { useState, useCallback, useRef } from 'react';
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
import DiscoveryTable from './components/DiscoveryTable';
import ProteinBio from './components/ProteinBio';
import LabReadiness from './components/LabReadiness';
import SubcellularLocation from './components/SubcellularLocation';
import SearchPanel from './components/SearchPanel';
import Toast from './components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const DEFAULT_SEQ =
  'MGSSHHHHHHSSGLVPRGSHMRGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALRQVASLNGTSSSPIYGKVDTARMGVMGWSMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCSLEDPAANKARKEAELAAATAEQ';

const DEFAULT_FILTERS = {
  reviewed: true,
  organism: '',
  lengthMax: 1000,
};

let toastId = 0;

export default function App() {

  // ---- view state ----
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'discovery' | 'analysis'

  // ---- dashboard (sequence) state ----
  const [sequence, setSequence] = useState(DEFAULT_SEQ);
  const [pdbData, setPdbData] = useState(null);
  const [plddtData, setPlddtData] = useState(null);
  const [seqLength, setSeqLength] = useState(0);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState(null);

  // ---- search & discovery state ----
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ---- analysis (selected protein) state ----
  const [selectedProtein, setSelectedProtein] = useState(null);
  const [labMetrics, setLabMetrics] = useState(null);
  const [labLoading, setLabLoading] = useState(false);

  // ---- toasts ----
  const [toasts, setToasts] = useState([]);

  const lastSearchRef = useRef({ query: '', filters: DEFAULT_FILTERS });

  // ---- toast helpers ----
  const addToast = useCallback((type, message, duration = 5000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- predict (existing flow) ----
  const handlePredict = useCallback(
    async (overrideSequence) => {
      const seq = overrideSequence || sequence;
      if (!seq.trim() || seq.trim().length < 10) return;

      setStatus('processing');
      setError(null);
      setPdbData(null);
      setPlddtData(null);

      try {
        const res = await fetch(`${API_BASE}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sequence: seq.trim() }),
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
        addToast('error', err.message);
      }
    },
    [sequence, addToast]
  );

  // ---- UniProt search ----
  const handleSearch = useCallback(
    async (query, page = 0) => {
      if (!query.trim()) return;

      setView('discovery');
      setSearchLoading(true);
      setSearchQuery(query);
      setCurrentPage(page);
      setHasSearched(true);
      lastSearchRef.current = { query, filters: { ...filters } };

      try {
        const params = new URLSearchParams({
          query: query.trim(),
          reviewed: filters.reviewed.toString(),
          organism: filters.organism,
          length_min: '1',
          length_max: filters.lengthMax.toString(),
          page: page.toString(),
          size: '25',
        });

        const res = await fetch(`${API_BASE}/api/uniprot/search?${params}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.detail || `Search failed: ${res.status}`);
        }

        const data = await res.json();
        setSearchResults(data.results);
        setTotalResults(data.total);
      } catch (err) {
        console.error(err);
        addToast('error', `Search failed: ${err.message}`);
        setSearchResults([]);
        setTotalResults(0);
      } finally {
        setSearchLoading(false);
      }
    },
    [filters, addToast]
  );

  const handleFiltersChange = useCallback((updater) => {
    if (typeof updater === 'function') {
      setFilters(updater);
    } else {
      setFilters(updater);
    }
  }, []);

  // ---- page change ----
  const handlePageChange = useCallback(
    (newPage) => {
      handleSearch(searchQuery, newPage);
    },
    [searchQuery, handleSearch]
  );

  // ---- Analyze a protein from the table ----
  const handleAnalyze = useCallback(
    async (accession) => {
      setView('analysis');
      setStatus('processing');
      setLabLoading(true);
      setLabMetrics(null);
      setPdbData(null);
      setPlddtData(null);
      setSelectedProtein(null);
      setError(null);

      try {
        const entryRes = await fetch(`${API_BASE}/api/uniprot/entry/${accession}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!entryRes.ok) {
          const errBody = await entryRes.json().catch(() => ({}));
          throw new Error(errBody.detail || `Failed to fetch entry: ${entryRes.status}`);
        }
        const protein = await entryRes.json();
        setSelectedProtein(protein);
        setSequence(protein.sequence);
        setSeqLength(protein.length);

        if (protein.sequence.length > 2000) {
          addToast(
            'error',
            `Sequence is ${protein.sequence.length} AA — exceeds the 2000 AA limit for ESMFold. Structure prediction skipped.`
          );
          setStatus('error');
          setError('Sequence too long for ESMFold (max 2000 AA)');
          setLabLoading(false);
          return;
        }

        const [predictRes, analyzeRes] = await Promise.all([
          fetch(`${API_BASE}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequence: protein.sequence }),
          }),
          fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequence: protein.sequence }),
          }),
        ]);

        if (analyzeRes.ok) {
          const labData = await analyzeRes.json();
          setLabMetrics(labData);
        } else {
          addToast('warning', 'Lab readiness analysis failed');
        }
        setLabLoading(false);

        if (!predictRes.ok) {
          const errBody = await predictRes.json().catch(() => ({}));
          throw new Error(errBody.detail || `Prediction failed: ${predictRes.status}`);
        }
        const predictData = await predictRes.json();
        setPdbData(predictData.pdb);
        setPlddtData(predictData.plddt);
        setSeqLength(predictData.sequence_length);
        setStatus('complete');
      } catch (err) {
        console.error(err);
        setError(err.message);
        setStatus('error');
        setLabLoading(false);
        addToast('error', err.message);
      }
    },
    [addToast]
  );

  // ---- navigation ----
  const handleBackToSearch = useCallback(() => {
    setView('discovery');
  }, []);

  const handleViewChange = useCallback((newView) => {
    if (newView === 'dashboard') {
      setView('dashboard');
    } else if (newView === 'discovery') {
      setView('discovery');
    }
  }, []);

  // ---- download PDB ----
  const handleDownload = useCallback(() => {
    if (!pdbData) return;
    const blob = new Blob([pdbData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedProtein ? `${selectedProtein.accession}.pdb` : 'predicted.pdb';
    a.click();
    URL.revokeObjectURL(url);
  }, [pdbData, selectedProtein]);

  return (
    <div className="app-layout">
      <Sidebar activeView={view} onViewChange={handleViewChange} />

      <div className="main-wrapper">
        <TopBar
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          view={view}
          onBackToSearch={handleBackToSearch}
        />

        {/* ========== DASHBOARD VIEW ========== */}
        {view === 'dashboard' && (
          <>
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
                    onClick={() => handlePredict()}
                    disabled={status === 'processing'}
                  >
                    Prediction Request
                    <span style={{ fontSize: 18 }}>→</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="left-column">
                <div className="mol-viewer-card">
                  <MolViewer pdbData={pdbData} status={status} />
                  <PredictionStatus status={status} error={error} />
                  <ConfidenceBar plddtData={plddtData} />
                </div>
              </div>

              <div className="right-column">
                <SequenceInput
                  sequence={sequence}
                  setSequence={setSequence}
                  onPredict={() => handlePredict()}
                  status={status}
                />
                <PldtMetrics plddtData={plddtData} sequence={sequence} />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-lg)',
                  }}
                >
                  <ProteinMetrics plddtData={plddtData} seqLength={seqLength} />
                  <GeneInfo status={status} />
                </div>
                <ActionsCard
                  pdbData={pdbData}
                  onDownload={handleDownload}
                  status={status}
                  sequence={sequence}
                />
              </div>
            </div>
          </>
        )}

        {/* ========== DISCOVERY VIEW ========== */}
        {view === 'discovery' && (
          <div className="discovery-layout">
            <SearchPanel
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handleSearch}
              filters={filters}
              setFilters={handleFiltersChange}
              totalResults={totalResults}
              hasSearched={hasSearched}
            />

            {hasSearched && (
              <DiscoveryTable
                results={searchResults}
                totalResults={totalResults}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onAnalyze={handleAnalyze}
                isLoading={searchLoading}
                searchQuery={searchQuery}
                pageSize={25}
              />
            )}
          </div>
        )}

        {/* ========== ANALYSIS VIEW ========== */}
        {view === 'analysis' && (
          <>
            <div className="page-header">
              <div className="page-header__row">
                <div>
                  <h1>{selectedProtein?.proteinName || 'Analyzing Protein…'}</h1>
                  <h2>
                    {selectedProtein
                      ? `${selectedProtein.accession} · ${selectedProtein.organism}`
                      : 'Fetching protein data…'}
                  </h2>
                </div>
                <div className="page-header__actions">
                  <button className="btn btn--ghost" onClick={handleBackToSearch}>
                    ← Back to Results
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="left-column">
                <div className="mol-viewer-card">
                  <MolViewer pdbData={pdbData} status={status} />
                  <PredictionStatus status={status} error={error} />
                  <ConfidenceBar plddtData={plddtData} />
                </div>
              </div>

              <div className="right-column">
                <ProteinBio protein={selectedProtein} />

                {/* ── Subcellular Localization ── */}
                <SubcellularLocation
                  locations={selectedProtein?.subcellularLocations}
                  isLoading={labLoading}
                />

                <LabReadiness metrics={labMetrics} isLoading={labLoading} />
                <PldtMetrics plddtData={plddtData} sequence={sequence} />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-lg)',
                  }}
                >
                  <ProteinMetrics plddtData={plddtData} seqLength={seqLength} />
                  <ActionsCard
                    pdbData={pdbData}
                    onDownload={handleDownload}
                    status={status}
                    sequence={sequence}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
