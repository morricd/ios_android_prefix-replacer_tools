@echo off
cd /d "%~dp0\.."
echo ======================================
echo iOS/Android Refactor Tool - Windows Build
echo ======================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Clean old builds
echo Cleaning old build files...
if exist "dist\" rmdir /s /q dist
echo.

REM Build
echo Building Windows installer...
echo.

call npm run build:win

REM Check if successful
if exist "dist\" (
    echo.
    echo ======================================
    echo Build successful!
    echo ======================================
    echo.
    
    echo Generated files:
    dir /b dist\*.exe
    echo.
    
    echo ======================================
    echo Location: %CD%\dist
    echo ======================================
    echo.
    
    echo Installation instructions:
    echo   1. Run the .exe installer
    echo   2. Follow the installation wizard
    echo   3. Launch from Desktop or Start Menu
    echo.
    
    set /p open="Open dist folder? (y/n): "
    if /i "%open%"=="y" start explorer dist
    
) else (
    echo.
    echo ======================================
    echo Build failed!
    echo ======================================
    echo.
    echo Please check the error messages above
    pause
    exit /b 1
)

pause
