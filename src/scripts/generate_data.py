"""
Generate synthetic student data from a JSON payload.

Payload schema:
{
  "mode": "dataset" | "single",
  "params": {...},
  "options": {...}  # required for single mode
}
"""

import argparse
import json
import math
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Tuple


DEFAULT_GRADE_SCALE = {
    "A+": 4.0,
    "A": 3.75,
    "A-": 3.5,
    "B+": 3.25,
    "B": 3.0,
    "B-": 2.75,
    "C+": 2.5,
    "C": 2.25,
    "D": 2.0,
    "F": 0.0,
}

DEFAULT_GRADE_SCALE_TUPLES = [
    ("A+", 4.00), ("A", 3.75), ("A-", 3.50),
    ("B+", 3.25), ("B", 3.00), ("B-", 2.75),
    ("C+", 2.50), ("C", 2.25),
    ("D", 2.00), ("F", 0.00),
]

DEPARTMENTS = ["CSE", "EEE", "BBA"]

SUBJECTS = {
    "CSE": [
        "Introduction to Programming", "Structured Programming", "Object Oriented Programming",
        "Data Structures", "Algorithms", "Discrete Mathematics", "Linear Algebra",
        "Probability and Statistics", "Numerical Methods", "Digital Logic Design",
        "Computer Organization", "Microprocessors", "Operating Systems", "Database Systems",
        "Computer Networks", "Data Communication", "Software Engineering", "Software Testing",
        "Web Programming", "Mobile Application Development", "Artificial Intelligence",
        "Machine Learning", "Neural Networks", "Computer Graphics", "Image Processing",
        "Pattern Recognition", "Human Computer Interaction", "Compiler Design",
        "Theory of Computation", "Distributed Systems", "Cloud Computing", "Cyber Security",
        "Cryptography", "Information Security", "Embedded Systems", "Real Time Systems",
        "Internet of Things", "Big Data Analytics", "Data Mining", "Bioinformatics",
        "Game Development", "Natural Language Processing", "Digital Signal Processing",
        "Advanced Algorithms", "Advanced Database Systems", "Research Methodology",
        "Project Management", "Capstone Project", "Intro to Quantum Computing", "Advanced Web Tech",
        "Robotics Process Automation", "Blockchain Fundamentals", "Advanced OS", "Parallel Computing",
        "High Performance Computing", "Advanced Computer Architecture", "Network Security",
        "Wireless Networks", "Cryptography and Network Security", "Digital Forensics",
        "Ethical Hacking", "Cloud Native Applications", "DevOps",
    ],
    "EEE": [
        "Basic Electrical Engineering", "Electrical Circuits", "Circuit Theory",
        "Electronic Devices", "Basic Electronics", "Analog Electronics", "Digital Electronics",
        "Digital Logic Design", "Signals and Systems", "Signal Processing", "Control Systems",
        "Microprocessors", "Microcontrollers", "Embedded Systems", "Power Systems I",
        "Power Systems II", "Electrical Machines I", "Electrical Machines II", "Power Electronics",
        "Renewable Energy Systems", "High Voltage Engineering", "Communication Engineering",
        "Data Communication", "Telecommunication Systems", "Electromagnetic Fields",
        "Microwave Engineering", "VLSI Design", "Nano Electronics", "Instrumentation",
        "Measurement and Sensors", "Robotics", "Industrial Electronics", "Energy Conversion",
        "Power Plant Engineering", "Switchgear and Protection", "Transmission and Distribution",
        "Electric Drives", "SCADA Systems", "Industrial Automation", "Engineering Mathematics",
        "Linear Algebra", "Probability and Statistics", "Numerical Methods",
        "Research Methodology", "Technical Writing", "Project Management", "Final Year Project",
        "Advanced Power Systems", "Smart Grids", "Power System Protection", "FACTS Devices",
        "Advanced Control Systems", "Non-linear Control", "Optimal Control", "Digital Signal Processing II",
        "Biomedical Instrumentation", "Optical Fiber Communication", "Wireless Communication",
        "Satellite Communication", "Antenna Engineering", "Advanced VLSI Design", "FPGA Design",
    ],
    "BBA": [
        "Principles of Management", "Principles of Accounting", "Financial Accounting",
        "Managerial Accounting", "Microeconomics", "Macroeconomics", "Business Mathematics",
        "Business Statistics", "Business Communication", "Business Ethics", "Marketing Principles",
        "Consumer Behavior", "Marketing Research", "Financial Management", "Corporate Finance",
        "Banking and Insurance", "Investment Analysis", "Human Resource Management",
        "Organizational Behavior", "Operations Management", "Supply Chain Management",
        "Production Management", "Entrepreneurship Development", "Small Business Management",
        "Business Law", "Labor Law", "International Business", "International Trade",
        "Strategic Management", "Management Information Systems", "E-Commerce", "Digital Marketing",
        "Business Analytics", "Data Analysis for Business", "Business Research Methods",
        "Project Management", "Risk Management", "Taxation", "Auditing", "Cost Accounting",
        "Public Finance", "Economic Development", "Corporate Governance", "Leadership Studies",
        "Negotiation and Conflict Management", "Internship", "Capstone Project",
        "International Finance", "Global Marketing", "Brand Management", "Services Marketing",
        "Sales Management", "Industrial Relations", "Compensation Management", "Training and Development",
        "Quality Management", "Logistics Management", "Mergers and Acquisitions", "Financial Modeling",
        "Derivatives and Risk Management", "Behavioral Finance", "Fintech",
    ],
}

