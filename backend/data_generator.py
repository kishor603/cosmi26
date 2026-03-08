import pandas as pd
import numpy as np

def generate_student_data(num_students=1000):
    np.random.seed(42)
    
    first_names = ["Kavin", "Anbarasu", "Elango", "Iniyan", "Madhavan", "Nallan", "Oviya", "Pugazh", "Tamizh", "Valavan", "Akilan", "Ezhil", "Ilango", "Karthik", "Manisankar", "Nalan", "Oviyan", "Pavithran", "Shankar", "Velan"]
    last_names = ["Selvan", "Pandian", "Cholan", "Cheran", "Maruthu", "Velu", "Mani", "Rajan", "Sivam", "Nathan"]
    
    student_ids = [f"STU{str(i).zfill(4)}" for i in range(1, num_students + 1)]
    
    names = []
    for i in range(num_students):
        fname = np.random.choice(first_names)
        if i < 500:
            std = "9"
            sec = chr(ord('A') + (i // 100))
        else:
            std = "10"
            sec = chr(ord('A') + ((i - 500) // 100))
        names.append(f"{fname} ({std}{sec})")
    
    # 1. Attendance (0-100%) - Key indicator for dropouts
    attendance = np.random.normal(loc=82, scale=18, size=num_students)
    attendance = np.clip(attendance, 30, 100)
    
    # 2. Exam records (0-100)
    exam_score = np.random.normal(loc=65, scale=20, size=num_students)
    exam_score += (attendance - 80) * 0.4
    exam_score = np.clip(exam_score, 15, 100)
    
    # 3. Mid-day meal consistency (%)
    # If attendance is low, or they are struggling, they might miss meals or just come for meals
    # In many gov schools, meal consistency correlates with poverty and attendance
    mid_day_meal = np.random.normal(loc=90, scale=15, size=num_students)
    mid_day_meal -= (100 - attendance) * 0.3
    mid_day_meal = np.clip(mid_day_meal, 10, 100)
    
    # 4. Guardian Involvement (1-5, lower in unengaged households)
    guardian_involvement = np.random.randint(1, 6, size=num_students)
    
    # 5. Distance from school (km) - Higher distance = Higher difficulty in rural areas
    distance = np.random.gamma(shape=2, scale=3, size=num_students)
    distance = np.clip(distance, 0.5, 25)
    
    # 6. Sibling Dropout History (0 = None, 1 = Yes)
    # Strong familial predictor for secondary school dropouts
    sibling_dropped_out = np.random.choice([0, 1], size=num_students, p=[0.85, 0.15])
    
    # ----------------------------------
    
    data = pd.DataFrame({
        'student_id': student_ids,
        'name': names,
        'attendance_rate': attendance,
        'exam_score': exam_score,
        'mid_day_meal_consistency': mid_day_meal,
        'guardian_involvement_score': guardian_involvement,
        'distance_from_school_km': distance,
        'sibling_dropout_history': sibling_dropped_out
    })
    
    # Rule to define actual "dropped_out" (Historical data for training)
    # Reflecting 19% average secondary school dropout rate in India
    risk_score = (
        (100 - data['attendance_rate']) * 0.5 + 
        (100 - data['exam_score']) * 0.2 + 
        (100 - data['mid_day_meal_consistency']) * 0.3 + 
        (5 - data['guardian_involvement_score']) * 5.0 +
        (data['distance_from_school_km']) * 1.5 +
        (data['sibling_dropout_history'] * 25.0) # Massive weighted jump based on J-PAL / rural evidence
    )
    
    risk_score += np.random.normal(0, 10, size=num_students)
    
    # Target approximately 19% dropout rate
    threshold = np.percentile(risk_score, 81) # Top 19%
    data['dropped_out'] = (risk_score >= threshold).astype(int)
    
    return data

if __name__ == "__main__":
    df = generate_student_data(1000)
    df.to_csv("students_historical.csv", index=False)
    print("Generated synthetic student records reflecting Gov school data")
