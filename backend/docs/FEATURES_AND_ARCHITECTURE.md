# Protly Backend — Features & Architecture Documentation

## 1) Overview
Protly backend is a FastAPI service that powers sequence-to-insight workflows for protein analysis. It currently provides:

- **Health monitoring** for service readiness.
- **Structure prediction integration** via ESMAtlas (PDB output).
- **Confidence extraction** (pLDDT-derived quality signals).
- **Solubility estimation** (heuristic/dummy MVP logic).
- **Stability estimation** (deterministic heuristic model).
- **Basic robustness controls** (rate limiting, request logging, security headers, input validation).

This document explains **what each feature is for**, **which problem it solves**, **why it is needed**, **how it works**, and **what can be improved next**.

---

## 2) Why this backend exists (Problem & Need)

### Problem space
Protein researchers and students often need a quick way to:
1. Convert an amino-acid sequence into an estimated 3D structure.
2. Assess reliability/quality of that structure.
3. Screen sequence properties (solubility, stability) before deeper experiments.

### Need
Most users do not want to manually combine multiple tools/APIs and parse scientific files themselves. They need:
- A single API service with consistent request/response patterns.
- Fast validation feedback on sequence input.
- Reproducible feature outputs for downstream UI and analysis.
- Isolation between features so one failure does not collapse the entire system.

Protly backend addresses these needs by exposing cohesive endpoints with shared middleware and modular feature logic.

---

## 3) Core design principles

1. **Thin API layer, focused feature logic**
   - Routing/HTTP concerns stay in `main.py`.
   - Computation logic can live in dedicated modules (e.g., `stability.py`).

2. **Modularity for fault isolation**
   - Features are endpoint-scoped.
   - A failure in one feature should return a controlled error for that feature, not crash unrelated endpoints.

3. **Validated inputs early**
   - Sequence cleaning/validation is performed via Pydantic validators.

4. **Operational safeguards**
   - Rate limiting protects from request abuse.
   - Request logging and security headers improve observability and baseline hardening.

---

## 4) Feature-by-feature documentation

## 4.1 Health Check — `GET /api/health`
### What it is for
Quick service liveness/readiness checks.

### Issue it solves
Without a health endpoint, orchestration, deployment checks, and monitoring tools cannot quickly confirm whether the backend is up.

### How it works
Returns a simple JSON status payload (`{"status":"ok"}`).

### Future enhancement
- Add dependency-level checks (e.g., external API status probe, queue/db checks when introduced).

---

## 4.2 Structure Prediction — `POST /api/predict`
### What it is for
Predicts 3D structure (PDB) from amino-acid sequence using ESMAtlas.

### Issue it solves
Users need programmatic protein folding output without manually calling external services and parsing raw responses.

### Need
Structure is foundational for most protein analysis workflows and visualization features in frontend.

### How it solves
1. Validates and cleans sequence.
2. Calls ESMAtlas fold API.
3. Parses returned PDB.
4. Extracts pLDDT (confidence) from B-factor fields.
5. Returns PDB + confidence summary in one response.

### Tech used
- `requests` for external API calls.
- `biotite` for PDB parsing.
- `numpy` for confidence aggregation.
- FastAPI + Pydantic for API contracts.

### Model details
- Folding model is external (**ESMAtlas/ESMFold API**).
- Confidence bands are bucketed from per-residue pLDDT values.

### Future enhancement
- Retry/backoff/circuit breaker around ESM calls.
- Caching for repeated sequences.
- Async HTTP client for better concurrency.

---

## 4.3 Confidence Metrics (within predict response)
### What it is for
Provides model-confidence interpretability:
- mean pLDDT
- per-residue pLDDT
- class percentages (very high/confident/low/very low)

### Issue it solves
Raw structures without confidence are hard to trust for decision-making.

### Need
Frontend charts/gauges and residue-level interpretation require structured confidence data.

### How it solves
Parses B-factor-like fields from PDB and transforms them into UI-friendly metrics.

### Future enhancement
- More granular residue annotation.
- Region-level confidence summaries.

---

## 4.4 Solubility Estimation — `POST /api/solubility`
### What it is for
Provides quick sequence-based solubility estimate for early screening.

### Issue it solves
Users need a lightweight proxy for solubility before running heavier models/experiments.

### Need
Useful triage signal during sequence exploration.

### How it solves
Calculates simple biochemical features (hydrophobicity + charge ratio) and maps to score/class.

### Current model status
- MVP heuristic/dummy logic.
- Includes random perturbation to mimic uncertainty in prototype stage.

### Future enhancement
- Replace with deterministic calibrated model and benchmarked dataset.
- Add confidence intervals derived from real training data.

---

## 4.5 Solubility Search — `GET /api/solubility/search`
### What it is for
Demonstrates searchable solubility records (currently dummy data).

### Issue it solves
Shows expected API shape for future indexed/dataset-backed lookup.

