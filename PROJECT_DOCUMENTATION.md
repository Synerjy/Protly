# Protly - Comprehensive Project Documentation

Welcome to the comprehensive documentation for **Protly**. This document provides an in-depth overview of the project's architecture, technical stack, core features, and implementation details based entirely on a code-level analysis of the repository. It is designed to be the single source of truth for onboarding new developers or understanding the system without requiring additional explanation.

---

## 1. Project Overview

**Protly** is a full-stack web application designed for protein structure prediction, visualization, and biomedical analysis. 

It allows users to:
- Input amino acid sequences to predict 3D protein structures using an ESMFold-based prediction backend (via the ESMAtlas API).
- Visualize the predicted 3D structures interactively.
- Analyze prediction confidence metrics (pLDDT).
- Search the UniProt database for known proteins and fetch their metadata.
- Calculate essential lab-readiness biochemical properties of proteins (Instability Index, Isoelectric Point, GRAVY).

---

## 2. Architecture & Tech Stack

Protly follows a decoupled frontend-backend architecture.

### 2.1 Frontend (React + Vite)
The frontend is a Single Page Application (SPA) built with React and bundled using Vite.
- **Core Frameworks**: React 19.2, Vite.
- **Styling**: Vanilla CSS (`index.css`) emphasizing a dark-mode, premium UI with smooth transitions and glassmorphism elements.
- **Routing/State**: Managed primarily via React local state (`useState`, `useCallback`) within a primary layout orchestrator (`App.jsx`).
- **Key Libraries**:
  - `3dmol`: Used in `MolViewer.jsx` to render interactive 3D models of protein structures based on PDB data.
  - `chart.js` / `react-chartjs-2`: Powers the graphical rendering of pLDDT metrics (per-residue confidence lines/bars).
  - `recharts`: Alternate charting library for other analytical visualizations.
- **Testing**: Setup with `vitest` and `@testing-library/react`.

### 2.2 Backend (FastAPI / Python)
The backend is a high-performance RESTful API that handles analytical computations, rate-limiting, and proxies external biological APIs.
- **Core Framework**: FastAPI, served via Uvicorn.
- **Rate Limiting**: Implemented using `slowapi` to prevent abuse (e.g., 10 predictions/min, 30 UniProt searches/min).
- **Key Python Libraries**:
  - `biotite`: Parses the PDB structures returned from ESMFold to reliably extract `b_factor` data, which maps to the pLDDT confidence scores.
  - `biopython`: Powers the `/api/analyze` endpoint. Uses `Bio.SeqUtils.ProtParam.ProteinAnalysis` to calculate biochemical metrics.
  - `requests` / `httpx`: Handles secure outbound HTTP calls to UniProt and ESMAtlas APIs.
  - `numpy`: Fast mathematical aggregation and distribution calculations of pLDDT scores.


### 2.3 Auxiliary Components
- **ESMFold Streamlit App (`esmfold-master` directory)**: Contains an alternative, standalone `streamlit_app.py` for interacting with ESMFold structure predictions natively in Python, acting potentially as a prototype or a specialized tool alongside the main stack.

---

## 3. Core Functionality & Implementation

### 3.1 Feature: Protein Structure Prediction
- **Frontend Flow**: User enters an amino acid sequence in `SequenceInput.jsx`. `App.jsx` issues a POST to `/api/predict`. 
- **Backend Flow**:
  1. Sequence is validated by Pydantic (`PredictRequest`) against valid 20 standard amino acid characters. Length is constrained (10 to 2000 AAs).
  2. The endpoint fires a POST request to the remote ESMAtlas fold endpoint: `https://api.esmatlas.com/foldSequence/v1/pdb/`.
  3. The raw PDB string is obtained.
  4. The backend writes the string to a temporary file and uses **Biotite** (`bsio.load_structure`) to parse it. 
  5. It extracts the `b_factor` field array for the alpha carbons, converting this directly into pLDDT scores.
  6. **Numpy** is used to classify the confidence bands:
     - **Very High**: > 90
     - **Confident**: 70 - 90
     - **Low**: 50 - 70
     - **Very Low**: < 50
- **Visualization**: Data returns to the frontend. `MolViewer.jsx` uses `3dmol` to spin up an interactive 3D WebGL viewer of the PDB output. `ConfidenceBar.jsx` and `PldtMetrics.jsx` visualize the confidence metrics using Chart.js.

### 3.2 Feature: UniProt Discovery & Search
- **Frontend Flow**: Switching the view to '*Discovery*' opens the `SearchPanel.jsx` and `DiscoveryTable.jsx`.
- **Filters**: Users can toggle 'Reviewed' (Swiss-Prot), Organism specificity, and Max Sequence Length.
- **Backend Flow (`/api/uniprot/search`)**: Proxy endpoint converts UI filters into a complex Solr query string (e.g., `(reviewed:true) AND (organism_id:9606) AND (length:[1 TO 1000])`). Fetches paginated JSON results from UniProt REST API, standardizing fields (Gene Name, Accession, Organism) for the frontend discovery table.

### 3.3 Feature: Lab Readiness Analysis
- When a user selects a protein from the Discovery Table, the view shifts to '*Analysis*'.
- **Frontend Flow**: Triggers concurrent requests to `/api/predict` (for structure) and `/api/analyze` (for properties).
- **Backend Flow (`/api/analyze`)**: 
  - Passes sequence to Biopython's `ProteinAnalysis`.
  - Calculates **Instability Index** (predicts in vitro stability, `<40` generally considered stable).
  - Calculates **Isoelectric Point** (pI, the pH where the molecule carries no net electric charge).
  - Calculates **GRAVY** (Grand Average of Hydropathy, indicating hydrophobicity).
- **Frontend Rendering**: Displayed prominently in `LabReadiness.jsx` via visual gauges or metric cards.

---

## 4. UI/UX & Views Structure

The application heavily utilizes React conditional rendering mapped to a local `view` state (`dashboard`, `discovery`, `analysis`) inside `App.jsx`.

1. **Dashboard View (Custom Sequence)**
   - Left side: 3D `MolViewer`, `PredictionStatus` indicators, general `ConfidenceBar` of the complete protein.
   - Right side: `SequenceInput` form, dynamic `PldtMetrics` charts, general sequence statistics `ProteinMetrics`, and file export via `ActionsCard`.

2. **Discovery View (Database Search)**
   - `SearchPanel`: Form inputs hooked to React state that trigger API calls on submit.
   - `DiscoveryTable`: Paginated responsive data table mapping over results array. Features an "Analyze" action button per row.

3. **Analysis View (Selected UniProt Protein)**
   - Header shows UniProt Accession, Protein Name, and Organism.
   - Pre-populates structure prediction and embeds `ProteinBio` (function/text descriptions from UniProt) and the specialized `LabReadiness` UI component calculating viabilities of wet-lab synthesis.

## 5. Security & Stability Implementations

- **Backend Middlewares**:
  - **CORS**: Secured to local/staging Vite environments.
  - **Security Headers Middleware**: Enforces `nosniff`, `X-Frame-Options: DENY`, strict `Content-Security-Policy`, and strips Permissions-Policy access to hardware.
- **Limiting**: `limiter.limit` (from `slowapi`) hard-caps computation-heavy endpoints to prevent DoS.
- **Error Handling**: Graceful fallback arrays in the frontend, explicit `HTTPException` blocks targeting upstream fails (e.g. 502 Bad Gateway if ESMAtlas drops). Temporary files created during Biotite parsing are securely closed and unlinked in `finally`/completion blocks to prevent memory/storage leaks.
