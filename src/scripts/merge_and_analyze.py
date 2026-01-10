
import json
import sys
import pandas as pd
import numpy as np
import os
import uuid
from collections import Counter

# Grade to GPA mapping
GRADE_TO_GPA = {
    'A+': 4.0,
    'A': 3.75,
    'A-': 3.5,
    'B+': 3.25,
    'B': 3.0,
    'B-': 2.75,
    'C+': 2.5,
    'C': 2.25,
    'D': 2.0,
    'F': 0.0,
}

# Keys that are definitely not course names
NON_COURSE_KEYS = {
    "creditHours", "creditLoad", "credits", "attendancePercentage", 
    "gpa", "grade", "score", "semesterName", "semester", "details"
}

def calculate_semester_gpa(semester_data, credits_per_subject=3):
    total_points = 0
    total_credits = 0

    search_locations = [semester_data]
    if isinstance(semester_data.get("details"), dict):
        search_locations.append(semester_data["details"])

    for loc in search_locations:
        for key, value in loc.items():
            if key not in NON_COURSE_KEYS and isinstance(value, str) and value in GRADE_TO_GPA:
                total_points += GRADE_TO_GPA[value] * credits_per_subject
                total_credits += credits_per_subject
        if total_credits > 0:
            break

    return total_points / total_credits if total_credits > 0 else np.nan

def process_student_data(students):
    """Processes raw student data to standardize fields and calculate aggregates."""
    for student in students:
        # Ensure each student has a unique ID
        if 'student_id' in student:
            student['id'] = student['student_id']
        elif 'student_id' not in student:
            student['id'] = str(uuid.uuid4())

        # --- Standardize Pre-Graduation GPA (SSC + HSC) ---
        ssc_keys = ['ssc_gpa', 'sscGpa', 'sscGPA']
        hsc_keys = ['hsc_gpa', 'hscGpa', 'hscGPA']

        ssc_gpa = np.nan
        hsc_gpa = np.nan

        for key in ssc_keys:
            if key in student:
                try:
                    ssc_gpa = float(student[key])
                    break
                except (ValueError, TypeError):
                    pass

        for key in hsc_keys:
            if key in student:
                try:
                    hsc_gpa = float(student[key])
                    break
                except (ValueError, TypeError):
                    pass

        # Weighted pre-graduation GPA (Bangladesh-aware)
        if not pd.isna(ssc_gpa) and not pd.isna(hsc_gpa):
            pre_grad_gpa = 0.3 * ssc_gpa + 0.7 * hsc_gpa
        elif not pd.isna(hsc_gpa):
            pre_grad_gpa = hsc_gpa
        elif not pd.isna(ssc_gpa):
            pre_grad_gpa = ssc_gpa
        else:
            pre_grad_gpa = np.nan

        student['ssc_gpa'] = ssc_gpa
        student['hsc_gpa'] = hsc_gpa
        student['pre_grad_gpa'] = pre_grad_gpa


        # --- Standardize Semester Structure (dict to list) ---
        semesters_list = []
        if "semesters" in student and isinstance(student.get("semesters"), dict):
             semesters_list = list(student["semesters"].values())
        elif "semesterDetails" in student and isinstance(student.get("semesterDetails"), list):
             semesters_list = student["semesterDetails"]
        elif "semesters" in student and isinstance(student.get("semesters"), list):
            semesters_list = student["semesters"]
        
        student["semesters"] = semesters_list # Replace original with list
        if "semesterDetails" in student: # Clean up old key
            del student["semesterDetails"]

        # --- Process Each Semester (in-place) ---
        for semester in student.get("semesters", []):
            if not isinstance(semester, dict):
                continue

            # Calculate GPA and append to the semester object
            semester["gpa"] = calculate_semester_gpa(semester)

            # Standardize credit load and append
            credit_keys = ['creditLoad', 'creditHours', 'credits']
            credit_val = np.nan
            search_loc = semester.get("details", semester)
            if not isinstance(search_loc, dict):
                search_loc = semester
            for key in credit_keys:
                if key in search_loc:
                    try:
                        credit_val = float(search_loc[key])
                        break
                    except (ValueError, TypeError, AttributeError):
                        continue
            semester["creditLoad"] = credit_val

            # Standardize attendance and append
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

        # --- Calculate Student-Level Aggregates ---
        valid_attendances = [s['attendancePercentage'] for s in student["semesters"] if pd.notna(s.get('attendancePercentage'))]
        student['avg_attendance'] = np.mean(valid_attendances) if valid_attendances else np.nan
        
        # Standardize CGPA
        if 'cgpa' not in student or not isinstance(student['cgpa'], (int, float)):
            total_points = 0
            total_credits = 0

            for s in student['semesters']:
                if pd.notna(s.get('gpa')) and pd.notna(s.get('creditLoad')):
                    total_points += s['gpa'] * s['creditLoad']
                    total_credits += s['creditLoad']

            student['cgpa'] = total_points / total_credits if total_credits > 0 else np.nan
            if pd.notna(student['cgpa']):
                student['cgpa'] = round(student['cgpa'], 2)

    return students

