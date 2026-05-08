@echo off
echo ===================================================
echo   Starting Path Learning Platform...
echo ===================================================

:: 1. Start Content Service (8002)
echo Starting Content Service...
start "Content Service (8002)" cmd /k "D:\path-learning\venv\Scripts\activate && cd /d D:\path-learning\backend\youtube_service\services\content-service && uvicorn app.main:app --reload --port 8002 --host 0.0.0.0"

:: 2. Start Progress Service (8003)
echo Starting Progress Service...
start "Progress Service (8003)" cmd /k "D:\path-learning\venv\Scripts\activate && cd /d D:\path-learning\backend\youtube_service\services\progress-service && uvicorn app.main:app --reload --port 8003 --host 0.0.0.0"

:: 3. Start Analytics Service (8004)
echo Starting Analytics Service...
start "Analytics Service (8004)" cmd /k "D:\path-learning\venv\Scripts\activate && cd /d D:\path-learning\backend\youtube_service\services\analytics-service && uvicorn app.main:app --reload --port 8004 --host 0.0.0.0"

:: 4. Start Path Service (8006)
echo Starting Path Service...
start "Path Service (8006)" cmd /k "D:\path-learning\venv\Scripts\activate && cd /d D:\path-learning\backend\path-service && uvicorn main:app --reload --port 8006 --host 0.0.0.0"

:: 5. Start User Service (8001)
echo Starting User Service...
start "User Service (8001)" cmd /k "D:\path-learning\venv\Scripts\activate && cd /d D:\path-learning\backend\youtube_service\services\user-service && uvicorn app.main:app --reload --port 8001 --host 0.0.0.0"

@REM :: 6. Start Frontend
@REM echo Starting Frontend...
@REM start "Frontend (npm run dev)" cmd /k "cd /d D:\path-learning\frontend && npm run dev"

echo.
echo All backend services launched with external access enabled!
pause