PERFORMANCE_BOUNDARIES = {
    "High": {"ssc": (3.6, 5.0), "hsc": (3.6, 5.0), "uni": (3.2, 4.0)},
    "Mid": {"ssc": (2.6, 4.2), "hsc": (2.6, 4.2), "uni": (2.5, 3.5)},
    "Low": {"ssc": (2.0, 3.6), "hsc": (2.0, 3.6), "uni": (2.0, 2.8)},
}



def round_two(value: float) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def hash_string_to_seed(value: str) -> int:
    h = 0
    for ch in value:
        h = ((h << 5) - h + ord(ch)) & 0xFFFFFFFF
    if h & 0x80000000:
        h = -((~h + 1) & 0xFFFFFFFF)
    return h


class Mulberry32:
    def __init__(self, seed: int) -> None:
        self.t = seed & 0xFFFFFFFF

    def random(self) -> float:
        self.t = (self.t + 0x6D2B79F5) & 0xFFFFFFFF
        result = self.t
        result = (result ^ (result >> 15)) * (result | 1) & 0xFFFFFFFF
        result ^= result + (((result ^ (result >> 7)) * (result | 61)) & 0xFFFFFFFF)
        result &= 0xFFFFFFFF
        return ((result ^ (result >> 14)) & 0xFFFFFFFF) / 4294967296.0


class Rng:
    def __init__(self, seed: Any) -> None:
        if seed is None or seed == "":
            import random
            self._random = random.random
        else:
            seed_number = seed if isinstance(seed, (int, float)) else hash_string_to_seed(str(seed))
            self._random = Mulberry32(int(seed_number)).random

    def random(self) -> float:
        return self._random()


def uniform(rng: Rng, min_value: float, max_value: float) -> float:
    return rng.random() * (max_value - min_value) + min_value


def randint(rng: Rng, min_value: int, max_value: int) -> int:
    return int(math.floor(rng.random() * (max_value - min_value + 1)) + min_value)


def shuffle(rng: Rng, array: List[Any]) -> List[Any]:
    current_index = len(array)
    while current_index != 0:
        random_index = int(math.floor(rng.random() * current_index))
        current_index -= 1
        array[current_index], array[random_index] = array[random_index], array[current_index]
    return array


def choice(rng: Rng, arr: List[Any]) -> Any:
    return arr[int(math.floor(rng.random() * len(arr)))]


def generate_subject_pool(department: str, subject_count: int) -> List[str]:
    base_subjects = SUBJECTS[department]
    subject_pool: List[str] = []
    for i in range(subject_count):
        subject_pool.append(f"{base_subjects[i % len(base_subjects)]}")
    return list(dict.fromkeys(subject_pool))