def analyze_data(students_df, plot_points=10):
    """Performs an in-depth analysis of the processed student dataset."""
    summary = {}
   

    # Total students before any filtering
    summary['total_students'] = int(students_df['student_id'].nunique())

    # Drop students with NaN CGPA for accurate analysis
    students_df.dropna(subset=['cgpa'], inplace=True)
    if students_df.empty:
        return {
            'hsc_vs_cgpa_density': [], 
            'performance_distribution': [], 
            'department_distribution': [],
            'cgpa_distribution': [],
            'credit_load_vs_grade': [],
            'attendance_vs_grade': [],
            'semester_count_distribution': [],
            'credit_distribution': []
        }, [], []

    # CGPA Distribution data
    bins = {}
    bin_size = 0.2
    for index, row in students_df.iterrows():
        cgpa = row['cgpa']
        student_id = row.get('id', 'N/A') # Use .get for safety
        adjusted_cgpa = 3.99 if cgpa >= 4.0 else cgpa
        if pd.notna(adjusted_cgpa):
            bin_val = np.floor(adjusted_cgpa / bin_size) * bin_size
            bin_key = f"{bin_val:.2f}"
            bins[bin_key] = bins.get(bin_key, 0) + 1

    
    cgpa_dist_data = []
    i = 0.0
    while i < 4.0:
        bin_key = f"{i:.2f}"
        cgpa_dist_data.append({
            "cgpa": i + bin_size / 2,
            "students": bins.get(bin_key, 0)
        })
        i += bin_size
    summary['cgpa_distribution'] = cgpa_dist_data

    # Performance Distribution
    perf_bins = [0, 2.5, 3.5, 4.0]
    labels = ['Low', 'Mid', 'High']
    students_df['performance_group'] = pd.cut(students_df['cgpa'], bins=perf_bins, labels=labels, include_lowest=True)
    performance_dist_series = students_df['performance_group'].value_counts()
    summary['performance_distribution'] = [
        {'name': index, 'value': value}
        for index, value in performance_dist_series.items()
    ]
    
    department_dist_series = students_df['department'].value_counts()
    summary['department_distribution'] = [
        {'name': index, 'value': value}
        for index, value in department_dist_series.items()
    ]

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
                "preGpa": density_df['pre_grad_gpa'].min() + (x + 0.5) * x_bin_width,
                "uniCgpa": density_df['cgpa'].min() + (y + 0.5) * y_bin_width,
                "count": c,
                "z": np.sqrt(c)
            }
            for x, y, c in zip(bin_counts['x_bin'], bin_counts['y_bin'], bin_counts['count'])
        ]
    else:
        summary['hsc_vs_cgpa_density'] = []

    # Credit Load and Attendance vs. Grade Analysis
    all_semesters = students_df.explode('semesters')
    all_semesters = all_semesters[all_semesters['semesters'].apply(lambda s: isinstance(s, dict) and pd.notna(s.get('creditLoad')) and pd.notna(s.get('gpa')) and pd.notna(s.get('attendancePercentage')))]

    if not all_semesters.empty:
        # Credit Load vs Grade
        credit_bins = {}
        for _, row in all_semesters.iterrows():
            semester = row['semesters']
            credit_bin = int(round(semester['creditLoad'] / 3) * 3)
            if credit_bin not in credit_bins:
                credit_bins[credit_bin] = {'total_gpa': 0, 'count': 0}
            credit_bins[credit_bin]['total_gpa'] += semester['gpa']
            credit_bins[credit_bin]['count'] += 1
        
        summary['credit_load_vs_grade'] = sorted([
            {"creditLoad": k, "avgGpa": v['total_gpa'] / v['count']}
            for k, v in credit_bins.items()
        ], key=lambda x: x['creditLoad'])
        
        # Attendance vs Grade
        min_attendance = all_semesters['semesters'].apply(lambda s: s['attendancePercentage']).min()
        max_attendance = all_semesters['semesters'].apply(lambda s: s['attendancePercentage']).max()
        bin_size = (max_attendance - min_attendance) / plot_points
        
        attendance_bins = {}
        for _, row in all_semesters.iterrows():
            semester = row['semesters']
            attendance_bin = int(np.floor((semester['attendancePercentage'] - min_attendance) / bin_size))
            if attendance_bin not in attendance_bins:
                attendance_bins[attendance_bin] = {'total_gpa': 0, 'total_attendance': 0, 'count': 0}
            attendance_bins[attendance_bin]['total_gpa'] += semester['gpa']
            attendance_bins[attendance_bin]['total_attendance'] += semester['attendancePercentage']
            attendance_bins[attendance_bin]['count'] += 1
            
        summary['attendance_vs_grade'] = sorted([
            {"attendance": v['total_attendance'] / v['count'], "avgGpa": v['total_gpa'] / v['count']}
            for k, v in attendance_bins.items()
        ], key=lambda x: x['attendance'])

    else:
        summary['credit_load_vs_grade'] = []
        summary['attendance_vs_grade'] = []
    
    # Semester Count Distribution
    semester_counts = students_df['semesters'].apply(lambda s: len(s) if isinstance(s, list) else 0)
    semester_count_distribution = semester_counts.value_counts().sort_index().to_dict()

    summary['semester_count_distribution'] = [
        {'name': f'{count} Semesters', 'count': num_students}
        for count, num_students in semester_count_distribution.items()
    ]

    # Credit Hour Distribution
    all_semesters_for_credits = students_df.explode('semesters')
    all_semesters_for_credits = all_semesters_for_credits[all_semesters_for_credits['semesters'].apply(lambda s: isinstance(s, dict) and pd.notna(s.get('creditLoad')))]
    
    if not all_semesters_for_credits.empty:
        credit_loads = all_semesters_for_credits['semesters'].apply(lambda s: s.get('creditLoad'))
        credit_distribution = credit_loads.astype(int).value_counts().sort_index().to_dict()
        summary['credit_distribution'] = [
            {'name': f'{credit} Credits', 'count': num_semesters}
            for credit, num_semesters in credit_distribution.items()
        ]
    else:
        summary['credit_distribution'] = []

    # General Statistics
    summary['avg_cgpa'] = students_df['cgpa'].mean()
    summary['median_cgpa'] = students_df['cgpa'].median()

    # Attendance Analysis
    attendance_df = students_df.dropna(subset=['avg_attendance'])
    summary['avg_attendance'] = attendance_df['avg_attendance'].mean() if not attendance_df.empty else 0

    # Insights
    insights = []
    if not pd.isna(summary.get('avg_cgpa')) and summary['avg_cgpa'] < 2.8:
        insights.append(f"The average CGPA of {summary['avg_cgpa']:.2f} is concerning.")
    
    if not insights:
        insights.append("The dataset appears healthy overall.")

    return summary, insights

