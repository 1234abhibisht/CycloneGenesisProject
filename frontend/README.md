# Frontend (React + Vite + Tailwind)

```bash
npm install
npm run dev        # http://localhost:3000  (expects the backend on http://127.0.0.1:8000)
npm run build      # production build in dist/
npm run typecheck  # optional TypeScript check
```

Set `VITE_API_URL` in `.env` (see `.env.example`) if the API is not on `http://127.0.0.1:8000/api`.

Pages (`src/pages`): Overview, Live Monitoring, Basin Watch (24 h formation chance), Forecast (+6/12/18/24 h),
District Strike Risk, Test-Storm Replay, Model Performance, Data & Sources. All numbers come from the backend;
the UI shows "—" when data is missing instead of placeholder values.
