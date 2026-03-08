import joblib
import os

model_path = r"c:\student risk management\backend\dropout_rf_model.joblib"
features_path = r"c:\student risk management\backend\feature_cols.joblib"

if os.path.exists(model_path):
    try:
        model = joblib.load(model_path)
        print(f"Model loaded successfully: {type(model)}")
    except Exception as e:
        print(f"Error loading model: {e}")
else:
    print(f"Model file not found at {model_path}")

if os.path.exists(features_path):
    try:
        features = joblib.load(features_path)
        print(f"Features loaded successfully: {features}")
    except Exception as e:
        print(f"Error loading features: {e}")
else:
    print(f"Features file not found at {features_path}")
