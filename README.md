# EmotionTrace

> **AI-Powered Bug Origin Prediction Using Developer Sentiment and Git History**  
> *Academic Minor Project — Phase 3: Real GitHub Repository Integration & Ingestion*

---

## 📌 Project Overview

**EmotionTrace** is an academic research engineering project investigating the predictive correlation between **developer affective state (sentiment/stress)** and **software defect inception**. 

By fusing the classical **Śliwerski-Zimmermann-Zeller (SZZ) algorithm** (which traces bug fixes to inducing commits via AST git-blame analysis) with **Natural Language Processing (NLP)** sentiment analysis (VADER + fine-tuned RoBERTa) performed on commit messages and code review exchanges, EmotionTrace predicts defect-inducing commits before they manifest as critical production incidents.

In **Phase 3**, real GitHub repository ingestion is implemented using **Octokit** and GitHub REST API, persisting repository metadata, commit histories, code churn (additions, deletions, changed files count), and author information into **MongoDB Atlas**.

---

## 🛠️ Mandatory Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Dark-mode-first high-performance UI |
| **Styling** | Tailwind CSS | Modern bespoke glassmorphism & typography |
| **Visualizations**| Recharts | Interactive radar, timeline, and risk distribution charts |
| **Icons** | Lucide React | Modern visual indicators and navigation iconography |
| **HTTP Client** | Axios | Frontend-to-backend API communication |
| **Backend** | Express.js, Node.js, TypeScript | RESTful API server with centralized error handling |
| **Data Persistence**| **MongoDB Atlas & Mongoose** | Document modeling for repositories, commits, and analysis history |
| **Git Integration** | **Octokit (GitHub REST API v3)** | Repository metadata, commit history, code churn, and changed file extraction |
| **Validation** | Zod & Custom ObjectId Middleware | Runtime schema, URL parser, and ObjectId hex validation |

---

## 🚀 Phase 3: GitHub Ingestion Architecture

### Ingestion Workflow
1. **Repository Submission**: The user submits a GitHub repository URL (e.g. `https://github.com/facebook/react`, `pallets/flask`, or `git@github.com:torvalds/linux.git`).
2. **URL Normalization**: `parseGitHubUrl` parses and normalizes the input into `{ owner, repo }`, validating GitHub naming constraints and rejecting non-GitHub domains.
3. **Metadata Fetching**: Octokit queries `octokit.rest.repos.get({ owner, repo })` to extract repository stars, forks, open issues, default branch, primary language, size, topics, and visibility.
4. **Repository Upsert**: The repository record is upserted into the MongoDB `repositories` collection (`fullName: owner/repo`). If it exists, metadata and default branch are updated; if not, a new document is registered.
5. **Analysis Run Created**: An `Analysis` record is created with `status: 'in_progress'` and `startedAt: Date.now()`.
6. **Commit Extraction**: Octokit retrieves recent commit history via `octokit.rest.repos.listCommits` and enriches each commit with detailed diff churn (`stats.additions`, `stats.deletions`, changed files list) via `octokit.rest.repos.getCommit`.
7. **Duplicate Prevention & Idempotency**: Commits are written using `Commit.bulkWrite` with `updateOne` + `$setOnInsert` and `upsert: true`. Existing commits are preserved and never duplicated (enforced by compound unique index `{ repositoryId: 1, hash: 1 }`).
8. **Completion Telemetry**: Repository and Analysis records are updated with `status: 'completed'`, execution duration, and total commits count.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:
```bash
Copy-Item server/.env.example server/.env
Copy-Item .env.example .env
```

| Variable | Description | Required | Example |
|---|---|---|---|
| `PORT` | Backend server port | Optional (default: `5000`) | `5000` |
| `NODE_ENV` | Runtime environment | Optional (default: `development`) | `development` |
| `CLIENT_URL` | Frontend client origin (CORS) | Optional (default: `http://localhost:5173`) | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas SRV connection string | Required for persistence | `mongodb+srv://user:pass@cluster0.mongodb.net/emotiontrace` |
| `GITHUB_TOKEN` | GitHub Personal Access Token | Optional (increases rate limit to 5,000/hr) | `ghp_xxxxxxxxxxxxxxxxxxxx` |

