@echo off
REM Setup script for SEO Toolkit MCP Server (Windows)

echo ========================================
echo SEO Toolkit MCP Server Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10 or higher from https://www.python.org/
    pause
    exit /b 1
)

echo Checking Python version...
for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo Found Python %PYTHON_VERSION%

REM Check if uv is installed
uv --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo Installing uv package manager...
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    if errorlevel 1 (
        echo ERROR: Failed to install uv
        pause
        exit /b 1
    )
    echo uv installed successfully
)

echo.
echo Creating virtual environment...
uv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo.
echo Activating virtual environment...
call .venv\Scripts\activate
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
uv add "mcp[cli]" httpx psycopg2-binary python-dotenv
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Checking for .env file...
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo WARNING: Please edit .env file and add your API keys!
    echo.
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file and add your API keys
echo 2. Add the server to Claude Desktop config:
echo    Location: %%AppData%%\Claude\claude_desktop_config.json
echo.
echo Example config:
echo {
echo   "mcpServers": {
echo     "seo-toolkit": {
echo       "command": "uv",
echo       "args": [
echo         "--directory",
echo         "%CD%",
echo         "run",
echo         "server.py"
echo       ]
echo     }
echo   }
echo }
echo.
echo 3. Restart Claude Desktop completely
echo.
pause
