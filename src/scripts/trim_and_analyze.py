
"""
Trim and re-analyze a single student dataset.

Flow:
1) Load and normalize the dataset.
2) Apply deterministic trimming by CGPA range.
3) Recompute summary + insights.
4) Save trimmed dataset and print JSON response.
"""

import json
import sys
import pandas as pd
import numpy as np
import os
import uuid
import hashlib

# This script is dedicated to trimming and re-analyzing a single dataset.

# Grade to GPA mapping
GRADE_TO_GPA = {
    'A+': 4.0, 'A': 3.75, 'A-': 3.5, 'B+': 3.25, 'B': 3.0, 'B-': 2.75,
    'C+': 2.5, 'C': 2.25, 'D': 2.0, 'F': 0.0,
}

NON_COURSE_KEYS = {
    "creditHours", "creditLoad", "credits", "attendancePercentage",
    "gpa", "grade", "score", "semesterName", "semester", "details"
}

def simple_string_hash(s):
    """A simple, deterministic string hashing function."""
    return int(hashlib.md5(str(s).encode()).hexdigest(), 16)

def calculate_semester_gpa(semester_data, credits_per_subject=3):
    """Compute GPA for one semester by scanning course-grade keys."""
    total_points, total_credits = 0, 0
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
    """Normalize schema differences and compute per-student aggregates."""
    for student in students:
        # --- ID Normalization ---
        if 'student_id' not in student:
            # Generate a unique numeric ID if it's missing
            student['student_id'] = int(str(uuid.uuid4().int)[:8])

        # --- GPA Calculation ---
        ssc_gpa = student.get('ssc_gpa') or student.get('sscGpa')
        hsc_gpa = student.get('hsc_gpa') or student.get('hscGpa')
        student['ssc_gpa'] = float(ssc_gpa) if ssc_gpa else np.nan
        student['hsc_gpa'] = float(hsc_gpa) if hsc_gpa else np.nan
        if pd.notna(student['ssc_gpa']) and pd.notna(student['hsc_gpa']):
            student['pre_grad_gpa'] = 0.3 * student['ssc_gpa'] + 0.7 * student['hsc_gpa']
        else:
            student['pre_grad_gpa'] = student['hsc_gpa'] if pd.notna(student['hsc_gpa']) else student['ssc_gpa']

        # --- Semester Processing ---
        semesters_list = student.get("semesters")
        if isinstance(semesters_list, dict):
            semesters_list = list(semesters_list.values())
        elif "semesterDetails" in student:
            semesters_list = student["semesterDetails"]
        student["semesters"] = semesters_list or []

        for semester in student["semesters"]:
            if isinstance(semester, dict):
                semester["gpa"] = calculate_semester_gpa(semester)
                semester["creditLoad"] = next((float(semester[k]) for k in ['creditLoad', 'creditHours', 'credits'] if k in semester and semester[k]), np.nan)
                semester['attendancePercentage'] = next((float(semester[k]) for k in ['attendancePercentage', 'attendance'] if k in semester and semester[k]), np.nan)

        valid_attendances = [s['attendancePercentage'] for s in student["semesters"] if pd.notna(s.get('attendancePercentage'))]
        student['avg_attendance'] = np.mean(valid_attendances) if valid_attendances else np.nan

        # --- CGPA Calculation ---
        if 'cgpa' not in student or pd.isna(student['cgpa']):
            valid_semesters = [s for s in student['semesters'] if pd.notna(s.get('gpa')) and pd.notna(s.get('creditLoad'))]
            total_points = sum(s['gpa'] * s['creditLoad'] for s in valid_semesters)
            total_credits = sum(s['creditLoad'] for s in valid_semesters)
            student['cgpa'] = round(total_points / total_credits, 2) if total_credits > 0 else np.nan
    return students

def analyze_data(students_df, plot_points=10, perf_high=3.5, perf_mid=2.0):
    """Aggregate statistics and chart-ready structures for the UI."""
    summary = {}
    if students_df.empty:
        return {}, []

    summary['total_students'] = int(students_df['student_id'].nunique())
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
        }, []

    # CGPA Distribution
    bins = {}
    bin_size = 0.2
    for _, row in students_df.iterrows():
        cgpa = row['cgpa']
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
    perf_bins = [0, perf_mid, perf_high, 4.0]
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

    # HSC vs CGPA Density
    density_df = students_df.dropna(subset=['pre_grad_gpa', 'cgpa'])
    if not density_df.empty:
        x_bins, y_bins = 20, 20
        x_range = density_df['pre_grad_gpa'].max() - density_df['pre_grad_gpa'].min()
        y_range = density_df['cgpa'].max() - density_df['cgpa'].min()
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

    # Credit Load and Attendance vs. Grade
    all_semesters = students_df.explode('semesters')
    all_semesters = all_semesters[all_semesters['semesters'].apply(
        lambda s: isinstance(s, dict) and pd.notna(s.get('creditLoad')) and pd.notna(s.get('gpa')) and pd.notna(s.get('attendancePercentage'))
    )]

    if not all_semesters.empty:
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
            for _, v in attendance_bins.items()
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
    all_semesters_for_credits = all_semesters_for_credits[all_semesters_for_credits['semesters'].apply(
        lambda s: isinstance(s, dict) and pd.notna(s.get('creditLoad'))
    )]
    if not all_semesters_for_credits.empty:
        credit_loads = all_semesters_for_credits['semesters'].apply(lambda s: s.get('creditLoad'))
        credit_distribution = credit_loads.astype(int).value_counts().sort_index().to_dict()
        summary['credit_distribution'] = [
            {'name': f'{credit} Credits', 'count': num_semesters}
            for credit, num_semesters in credit_distribution.items()
        ]
    else:
        summary['credit_distribution'] = []

    # General stats
    summary['avg_cgpa'] = students_df['cgpa'].mean()
    summary['median_cgpa'] = students_df['cgpa'].median()

    attendance_df = students_df.dropna(subset=['avg_attendance'])
    summary['avg_attendance'] = attendance_df['avg_attendance'].mean() if not attendance_df.empty else 0

    insights = []
    if not pd.isna(summary.get('avg_cgpa')) and summary['avg_cgpa'] < 2.8:
        insights.append(f"The average CGPA of {summary['avg_cgpa']:.2f} is concerning.")

    if not insights:
        insights.append("The dataset appears healthy overall.")

    return summary, insights

