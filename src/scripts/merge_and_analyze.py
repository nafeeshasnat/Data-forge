
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

# Keys that are definitely not course names
NON_COURSE_KEYS = {
    "creditHours", "creditLoad", "credits", "attendancePercentage", 
    "gpa", "grade", "score", "semesterName", "semester", "details"
}

def calculate_semester_gpa(semester_data):
    """Calculates the GPA for a single semester from its course grades."""
    total_gpa_points = 0
    course_count = 0

    # Search for course grades in the semester data or a nested 'details' dict
    search_locations = [semester_data]
    if isinstance(semester_data.get("details"), dict):
        search_locations.append(semester_data["details"])

    for loc in search_locations:
        for key, value in loc.items():
            # A course is assumed to be a key that is not a non-course key and has a valid grade string as a value
            if key not in NON_COURSE_KEYS and isinstance(value, str) and value in GRADE_TO_GPA:
                total_gpa_points += GRADE_TO_GPA[value]
                course_count += 1
        if course_count > 0:  # Prioritize the first location where courses are found
            break
            
    return total_gpa_points / course_count if course_count > 0 else np.nan

def process_student_data(students):
    """Processes raw student data to standardize fields and calculate aggregates."""
    processed_students = []
    for student in students:
        # --- Standardize Pre-Graduation GPA ---
        pre_grad_gpa_keys = ['pre_grad_gpa', 'hscGpa', 'hsc_gpa', 'preGradGpa']
        gpa_val = np.nan
        for key in pre_grad_gpa_keys:
            if key in student:
                try:
                    gpa_val = float(student[key])
                    break
                except (ValueError, TypeError):
                    continue
        student['pre_grad_gpa'] = gpa_val

        # --- Standardize Semester Structure ---
        if "semesters" in student and "semesterDetails" not in student:
            student["semesterDetails"] = student.pop("semesters")
        if isinstance(student.get("semesterDetails"), dict):
            student["semesterDetails"] = list(student["semesterDetails"].values())
        if not isinstance(student.get("semesterDetails"), list):
            student["semesterDetails"] = []

        # --- Process Each Semester ---
        processed_semesters = []
        for semester in student.get("semesterDetails", []):
            if not isinstance(semester, dict):
                continue

            # Calculate GPA from grades, defaulting to NaN if not possible
            semester["gpa"] = calculate_semester_gpa(semester)

            # Standardize credit load, defaulting to NaN
            credit_keys = ['creditLoad', 'creditHours', 'credits']
            credit_val = np.nan
            search_loc = semester.get("details", semester)
            for key in credit_keys:
                if key in search_loc:
                    try:
                        credit_val = float(search_loc[key])
                        break
                    except (ValueError, TypeError, AttributeError):
                        continue
            semester["creditLoad"] = credit_val

            # Standardize attendance, defaulting to NaN
            attendance_keys = ['attendancePercentage', 'attendance', 'attendance_percentage']
            attendance_val = np.nan
            for key in attendance_keys:
                if key in semester:
                    try:
                        attendance_val = float(semester[key])
                        break
                    except (ValueError, TypeError):
                        continue
            semester['attendancePercentage'] = attendance_val

            processed_semesters.append(semester)

        student["semesterDetails"] = processed_semesters

        # --- Calculate Student-Level Aggregates ---
        valid_attendances = [s['attendancePercentage'] for s in student["semesterDetails"] if pd.notna(s.get('attendancePercentage'))]
        student['avg_attendance'] = np.mean(valid_attendances) if valid_attendances else np.nan
        
        # Standardize CGPA
        if 'cgpa' not in student or not isinstance(student['cgpa'], (int, float)):
            student['cgpa'] = np.nan

        processed_students.append(student)
    return processed_students

