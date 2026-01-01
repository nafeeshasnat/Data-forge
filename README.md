# DataForge AI

DataForge AI is a powerful and intuitive application for generating synthetic student datasets. Leveraging a modern tech stack and AI-powered insights, it provides a flexible platform for creating realistic and customizable data for educational research, software testing, and data analysis purposes.

## ✨ Features

- **Customizable Data Generation**: Easily configure parameters such as the number of students, semester workload, performance distribution, and more.
- **Interactive Dashboard**: Visualize the generated data through a variety of charts and graphs, including demographics, academic performance, and subject distributions.
- **AI-Powered Insights**: Get AI-driven analysis on the generated dataset to identify trends, patterns, and correlations.
- **Rich Visualizations**: The dashboard includes charts for CGPA distribution, HSC vs. CGPA correlation, department distribution, and more.
- **Downloadable Datasets**: Export the generated student data in JSON format with a single click.
- **Modern & Responsive UI**: Built with ShadCN UI and Tailwind CSS for a clean, dark-themed, and responsive user experience.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Charting**: [Recharts](https://recharts.org/)
- **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Schema Validation**: [Zod](https://zod.dev/)

## Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or newer recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```sh
   git clone <your-repository-url>
   ```
2. Navigate to the project directory:
   ```sh
   cd dataforge-ai
   ```
3. Install the dependencies:
   ```sh
   npm install
   ```

### Running the Application

To start the development server, run the following command:

```sh
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## 📂 Project Structure

- `src/app/`: Contains the main pages and routing logic for the Next.js App Router.
- `src/components/`: Includes all React components, organized into UI primitives and application-specific components.
- `src/lib/`: Holds utility functions, type definitions (`types.ts`), and the core data generation logic (`data-generator.ts`).
- `src/ai/`: Contains Genkit flows for AI-powered features like tendency analysis.
- `public/`: Static assets.
- `tailwind.config.ts`: Configuration file for Tailwind CSS.
