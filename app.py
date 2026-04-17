"""
Cloud-Based Student Performance Multi-Class Prediction Dashboard
Flask Application - Main Entry Point

Routes:
    /                 - Dashboard UI (HTML)
    /predict          - Single student prediction (JSON)
    /batch_predict    - Batch CSV prediction (JSON)
    /feature_importance - Feature importance data (JSON)
"""

import os
import json
import traceback

import pandas as pd
import numpy as np
import joblib
from flask import Flask, request, jsonify, render_template

from utils.suggestions import get_suggestions

# ──────────────────────────────────────────────
# App Initialization
# ──────────────────────────────────────────────

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ──────────────────────────────────────────────
# Load Model Assets
# ──────────────────────────────────────────────

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

model = joblib.load(os.path.join(MODEL_DIR, "model.pkl"))
label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))

with open(os.path.join(MODEL_DIR, "feature_importance.json"), "r") as f:
    feature_importance_data = json.load(f)

with open(os.path.join(MODEL_DIR, "model_metadata.json"), "r") as f:
    model_metadata = json.load(f)

FEATURE_NAMES = model_metadata["features"]
CLASSES = model_metadata["classes"]

print(f"\n Model loaded successfully!")
print(f"   Accuracy: {model_metadata['accuracy']}")
print(f"   Features: {FEATURE_NAMES}")
print(f"   Classes:  {CLASSES}\n")


# ──────────────────────────────────────────────
# Validation Helpers
# ──────────────────────────────────────────────

def validate_student_input(data):
    """Validate that all required features are present and numeric."""
    errors = []
    validated = {}

    for feature in FEATURE_NAMES:
        value = data.get(feature)
        if value is None or value == "":
            errors.append(f"Missing required field: '{feature}'")
            continue
        try:
            validated[feature] = float(value)
        except (ValueError, TypeError):
            errors.append(f"Invalid value for '{feature}': must be a number, got '{value}'")

    # Range validation
    if not errors:
        if validated.get("study_hours", 0) < 0 or validated.get("study_hours", 0) > 24:
            errors.append("study_hours must be between 0 and 24")
        if validated.get("attendance", 0) < 0 or validated.get("attendance", 0) > 100:
            errors.append("attendance must be between 0 and 100")
        if validated.get("internal_marks", 0) < 0 or validated.get("internal_marks", 0) > 100:
            errors.append("internal_marks must be between 0 and 100")
        if validated.get("termwork_marks", 0) < 0 or validated.get("termwork_marks", 0) > 100:
            errors.append("termwork_marks must be between 0 and 100")
        if validated.get("previous_cgpa", 0) < 0 or validated.get("previous_cgpa", 0) > 10:
            errors.append("previous_cgpa must be between 0 and 10")
        if validated.get("certifications_completed", 0) < 0:
            errors.append("certifications_completed must be 0 or positive")

    return validated, errors


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────

@app.route("/")
def index():
    """Render the main dashboard page."""
    return render_template(
        "dashboard.html",
        accuracy=model_metadata["accuracy"],
        features=FEATURE_NAMES,
        classes=CLASSES
    )


@app.route("/predict", methods=["POST"])
def predict():
    """
    Single student prediction endpoint.
    Accepts JSON body with student features.
    Returns prediction, confidence, suggestions.
    """
    try:
        data = request.get_json(force=True)

        validated, errors = validate_student_input(data)
        if errors:
            return jsonify({
                "status": "error",
                "message": "Validation failed",
                "errors": errors
            }), 400

        # Prepare input array in correct feature order
        input_array = np.array([[validated[f] for f in FEATURE_NAMES]])

        # Predict
        prediction_encoded = model.predict(input_array)
        probabilities = model.predict_proba(input_array)[0]

        predicted_label = label_encoder.inverse_transform(prediction_encoded)[0]
        confidence = float(max(probabilities)) * 100

        # Class probabilities
        class_probabilities = {}
        for cls, prob in zip(label_encoder.classes_, probabilities):
            class_probabilities[cls] = round(float(prob) * 100, 2)

        # Suggestions
        suggestions = get_suggestions(predicted_label, validated)

        return jsonify({
            "status": "success",
            "prediction": predicted_label,
            "confidence": round(confidence, 2),
            "class_probabilities": class_probabilities,
            "suggestions": suggestions,
            "feature_importance": feature_importance_data,
            "input_data": validated
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Prediction failed: {str(e)}"
        }), 500


