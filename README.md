# DataForge AI

DataForge AI is a Vite + React application for generating, analyzing, trimming, and merging synthetic student datasets. It combines an in-browser data generation and analysis engine with optional Python-powered workflows for heavier dataset processing.

## Key Features

- **Synthetic data generation** with adjustable population size, performance mix, credit load, attendance impact, and more.
- **Deterministic analysis engine** that produces summary statistics, performance grouping, and data prepared for charts.
- **Interactive dashboard** with CGPA distributions, department mix, HSC vs CGPA, credit load effects, attendance impact, semester counts, and more.
- **Dataset trimming** by CGPA range (client-side in the main generator; server-side via Python on the trim page).
- **Dataset merging** and re-analysis via Python scripts and an Express API.
- **JSON-to-text conversion** for exporting a readable plain text summary of datasets.
- **Downloadable JSON** datasets stripped of analysis-only fields.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, React Router
- **Backend (local):** Express + TypeScript (`server/server.ts`)
- **UI:** shadcn/ui, Tailwind CSS, Radix UI
- **Charts:** Recharts
- **Python (optional):** `pandas`, `numpy` for merge/trim/format scripts

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Python 3 (required for merge/trim/json-to-text endpoints)
- Python packages: `pandas`, `numpy`

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

- Frontend: `http://localhost:9002`
- Express API server: `http://localhost:3000`

### Build + Serve

```bash
npm run build
npm run start
```

## Scripts

- `npm run dev`: runs Vite and the Express server concurrently
- `npm run dev:client`: runs Vite on port 9002
- `npm run dev:server`: runs the Express API with tsx watch
- `npm run build`: builds the server TypeScript and the Vite app
- `npm run start` / `npm run serve`: serves the built app via Express
- `npm run typecheck`: TypeScript type check

## Project Structure

```
src/
  app/                       # Route-level pages (/, /merge, /trim)
  components/
    app/                     # App-specific UI (charts, dashboard, sidebar)
    ui/                      # shadcn/ui components
  hooks/                     # Custom hooks (toast, generation state)
  lib/
    data-generator.ts        # Synthetic data generation
    engine/analysis-engine.ts # Deterministic analysis + trimming
    chart-data-utils.ts      # Chart data helpers
    config.ts                # Default parameters
    subjects.ts              # Department + subject pools
    types.ts                 # TypeScript types
  scripts/                   # Python helpers for merge/trim/json-to-text
server/
  server.ts                  # Express server + API endpoints
docs/
  blueprint.md               # High-level product blueprint
student_dataset.json         # Sample dataset
```

## Routes

- `/` (Main generator): parameter controls, dataset generation, dashboard, and client-side trim/download.
- `/merge`: upload multiple JSON datasets, run Python merge + analysis, download merged output.
- `/trim`: upload a JSON dataset, trim by CGPA range on the server, re-analyze, download output.

Note: `src/app/upload/page.tsx` exists but is not wired into the router (`src/main.tsx`) and references a missing `@/app/actions` module.

## Data Model

### Student

```ts
{
  student_id: number;
  ssc_gpa: number;
  hsc_gpa: number;
  gender: "male" | "female";
  birth_year: number;
  department: string;
  semesters: Record<string, Semester>;
}
```

### Semester

```ts
{
  creditHours: number;
  attendancePercentage: number;
  [subjectName: string]: "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "F";
}
```

Derived fields added during analysis:
- `cgpa`
- `performanceGroup` (`High`, `Mid`, `Low`)
- `avgCreditLoad`
- `avgAttendance`
- `semesterDetails` (per-semester GPA + credit load)

## Generation Parameters

Defined in `src/components/app/parameter-sidebar.tsx` and used by `src/lib/data-generator.ts`:

- `numStudents`: total students to generate
- `creditsPerSubject`: credits per subject (used in GPA calculations)
- `minCredit`, `stdCredit`, `maxCredit`: per-semester credit range
- `maxCreditImpact`: how much heavy credit load depresses GPA
- `highPerformanceChance`, `lowPerformanceChance`: controls performance mix
- `preGradScoreInfluence`: weight of SSC/HSC GPA on university GPA
- `exceptionPercentage`: chance of exceptional performance swings
- `attendanceImpact`: attendance effect on GPA

## Analysis Engine

`src/lib/engine/analysis-engine.ts` provides deterministic analytics:

- CGPA calculation based on per-semester grades
- Performance grouping (High/Mid/Low)
- Summary stats: total students, avg HSC GPA, avg CGPA, department mix, performance mix, avg credit load, avg attendance
- Deterministic trimming of a percentage of students in a CGPA range
- Insights such as dominant performance group and CGPA vs HSC deltas

## API Endpoints (Express)

Defined in `server/server.ts` (used by the `/merge` page):

- `POST /api/merge`: merge multiple JSON datasets and analyze using `src/scripts/merge_and_analyze.py`
- `GET /api/download/:filename`: download merged output stored in the `tmp` directory
- `POST /api/json-to-text`: convert JSON dataset to plain text via `src/scripts/json_to_text.py`

The `/trim` page currently calls `/api/upload` and `/api/trim`, which are implemented as Next.js-style route files in `src/app/api`. These are not wired into the Express server and will not work unless you run the project in a Next.js runtime or add equivalent Express endpoints.

## Python Scripts

Located in `src/scripts`:

- `merge_and_analyze.py`: merges datasets, normalizes schema, computes summaries and chart-ready aggregates
- `trim_and_analyze.py`: trims a dataset by CGPA range and re-analyzes, writing a new JSON file to `tmp`
- `json_to_text.py`: prints a human-readable view of a dataset

## Notes

- `server/server.js` appears to be an outdated/invalid build artifact and is not used by the TypeScript server.
- `student_dataset.json` is a sample output dataset for testing.
