@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Eco AI 웹앱을 http://localhost:8080 에서 실행합니다. (종료: 이 창을 닫기)
start "" http://localhost:8080/index.html
python -m http.server 8080
