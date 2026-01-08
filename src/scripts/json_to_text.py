
import json
import sys

def format_student_data(data):
    """
    Formats the student data into a readable plain text format.
    """
    output = []
    if 'students' in data:
        for student in data['students']:
            output.append(f"Student ID: {student.get('student_id', 'N/A')}")
            output.append(f"  CGPA: {student.get('cgpa', 'N/A')}")
            output.append(f"  Department: {student.get('department', 'N/A')}")
            output.append("  Semesters:")
            semesters = student.get('semesters', {})
            if isinstance(semesters, dict):
                for sem, details in semesters.items():
                    output.append(f"    Semester {sem}:")
                    output.append(f"      Credits: {details.get('creditHours', 'N/A')}")
                    output.append(f"      Attendance: {details.get('attendancePercentage', 'N/A')}%")
            output.append("\n")
    return "\n".join(output)

def main():
    if len(sys.argv) != 2:
        print("Usage: python json_to_text.py <file_path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        formatted_text = format_student_data(data)
        print(formatted_text)

    except FileNotFoundError:
        print(f"Error: File not found at {file_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_path}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
