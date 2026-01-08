import json
import sys

def analyze_data(students, params):
    # This is a placeholder for the actual analysis logic from AnalysisEngine
    # For now, it will just return the students and some basic summary
    summary = {
        "total_students": len(students),
        "average_cgpa": sum(s['cgpa'] for s in students) / len(students) if students else 0
    }
    insights = ["This is a sample insight."]
    return students, summary, insights

def main():
    file_paths = sys.argv[1:]
    all_students = []
    first_file_params = None

    for file_path in file_paths:
        with open(file_path, 'r') as f:
            data = json.load(f)
            students = data.get('students', [])
            all_students.extend(students)
            if first_file_params is None and 'params' in data:
                first_file_params = data['params']

    if not all_students:
        print(json.dumps({"error": "No students found"}), file=sys.stderr)
        sys.exit(1)

    analysis_params = first_file_params if first_file_params else {
        "numStudents": len(all_students),
        "highPerformanceChance": 0.2,
        "lowPerformanceChance": 0.2,
        "exceptionPercentage": 0.1,
        "preGradScoreInfluence": 0.5,
        "attendanceImpact": 0.2,
        "stdCredit": 15,
        "maxCredit": 22,
        "minCredit": 12,
        "creditsPerSubject": 3,
        "maxCreditImpact": 0.5
    }

    students_with_cgpa, summary, insights = analyze_data(all_students, analysis_params)

    result = {
        "students": students_with_cgpa,
        "summary": summary,
        "insights": insights,
        "params": analysis_params
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