def analyze_data(students_df):
    """Performs an in-depth analysis of the processed student dataset."""
    summary = {}

    # Drop students with NaN CGPA for accurate analysis
    students_df.dropna(subset=['cgpa'], inplace=True)
    if students_df.empty:
        return {'hsc_vs_cgpa_density': [], 'performance_distribution': {}, 'department_distribution': {}}, []

    # Performance Distribution
    bins = [0, 2.5, 3.5, 4.0]
    labels = ['Low', 'Mid', 'High']
    students_df['performance_group'] = pd.cut(students_df['cgpa'], bins=bins, labels=labels, include_lowest=True)
    summary['performance_distribution'] = students_df['performance_group'].value_counts().to_dict()
    summary['department_distribution'] = students_df['department'].value_counts().to_dict()

    # HSC vs CGPA Density (only if pre_grad_gpa data exists)
    density_df = students_df.dropna(subset=['pre_grad_gpa', 'cgpa'])
    if not density_df.empty:
        x_bins, y_bins = 20, 20
        x_range, y_range = (density_df['pre_grad_gpa'].max() - density_df['pre_grad_gpa'].min()), (density_df['cgpa'].max() - density_df['cgpa'].min())
        x_bin_width = x_range / x_bins if x_range > 0 else 1
        y_bin_width = y_range / y_bins if y_range > 0 else 1
        
        density_df['x_bin'] = np.floor((density_df['pre_grad_gpa'] - density_df['pre_grad_gpa'].min()) / x_bin_width).astype(int).clip(0, x_bins - 1)
        density_df['y_bin'] = np.floor((density_df['cgpa'] - density_df['cgpa'].min()) / y_bin_width).astype(int).clip(0, y_bins - 1)
        
        bin_counts = density_df.groupby(['x_bin', 'y_bin']).size().reset_index(name='count')
        summary['hsc_vs_cgpa_density'] = [
            {
                "pre_gpa": density_df['pre_grad_gpa'].min() + (x + 0.5) * x_bin_width,
                "uni_cgpa": density_df['cgpa'].min() + (y + 0.5) * y_bin_width,
                "count": c
            }
            for x, y, c in zip(bin_counts['x_bin'], bin_counts['y_bin'], bin_counts['count'])
        ]
    else:
        summary['hsc_vs_cgpa_density'] = []

    # General Statistics
    summary['avg_cgpa'] = students_df['cgpa'].mean()
    summary['median_cgpa'] = students_df['cgpa'].median()
    summary['top_performers'] = students_df.nlargest(5, 'cgpa').to_dict('records')
    summary['low_performers'] = students_df.nsmallest(5, 'cgpa').to_dict('records')

    # Attendance Analysis
    attendance_df = students_df.dropna(subset=['avg_attendance'])
    low_attendance_threshold = 75
    summary['avg_attendance'] = attendance_df['avg_attendance'].mean() if not attendance_df.empty else 0
    summary['low_attendance_students'] = attendance_df[attendance_df['avg_attendance'] < low_attendance_threshold].to_dict('records')

    # Insights
    insights = []
    if summary['avg_cgpa'] < 2.8:
        insights.append(f"The average CGPA of {summary['avg_cgpa']:.2f} is concerning.")
    if len(summary['low_performers']) > 0:
        insights.append(f"{len(summary['low_performers'])} students may need academic support.")
    if len(summary['low_attendance_students']) > 0:
        insights.append(f"{len(summary['low_attendance_students'])} students have low attendance, which may affect their performance.")
    if not insights:
        insights.append("The dataset appears healthy overall.")

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
                students_to_extend = data.get('students', data if isinstance(data, list) else [])
                all_students.extend(students_to_extend)
        except (json.JSONDecodeError, FileNotFoundError):
            print(json.dumps({"error": f"Failed to read or parse {file_path}"}), file=sys.stderr)
            continue

    if not all_students:
        print(json.dumps({"error": "No valid student data found in files"}), file=sys.stderr)
        sys.exit(1)

    processed_students = process_student_data(all_students)
    students_df = pd.DataFrame(processed_students)
    
    summary, insights = analyze_data(students_df)

    # Convert numpy types to native Python types for JSON serialization
    def convert_numpy_types(obj):
        if isinstance(obj, dict):
            return {k: convert_numpy_types(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [convert_numpy_types(i) for i in obj]
        if isinstance(obj, (np.integer, np.int_)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float_)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return obj


    summary = convert_numpy_types(summary)
    
    # Convert DataFrame to JSON-compatible format, handling NaN
    students_json = json.loads(students_df.to_json(orient='records', default_handler=lambda x: None if pd.isna(x) else x))

    result = {
        "summary": summary,
        "insights": insights,
        "students": students_json,
        "params": {"std_credit": 18, "max_credit_impact": 0.15}
    }
    print(json.dumps(result, indent=2, allow_nan=False))

if __name__ == "__main__":
    main()
