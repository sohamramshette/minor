# EmotionTrace 🔍⚡

> **AI-Powered Bug Origin Prediction Using Developer Sentiment and Git History**  
> *Academic Minor Project — Phase 2: MongoDB Atlas Persistence Layer & REST API*

---

## 📌 Project Overview

**EmotionTrace** is an academic research engineering project investigating the predictive correlation between **developer affective state (sentiment/stress)** and **software defect inception**. 

By fusing the classical **Śliwerski-Zimmermann-Zeller (SZZ) algorithm** (which traces bug fixes to inducing commits via AST git-blame analysis) with **Natural Language Processing (NLP)** sentiment analysis (VADER + fine-tuned RoBERTa) performed on commit messages and code review exchanges, EmotionTrace predicts defect-inducing commits before they manifest as critical production incidents.

In **Phase 2**, a complete MongoDB Atlas persistence layer is implemented with Mongoose models, compound indexing, query pagination, and REST API endpoints.

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
| **Git Integration** | Octokit (GitHub REST & GraphQL API) | Commit history, blame, and churn extraction (Phase 3) |
| **Validation** | Zod & Custom ObjectId Middleware | Runtime schema and ObjectId hex validation |

---

## 🗄️ MongoDB Atlas Setup Guide

### 1. Create a Free MongoDB Atlas Cluster
1. Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create an account.
2. Create a new project named `EmotionTrace`.
3. Deploy a free **M0 Sandbox** cluster (AWS, GCP, or Azure).

### 2. Configure Database Access
1. In the left navigation, go to **Security** &gt; **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password Authentication**:
   - Username: e.g. `emotiontrace_admin`
   - Password: generate or choose a secure password (avoid raw special characters or URL-encode them).
4. Assign the user **Read and write to any database** privileges.

### 3. Configure Network Access (IP Whitelist)
1. Go to **Security** &gt; **Network Access**.
2. Click **Add IP Address**.
3. For development, you can select **Allow Access from Anywhere** (`0.0.0.0/0`) or add your current public IP.

### 4. Obtain the Connection String
1. Under **Deployment** &gt; **Database**, click **Connect** on your cluster.
2. Select **Drivers** (Node.js).
3. Copy the SRV connection URI:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/emotiontrace?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your credentials, and specify `/emotiontrace` as the database name.

### 5. Set Environment Variables
Copy and update `.env`:
```bash
# On Windows PowerShell:
Copy-Item server/.env.example server/.env
Copy-Item .env.example .env
```
Paste your MongoDB Atlas connection string into `server/.env`:
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/emotiontrace?retryWrites=true&w=majority
```

> **Standalone Development Mode**: If `MONGODB_URI` is omitted or unconfigured, the backend automatically operates in standalone mode, reporting `services.database: "unconfigured"`. When database endpoints are queried without MongoDB, they return structured `503 Service Unavailable` responses without crashing.

---

## 📐 Data Models & Schema Design

### 1. `Repository` (`server/src/models/Repository.ts`)
- `fullName`: Unique string index (e.g. `facebook/react`).
- `owner`: String index (e.g. `facebook`).
- `name`: String (e.g. `react`).
- `githubUrl`: String.
- `defaultBranch`: String (default `main`).
- `metadata`: Nested object containing `description`, `language`, `stars`, `forks`, `openIssues`, `sizeKb`, `topics`, `isPrivate`.
- `status`: `'idle' | 'pending' | 'analyzing' | 'completed' | 'failed'`.
- `analyzedAt`: Date.
- `timestamps`: `createdAt`, `updatedAt`.

### 2. `Commit` (`server/src/models/Commit.ts`)
- `repositoryId`: ObjectId referencing `Repository` (indexed).
- `hash`: Commit SHA (indexed).
- `shortHash`: 7-character prefix.
- `message`: Commit commit message.
- `author`: Nested object `{ name, email, date, avatarUrl }`.
- `authoredDate`: Date (indexed for time-series sorting).
- `churn`: Code churn metrics `{ insertions, deletions, filesCount }`.
- `sentiment`: Affective metrics `{ score, tone, confidence, keywords, stressIndicator }`.
- `bugRisk`: Fault metrics `{ probability, level, factors }`.
- `isInducingCandidate`: Boolean flag (indexed).
- `status`: `'pending' | 'analyzed' | 'skipped'`.
- **Compound Unique Index**: `{ repositoryId: 1, hash: 1 }` strictly enforces that no duplicate commits can exist within the same repository.

### 3. `Analysis` / `AnalysisHistory` (`server/src/models/Analysis.ts`)
- `repositoryId`: ObjectId referencing `Repository`.
- `status`: `'pending' | 'in_progress' | 'completed' | 'failed'`.
- `branch`: Branch analyzed.
- `startedAt`, `completedAt`, `durationMs`.
- `summaryMetrics`: Aggregates `{ totalCommits, highRiskCommits, averageStressIndex, correlationScore, detectedBugOrigins, mlAccuracy }`.
- `error`: Error traceback if failed.

---

## 🌐 Phase 2 REST API Endpoints

All responses follow a consistent JSON envelope:
```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "timestamp": "2026-10-26T02:07:29.358Z"
}
```

| Method | Endpoint | Description | Validation / Query Params |
|---|---|---|---|
| `GET` | `/api/health` | Live system health and MongoDB telemetry | Returns uptime, memory, and database status |
| `GET` | `/api/repositories` | List stored repositories | Supports `page`, `limit`, `status`, `search` |
| `POST`| `/api/repositories` | Register a new repository | Validates body; rejects duplicates (409) |
| `GET` | `/api/repositories/:id` | Get repository details | Validates 24-hex ObjectId (400 on invalid) |
| `GET` | `/api/repositories/:id/commits` | Get paginated commits for repository | Supports `page`, `limit`, `riskLevel`, `sentimentTone`, `search` |
| `GET` | `/api/analyses` | List historical analysis runs | Supports `repositoryId`, `status`, `page`, `limit` |
| `POST`| `/api/analyses` | Record a new analysis execution | Validates repository existence |
| `GET` | `/api/analyses/:id` | Get analysis run details | Populates repository metadata; validates ObjectId |

---

## 🧪 Automated Testing & Verification

Execute all unit and integration test suites:
```bash
npm run test --workspace=server
```

### Test Coverage (23 Passing Tests across 3 Suites)
1. **`health.test.ts`**: Verifies root metadata, Phase 2 health payload, memory statistics, and 404 route handling.
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

---

## 🏃 Running the Application

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

## 🔮 Phase 3 Roadmap

1. **Octokit Live Ingestion:** Connect GitHub Personal Access Token to ingest real commit trees, PR comments, and blame logs directly into MongoDB collections.
2. **RoBERTa / VADER NLP Pipeline:** Live inference pipeline using fine-tuned transformer weights for software engineering sentiment classification.
3. **AST Git Blame SZZ Engine:** Implement SZZ commit tracing to automatically pinpoint bug-introducing changes.

---

## 📄 Academic Attribution & Licensing

Developed as an Academic Minor Engineering Project (2026).  
Licensed under the [MIT License](LICENSE).
#   m i n o r  
 