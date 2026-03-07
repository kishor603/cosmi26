# AI Early Warning System for Student Dropout Risk

This is a comprehensive full-stack application for predicting and visualizing student dropout risks in government schools using Machine Learning.

## Features
- **Machine Learning Model**: Built with `scikit-learn` (Random Forest Classifier). It takes synthetic student data (attendance, grades, socio-economic index, parent involvement, behavioral incidents, distance) and predicts dropout risks.
- **FastAPI Backend**: A robust Python server providing dynamic API endpoints to fetch predicting scores on the fly.
- **Modern JavaScript Dashboard**: A stunning, responsive frontend built with Vanilla HTML, CSS, and JS. Features glassmorphism, dynamic data filtering, summary statistical cards, and a live data table.

## Prerequisites
- Python 3.9+
- `pip` package manager

## Installation & Running

### 1. Setup Backend
Navigate to the `backend` directory, install dependencies, generate data, and train the ML model.

```bash
cd backend
pip install -r requirements.txt
python data_generator.py
python train.py
```

### 2. Start Servers

**Start the FastAPI Backend:**
Open a terminal, go to `backend/`, and run:
```bash
uvicorn main:app --port 8000
```
This serves the API at `http://127.0.0.1:8000/api/students`.

**Start the Frontend Dashboard:**
Open another terminal, go to `frontend/`, and start a simple static server:
```bash
python -m http.server 3000
```
Then open your browser and navigate to `http://localhost:3000`.

## Directory Structure
- `backend/`
  - `data_generator.py`: Generates synthetic `students_historical.csv`.
  - `train.py`: Trains the Random Forest Model and saves `.joblib` artifacts.
  - `main.py`: The FastAPI server application.
  - `requirements.txt`: Python dependencies.
- `frontend/`
  - `index.html`: The main dashboard page layout.
  - `styles.css`: The styling engine featuring variables, animations, and glassmorphism.
  - `app.js`: Logic for fetching data dynamically and rendering the dashboard.
