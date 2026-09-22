@echo off
echo Starting Pulse Services for Interview...

echo Starting Python ML Service...
start "Pulse: Python ML" cmd /k "cd backend-python && uvicorn app:app --host 0.0.0.0 --port 5001"

echo Starting Node API...
start "Pulse: Node API" cmd /k "cd backend-node && npm start"

echo Starting React Frontend...
start "Pulse: React Frontend" cmd /k "cd frontend && npm run dev"

echo All services are starting in separate windows!
echo Please wait a few seconds, then open http://localhost:5173 in your browser.
