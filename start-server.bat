@echo off
echo Starting Media Distribution Platform Server...
echo.

REM Check if port 3000 is in use
netstat -ano | findstr :3000 >nul
if %errorlevel% == 0 (
    echo Port 3000 is already in use!
    echo.
    echo Finding process using port 3000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        echo Killing process %%a...
        taskkill /PID %%a /F >nul 2>&1
        timeout /t 2 /nobreak >nul
    )
    echo.
)

echo Starting server...
npm start

