@echo off
REM Executado pela Tarefa Agendada do Windows. Roda a sincronização de emails
REM na pasta do projeto e acumula a saída em email-sync.log.
cd /d "%~dp0.."
echo [%date% %time%] iniciando >> "email-sync.log"
call "C:\Program Files\nodejs\npm.cmd" run email:sync >> "email-sync.log" 2>&1
echo [%date% %time%] fim (codigo %errorlevel%) >> "email-sync.log"
