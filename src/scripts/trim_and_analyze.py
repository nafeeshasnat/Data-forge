
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
    """Processes and standardizes student data."""
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

def analyze_data(students_df):
    """Performs an in-depth analysis of the processed student dataset."""
    summary = {}
    if students_df.empty:
        return {}, []

    summary['total_students'] = int(students_df['student_id'].nunique())
    students_df.dropna(subset=['cgpa'], inplace=True)
    if students_df.empty:
        return {'total_students': 0}, []
        
    # --- Distributions ---
    summary['cgpa_distribution'] = [{'cgpa': i + 0.1, 'students': len(students_df[(students_df['cgpa'] >= i) & (students_df['cgpa'] < i + 0.2)])} for i in np.arange(0, 4, 0.2)]
    summary['performance_distribution'] = students_df.groupby(pd.cut(students_df['cgpa'], [0, 2.5, 3.5, 4.0], labels=['Low', 'Mid', 'High'], include_lowest=True)).size().reset_index(name='value').rename(columns={'cgpa': 'name'}).to_dict('records')
    summary['department_distribution'] = students_df['department'].value_counts().reset_index().rename(columns={'index': 'name', 'count': 'value'}).to_dict('records')

    # --- General stats ---
    summary['avg_cgpa'] = students_df['cgpa'].mean()
    summary['median_cgpa'] = students_df['cgpa'].median()
    summary['avg_attendance'] = students_df['avg_attendance'].mean()
    
    insights = [f"The average CGPA of {summary['avg_cgpa']:.2f} is concerning."] if summary.get('avg_cgpa', 3.0) < 2.8 else ["The dataset appears healthy overall."]
    
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
    download_filename = f"{prefix}_{uuid.uuid4()}.json"
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
        if isinstance(obj, (np.floating, np.float_)): return float(obj)
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

    try:
        with open(input_file, 'r') as f:
            students = json.load(f)
            # Handle both list of students and {'students': [...]} format
            if isinstance(students, dict) and 'students' in students:
                students = students['students']

    except (json.JSONDecodeError, FileNotFoundError):
        print(json.dumps({"error": f"Failed to read or parse {input_file}"}), file=sys.stderr)
        sys.exit(1)
    
    processed_students = process_student_data(students)
    students_df = pd.DataFrame(processed_students)
    
    trimmed_df = trim_data(students_df.copy(), min_cgpa, max_cgpa, percentage)
    summary, insights = analyze_data(trimmed_df.copy())
    
    download_filename = save_results(trimmed_df, "trimmed_data")
    print_json_output(summary, insights, download_filename, params)

if __name__ == "__main__":
    main()
