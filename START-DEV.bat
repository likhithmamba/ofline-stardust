@echo off
echo ==========================================
echo    Stardust — Starting Dev Environment
echo ==========================================
echo.

:: Check for node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

echo Starting Vite dev server and Electron...
echo Press Ctrl+C to stop
echo.

npm run dev
pause