@app.route("/batch_predict", methods=["POST"])
def batch_predict():
    """
    Batch prediction endpoint.
    Accepts CSV file upload.
    Returns predictions for all rows.
    """
    try:
        if "file" not in request.files:
            return jsonify({
                "status": "error",
                "message": "No file uploaded. Please upload a CSV file."
            }), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({
                "status": "error",
                "message": "No file selected."
            }), 400

        if not file.filename.lower().endswith(".csv"):
            return jsonify({
                "status": "error",
                "message": "Invalid file format. Only .csv files are accepted."
            }), 400

        # Save and read CSV
        filepath = os.path.join(UPLOAD_FOLDER, "batch_upload.csv")
        file.save(filepath)
        df = pd.read_csv(filepath)

        # Validate columns
        missing_cols = [col for col in FEATURE_NAMES if col not in df.columns]
        if missing_cols:
            return jsonify({
                "status": "error",
                "message": f"Missing columns in CSV: {', '.join(missing_cols)}",
                "required_columns": FEATURE_NAMES
            }), 400

        # Select only feature columns in correct order
        df_features = df[FEATURE_NAMES]

        # Check for non-numeric values
        try:
            df_features = df_features.apply(pd.to_numeric, errors="raise")
        except (ValueError, TypeError) as ve:
            return jsonify({
                "status": "error",
                "message": f"CSV contains non-numeric values: {str(ve)}"
            }), 400

        # Predict
        predictions = model.predict(df_features.values)
        probabilities = model.predict_proba(df_features.values)

        labels = label_encoder.inverse_transform(predictions)

        # Build results
        results = []
        for i in range(len(labels)):
            confidence = float(max(probabilities[i])) * 100
            results.append({
                "row": i + 1,
                "prediction": labels[i],
                "confidence": round(confidence, 2)
            })

        # Summary counts
        summary = {}
        for cls in CLASSES:
            summary[cls] = int(np.sum(labels == cls))

        # Cleanup
        if os.path.exists(filepath):
            os.remove(filepath)

        return jsonify({
            "status": "success",
            "total_records": len(results),
            "summary": summary,
            "results": results
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Batch prediction failed: {str(e)}"
        }), 500


@app.route("/feature_importance", methods=["GET"])
def get_feature_importance():
    """Return feature importance data."""
    try:
        # Sort by importance descending
        sorted_features = dict(
            sorted(feature_importance_data.items(), key=lambda x: x[1], reverse=True)
        )

        return jsonify({
            "status": "success",
            "feature_importance": sorted_features,
            "model_accuracy": model_metadata["accuracy"],
            "total_features": len(sorted_features),
            "classes": CLASSES
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to load feature importance: {str(e)}"
        }), 500


# ──────────────────────────────────────────────
# Error Handlers
# ──────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({"status": "error", "message": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"status": "error", "message": "Method not allowed"}), 405


@app.errorhandler(413)
def file_too_large(e):
    return jsonify({"status": "error", "message": "File too large. Maximum size is 16MB."}), 413


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"status": "error", "message": "Internal server error"}), 500


# ──────────────────────────────────────────────
# Run
# ──────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  🎓 Student Performance Prediction Dashboard")
    print("  🌐 Cloud Computing Mini-Project")
    print("  📊 Model: Random Forest Classifier")
    print(f"  🎯 Accuracy: {model_metadata['accuracy'] * 100:.1f}%")
    print("=" * 60)
    print("  🚀 Starting server at http://127.0.0.1:5000")
    print("=" * 60 + "\n")

    app.run(debug=True, host="0.0.0.0", port=5000)
