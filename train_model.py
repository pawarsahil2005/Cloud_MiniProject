import pandas as pd
import numpy as np
import joblib
import json

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


print("STEP 1: Loading dataset...")

data = pd.read_csv("dataset/student_dataset.csv")

print("Dataset loadead successfully")
print(data.head())


print("\nSTEP 2: Splitting features and labels...")

X = data.drop("performance", axis=1)

y = data["performance"]


print("Features shape:", X.shape)
print("Labels shape:", y.shape)


print("\nSTEP 3: Encoding labels...")

encoder = LabelEncoder()

y_encoded = encoder.fit_transform(y)

print("Classes:", encoder.classes_)


print("\nSTEP 4: Train-test split...")

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded

)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


print("\nSTEP 5: Training Random Forest model...")

model = RandomForestClassifier(

    n_estimators=300,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42

)

model.fit(X_train, y_train)

print("Model training completed")


print("\nSTEP 6: Evaluating model...")

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nMODEL ACCURACY:", accuracy)


print("\nClassification Report:\n")

print(classification_report(

    y_test,
    predictions,
    target_names=encoder.classes_

))


print("\nSTEP 7: Extracting feature importance...")

feature_importance = model.feature_importances_

feature_names = X.columns


importance_dict = {}

for feature, importance in zip(feature_names, feature_importance):

    importance_dict[feature] = float(importance)

    print(feature, ":", importance)


print("\nSTEP 8: Saving feature importance JSON...")

with open("model/feature_importance.json", "w") as f:

    json.dump(importance_dict, f)


print("Feature importance saved")


print("\nSTEP 9: Saving label encoder...")

joblib.dump(

    encoder,
    "model/label_encoder.pkl"

)

print("Encoder saved")


print("\nSTEP 10: Saving trained model...")

joblib.dump(

    model,
    "model/model.pkl"

)

print("Model saved successfully")


print("\nSTEP 11: Saving metadata for dashboard analytics...")

metadata = {

    "accuracy": float(accuracy),

    "features": list(feature_names),

    "classes": list(encoder.classes_)

}


with open("model/model_metadata.json", "w") as f:

    json.dump(metadata, f)


print("Metadata saved successfully")


print("\nTRAINING COMPLETED SUCCESSFULLY")