import json
import os

def generate_district_data(num_schools=20):
    """
    Mock data generation simulating aggregated data across different schools
    within a district for heat-mapping.
    """
    
    schools = []
    
    # Generate mock GPS and risk configurations
    base_lat = 28.6139  # Delhi approx
    base_lon = 77.2090
    
    for i in range(1, num_schools + 1):
        # Add slight variations to lat/lon for a visual spread
        lat = base_lat + (os.urandom(1)[0] / 255.0 - 0.5) * 0.2
        lon = base_lon + (os.urandom(1)[0] / 255.0 - 0.5) * 0.2
        
        # Simulate School Data
        total_students = int(100 + (os.urandom(1)[0] / 255.0 * 400))
        high_risk_pct = 5 + (os.urandom(1)[0] / 255.0 * 25) # 5% to 30%
        
        high_risk_count = int(total_students * (high_risk_pct / 100))
        
        schools.append({
            "school_id": f"SCH{str(i).zfill(3)}",
            "name": f"Government Secondary School {i}",
            "lat": lat,
            "lon": lon,
            "total_students": total_students,
            "high_risk_count": high_risk_count,
            "high_risk_percentage": round(high_risk_pct, 1)
        })
        
    return {"district_name": "Central District", "schools": schools}

if __name__ == "__main__":
    data = generate_district_data()
    with open("district_heatmap.json", "w") as f:
        json.dump(data, f, indent=4)
    print("Generated district_heatmap.json")
