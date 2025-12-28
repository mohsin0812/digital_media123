@echo off
echo Stopping Media Distribution Platform Server...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Found process %%a using port 3000
    taskkill /PID %%a /F
    if %errorlevel% == 0 (
        echo Server stopped successfully!
    ) else (
        echo Failed to stop server. You may need to run as administrator.
    )
)

pause

