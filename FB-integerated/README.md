# FB integerated

Independent copy of frontend 1, connected to its own FastAPI backend and copied research artifacts. Original frontend 1 and cyclone-ai folders are preserved.

## Run
Double-click start-integrated.cmd (or run start-integrated.ps1).
Frontend: http://127.0.0.1:3002/dashboard/warnings
Backend: http://127.0.0.1:8002/api/system/status

The existing local Python runtime and installed scientific dependencies are used by the launcher. requirements-research.txt records the backend packages for another machine. Frontend packages are already installed; npm ci reproduces them.

## Connected
- Real ERA5/IBTrACS XGBoost inference: formation grid and +24-hour wind/track.
- 463 North Indian Ocean historical storms, map replay and recorded observations.
- Coastal geometric proximity, backend status, model split metrics, live/replay switching.
- Research backend also exposes weather and preparedness APIs.

The earlier frontend router, navigation, layout, colours and cloud hero are retained. Data adapters in backend/compatibility_api.py bridge its older basin/archive response contracts. Labels were corrected where backend outputs differ: only +24h is available; pressure, uncertainty, SHAP and training history are not invented. Forecast charts no longer generate fake LSTM/ensemble curves.

The old response console remains a labelled design preview: its automatic evacuation logistics/cell-broadcast controls are not operational. The historical similarity panel is also labelled illustrative. This is a local research integration, not an official warning or evacuation system. No old subscriber database or provider credentials were copied.

Use npm run build to check TypeScript and produce dist. Neither frontend-only port 3001 nor the earlier integrated site on port 3000 is replaced.
