@echo off

set BASE=C:\Users\harid\OneDrive\Desktop\new_pod\path-learning

echo ===================================================
echo   Starting Path Learning Platform...
echo ===================================================

:: 1. Content Service (8002)
echo Starting Content Service...
start "Content Service (8002)" cmd /k "call %BASE%\venv\Scripts\activate && cd /d %BASE%\youtube_service\services\content-service && uvicorn app.main:app --reload --port 8002"

:: 2. Progress Service (8003)
echo Starting Progress Service...
start "Progress Service (8003)" cmd /k "call %BASE%\venv\Scripts\activate && cd /d %BASE%\youtube_service\services\progress-service && uvicorn app.main:app --reload --port 8003"

:: 3. Analytics Service (8004)
echo Starting Analytics Service...
start "Analytics Service (8004)" cmd /k "call %BASE%\venv\Scripts\activate && cd /d %BASE%\youtube_service\services\analytics-service && uvicorn app.main:app --reload --port 8004"

:: 4. Path Service (8006)
echo Starting Path Service...
start "Path Service (8006)" cmd /k "call %BASE%\venv\Scripts\activate && cd /d %BASE%\path-service && uvicorn main:app --reload --port 8006"

echo.
echo All services launched!
pause