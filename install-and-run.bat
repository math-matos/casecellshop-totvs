@echo off
cd /d "%~dp0"

echo Instalando dependencias da API...
cd /d "%~dp0api"
call npm install
if errorlevel 1 goto :error

echo Instalando dependencias do WEB...
cd /d "%~dp0web"
call npm install
if errorlevel 1 goto :error

cd /d "%~dp0"

call dev.bat
goto :eof

:error
echo Falha na instalacao.
pause