def select_performance_group(rng: Rng, params: Dict[str, Any]) -> str:
    high_chance = float(params.get("highPerformanceChance", 0))
    low_chance = float(params.get("lowPerformanceChance", 0))
    mid_chance = 1 - high_chance - low_chance
    rand = rng.random()
    if rand < high_chance:
        return "High"
    if rand < high_chance + mid_chance:
        return "Mid"
    return "Low"


def get_exceptional_performance_group(rng: Rng, original_group: str) -> str:
    if original_group == "High":
        return "Low"
    if original_group == "Low":
        return "High"
    return "High" if rng.random() < 0.5 else "Low"


def generate_gpa_in_bounds(rng: Rng, group: str, gpa_type: str) -> float:
    min_value, max_value = PERFORMANCE_BOUNDARIES[group][gpa_type]
    return uniform(rng, min_value, max_value)


def gpa_to_grade(gpa: float, grade_scale_tuples: List[Tuple[str, float]]) -> str:
    for grade, value in grade_scale_tuples:
        if gpa >= value:
            return grade
    return "F"


def grade_for_target_gpa(rng: Rng, target_gpa: float, grade_scale_tuples: List[Tuple[str, float]]) -> str:
    if not grade_scale_tuples:
        return "F"
    if target_gpa >= grade_scale_tuples[0][1]:
        return grade_scale_tuples[0][0]

    for i in range(len(grade_scale_tuples) - 1):
        upper_grade, upper_value = grade_scale_tuples[i]
        lower_grade, lower_value = grade_scale_tuples[i + 1]
        if target_gpa >= lower_value:
            span = upper_value - lower_value
            if span <= 0:
                return upper_grade
            upper_chance = (target_gpa - lower_value) / span
            return upper_grade if rng.random() < upper_chance else lower_grade

    return grade_scale_tuples[-1][0]


def credit_impact(credits: int, params: Dict[str, Any]) -> float:
    std_credit = float(params.get("stdCredit", 0))
    max_credit = float(params.get("maxCredit", 0))
    max_credit_impact = float(params.get("maxCreditImpact", 0))
    if credits <= std_credit:
        return 0.0
    deviation = (credits - std_credit) / (max_credit - std_credit)
    return -(deviation ** 1.5) * max_credit_impact / 2.0


def build_credit_plan(
    rng: Rng,
    semester_count: int,
    average_credits: float,
    min_credit: int,
    max_credit: int,
) -> List[int]:
    total_credits = int(round(average_credits * semester_count))
    plan: List[int] = []
    remaining = total_credits
    for i in range(semester_count):
        semesters_left = semester_count - i
        min_for_remaining = (semesters_left - 1) * min_credit
        max_for_remaining = (semesters_left - 1) * max_credit
        min_allowed = max(min_credit, remaining - max_for_remaining)
        max_allowed = min(max_credit, remaining - min_for_remaining)
        next_credits = remaining if semesters_left == 1 else randint(rng, min_allowed, max_allowed)
        plan.append(int(next_credits))
        remaining -= next_credits
    return plan


def get_grade_scale_tuples(params: Dict[str, Any]) -> List[Tuple[str, float]]:
    grade_scale = params.get("gradeScale") or DEFAULT_GRADE_SCALE
    tuples = sorted(
        [(grade, float(value)) for grade, value in grade_scale.items()],
        key=lambda x: x[1],
        reverse=True,
    )
    return tuples if tuples else DEFAULT_GRADE_SCALE_TUPLES


def get_grade_scale_map(params: Dict[str, Any]) -> Dict[str, float]:
    grade_scale = params.get("gradeScale") or DEFAULT_GRADE_SCALE
    return {grade: float(value) for grade, value in grade_scale.items()}


def calculate_cgpa(student: Dict[str, Any], grade_scale: Dict[str, float], credits_per_subject: int) -> float:
    total_points = 0.0
    total_credits = 0
    semesters = student.get("semesters") or {}
    for semester in semesters.values():
        if not isinstance(semester, dict):
            continue
        for key, value in semester.items():
            if key in ("creditHours", "attendancePercentage"):
                continue
            if isinstance(value, str) and value in grade_scale:
                total_points += grade_scale[value] * credits_per_subject
                total_credits += credits_per_subject
    return total_points / total_credits if total_credits > 0 else 0.0


