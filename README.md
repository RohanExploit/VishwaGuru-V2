## VishwaGuru

VishwaGuru is an open‑source civic-tech platform that helps India’s youth engage with democracy.  
It uses AI to turn everyday evidence (photos, videos, descriptions) into concrete actions like contacting representatives, filing grievances, and organizing local campaigns.

### Key Features

- **AI-powered action plans**: Uses Google Gemini to generate WhatsApp messages, email drafts, and escalation plans for civic issues.
- **Issue reporting**: Report issues via a modern web app and a Telegram bot.
- **Local & production ready**: SQLite for local development, PostgreSQL for production.
- **Modern stack**: React + Vite + Tailwind CSS on the frontend; FastAPI + SQLAlchemy on the backend.

---

## Project Structure

- `backend/` – FastAPI app, AI integration, database models, Telegram bot.
- `frontend/` – React (Vite) SPA for the user-facing interface.
- `data/` – Sample/reference data for responsibilities and mappings.
- `tests/` – Automated tests for backend and integration flows.
- `render.yaml`, `netlify.toml` – Deployment configuration for Render (backend) and Netlify (frontend).

For a deeper architectural overview, see `ARCHITECTURE.md` and `IMPLEMENTATION_SUMMARY.md`.

---

## Prerequisites

Install these before you start:

- **Python 3.10+** (3.8+ may work, but 3.10+ is recommended)
- **Node.js 18+** and **npm**
- **Git**

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your_github_repo_url>
cd VishwaGuru
```

> Replace `<your_github_repo_url>` with the URL of the GitHub repo you create for this project.

### 2. Backend setup

The backend powers the API, AI services, database, and Telegram bot.

1. **Create and activate a virtual environment** (from the project root):

   ```bash
   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate

   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install backend dependencies**:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Environment configuration**

   Create a `.env` file in the project root (next to `backend/` and `frontend/`).

   Required variables:

   - `TELEGRAM_BOT_TOKEN` – Token from `@BotFather` for the Telegram bot.
   - `GEMINI_API_KEY` – API key from Google AI Studio.
   - `DATABASE_URL` – Optional; defaults to `sqlite:///./backend/data/issues.db` if not set.

   If you have an `.env.example` file, you can start from it:

   ```bash
   cp .env.example .env   # Linux/macOS
   ```

   Then edit `.env` with your own values.

### 3. Frontend setup

From the project root:

```bash
cd frontend
npm install
cd ..
```

---

## Running the App in Development

### 1. Start the backend (FastAPI + Telegram bot)

From the project root, with your virtual environment activated:

```bash
cd backend
python -m uvicorn main:app --reload
```

- Backend API: `http://localhost:8000`
- OpenAPI docs: `http://localhost:8000/docs`

> **Note (Windows/PowerShell)**: You do **not** need `PYTHONPATH` hacks if you run the command from inside the `backend/` directory as shown above.

### 2. Start the frontend (React + Vite)

In a **new terminal** window:

```bash
cd frontend
npm run dev
```

By default, the frontend runs on `http://localhost:5173`.

If your backend runs on a different host/port, set:

```bash
VITE_API_URL=http://localhost:8000
```

in a `frontend/.env` or `frontend/.env.local` file.

---

## Tests & Basic Stability Checks

The repository includes backend tests under `tests/`.

After activating your virtual environment and installing backend dependencies:

```bash
cd backend
pytest
```

If `pytest` is not installed, you can add it by installing the optional dev dependencies or by running:

```bash
pip install pytest
```

For a quick syntax check on backend files:

```bash
cd backend
python -m compileall .
```

---

## Deployment Overview

VishwaGuru is designed for split deployment:

- **Frontend**: Netlify (static hosting for the React app)
- **Backend**: Render (FastAPI app + Telegram bot + PostgreSQL/SQLite)

Benefits:

- **Better performance** – CDN for frontend assets
- **Independent scaling** – Scale API and UI separately
- **Simpler rollbacks** – Revert frontend/backend independently

### Quick deployment reference

For detailed, step‑by‑step instructions, see:

- `DEPLOYMENT_GUIDE.md` – Complete deployment guide
- `QUICK_REFERENCE.md` – At-a-glance config and commands

**Backend (Render) – core settings**

- Build command: `pip install -r backend/requirements.txt`
- Start command: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, etc.

**Frontend (Netlify) – core settings**

- Base directory: `frontend/`
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Environment variable: `VITE_API_URL` pointing to your Render backend URL

> **Do NOT use**:
> - `python -m bot` – Only runs the Telegram bot, not the web server.
> - `./render-build.sh` – Only required for specific advanced setups; use `render.yaml` instead.

---

## Contributing

Contributions are welcome. To propose a change:

1. Fork the repository on GitHub.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and commit:

   ```bash
   git commit -m "Describe your change briefly"
   ```

4. Push your branch and open a Pull Request against the main branch.

---

## License

This project is licensed under the **AGPL-3.0** license.  
See `LICENSE` for full details.

# VishwaGuru-V2
