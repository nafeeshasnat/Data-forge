
import json
import sys
import pandas as pd
import numpy as np

# Grade to GPA mapping
GRADE_TO_GPA = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "F": 0.0,
}

# Keys in the semester data that are not course names
NON_COURSE_KEYS = {"creditHours", "creditLoad", "credits", "attendancePercentage", "gpa", "grade", "score"}

def calculate_semester_gpa(semester_data):
    """Calculates the GPA for a single semester from its course grades."""
    total_gpa_points = 0
    course_count = 0

    # Prioritize the nested 'details' object, but fall back to the semester object
    search_locations = []
    if isinstance(semester_data.get("details"), dict):
        search_locations.append(semester_data["details"])
    search_locations.append(semester_data)

    for loc in search_locations:
        for key, value in loc.items():
            if key not in NON_COURSE_KEYS:
                total_gpa_points += GRADE_TO_GPA.get(value, 0.0)
                course_count += 1
        if course_count > 0: # Stop if courses are found to avoid double-counting
            break
            
    return total_gpa_points / course_count if course_count > 0 else 0

def process_student_data(students):
    """
    Processes raw student data to standardize fields and calculate aggregates.
    """
    processed_students = []
    for student in students:
        if "semesters" in student and "semesterDetails" not in student:
            student["semesterDetails"] = student.pop("semesters")
        if isinstance(student.get("semesterDetails"), dict):
            student["semesterDetails"] = list(student["semesterDetails"].values())
        if not isinstance(student.get("semesterDetails"), list):
            student["semesterDetails"] = []

        processed_semesters = []
        for semester in student.get("semesterDetails", []):
            if not isinstance(semester, dict):
                continue
            
            # Calculate GPA from grades
            semester["gpa"] = calculate_semester_gpa(semester)

            # Standardize credit load
            search_loc = semester.get("details", semester)
            credit_load_val = search_loc.get("creditLoad", search_loc.get("creditHours", search_loc.get("credits")))
            try:
                semester["creditLoad"] = float(credit_load_val)
            except (ValueError, TypeError, AttributeError):
                semester["creditLoad"] = 0

            processed_semesters.append(semester)

        student["semesterDetails"] = processed_semesters

        total_attendance = sum(s.get("attendancePercentage", 0) for s in student["semesterDetails"])
        semester_count = len(student["semesterDetails"])

        student['avg_attendance'] = total_attendance / semester_count if semester_count > 0 else 0
        
        processed_students.append(student)
    return processed_students

def analyze_data(students_df):
    """
    Performs an in-depth analysis of the processed student dataset.
    """
    summary = {}
    insights = []

    bins = [0, 2.5, 3.5, 4.0]
    labels = ['Low', 'Mid', 'High']
    students_df['performance_group'] = pd.cut(students_df['cgpa'], bins=bins, labels=labels, include_lowest=True)
    summary['performanceDistribution'] = students_df['performance_group'].value_counts().to_dict()
    summary['departmentDistribution'] = students_df['department'].value_counts().to_dict()

    if 'hsc_gpa' in students_df.columns and not students_df['hsc_gpa'].empty:
        x_bins, y_bins = 20, 20
        x_bin_width, y_bin_width = (5.0 - 0.0) / x_bins, (4.0 - 0.0) / y_bins
        students_df['x_bin'] = np.floor((students_df['hsc_gpa'] - 0.0) / x_bin_width).astype(int).clip(0, x_bins - 1)
        students_df['y_bin'] = np.floor((students_df['cgpa'] - 0.0) / y_bin_width).astype(int).clip(0, y_bins - 1)
        bin_counts = students_df.groupby(['x_bin', 'y_bin']).size().reset_index(name='count')
        summary['hscVsCgpaDensity'] = [
            {"preGpa": 0.0 + (x + 0.5) * x_bin_width, "uniCgpa": 0.0 + (y + 0.5) * y_bin_width, "count": c}
            for x, y, c in zip(bin_counts['x_bin'], bin_counts['y_bin'], bin_counts['count'])
        ]
        students_df.drop(columns=['x_bin', 'y_bin'], inplace=True)
    else:
        summary['hscVsCgpaDensity'] = []

    summary['average_cgpa'] = students_df['cgpa'].mean()
    summary['median_cgpa'] = students_df['cgpa'].median()
    summary['top_performers'] = students_df.nlargest(5, 'cgpa').to_dict('records')
    summary['low_performers'] = students_df.nsmallest(5, 'cgpa').to_dict('records')

    low_attendance_threshold = 75
    summary['average_attendance'] = students_df['avg_attendance'].mean()
    summary['low_attendance_students'] = students_df[students_df['avg_attendance'] < low_attendance_threshold].to_dict('records')

    if summary['average_cgpa'] < 2.8:
        insights.append(f"The average CGPA of {summary['average_cgpa']:.2f} is concerning.")
    if len(summary['low_performers']) > 0:
        insights.append(f"{len(summary['low_performers'])} students need immediate attention.")
    if len(summary['low_attendance_students']) > 0:
        insights.append(f"{len(summary['low_attendance_students'])} students have low attendance.")
    if not insights:
        insights.append("The dataset appears healthy.")

    return summary, insights

def main():
    file_paths = sys.argv[1:]
    if not file_paths:
        print(json.dumps({"error": "No file paths provided"}), file=sys.stderr)
        sys.exit(1)

    all_students = []
    for file_path in file_paths:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                all_students.extend(data.get('students', []))
        except (json.JSONDecodeError, FileNotFoundError):
            print(json.dumps({"error": f"Failed to read or parse {file_path}"}), file=sys.stderr)
            continue # Continue to next file on error

    if not all_students:
        print(json.dumps({"error": "No student data found"}), file=sys.stderr)
        sys.exit(1)

    processed_students = process_student_data(all_students)
    students_df = pd.DataFrame(processed_students)
    
    if 'hscGpa' in students_df.columns:
        students_df.rename(columns={'hscGpa': 'hsc_gpa'}, inplace=True)
    if 'hsc_gpa' in students_df.columns:
        students_df['hsc_gpa'] = pd.to_numeric(students_df['hsc_gpa'], errors='coerce').fillna(0)
    
    summary, insights = analyze_data(students_df)

    def convert_numpy_types(obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, dict): return {k: convert_numpy_types(v) for k, v in obj.items()}
        if isinstance(obj, list): return [convert_numpy_types(i) for i in obj]
        return obj

    summary = convert_numpy_types(summary)
    
    result = {
        "summary": summary,
        "insights": insights,
        "students": json.loads(students_df.to_json(orient='records')),
        "params": {"stdCredit": 18, "maxCreditImpact": 0.15}
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
