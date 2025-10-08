@echo off
REM EMERGENCY FIX - This will force-kill EVERYTHING and start fresh

echo.
echo ============================================
echo   EMERGENCY FIX - Killing Everything
echo ============================================
echo.

REM Kill absolutely every node process
echo [Step 1] Killing all node.exe processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

REM Kill npm processes
echo [Step 2] Killing all npm processes...
taskkill /F /IM npm.cmd >nul 2>&1
timeout /t 2 >nul

REM Clear .next folder
echo [Step 3] Clearing .next folder...
if exist .next (
    rmdir /s /q .next
    echo          .next folder deleted
) else (
    echo          .next folder not found
)

REM Clear node_modules cache
echo [Step 4] Clearing node_modules cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo          Cache cleared
) else (
    echo          No cache found
)

REM Fix environment files
echo [Step 5] Fixing environment files...
powershell -Command "(Get-Content .env.local) -replace '^POSTGRES_URL=', '# POSTGRES_URL=' | Set-Content .env.local" >nul 2>&1
powershell -Command "(Get-Content .env.development) -replace '^POSTGRES_URL=', '# POSTGRES_URL=' | Set-Content .env.development" >nul 2>&1
echo          Environment files fixed

timeout /t 3 >nul

echo.
echo ============================================
echo   Starting Fresh Development Server
echo ============================================
echo.
echo Look for this success message:
echo   [32m🔧 Using SQLite database at: D:\GEO_SEO_Domination-Tool\data\geo-seo.db[0m
echo   [32m✓ Connected to SQLite database[0m
echo.

REM Start dev server
npm run dev

pause