def trim_data(students_df, min_cgpa, max_cgpa, percentage):
    """Deterministically trims a percentage of students from a CGPA range."""
    in_range_mask = (students_df['cgpa'] >= min_cgpa) & (students_df['cgpa'] <= max_cgpa)
    students_in_range = students_df[in_range_mask]
    students_out_of_range = students_df[~in_range_mask]
    
    num_to_remove = int(len(students_in_range) * (percentage / 100))
    if num_to_remove == 0:
        return students_df

    # Deterministic shuffle based on student_id hash
    students_in_range['hash'] = students_in_range['student_id'].astype(str).apply(simple_string_hash)
    students_in_range_shuffled = students_in_range.sort_values(by='hash').reset_index(drop=True)
    
    trimmed_in_range = students_in_range_shuffled.iloc[num_to_remove:]
    final_df = pd.concat([students_out_of_range, trimmed_in_range.drop(columns=['hash'])]).sort_index()
    return final_df

def save_results(df, prefix):
    """Saves the DataFrame to a JSON file in the tmp directory."""
    output_dir = "tmp"
    os.makedirs(output_dir, exist_ok=True)
    unique_id = str(uuid.uuid4().int % 10000).zfill(4)
    student_count = int(df['student_id'].nunique()) if 'student_id' in df.columns else len(df.index)
    download_filename = f"{prefix}_{student_count}_students_{unique_id}.json"
    output_path = os.path.join(output_dir, download_filename)
    
    final_columns_order = ['student_id', 'department', 'ssc_gpa', 'hsc_gpa', 'cgpa', 'semesters']
    existing_columns = [col for col in final_columns_order if col in df.columns]
    
    df_cleaned = df[existing_columns].copy()
    df_cleaned.replace({np.nan: None}, inplace=True)
    
    with open(output_path, 'w') as f:
        json.dump(df_cleaned.to_dict('records'), f, indent=2)
    return download_filename

def print_json_output(summary, insights, download_filename, params):
    """Prints the final JSON output to stdout."""
    def convert_numpy_types(obj):
        if isinstance(obj, (np.integer, np.int_)): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, dict): return {k: convert_numpy_types(v) for k, v in obj.items()}
        if isinstance(obj, list): return [convert_numpy_types(i) for i in obj]
        if pd.isna(obj): return None
        return obj

    result = {
        "summary": convert_numpy_types(summary),
        "insights": insights,
        "downloadFilename": download_filename,
        "params": params
    }
    print(json.dumps(result, indent=2))

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input file provided."}), file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    
    params = {arg.split('=')[0].replace('--', ''): arg.split('=')[1] for arg in sys.argv[2:] if '=' in arg}
    min_cgpa = float(params.get('min-cgpa', 0))
    max_cgpa = float(params.get('max-cgpa', 4.0))
    percentage = float(params.get('percentage', 0))
    perf_high = float(params.get('perf-high', 3.5))
    perf_mid = float(params.get('perf-mid', 2.0))

    # 1) Load dataset from disk.
    try:
        with open(input_file, 'r') as f:
            students = json.load(f)
            # Handle both list of students and {'students': [...]} format
            if isinstance(students, dict) and 'students' in students:
                students = students['students']

    except (json.JSONDecodeError, FileNotFoundError):
        print(json.dumps({"error": f"Failed to read or parse {input_file}"}), file=sys.stderr)
        sys.exit(1)
    
    # 2) Normalize records and build DataFrame.
    processed_students = process_student_data(students)
    students_df = pd.DataFrame(processed_students)
    
    # 3) Trim and re-analyze.
    trimmed_df = trim_data(students_df.copy(), min_cgpa, max_cgpa, percentage)
    summary, insights = analyze_data(trimmed_df.copy(), plot_points=10, perf_high=perf_high, perf_mid=perf_mid)
    
    # 4) Save output and emit API response.
    download_filename = save_results(trimmed_df, "trimmed_data")
    print_json_output(summary, insights, download_filename, params)

if __name__ == "__main__":
    main()
