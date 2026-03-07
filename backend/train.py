import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

def train_model():
    print("Loading data...")
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "students_historical.csv")
    df = pd.read_csv(data_path)
    
    # Updated Features
    feature_cols = [
        'attendance_rate', 
        'exam_score', 
        'mid_day_meal_consistency', 
        'guardian_involvement_score', 
        'distance_from_school_km',
        'sibling_dropout_history'
    ]
    X = df[feature_cols]
    y = df['dropped_out']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier on new features...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    print("Saving model and features...")
    joblib.dump(model, 'dropout_rf_model.joblib')
    joblib.dump(feature_cols, 'feature_cols.joblib')
    print("Training complete and artifacts saved.")

if __name__ == "__main__":
    train_model()
