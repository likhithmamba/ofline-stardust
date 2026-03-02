@echo off
echo ==========================================
echo    Stardust — Building Windows Installer
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

echo Building renderer (Vite)...
call npm run build:renderer
if errorlevel 1 (
    echo.
    echo Build failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo Packaging Electron app...
call npx electron-builder --win
if errorlevel 1 (
    echo.
    echo Packaging failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo    Build Complete!
echo    Output: dist-electron\
echo ==========================================
pause
