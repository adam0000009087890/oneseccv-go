@echo off
REM ─────────────────────────────────────────────────────────────
REM OneSecCV — Build Script (EXE + MSI)
REM Requires: Go, Node.js, Wails CLI, WiX Toolset v3
REM Run from the project root: build_installer.bat
REM ─────────────────────────────────────────────────────────────

setlocal

echo.
echo  [1/4] Building OneSecCV.exe with Wails...
wails build -platform windows/amd64
if errorlevel 1 (
    echo  ERROR: Wails build failed.
    exit /b 1
)
echo  Done.

echo.
echo  [2/4] Checking WiX Toolset...
where candle.exe >nul 2>&1
if errorlevel 1 (
    echo  ERROR: candle.exe not found.
    echo  Install WiX Toolset v3 from: https://github.com/wixtoolset/wix3/releases
    echo  Then add it to your PATH.
    exit /b 1
)
echo  WiX found.

echo.
echo  [3/4] Compiling installer source (.wxs → .wixobj)...
cd installer
candle.exe -ext WixUIExtension OneSecCV.wxs
if errorlevel 1 (
    echo  ERROR: candle.exe failed.
    cd ..
    exit /b 1
)

echo.
echo  [4/4] Linking installer (.wixobj → .msi)...
light.exe -ext WixUIExtension -out OneSecCV.msi OneSecCV.wixobj
if errorlevel 1 (
    echo  ERROR: light.exe failed.
    cd ..
    exit /b 1
)

cd ..

echo.
echo  ─────────────────────────────────────────────────
echo   SUCCESS: installer\OneSecCV.msi is ready!
echo  ─────────────────────────────────────────────────
echo.

endlocal