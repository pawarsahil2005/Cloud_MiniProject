import joblib
import numpy as np
import pandas as pd

model = joblib.load("model/model.pkl")

encoder = joblib.load("model/label_encoder.pkl")


def predict_student(student_data):

    input_array = np.array([student_data])


    prediction = model.predict(input_array)


    probabilities = model.predict_proba(input_array)


    predicted_label = encoder.inverse_transform(prediction)[0]


    confidence_score = max(probabilities[0])


    return predicted_label, confidence_score

def batch_prediction(file_path):

    df = pd.read_csv(file_path)


    predictions = model.predict(df)


    probabilities = model.predict_proba(df)


    labels = encoder.inverse_transform(predictions)


    results = []


    for i in range(len(labels)):

        results.append({

            "prediction": labels[i],

            "confidence": float(max(probabilities[i]))

        })


    return results


if __name__ == "__main__":

    sample_student = [

        6.5,
        88,
        75,
        82,
        8.2,
        3

    ]


    prediction, confidence = predict_student(sample_student)


    print("Prediction:", prediction)

    print("Confidence:", confidence)