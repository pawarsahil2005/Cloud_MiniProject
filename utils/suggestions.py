"""
Suggestion Engine for Student Performance Dashboard
Generates actionable suggestions based on prediction class and input features.
"""


def get_suggestions(prediction, student_data=None):
    """
    Generate suggestions based on predicted performance class.

    Args:
        prediction (str): The predicted class - 'Excellent', 'Good', 'Average', or 'At Risk'
        student_data (dict, optional): Dictionary of student feature values for personalized suggestions

    Returns:
        dict: Contains 'title', 'icon', 'suggestions' list, and 'color'
    """

    suggestions_map = {
        "Excellent": {
            "title": "Outstanding Performance! 🌟",
            "icon": "🏆",
            "color": "#10b981",
            "suggestions": [
                "Continue maintaining your excellent study habits and consistency.",
                "Consider mentoring other students to strengthen your own understanding.",
                "Explore advanced certifications and competitive programming challenges.",
                "Participate in research projects or hackathons to expand your skillset.",
                "Start building a strong portfolio for higher education or placements.",
                "Take leadership roles in academic clubs and technical communities."
            ]
        },
        "Good": {
            "title": "Great Progress! 👏",
            "icon": "📈",
            "color": "#3b82f6",
            "suggestions": [
                "You are performing well — push a little more to reach the Excellent tier.",
                "Focus on improving internal marks by revising key concepts regularly.",
                "Increase study hours by 1-2 hours daily for complex subjects.",
                "Complete at least 2 more certifications to boost your profile.",
                "Attend all classes consistently to improve your attendance score.",
                "Practice previous year question papers for better exam preparation."
            ]
        },
        "Average": {
            "title": "Room for Improvement 📊",
            "icon": "⚠️",
            "color": "#f59e0b",
            "suggestions": [
                "Create a structured daily study schedule and stick to it consistently.",
                "Focus on improving attendance — aim for 85%+ attendance rate.",
                "Seek help from professors or peers for difficult topics immediately.",
                "Complete all termwork assignments on time with quality submissions.",
                "Start working on at least 1 certification in your area of interest.",
                "Join study groups to stay motivated and learn collaboratively.",
                "Review and revise previous CGPA weak subjects to strengthen fundamentals."
            ]
        },
        "At Risk": {
            "title": "Immediate Action Required! 🚨",
            "icon": "🔴",
            "color": "#ef4444",
            "suggestions": [
                "URGENT: Increase daily study hours to at least 4-5 hours immediately.",
                "Attend ALL classes without fail — every lecture counts significantly.",
                "Meet with your academic advisor or mentor for a personalized improvement plan.",
                "Focus on completing all pending termwork and internal assessments.",
                "Start with basics — revisit fundamental concepts before moving to advanced topics.",
                "Avoid distractions and create a dedicated, quiet study environment.",
                "Set small daily goals and track your progress consistently.",
                "Consider enrolling in remedial classes or tutorial sessions.",
                "Maintain a positive mindset — improvement is absolutely possible with effort."
            ]
        }
    }

    result = suggestions_map.get(prediction, suggestions_map["Average"])

    # Add personalized suggestions based on student data
    if student_data:
        personalized = []

        study_hours = student_data.get("study_hours", 0)
        attendance = student_data.get("attendance", 0)
        internal_marks = student_data.get("internal_marks", 0)
        termwork_marks = student_data.get("termwork_marks", 0)
        previous_cgpa = student_data.get("previous_cgpa", 0)
        certifications = student_data.get("certifications_completed", 0)

        if study_hours < 4:
            personalized.append(
                f"📚 Your study hours ({study_hours:.1f}h) are below recommended. Aim for at least 5+ hours daily."
            )
        if attendance < 75:
            personalized.append(
                f"📋 Your attendance ({attendance:.1f}%) is critically low. Minimum 75% is mandatory."
            )
        if internal_marks < 60:
            personalized.append(
                f"📝 Internal marks ({internal_marks:.1f}) need improvement. Focus on assignment quality."
            )
        if termwork_marks < 60:
            personalized.append(
                f"🔧 Termwork marks ({termwork_marks:.1f}) are below average. Submit all practical work on time."
            )
        if previous_cgpa < 7.0:
            personalized.append(
                f"📉 Previous CGPA ({previous_cgpa:.2f}) indicates weak fundamentals. Revise core subjects."
            )
        if certifications < 2:
            personalized.append(
                f"🏅 Only {certifications} certification(s) completed. Aim for at least 3-4 certifications."
            )

        if personalized:
            result = dict(result)  # copy
            result["personalized"] = personalized

    return result