def build_target_cgpa_samples(histogram: List[Dict[str, Any]], total_students: int) -> List[float]:
    if total_students <= 0:
        return []
    total_hist = sum(int(entry.get("students", 0)) for entry in histogram)
    if total_hist <= 0:
        return []
    factor = total_students / total_hist
    scaled = [float(entry.get("students", 0)) * factor for entry in histogram]
    bases = [int(math.floor(value)) for value in scaled]
    remainders = [value - base for value, base in zip(scaled, bases)]
    remaining = total_students - sum(bases)
    order = sorted(range(len(remainders)), key=lambda i: remainders[i], reverse=True)
    for i in range(remaining):
        bases[order[i % len(order)]] += 1

    samples: List[float] = []
    for entry, count in zip(histogram, bases):
        samples.extend([float(entry.get("cgpa", 0.0))] * count)
    return samples


def build_samples_from_counts(histogram: List[Dict[str, Any]]) -> List[float]:
    samples: List[float] = []
    for entry in histogram:
        count = int(entry.get("students", 0))
        if count <= 0:
            continue
        samples.extend([float(entry.get("cgpa", 0.0))] * count)
    return samples


def adjust_histogram_for_fail(
    histogram: List[Dict[str, Any]],
    total_students: int,
    fail_ratio: float,
    high_tail_threshold: float,
    high_tail_weight: float,
) -> List[Dict[str, Any]]:
    fail_ratio = max(0.0, min(1.0, fail_ratio))
    target_fail = int(round(total_students * fail_ratio))
    target_pass = total_students - target_fail

    def scale_group(entries: List[Dict[str, Any]], target_count: int) -> List[int]:
        total_hist = sum(int(entry.get("students", 0)) for entry in entries)
        if total_hist <= 0 or target_count <= 0:
            return [0 for _ in entries]
        factor = target_count / total_hist
        scaled = [float(entry.get("students", 0)) * factor for entry in entries]
        bases = [int(math.floor(value)) for value in scaled]
        remainders = [value - base for value, base in zip(scaled, bases)]
        remaining = target_count - sum(bases)
        if remaining > 0:
            order = sorted(range(len(remainders)), key=lambda i: remainders[i], reverse=True)
            for i in range(remaining):
                bases[order[i % len(order)]] += 1
        return bases

    below_entries = [entry for entry in histogram if float(entry.get("cgpa", 0.0)) < 2.0]
    above_entries = [entry for entry in histogram if float(entry.get("cgpa", 0.0)) >= 2.0]

    below_counts = scale_group(below_entries, target_fail)

    weighted_above = []
    for entry in above_entries:
        cgpa = float(entry.get("cgpa", 0.0))
        weight = high_tail_weight if cgpa >= high_tail_threshold else 1.0
        weighted_above.append({"cgpa": cgpa, "students": float(entry.get("students", 0)) * weight})

    above_counts = scale_group(weighted_above, target_pass)

    below_iter = iter(below_counts)
    above_iter = iter(above_counts)
    adjusted: List[Dict[str, Any]] = []
    for entry in histogram:
        cgpa = float(entry.get("cgpa", 0.0))
        if cgpa < 2.0:
            count = next(below_iter, 0)
        else:
            count = next(above_iter, 0)
        adjusted.append({"cgpa": cgpa, "students": count})

    return adjusted


def closest_grade(target_value: float, grade_scale_tuples: List[Tuple[str, float]]) -> str:
    return min(
        grade_scale_tuples,
        key=lambda item: (abs(item[1] - target_value), -item[1])
    )[0]


def adjust_student_grades(
    student: Dict[str, Any],
    delta: float,
    grade_scale_map: Dict[str, float],
    grade_scale_tuples: List[Tuple[str, float]],
    target_cgpa: float | None = None,
    high_tail_threshold: float = 3.0,
    high_tail_boost: float = 0.0,
) -> None:
    semesters = student.get("semesters") or {}
    for semester in semesters.values():
        if not isinstance(semester, dict):
            continue
        for key, value in list(semester.items()):
            if key in ("creditHours", "attendancePercentage"):
                continue
            if isinstance(value, str) and value in grade_scale_map:
                boost = 0.0
                if target_cgpa is not None and target_cgpa >= high_tail_threshold and delta > 0:
                    boost = high_tail_boost
                target_value = grade_scale_map[value] + delta + boost
                semester[key] = closest_grade(target_value, grade_scale_tuples)