> **Rate Limit Management**: Without `GITHUB_TOKEN`, GitHub limits unauthenticated requests to 60 requests/hour per IP. Setting a personal access token raises the threshold to 5,000 requests/hour.

---

## 📡 REST API Endpoints

All responses follow a consistent JSON envelope:
```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "timestamp": "2026-11-02T10:00:00.000Z"
}
```

| Method | Endpoint | Description | Validation / Query Params |
|---|---|---|---|
| `GET` | `/api/health` | Live system health and MongoDB telemetry | Returns uptime, memory, and database status |
| `POST`| `/api/repositories/analyze` | **Ingest real GitHub repository & commits** | Body: `{ url: string, branch?: string, maxCommits?: number }` |
| `GET` | `/api/repositories` | List stored repositories | Supports `page`, `limit`, `status`, `search` |
| `POST`| `/api/repositories` | Register a new repository document | Validates body; rejects duplicates (409) |
| `GET` | `/api/repositories/:id` | Get repository details and commit count | Validates 24-hex ObjectId (400 on invalid) |
| `GET` | `/api/repositories/:id/commits` | Get paginated commits for repository | Supports `page`, `limit`, `riskLevel`, `sentimentTone`, `search` |
| `GET` | `/api/analyses` | List historical analysis runs | Supports `repositoryId`, `status`, `page`, `limit` |
| `POST`| `/api/analyses` | Record a new analysis execution | Validates repository existence |
| `GET` | `/api/analyses/:id` | Get analysis run details | Populates repository metadata; validates ObjectId |

---

## 🧪 Automated Testing & Verification

Execute all unit and integration test suites:
```bash
npm run test
```

### Test Coverage (38 Passing Tests across 4 Suites)
1. **`health.test.ts`**: Verifies root metadata, Phase 3 health payload, memory statistics, and 404 route handling.
2. **`dbUnavailable.test.ts`**: Verifies that when MongoDB is disconnected or unconfigured, the API returns graceful HTTP 503 errors and never crashes.
3. **`dbPersistence.test.ts`**: Runs against in-memory MongoDB to verify:
   - Real MongoDB connection establishment.
   - Document creation and duplicate repository rejection (HTTP 409).
   - Compound unique indexing (`repositoryId + hash`) preventing duplicate commits.
   - Repository listing and ID detail retrieval.
   - Commit pagination (`page`, `limit`, `totalPages`, `hasNext`, `hasPrev`).
   - Commit filtering by risk level (`critical`, `high`, `moderate`, `low`) and sentiment tone.
   - Hexadecimal ObjectId validation (HTTP 400 Bad Request on invalid format).
   - 404 Not Found handling on nonexistent ObjectIds.
   - Analysis run recording, listing with population, and detail retrieval.
4. **`githubIngestion.test.ts`**:
   - URL parsing: HTTPS, HTTP, www, trailing slashes, `.git`, shorthand `owner/repo`, and SSH format.
   - URL rejection: non-GitHub domains, malformed strings, and empty input.
   - Input validation: missing `url` (400) and invalid format (400).
   - End-to-end ingestion: metadata extraction, code churn, author details, and MongoDB persistence.
   - Duplicate prevention & idempotency: re-analyzing the same repository stores 0 duplicate commits.
   - Error handling: GitHub 404 (Not Found) and GitHub 403 (Rate Limit Exceeded).
   - Edge cases: repositories with 0 commits handled cleanly.
   - Pagination and search across persisted commits.

---

## 💻 Running the Application

```bash
# Run both Frontend Dashboard and Backend API concurrently:
npm run dev

# Or run workspaces separately:
npm run dev:server      # Starts Express on http://localhost:5000
npm run dev:client      # Starts Vite on http://localhost:5173

# Compile production bundles:
npm run build
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔮 Phase 4 Roadmap

1. **RoBERTa / VADER NLP Pipeline:** Sentiment scoring on ingested commit messages and developer issue discussions.
2. **AST Git Blame SZZ Engine:** Identify bug-introducing commit candidates using SZZ algorithm AST diff tracing.
3. **Cross-Correlation ML Model:** Train Random Forest and XGBoost classifiers on affective cues + code churn to predict defect probability.

---

## 📄 Academic Attribution & Licensing

Developed as an Academic Minor Engineering Project (2026).  
Licensed under the [MIT License](LICENSE).