def main():
    # Default plot points
    plot_points = 10
    file_paths = []

    # Separate file paths from other arguments
    for arg in sys.argv[1:]:
        if arg.startswith('--plot-points='):
            try:
                plot_points = int(arg.split('=')[1])
            except (ValueError, IndexError):
                print(json.dumps({"error": "Invalid value for --plot-points"}), file=sys.stderr)
                sys.exit(1)
        else:
            file_paths.append(arg)

    if not file_paths:
        print(json.dumps({"error": "No file paths provided"}), file=sys.stderr)
        sys.exit(1)

    all_students = []
    for file_path in file_paths:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict) and 'students' in data:
                    students_to_extend = data['students']
                elif isinstance(data, list):
                    students_to_extend = data
                else:
                    students_to_extend = []
                all_students.extend(students_to_extend)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(json.dumps({"error": f"Failed to read or parse {file_path}: {str(e)}"}), file=sys.stderr)
            continue

    if not all_students:
        print(json.dumps({"error": "No valid student data found in any of the provided files"}), file=sys.stderr)
        sys.exit(1)

    processed_students = process_student_data(all_students)
    students_df = pd.DataFrame(processed_students)
    
    summary, insights = analyze_data(students_df.copy(), plot_points=plot_points)

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
    
    # --- Save full dataset to a temporary file ---
    output_dir = "tmp"
    os.makedirs(output_dir, exist_ok=True)
    download_filename = f"merged_data_{uuid.uuid4()}.json"
    output_path = os.path.join(output_dir, download_filename)

    # --- Clean up DataFrame for final download ---
    # Ensure 'id' is kept for the final JSON output if it exists
    final_columns = [col for col in students_df.columns if col not in ['semesters', 'pre_grad_gpa', 'avg_attendance', 'performance_group', 'semester_details']]
    students_df_cleaned = students_df[final_columns]

    students_df_cleaned.replace({np.nan: None}, inplace=True)
    final_students_json = students_df_cleaned.to_dict('records')
    
    with open(output_path, 'w') as f:
        json.dump(final_students_json, f, indent=2)
    # ---------------------------------------------

    result = {
        "summary": summary,
        "insights": insights,
        "downloadFilename": download_filename,
        "params": {
            "std_credit": 18, 
            "max_credit_impact": 0.15,
            "plot_points": plot_points
        }
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
