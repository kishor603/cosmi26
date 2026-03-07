from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import pandas as pd
import joblib
import os

MODEL_PATH = "dropout_rf_model.joblib"
FEATURES_PATH = "feature_cols.joblib"
DATA_PATH = "students_historical.csv"

model = None
feature_cols = None
students_df = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, feature_cols, students_df
    if os.path.exists(MODEL_PATH) and os.path.exists(FEATURES_PATH):
        model = joblib.load(MODEL_PATH)
        feature_cols = joblib.load(FEATURES_PATH)
    if os.path.exists(DATA_PATH):
        students_df = pd.read_csv(DATA_PATH)
    yield

app = FastAPI(title="India Dropout Early Warning System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StudentFeatures(BaseModel):
    attendance_rate: float
    exam_score: float
    mid_day_meal_consistency: float
    guardian_involvement_score: int
    distance_from_school_km: float
    sibling_dropout_history: int

class InterventionRecord(BaseModel):
    type: str
    date: str
    notes: str
    logged_by: str

# In-memory store for interventions (mocking a database)
interventions_db = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Student Risk API"}

@app.get("/district_heatmap.json")
def serve_heatmap():
    if os.path.exists("district_heatmap.json"):
        return FileResponse("district_heatmap.json")
    return {"error": "Heatmap data not generated"}

@app.get("/api/students")
def get_students():
    if students_df is None or model is None:
        return {"error": "Model or data not loaded."}
    
    X = students_df[feature_cols]
    probs = model.predict_proba(X)[:, 1]
    
    response_data = []
    
    for i, row in students_df.iterrows():
        risk_prob = float(probs[i])
        
        # Adjust risk levels based on 19% context
        risk_level = "Low"
        if risk_prob > 0.65: # High Risk
             risk_level = "High"
        elif risk_prob > 0.35: # Medium Risk
             risk_level = "Medium"
             
        # Extract top 3 features by deviation from ideal (Heuristic Explainability)
        base_deviations = [
            ("Low Attendance", max(0.0, 95.0 - float(row['attendance_rate'])) * 0.5), # Assuming 95% is ideal
            ("Poor Exam Scores", max(0.0, 85.0 - float(row['exam_score'])) * 0.2),
            ("Missed Mid-Day Meals", max(0.0, 95.0 - float(row['mid_day_meal_consistency'])) * 0.3),
            ("Low Guardian Involvement", max(0.0, 5.0 - float(row['guardian_involvement_score'])) * 5.0),
            ("High Distance from School", max(0.0, float(row['distance_from_school_km']) - 3.0) * 1.5),
            ("Sibling Dropout History", float(row['sibling_dropout_history']) * 25.0)
        ]
        
        # Sort by impact
        base_deviations.sort(key=lambda x: x[1], reverse=True)
        top_factors = [d[0] for d in base_deviations[:3] if d[1] > 0]
             
        student_record = {
            "id": row['student_id'],
            "name": row['name'],
            "attendance": float(row['attendance_rate']),
            "grade": float(row['exam_score']),
            "mid_day_meal": float(row['mid_day_meal_consistency']),
            "guardian_inv": int(row['guardian_involvement_score']),
            "distance": float(row['distance_from_school_km']),
            "risk_score": float(round(risk_prob * 100, 2)),
            "risk_level": risk_level,
            "top_factors": top_factors,
            "sibling_dropout": int(row['sibling_dropout_history'])
        }
        response_data.append(student_record)
        
    return {"students": response_data}

@app.post("/api/predict")
def predict_risk(student: StudentFeatures):
    if model is None:
        return {"error": "Model not loaded."}
        
    data = pd.DataFrame([student.dict()])
    data = data[feature_cols]
    prob = model.predict_proba(data)[0][1]
    
    risk_level = "Low"
    if prob > 0.65:
         risk_level = "High"
    elif prob > 0.35:
         risk_level = "Medium"
         
    # Explainable AI Logic - Heuristic Deviation
    deviations = [
        {"factor": "Attendance", "desc": "Low Attendance", "impact": max(0.0, 95.0 - float(student.attendance_rate)) * 0.5},
        {"factor": "Exams", "desc": "Poor Exam Scores", "impact": max(0.0, 85.0 - float(student.exam_score)) * 0.2},
        {"factor": "Meals", "desc": "Missed Mid-Day Meals", "impact": max(0.0, 95.0 - float(student.mid_day_meal_consistency)) * 0.3},
        {"factor": "Guardian", "desc": "Low Guardian Involvement", "impact": max(0.0, 5.0 - float(student.guardian_involvement_score)) * 5.0},
        {"factor": "Distance", "desc": "High Distance from School", "impact": max(0.0, float(student.distance_from_school_km) - 3.0) * 1.5},
        {"factor": "Sibling", "desc": "Sibling Dropout History", "impact": float(student.sibling_dropout_history) * 25.0}
    ]
    
    # Sort with explicit typing
    def sort_key(d: dict) -> float:
        return float(d["impact"])
        
    deviations.sort(key=sort_key, reverse=True)
    top_3 = []
    
    for d_item in deviations[:3]:
        impact_val = float(d_item["impact"])
        if impact_val > 0.0:
            top_3.append({
                "factor": str(d_item["desc"]),
                "direction": "+",
                "weight": round(impact_val, 1)
            })

    # Evidence-based Intervention Playbook Matcher
    interventions = []
    primary_factor = top_3[0]["factor"] if top_3 else None
    
    if primary_factor == "Sibling Dropout History":
        interventions.append({"title": "Targeted Home Visit (Pratham Methodology)", "efficacy": "High"})
        interventions.append({"title": "Check PM POSHAN (Mid-Day Meal Expansion) Eligibility", "efficacy": "Medium"})
        
    if primary_factor == "Low Attendance":
        interventions.append({"title": "Peer Buddy Assignment (J-PAL Evidence Base)", "efficacy": "High"})
        interventions.append({"title": "Parent Engagement Call (Supportive Framing)", "efficacy": "Medium"})
        
    if primary_factor == "High Distance from School":
        interventions.append({"title": "State Cycle Scheme Application", "efficacy": "High"})
        
    if primary_factor == "Poor Exam Scores":
        interventions.append({"title": "Targeted Remedial Classes (ASER Data Recommended)", "efficacy": "High"})
        
    if student.mid_day_meal_consistency < 75:
        interventions.append({"title": "PM POSHAN Allowance Check", "efficacy": "High"})
        interventions.append({"title": "National Means-cum-Merit Scholarship (NMMS) Screening", "efficacy": "Medium"})

    # Ensure uniqueness
    seen = set()
    unique_interventions = []
    for inv in interventions:
        if inv["title"] not in seen:
            unique_interventions.append(inv)
            seen.add(inv["title"])
         
    return {
        "risk_probability": float(prob),
        "risk_score_percentage": float(round(prob * 100, 2)),
        "risk_level": risk_level,
        "top_contributing_factors": top_3,
        "recommended_interventions": unique_interventions
    }

@app.get("/api/interventions/{student_id}")
def get_interventions(student_id: str):
    return {"interventions": interventions_db.get(student_id, [])}

@app.post("/api/interventions/{student_id}")
def log_intervention(student_id: str, record: InterventionRecord):
    if student_id not in interventions_db:
        interventions_db[student_id] = []
    interventions_db[student_id].append(record.dict())
    return {"status": "success", "message": "Intervention logged"}

@app.get("/api/generate_communication/{student_id}")
def generate_communication(student_id: str, primary_factor: str):
    # Stigma-Free Communication Generator
    # Ban words: "dropout", "failing", "risk"
    
    base_msg = "Namaste. As teachers at the school, we deeply care about your child's success and well-being. "
    
    if "Attendance" in primary_factor:
        msg = base_msg + "We noticed a recent change in their daily school attendance routine. We want to ensure they are healthy and have all the support they need to continue their learning journey smoothly. Please let us know if there is any way we can assist."
    elif "Exam" in primary_factor:
        msg = base_msg + "We see great potential in your child and want to partner with you to support their academic progress. There are new remedial and peer-learning opportunities available that we believe they would enjoy."
    elif "Meal" in primary_factor:
         msg = base_msg + "We hold your child's health and nutrition as a top priority. We want to ensure they are fully utilizing the school's meal provisions and ask if there are any specific needs we can address."
    else:
        msg = base_msg + "We are reaching out to share updates on your child's progress and discuss ways we can work together to ensure they have a fantastic school year."
        
    hindi_translations = {
         "Attendance": "नमस्ते। विद्यालय में शिक्षकों के रूप में, हम आपके बच्चे की सफलता और भलाई की गहराई से परवाह करते हैं। हमने हाल ही में उनकी दैनिक उपस्थिति में बदलाव देखा है। हम यह सुनिश्चित करना चाहते हैं कि वे स्वस्थ हैं और हम उनकी मदद करना चाहते हैं।",
         "Exam": "नमस्ते। हम आपके बच्चे में काफी संभावनाएं देखते हैं। हम उनकी प्रगति का समर्थन करने के लिए आपके साथ साझेदारी करना चाहते हैं।",
         "Meal": "नमस्ते। आपके बच्चे का स्वास्थ्य हमारी सर्वोच्च प्राथमिकता है। हम यह सुनिश्चित करना चाहते हैं कि उन्हें विद्यालय का पूरा लाभ मिल रहा है।"
    }
    
    hindi_msg = hindi_translations.get(primary_factor.split(" ")[-1] if " " in primary_factor else primary_factor, "नमस्ते। हम आपके बच्चे की प्रगति साझा करने के लिए संपर्क कर रहे हैं।")
    
    return {
        "english_draft": msg,
        "hindi_draft": hindi_msg
    }
