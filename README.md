````md
# EduPredict — Student Performance Prediction Dashboard

A cloud-based student performance prediction dashboard built using Flask, Machine Learning, and an interactive frontend UI. The system predicts student performance categories such as At Risk, Average, Good, and Excellent using a trained Random Forest Classifier.

---

## 🚀 Features

- Single Student Performance Prediction
- Batch CSV Prediction Upload
- Feature Importance Visualization
- Interactive Dashboard UI
- Personalized Suggestion Engine
- REST API Support
- Cloud Computing Based Project

---

## 🛠️ Tech Stack

### Languages
- Python
- JavaScript
- HTML
- CSS

### Frameworks & Libraries
- Flask
- Scikit-learn
- Pandas
- NumPy
- Chart.js

### Tools & Platforms
- Git
- GitHub
- AWS

---

## 📁 Project Structure

```bash
EduPredict/
│── app.py
│── train_model.py
│── predict.py
│── requirements.txt
│
├── dataset/
│   └── student_dataset.csv
│
├── model/
│   ├── model.pkl
│   ├── label_encoder.pkl
│   ├── feature_importance.json
│   └── model_metadata.json
│
├── templates/
│   └── dashboard.html
│
├── static/
│   ├── css/
│   └── js/
│
├── uploads/
│
└── utils/
    └── suggestions.py
````

---

## 📚 Project Overview

EduPredict analyzes student academic data and predicts performance categories using Machine Learning techniques. The application provides both a web dashboard and REST APIs for predictions.

### Prediction Classes

* At Risk
* Average
* Good
* Excellent

### Input Features

* Study Hours
* Attendance
* Internal Marks
* Termwork Marks
* Previous CGPA
* Certifications Completed

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/EduPredict.git
cd EduPredict
```

### 2️⃣ Create Virtual Environment

```bash
python -m venv .venv
```

### 3️⃣ Activate Environment

#### Windows

```bash
.venv\Scripts\activate
```

#### Linux/Mac

```bash
source .venv/bin/activate
```

### 4️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

## ▶️ Run the Project

### Train the Model

```bash
python train_model.py
```

### Start Flask Server

```bash
python app.py
```

Application runs on:

```bash
http://127.0.0.1:5000
```

---

## 🔌 API Endpoints

### GET `/`

Returns Dashboard UI

---

### POST `/predict`

#### Sample Request

```json
{
  "study_hours": 6.5,
  "attendance": 88,
  "internal_marks": 75,
  "termwork_marks": 82,
  "previous_cgpa": 8.2,
  "certifications_completed": 3
}
```

---

### POST `/batch_predict`

#### CSV Format

```csv
study_hours,attendance,internal_marks,termwork_marks,previous_cgpa,certifications_completed
```

---

### GET `/feature_importance`

Returns feature importance and model accuracy.

---

## 📊 Dashboard Features

* Prediction Probability Charts
* Feature Importance Graphs
* Batch Prediction Summary
* Personalized Suggestions
* Interactive Visual Analytics

---

## 🧠 Machine Learning Model

* Random Forest Classifier
* Data Preprocessing
* Feature Engineering
* Model Evaluation
* Multi-Class Classification

---

## 🧪 Testing

```bash
python predict.py
```

---

## 🌟 Future Improvements

* Docker Deployment
* Unit Testing
* AWS Cloud Deployment
* Advanced Model Optimization

---
