# Protly — Protein Folding Analysis Dashboard

Protly is a modern, responsive web dashboard built to visualize and analyze protein structures using [ESMFold](https://esmatlas.com/about). 

This project migrates the original Streamlit-based implementation into a robust architecture using a **FastAPI backend** and a **React + Vite frontend** with dynamic 3D molecular visualization.

## Preview

<img width="1920" height="1080" alt="Screenshot 2026-02-27 230522" src="https://github.com/user-attachments/assets/d633c3e9-add7-4aa9-adf4-f0f65675e958" />

## 🌟 Features
*   **3D Molecular Viewer**: Rendering predicted protein structures in high fidelity using `3Dmol.js`.
*   **Seamless ESMFold Integration**: Directly sends sequences to the ESMAtlas API and fetches the predicted `.pdb` structures and `pLDDT` B-factors.
*   **Confidence Metrics**: Interactive gauges and a per-residue sparkline chart that visualizes High, Confident, and Low `pLDDT` regions.
*   **FastAPI Backend**: A lightweight Python REST API proxying requests to ESMAtlas and processing the resulting PDB files into detailed metrics.
*   **Modern React UI**: A custom CSS dashboard featuring a responsive layout and beautiful typography (Inter), fully replacing the Streamlit constraints.

## 🏗️ Architecture
*   **Frontend (/frontend)**: React 18, Vite, Chart.js, 3dmol.js
*   **Backend (/backend)**: FastAPI, Uvicorn, Requests, Biotite, Numpy

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
Paste your amino acid sequence into the **Sequence Entry Center** and hit **Predict**.

*(Note: The prediction can take up to 2 minutes depending on the sequence length and ESMAtlas server load.)*

## 📥 Exporting
Once the structure is predicted, you can click **Download PDB** to save the `.pdb` file locally for further analysis in tools like PyMOL or ChimeraX.

## 📜 Credits
*   Inspired by the original Streamlit ESMFold app by Chanin Nantasenamat.
*   Powered by the Meta [ESM-2 language model](https://ai.facebook.com/blog/protein-folding-esmfold-metagenomics/).