### Need
Useful for frontend list/search UX and contract prototyping.

### Future enhancement
- Back by real datastore.
- Pagination, sorting, filtering, auth-protected access.

---

## 4.6 Stability Estimation — `POST /api/stability`
### What it is for
Returns deterministic stability metrics for a given sequence.

### Issue it solves
Earlier implementation lacked a dedicated stability signal, limiting analysis breadth.

### Need
Stability is a key screening dimension alongside structure and solubility.

### How it solves
- Endpoint accepts validated sequence input.
- Calls modular function `compute_stability_metrics(sequence)`.
- Computes:
  - aromaticity
  - aliphatic index approximation
  - charge density
  - disorder-promoting residue fraction
  - derived instability index
  - stability score and class

### Tech + model
- Pure Python deterministic heuristic (no random component).
- Encapsulated in `backend/stability.py` for modularity and easier replacement.

### Why deterministic is useful now
- Reproducible outputs for same input.
- Easier testing/debugging.
- Predictable behavior for frontend integration.

### Future enhancement
- Replace heuristic with ML model trained on curated stability datasets.
- Add calibration, confidence bounds, and model version metadata.
- Add explainability outputs for residue-level contributions.

---

## 5) Input validation strategy

All sequence endpoints rely on Pydantic validation to:
- strip whitespace/digits,
- uppercase residue letters,
- reject non-standard amino-acid characters,
- enforce length constraints.

This prevents invalid data from flowing into expensive downstream logic.

Future improvement: centralize validation into a shared model/mixin to avoid duplication.

---

## 6) Modularity and failure isolation (important for team development)

### Current isolation mechanisms
1. **Endpoint boundaries**
   - Each feature has an independent route handler and response model.

2. **Feature module separation**
   - Stability computation is in `backend/stability.py`, separate from route orchestration.

3. **Controlled exceptions**
   - Stability endpoint wraps compute call and returns graceful `500` on internal failures.

4. **Cross-cutting concerns via middleware**
   - Logging/security headers are global yet non-invasive to feature-specific logic.

### Why this matters
In team environments, independent contributors can evolve one feature with lower risk of breaking unrelated workflows.

### Additional recommended modularity improvements
- Move solubility logic to `backend/solubility.py`.
- Move prediction logic to `backend/predict_service.py`.
- Add `backend/schemas.py` (shared request/response models).
- Add automated tests per feature module.

---

## 7) Security & reliability posture (current state)

### Implemented
- CORS configuration.
- Security response headers.
- Rate limiting (`slowapi`).
- Input validation.
- Request logs and exception logs.

### Gaps / next steps
- Authentication/authorization.
- Structured error IDs + tracing.
- Centralized exception mapping.
- Rate-limit tuning per endpoint sensitivity.

---

## 8) Technology stack

- **Framework:** FastAPI
- **Validation:** Pydantic
- **ASGI server:** Uvicorn
- **External API:** ESMAtlas folding endpoint
- **Data/science libs:** NumPy, Biotite, Pandas (confidence helper module)
- **Protection:** SlowAPI rate limiting

---

## 9) Model summary table

| Feature | Model Type | Deterministic? | Data Source | Production-readiness |
|---|---|---:|---|---|
| Structure prediction | External deep model (ESMAtlas/ESMFold) | Yes (service-defined) | External API | Medium (depends on external SLA) |
| Confidence metrics | Rule-based post-processing | Yes | PDB B-factor/pLDDT | High for MVP |
| Solubility | Heuristic prototype | No (current random perturbation) | Sequence-derived | Low/Prototype |
| Stability | Heuristic module | Yes | Sequence-derived | Medium for MVP |

---

## 10) Suggested roadmap

### Phase 1 (short-term)
- Add tests for stability module and validators.
- Remove randomness from solubility (or version it as prototype).
- Add docs/OpenAPI examples for all endpoints.

### Phase 2 (mid-term)
- Move all feature logic into separate service modules.
- Add shared schemas and utilities package.
- Add structured logging + request correlation IDs.

### Phase 3 (long-term)
- Train/serve dedicated ML models for solubility and stability.
- Add auth, persistence, job queue for long-running tasks.
- Add batch endpoints and async processing.

---

## 11) How to extend a new feature safely (team guideline)

1. Create `backend/<feature>.py` with pure computation/service logic.
2. Keep route handlers thin in `main.py`.
3. Define request/response schemas clearly.
4. Add endpoint-level error handling.
5. Add tests:
   - happy path,
   - validation errors,
   - feature failure isolation.
6. Document feature in this docs folder.

This process helps ensure one feature issue does not cascade into a full-system failure.

---

## 12) Conclusion
Protly backend is evolving from an MVP monolith toward a modular analysis platform. The recent stability feature and modular extraction are steps in the right direction. By continuing to separate feature logic, standardize validation, improve tests, and document contracts, the team can scale safely while keeping reliability high.
