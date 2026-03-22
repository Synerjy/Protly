# PROTLY — Protein Folding Analysis Dashboard

Protly is a modern, responsive web dashboard built to visualize and analyze protein structures using [ESMFold](https://esmatlas.com/about). 

This project migrates the original Streamlit-based implementation into a robust architecture using a **FastAPI backend** and a **React + Vite frontend** with dynamic 3D molecular visualization, **UniProt-powered protein discovery**, and **lab-readiness metrics**.

## Preview

<img width="1920" height="1080" alt="Screenshot 2026-02-27 230522" src="https://github.com/user-attachments/assets/d633c3e9-add7-4aa9-adf4-f0f65675e958" />

## 🌟 Features

### 🔍 Search & Discovery Engine
*   **UniProt Integration**: Search across the entire UniProt database by protein name, gene name, or accession ID — powered by the UniProt REST API proxied through the backend.
*   **Smart Filters**: Filter results by review status (Swiss-Prot), organism (Human, Mouse, E. Coli), and protein length — all as intuitive inline chips.
*   **Discovery Table**: Paginated results table displaying accession, entry name, protein name, gene, organism, and length with one-click "Analyze" buttons.
*   **Central Search Panel**: A prominent, Google-style search bar with hero heading and horizontally arranged filter chips for an intuitive search-first experience.

### 🧬 Protein Analysis Pipeline
*   **3D Molecular Viewer**: Rendering predicted protein structures in high fidelity using `3Dmol.js`, with switchable visualization styles (Cartoon, Stick, Sphere, Surface).
*   **Seamless ESMFold Integration**: Directly sends sequences to the ESMAtlas API and fetches the predicted `.pdb` structures and `pLDDT` B-factors.
*   **Protein Bio Card**: Displays protein name, gene, organism, length, and a UniProt functional summary upon selection from the discovery table.
*   **Lab-Readiness Metrics**: Calculates Instability Index, Isoelectric Point (pI), and GRAVY score using Biopython's `ProteinAnalysis`, with color-coded stability/acidity/hydrophobicity tags. ([Learn more about the Instability Index calculation here](./docs/instability_index.md))
*   **Confidence Metrics**: Interactive gauges and a per-residue sparkline chart with detailed residue tooltips showing amino acid letters and confidence classifications.
*   **Sequence Validation**: Real-time validation of amino acid sequences with clear feedback for invalid characters.

### 🛠️ Architecture & DX
*   **Multi-Format Export**: Download predicted structures as PDB files or sequences in FASTA format.
*   **Toast Notifications**: Slide-in notifications for errors, warnings, and success messages with auto-dismiss.
*   **Skeleton Loading**: Shimmer loading animations on discovery table rows and lab-readiness tiles during API calls.
*   **State Persistence**: Navigate between discovery results and analysis view without losing search context.
*   **FastAPI Backend**: A lightweight Python REST API with rate limiting, structured logging, and security headers.
*   **Modern React UI**: A custom CSS dashboard featuring a responsive layout and beautiful typography (Inter).

## 📁 Project Structure
```
Protly/
├── backend/
│   ├── main.py              # FastAPI server — prediction, UniProt proxy, analysis
│   └── requirements.txt     # Python dependencies (incl. biopython)
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Root component — three-view state management
│   │   ├── main.jsx          # React entry point
│   │   ├── index.css         # Design system & all styles (~1900 lines)
│   │   └── components/
│   │       ├── MolViewer.jsx        # 3D protein viewer (3Dmol.js)
│   │       ├── SequenceInput.jsx    # Sequence input with validation
│   │       ├── SearchPanel.jsx      # Central search bar & filter chips
│   │       ├── DiscoveryTable.jsx   # Paginated UniProt results table
│   │       ├── ProteinBio.jsx       # Protein metadata & functional summary
│   │       ├── LabReadiness.jsx     # Stability index, pI, GRAVY tiles
│   │       ├── Toast.jsx            # Slide-in toast notifications
│   │       ├── PldtMetrics.jsx      # pLDDT score chart
│   │       ├── ConfidenceBar.jsx    # Circular confidence gauges
│   │       ├── ProteinMetrics.jsx   # Protein analytics summary
│   │       ├── ActionsCard.jsx      # PDB & FASTA export
│   │       ├── PredictionStatus.jsx # Status badge
│   │       ├── GeneInfo.jsx         # Gene & organism tracking
│   │       ├── Sidebar.jsx          # Navigation sidebar
│   │       └── TopBar.jsx           # Top navigation bar
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🏗️ Architecture
*   **Frontend**: React 18, Vite, Chart.js, 3Dmol.js
*   **Backend**: FastAPI, Uvicorn, Requests, Biotite, Biopython, NumPy, SlowAPI

## ⚙️ Prerequisites
*   **Python** 3.10+
*   **Node.js** 18+ and **npm**
*   Internet connection (for ESMAtlas API and UniProt API calls)

## 🚀 Getting Started

To run Protly locally, you will need to start both the Python backend and the Node.js frontend.

### 1. Start the Backend

```bash
cd backend
# Create a virtual environment and activate it if you haven't already
python -m venv myenv
source myenv/bin/activate  # On Windows: myenv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server on port 8000
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
cd frontend
# Install npm dependencies
npm install

# Start the Vite development server on port 5173
npm run dev
```

### 3. Open the App
Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

**Two ways to analyze proteins:**
- **Dashboard** — Paste an amino acid sequence into the Sequence Entry Center and click **Predict** for ESMFold structure prediction.
- **Discovery** — Click the 🔍 icon in the sidebar (or type in the top search bar) to search the UniProt database, filter results, and click **Analyze →** to run the full pipeline.

*(Note: ESMFold prediction can take up to 2 minutes depending on the sequence length and server load.)*

## 🧪 Testing and Code Quality

Protly is equipped with comprehensive automated testing and static analysis for both the frontend and backend. 

### Frontend Tests (Vitest & React Testing Library)
```bash
cd frontend
npm run test       # Run unit and component tests
npm run lint       # Run ESLint to catch bugs
npm run format     # Run Prettier code formatting
```

### Backend Tests (Pytest & FastAPI TestClient)
```bash
cd backend
pytest tests/      # Run all API and validation tests
flake8 .           # Run static analysis
black .            # Run PEP8 auto-formatter
```

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — returns `{ "status": "ok" }` |
| `POST` | `/api/predict` | Predict protein structure from an amino acid sequence |
| `GET` | `/api/uniprot/search` | Proxy filtered searches to the UniProt REST API |
| `GET` | `/api/uniprot/entry/{accession}` | Fetch full protein entry (sequence + metadata) by accession |
| `POST` | `/api/analyze` | Calculate lab-readiness metrics (Instability Index, pI, GRAVY) |

### `POST /api/predict`

**Request body** (JSON):
```json
{
  "sequence": "MGSSHHHHH..."   // 10–2000 chars, standard amino acids only
}
```

**Response** (JSON):
```json
{
  "pdb": "...",                // Full PDB file contents
  "plddt": {
    "mean": 82.5,
    "per_residue": [90.1, 85.3, ...],
    "very_high": 45.2,
    "confident": 30.1,
    "low": 15.0,
    "very_low": 9.7
  },
  "sequence_length": 270
}
```

### `GET /api/uniprot/search`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | *required* | Search term (protein name, gene name, or accession) |
| `reviewed` | bool | `true` | Filter to reviewed (Swiss-Prot) entries only |
| `organism` | string | `""` | Filter by organism: `human`, `mouse`, or `ecoli` |
| `length_min` | int | `1` | Minimum protein length |
| `length_max` | int | `1000` | Maximum protein length |
| `page` | int | `0` | Page number (0-indexed) |
| `size` | int | `25` | Results per page |

### `POST /api/analyze`

**Request body** (JSON):
```json
{
  "sequence": "MGSSHHHHH..."   // 10–10000 chars
}
```

**Response** (JSON):
```json
{
  "instability_index": 40.33,
  "isoelectric_point": 5.22,
  "gravy": 0.1927,
  "is_stable": false,
  "sequence_length": 110
}
```

**Rate limit**: 30 requests per minute per IP (search, entry, analyze); 10/min for predict.

## 📥 Exporting
Once the structure is predicted, you can:
- Click **PDB** to download the `.pdb` file for tools like PyMOL or ChimeraX
- Click **FASTA** to download the sequence in FASTA format

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📜 Credits
*   Inspired by the original Streamlit ESMFold app by Chanin Nantasenamat.
*   Powered by the Meta [ESM-2 language model](https://ai.facebook.com/blog/protein-folding-esmfold-metagenomics/).
*   Protein search powered by the [UniProt REST API](https://www.uniprot.org/help/api).
*   Lab-readiness metrics calculated with [Biopython](https://biopython.org/).

## 📄 License
This project is for educational and research purposes. See the repository for license details.
