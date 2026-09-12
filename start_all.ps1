Write-Host "Starting Pulse Services..."

# Start Python FastAPI ML Service
Write-Host "Starting Python ML Service on port 5001..."
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend-python; python -m uvicorn app:app --port 5001 --reload`""

# Start Node.js API Service
Write-Host "Starting Node.js Backend on port 5000..."
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend-node; npm run dev`""

# Start React Frontend
Write-Host "Starting React Frontend on port 5173..."
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "All services started in separate windows."
