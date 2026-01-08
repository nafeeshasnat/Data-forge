
import json
import sys
import pandas as pd
import numpy as np

def process_student_data(students):
    """
    Processes raw student data to flatten the semester information.
    """
    processed_students = []
    for student in students:
        semesters = student.get("semesters", {})
        
        if isinstance(semesters, dict) and semesters:
            total_credits = sum(details.get("creditHours", 0) for details in semesters.values())
            total_attendance = sum(details.get("attendancePercentage", 0) for details in semesters.values())
            semester_count = len(semesters)
            
            student['avg_attendance'] = total_attendance / semester_count if semester_count > 0 else 0
            student['avg_credit_load'] = total_credits / semester_count if semester_count > 0 else 0
        else:
            student['avg_attendance'] = 0
            student['avg_credit_load'] = 0
        
        processed_students.append(student)
    return processed_students

def analyze_data(students_df):
    """
    Performs an in-depth analysis of the processed student dataset.
    """
    summary = {}
    insights = []

    # --- Performance Group Distribution ---
    bins = [0, 2.5, 3.5, 4.0]
    labels = ['Low', 'Mid', 'High']
    students_df['performance_group'] = pd.cut(students_df['cgpa'], bins=bins, labels=labels, include_lowest=True)
    summary['performanceDistribution'] = students_df['performance_group'].value_counts().to_dict()

    # --- Department Distribution ---
    summary['departmentDistribution'] = students_df['department'].value_counts().to_dict()

    # --- HSC vs CGPA Binned Scatter Plot ---
    if 'hsc_gpa' in students_df.columns:
        x_bins = 20
        y_bins = 20
        x_bin_width = (5.0 - 0.0) / x_bins
        y_bin_width = (4.0 - 0.0) / y_bins

        students_df['x_bin'] = np.floor((students_df['hsc_gpa'] - 0.0) / x_bin_width).astype(int)
        students_df['y_bin'] = np.floor((students_df['cgpa'] - 0.0) / y_bin_width).astype(int)

        # Clamp indices to valid ranges
        students_df['x_bin'] = students_df['x_bin'].clip(0, x_bins - 1)
        students_df['y_bin'] = students_df['y_bin'].clip(0, y_bins - 1)

        bin_counts = students_df.groupby(['x_bin', 'y_bin']).size().reset_index(name='count')

        summary['hscVsCgpaDensity'] = [
            {
                "preGpa": 0.0 + (x_bin + 0.5) * x_bin_width,
                "uniCgpa": 0.0 + (y_bin + 0.5) * y_bin_width,
                "count": count
            }
            for x_bin, y_bin, count in zip(bin_counts['x_bin'], bin_counts['y_bin'], bin_counts['count'])
        ]
        students_df.drop(columns=['x_bin', 'y_bin'], inplace=True)

    else:
        summary['hscVsCgpaDensity'] = []


    # --- Performance Analysis ---
    summary['average_cgpa'] = students_df['cgpa'].mean()
    summary['median_cgpa'] = students_df['cgpa'].median()
    summary['top_performers'] = students_df.nlargest(5, 'cgpa').to_dict('records')
    summary['low_performers'] = students_df.nsmallest(5, 'cgpa').to_dict('records')

    # --- Attendance Analysis ---
    low_attendance_threshold = 75
    summary['average_attendance'] = students_df['avg_attendance'].mean()
    summary['low_attendance_students'] = students_df[students_df['avg_attendance'] < low_attendance_threshold].to_dict('records')

    # --- Credit Load Analysis ---
    summary['average_credit_load'] = students_df['avg_credit_load'].mean()
    summary['overloaded_students'] = students_df[students_df['avg_credit_load'] > 20].to_dict('records')
    summary['underloaded_students'] = students_df[students_df['avg_credit_load'] < 15].to_dict('records')

    # --- Generate Insights ---
    if summary['average_cgpa'] < 2.8:
        insights.append(f"The average CGPA of {summary['average_cgpa']:.2f} is concerning. Consider implementing academic support programs.")
    
    low_perf_count = len(summary['low_performers'])
    if low_perf_count > 0:
        insights.append(f"{low_perf_count} students have a CGPA below 2.0. These students may be at high risk and require immediate attention.")

    low_attendance_count = len(summary['low_attendance_students'])
    if low_attendance_count > 0:
        insights.append(f"{low_attendance_count} students have an average attendance rate below {low_attendance_threshold}%. This is a strong predictor of poor performance.")

    if not insights:
        insights.append("The dataset appears healthy. No immediate concerns were identified.")

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
            sys.exit(1)

    if not all_students:
        print(json.dumps({"error": "No student data found"}), file=sys.stderr)
        sys.exit(1)

    processed_students = process_student_data(all_students)
    students_df = pd.DataFrame(processed_students)
    
    # Standardize the 'hscGpa' column to 'hsc_gpa' if it exists
    if 'hscGpa' in students_df.columns:
        students_df.rename(columns={'hscGpa': 'hsc_gpa'}, inplace=True)

    if 'hsc_gpa' in students_df.columns:
        students_df['hsc_gpa'] = pd.to_numeric(students_df['hsc_gpa'], errors='coerce')
        students_df.dropna(subset=['hsc_gpa'], inplace=True)
    
    summary, insights = analyze_data(students_df)

    # Helper to convert numpy types for JSON serialization
    def convert_numpy_types(obj):
        if isinstance(obj, dict):
            return {k: convert_numpy_types(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_numpy_types(i) for i in obj]
        elif hasattr(obj, 'item'):
            return obj.item()
        return obj

    summary = convert_numpy_types(summary)
    
    # Create a default params object for the merged data
    params = {
        "stdCredit": 18,
        "maxCreditImpact": 0.15
    }

    result = {
        "summary": summary,
        "insights": insights,
        "students": json.loads(students_df.to_json(orient='records')),
        "params": params
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
