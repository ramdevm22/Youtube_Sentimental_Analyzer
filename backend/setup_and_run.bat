@echo off
echo ========================================
echo  YouTube Sentiment Analyzer - Setup
echo ========================================

:: Step 1: Create conda environment
echo Creating conda environment...
call conda create -n yt_sentiment python=3.11 -y

:: Step 2: Activate it
echo Activating environment...
call conda activate yt_sentiment

:: Step 3: Install setuptools first
echo Installing setuptools...
call conda install setuptools -y

:: Step 4: Install requirements (mlflow excluded)
echo Installing requirements...
call pip install fastapi==0.111.0 uvicorn[standard]==0.30.1 python-dotenv==1.0.1 pydantic==2.7.1 pydantic-settings==2.3.1 langchain==0.2.1 langchain-community==0.2.1 langchain-openai==0.1.8 langchain-core==0.2.3 faiss-cpu==1.8.0 tiktoken==0.7.0 openai==1.30.1 youtube-transcript-api==0.6.2

:: Step 5: Run server
echo Starting server...
python run.py

pause
