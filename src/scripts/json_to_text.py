import json
import sys
import os

def main():
    print(f"[Debug] Script started. CWD: {os.getcwd()}", file=sys.stderr)
    print(f"[Debug] Received arguments: {sys.argv}", file=sys.stderr)

    if len(sys.argv) < 2:
        print("Usage: python json_to_text.py <file_path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    print(f"[Debug] Processing file: {file_path}", file=sys.stderr)

    if not os.path.exists(file_path):
        print(f"[Debug] File does not exist at path: {file_path}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        text_output = ""
        if isinstance(data, dict):
            for key, value in data.items():
                text_output += f"{key}: {json.dumps(value, indent=2)}\n"
        elif isinstance(data, list):
            for index, item in enumerate(data):
                 text_output += f"Item {index}: {json.dumps(item, indent=2)}\n"
        else:
            text_output = json.dumps(data, indent=2)

        print(text_output)

    except json.JSONDecodeError:
        print(f"Error: Invalid JSON file at {file_path}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