def nudge_cgpa_distribution(students: List[Dict[str, Any]], params: Dict[str, Any]) -> None:
    histogram = params.get("cgpaTargetHistogram")
    if not histogram:
        return
    grade_scale_map = get_grade_scale_map(params)
    grade_scale_tuples = get_grade_scale_tuples(params)
    credits_per_subject = int(params.get("creditsPerSubject", 1))
    fail_ratio = params.get("failChance")
    if fail_ratio is not None:
        try:
            high_tail_threshold = float(params.get("cgpaHighTailThreshold", 3.5))
            high_tail_weight = float(params.get("cgpaHighTailWeight", 1.0))
            adjusted_histogram = adjust_histogram_for_fail(
                histogram,
                len(students),
                float(fail_ratio),
                high_tail_threshold,
                high_tail_weight,
            )
            target_samples = build_samples_from_counts(adjusted_histogram)
        except (TypeError, ValueError):
            target_samples = build_target_cgpa_samples(histogram, len(students))
    else:
        target_samples = build_target_cgpa_samples(histogram, len(students))
    if len(target_samples) != len(students):
        return

    current = []
    for index, student in enumerate(students):
        student_id = student.get("student_id", index)
        cgpa = calculate_cgpa(student, grade_scale_map, credits_per_subject)
        current.append((cgpa, student_id, index))

    current.sort(key=lambda item: (item[0], item[1]))
    target_samples.sort()

    high_tail_threshold = float(params.get("cgpaHighTailThreshold", 3.0))
    high_tail_boost = float(params.get("cgpaHighTailBoost", 0.0))
    for (cgpa, _student_id, index), target_cgpa in zip(current, target_samples):
        delta = target_cgpa - cgpa
        if abs(delta) < 1e-9:
            continue
        adjust_student_grades(
            students[index],
            delta,
            grade_scale_map,
            grade_scale_tuples,
            target_cgpa=target_cgpa,
            high_tail_threshold=high_tail_threshold,
            high_tail_boost=high_tail_boost,
        )


def enforce_fail_percentage(students: List[Dict[str, Any]], params: Dict[str, Any]) -> None:
    fail_chance = params.get("failChance")
    if fail_chance is None:
        return
    try:
        target_ratio = float(fail_chance)
    except (TypeError, ValueError):
        return

    total = len(students)
    if total == 0:
        return

    target_count = max(0, min(total, int(round(total * target_ratio))))
    grade_scale_map = get_grade_scale_map(params)
    grade_scale_tuples = get_grade_scale_tuples(params)
    credits_per_subject = int(params.get("creditsPerSubject", 1))

    cgpa_rows = []
    for index, student in enumerate(students):
        student_id = student.get("student_id", index)
        cgpa = calculate_cgpa(student, grade_scale_map, credits_per_subject)
        cgpa_rows.append((cgpa, student_id, index))

    below = [row for row in cgpa_rows if row[0] < 2.0]
    above_or_equal = [row for row in cgpa_rows if row[0] >= 2.0]

    if len(below) < target_count:
        needed = target_count - len(below)
        above_or_equal.sort(key=lambda row: (row[0], row[1]))
        for cgpa, _student_id, index in above_or_equal[:needed]:
            delta = 1.95 - cgpa
            adjust_student_grades(students[index], delta, grade_scale_map, grade_scale_tuples)
    elif len(below) > target_count:
        needed = len(below) - target_count
        below.sort(key=lambda row: (row[0], row[1]), reverse=True)
        for cgpa, _student_id, index in below[:needed]:
            delta = 2.05 - cgpa
            adjust_student_grades(students[index], delta, grade_scale_map, grade_scale_tuples)


