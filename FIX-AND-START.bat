@echo off
REM Auto-fix script for GEO-SEO Domination Tool
REM Double-click this file to fix everything automatically

echo.
echo ========================================
echo   GEO-SEO Auto-Fix Script
echo ========================================
echo.

REM Run PowerShell script with execution policy bypass
powershell.exe -ExecutionPolicy Bypass -File "%~dp0fix-everything.ps1"

pause
