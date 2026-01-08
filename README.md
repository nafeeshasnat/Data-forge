e# DataForge AI

DataForge is a powerful and intuitive application for generating and analyzing synthetic student datasets. It provides a flexible platform for creating realistic and customizable data for educational research, software testing, and data analysis purposes.

## ✨ Key Features

- **Synthetic Data Generation:** Generate large, realistic datasets of student academic records with a single click.
- **In-Depth Customization:** Fine-tune the data generation process with a wide range of parameters, including:
    - Student population size
    - Performance distribution (high, mid, low performers)
    - Influence of pre-university scores
    - Credit load and its impact on grades
    - Attendance impact
- **Advanced Analysis Engine:** Automatically analyzes the generated dataset to provide:
    - Detailed statistical summaries.
    - Actionable insights and observations about the data.
    - Performance-based student profiling.
- **Interactive Visualizations:** A comprehensive dashboard with interactive charts to explore:
    - CGPA and credit hour distributions.
    - Correlation between pre-grad GPA and university CGPA.
    - Impact of credit load on academic performance.
- **Data Manipulation:**
    - **Trim:** Filter the dataset based on CGPA ranges to focus on specific cohorts.
    - **Merge:** Combine two separately generated datasets for comparative analysis.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/dataforge-ai.git
    cd dataforge-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start both the front-end and back-end servers in development mode.

4.  Open your browser and navigate to `http://localhost:9002` to see the application in action.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, TypeScript
- **Backend:** Express.js, TypeScript
- **UI Components:** shadcn/ui, Tailwind CSS
- **Data Visualization:** Recharts
- **State Management:** React Hooks & Context API
- **Linting & Formatting:** ESLint, Prettier

## 🔧 How It Works

### Data Generation Pipeline

1.  **Parameter Input:** The user sets various parameters through the sidebar UI, such as the number of students, performance distribution, and credit load impact.
2.  **Stochastic Generation:** A synthetic dataset is generated based on these parameters. Each student's academic journey is simulated semester by semester. The process is stochastic, meaning each generation will produce a unique dataset. Key factors include:
    *   **Performance Profile:** Students are initially categorized as high, mid, or low performers based on a probability distribution.
    *   **CGPA Simulation:** A student's CGPA evolves over time, influenced by their performance profile, pre-university scores, and a degree of randomness.
3.  **Analysis Engine:** Once generated, the dataset is fed into the analysis engine.
4.  **Deterministic Analysis:** The engine processes the data deterministically to calculate summary statistics, generate qualitative insights, and prepare data for visualization.

### Project Structure

The project is organized into the following main directories:

```
src
├── app/              # Main application pages (data generation, merge)
├── components/
│   ├── app/          # Application-specific components (charts, sidebars)
│   └── ui/           # Reusable UI components from shadcn/ui
├── hooks/            # Custom React hooks (e.g., use-toast)
├── lib/
│   ├── data-generator.ts # Core data generation logic
│   ├── engine/       # Analysis engine and insight generation
│   ├── types.ts      # TypeScript type definitions
│   └── config.ts     # Default parameters and app configuration
└── styles/           # Global styles and Tailwind CSS setup
server/
├── server.ts         # Main Express.js server file
```

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

1.  **Fork the repository.**
2.  **Create a new branch:** `git checkout -b feat/your-feature-name`
3.  **Make your changes.**
4.  **Commit your changes:** `git commit -m 'feat: Add some amazing feature'`
5.  **Push to the branch:** `git push origin feat/your-feature-name`
6.  **Open a pull request.**

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Future Work

- More advanced statistical models for data generation.
- Exporting data in different formats (CSV, Excel).
- User authentication and saved configurations.