def get_seeded_generation_id(seed: Any) -> int:
    seed_number = seed if isinstance(seed, (int, float)) else hash_string_to_seed(str(seed))
    normalized = abs(int(seed_number)) % 9000
    return 101 + normalized


def get_unseeded_generation_id() -> int:
    rng = Rng(None)
    return int(math.floor(rng.random() * 1000) + 101)


def generate_synthetic_data(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    students: List[Dict[str, Any]] = []
    subject_count = int(params.get("subjectCount") or params.get("SUBJECT_COUNT") or 60)
    grade_scale_tuples = get_grade_scale_tuples(params)
    current_year = int(params.get("currentYear") or datetime.utcnow().year)
    max_birth_year = current_year - 30
    min_birth_year = max_birth_year - 12
    rng = Rng(params.get("seed"))

    if params.get("seed") is not None and params.get("seed") != "":
        generation_id = get_seeded_generation_id(params.get("seed"))
    else:
        generation_id = get_unseeded_generation_id()

    num_students = int(params.get("numStudents", 0))
    for i in range(1, num_students + 1):
        student_in_generation_id = i
        student_id = (generation_id * 10000) + student_in_generation_id

        performance_group = select_performance_group(rng, params)
        department = choice(rng, DEPARTMENTS)
        ssc_gpa = round_two(generate_gpa_in_bounds(rng, performance_group, "ssc"))
        hsc_gpa = round_two(generate_gpa_in_bounds(rng, performance_group, "hsc"))
        pre_grad_uni_gpa = ((ssc_gpa / 5.0) + (hsc_gpa / 5.0)) / 2 * 4.0

        perfect_chance = float(params.get("perfectScorerChance", 0.8))
        is_perfect = performance_group == "High" and pre_grad_uni_gpa > 3.75 and rng.random() < perfect_chance
        perfect_target_gpa = uniform(rng, 3.80, 3.99) if is_perfect and rng.random() < 0.8 else 4.0
        full_subject_pool = generate_subject_pool(department, subject_count)
        student_subject_pool = shuffle(rng, full_subject_pool[:])
        student_subject_pool = student_subject_pool[:subject_count]

        semesters: Dict[str, Dict[str, Any]] = {}
        semester_id = 1
        subjects_to_assign = list(student_subject_pool)
        student_base_attendance = uniform(rng, 60, 98)
        prev_accumulated_gpa = 0.0

        while subjects_to_assign:
            subject_count_for_sem = min(
                int(math.ceil(randint(rng, int(params.get("minCredit", 0)), int(params.get("maxCredit", 0))) / float(params.get("creditsPerSubject", 1)))),
                len(subjects_to_assign),
            )
            actual_credits = subject_count_for_sem * int(params.get("creditsPerSubject", 1))
            semester_subjects = subjects_to_assign[:subject_count_for_sem]
            subjects_to_assign = subjects_to_assign[subject_count_for_sem:]

            pre_grad_decay = float(params.get("preGradDecay", 0.9))
            w_pre = pre_grad_decay ** (semester_id - 1)
            w_accum = 1 - w_pre

            attendance_percentage = int(round(student_base_attendance + uniform(rng, -2.5, 2.5)))

            if is_perfect:
                semester_gpa = perfect_target_gpa
            else:
                base_gpa = pre_grad_uni_gpa * w_pre + prev_accumulated_gpa * w_accum
                base_gpa += uniform(rng, -0.2, 0.2)

                transition_shock = params.get("transitionShock") or {}
                if transition_shock and performance_group != "High":
                    hsc_min = float(transition_shock.get("hscMin", 0))
                    max_semesters = int(transition_shock.get("maxSemesters", 0))
                    drop = float(transition_shock.get("drop", 0))
                    if hsc_gpa >= hsc_min and semester_id <= max_semesters:
                        base_gpa -= drop

                exception_percentage = float(params.get("exceptionPercentage", 0))
                if performance_group != "High" and rng.random() < exception_percentage:
                    exceptional_swing = 0.35
                    base_gpa += exceptional_swing if get_exceptional_performance_group(rng, performance_group) == "High" else -exceptional_swing

                if performance_group == "High":
                    perfect_score_push = (pre_grad_uni_gpa / 4.0) * float(params.get("preGradScoreInfluence", 0))
                    base_gpa = base_gpa * (1 - perfect_score_push) + 4.0 * perfect_score_push

                impact_scale = 0.6 if base_gpa >= 3.6 else 0.8 if base_gpa >= 3.3 else 1.0
                semester_gpa = base_gpa + credit_impact(actual_credits, params) * impact_scale
                attendance_impact = (attendance_percentage - 82.5) / 17.5 * float(params.get("attendanceImpact", 0)) * impact_scale
                semester_gpa += attendance_impact

            prev_accumulated_gpa = ((prev_accumulated_gpa * (semester_id - 1)) + semester_gpa) / semester_id

            semester_data: Dict[str, Any] = {
                "creditHours": actual_credits,
                "attendancePercentage": attendance_percentage,
            }

            for subject in semester_subjects:
                if is_perfect:
                    final_gpa = perfect_target_gpa
                else:
                    final_gpa = semester_gpa + uniform(rng, -0.22, 0.22)
                semester_data[subject] = (
                    grade_for_target_gpa(rng, final_gpa, grade_scale_tuples)
                    if is_perfect
                    else gpa_to_grade(final_gpa, grade_scale_tuples)
                )

            semesters[str(semester_id)] = semester_data
            semester_id += 1

        students.append({
            "student_id": student_id,
            "ssc_gpa": ssc_gpa,
            "hsc_gpa": hsc_gpa,
            "gender": choice(rng, ["male", "female"]),
            "birth_year": randint(rng, min_birth_year, max_birth_year),
            "department": department,
            "semesters": semesters,
        })

    nudge_cgpa_distribution(students, params)
    enforce_fail_percentage(students, params)
    return students


def generate_single_student(params: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
    rng = Rng(params.get("seed"))
    grade_scale_tuples = get_grade_scale_tuples(params)
    current_year = int(params.get("currentYear") or datetime.utcnow().year)
    max_birth_year = current_year - 30
    min_birth_year = max_birth_year - 12

    if params.get("seed") is not None and params.get("seed") != "":
        generation_id = get_seeded_generation_id(params.get("seed"))
    else:
        generation_id = get_unseeded_generation_id()
    student_id = (generation_id * 10000) + 1

    performance_group = options.get("performanceGroup", "Mid")
    department = choice(rng, DEPARTMENTS)
    ssc_gpa = round_two(generate_gpa_in_bounds(rng, performance_group, "ssc"))
    hsc_gpa = round_two(generate_gpa_in_bounds(rng, performance_group, "hsc"))
    pre_grad_uni_gpa = ((ssc_gpa / 5.0) + (hsc_gpa / 5.0)) / 2 * 4.0
    perfect_chance = float(params.get("perfectScorerChance", 0.8))
    is_perfect = performance_group == "High" and pre_grad_uni_gpa > 3.8 and rng.random() < perfect_chance
    perfect_target_gpa = uniform(rng, 3.8, 3.9) if is_perfect and rng.random() < 0.5 else 4.0
    subject_count = int(params.get("subjectCount") or params.get("SUBJECT_COUNT") or 60)
    full_subject_pool = generate_subject_pool(department, subject_count)
    student_subject_pool = shuffle(rng, full_subject_pool[:])
    student_subject_pool = student_subject_pool[:subject_count]
    credit_plan = build_credit_plan(
        rng,
        int(options.get("semesterCount", 0)),
        float(options.get("averageCredits", 0)),
        int(params.get("minCredit", 0)),
        int(params.get("maxCredit", 0)),
    )

    semesters: Dict[str, Dict[str, Any]] = {}
    semester_summaries: List[Dict[str, Any]] = []
    subjects_to_assign = list(student_subject_pool)
    student_base_attendance = uniform(rng, 60, 98)
    prev_accumulated_gpa = 0.0

    for semester_index, requested_credits in enumerate(credit_plan):
        if not subjects_to_assign:
            break
        subject_count_for_sem = min(
            int(math.ceil(requested_credits / float(params.get("creditsPerSubject", 1)))),
            len(subjects_to_assign),
        )
        actual_credits = subject_count_for_sem * int(params.get("creditsPerSubject", 1))
        semester_subjects = subjects_to_assign[:subject_count_for_sem]
        subjects_to_assign = subjects_to_assign[subject_count_for_sem:]

        semester_id = semester_index + 1
        pre_grad_decay = float(params.get("preGradDecay", 0.9))
        w_pre = pre_grad_decay ** (semester_id - 1)
        w_accum = 1 - w_pre

        attendance_percentage = int(round(student_base_attendance + uniform(rng, -2.5, 2.5)))

        if is_perfect:
            semester_gpa = perfect_target_gpa
        else:
            base_gpa = pre_grad_uni_gpa * w_pre + prev_accumulated_gpa * w_accum
            base_gpa += uniform(rng, -0.2, 0.2)

            transition_shock = params.get("transitionShock") or {}
            if transition_shock and performance_group != "High":
                hsc_min = float(transition_shock.get("hscMin", 0))
                max_semesters = int(transition_shock.get("maxSemesters", 0))
                drop = float(transition_shock.get("drop", 0))
                if hsc_gpa >= hsc_min and semester_id <= max_semesters:
                    base_gpa -= drop

            exception_percentage = float(params.get("exceptionPercentage", 0))
            if performance_group != "High" and rng.random() < exception_percentage:
                exceptional_swing = 0.35
                base_gpa += exceptional_swing if get_exceptional_performance_group(rng, performance_group) == "High" else -exceptional_swing

            if performance_group == "High":
                perfect_score_push = (pre_grad_uni_gpa / 4.0) * float(params.get("preGradScoreInfluence", 0))
                base_gpa = base_gpa * (1 - perfect_score_push) + 4.0 * perfect_score_push

            effective_params = dict(params)
            if options.get("attendanceImpact") is not None:
                effective_params["attendanceImpact"] = options.get("attendanceImpact")
            if options.get("maxCreditImpact") is not None:
                effective_params["maxCreditImpact"] = options.get("maxCreditImpact")

            impact_scale = 0.6 if base_gpa >= 3.6 else 0.8 if base_gpa >= 3.3 else 1.0
            semester_gpa = base_gpa + credit_impact(actual_credits, effective_params) * impact_scale
            attendance_impact = (attendance_percentage - 82.5) / 17.5 * float(effective_params.get("attendanceImpact", 0)) * impact_scale
            semester_gpa += attendance_impact

        prev_accumulated_gpa = ((prev_accumulated_gpa * semester_index) + semester_gpa) / semester_id

        semester_data: Dict[str, Any] = {
            "creditHours": actual_credits,
            "attendancePercentage": attendance_percentage,
        }

        for subject in semester_subjects:
            if is_perfect:
                final_gpa = perfect_target_gpa
            else:
                final_gpa = semester_gpa + uniform(rng, -0.22, 0.22)
            semester_data[subject] = (
                grade_for_target_gpa(rng, final_gpa, grade_scale_tuples)
                if is_perfect
                else gpa_to_grade(final_gpa, grade_scale_tuples)
            )

        semesters[str(semester_id)] = semester_data
        semester_summaries.append({
            "creditHours": actual_credits,
            "attendancePercentage": attendance_percentage,
            "gpa": round_two(semester_gpa),
        })

    return {
        "student": {
            "student_id": student_id,
            "ssc_gpa": ssc_gpa,
            "hsc_gpa": hsc_gpa,
            "gender": choice(rng, ["male", "female"]),
            "birth_year": randint(rng, min_birth_year, max_birth_year),
            "department": department,
            "semesters": semesters,
        },
        "semesterSummaries": semester_summaries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic data payload.")
    parser.add_argument("--payload", required=True, help="JSON payload for generation.")
    args = parser.parse_args()

    payload = json.loads(args.payload)
    mode = payload.get("mode", "dataset")
    params = payload.get("params") or {}

    if mode == "single":
        options = payload.get("options") or {}
        result = generate_single_student(params, options)
    else:
        result = {"students": generate_synthetic_data(params)}

    print(json.dumps(result))


if __name__ == "__main__":
    main()
