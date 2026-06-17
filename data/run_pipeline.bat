@echo off
REM 1. 데이터 폴더로 작업 디렉터리를 이동합니다. (.env 파일을 정상적으로 읽기 위해 필수)
cd /d d:\miniproject\MovieEntertainmentProject\data

REM 2. 만약 파이썬 가상환경(venv 등)을 사용 중이라면 아래의 주석(REM)을 지우고 경로를 맞게 수정하세요.
REM call d:\miniproject\MovieEntertainmentProject\venv\Scripts\activate

REM 3. 스크립트를 실행합니다.
python push_to_backend.py