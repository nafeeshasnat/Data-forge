'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing generated student data and providing insights.
 *
 * The flow takes a JSON string of student data as input and returns an analysis of the data's tendencies and patterns.
 * @file        ai-tendency-insights.ts
 * @exports   analyzeStudentData - The function to analyze student data.
 * @exports   AnalyzeStudentDataInput - The input type for the analyzeStudentData function.
 * @exports   AnalyzeStudentDataOutput - The return type for the analyzeStudentData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStudentDataInputSchema = z.object({
  studentData: z.string().describe('A JSON string containing the generated student data.'),
});
export type AnalyzeStudentDataInput = z.infer<typeof AnalyzeStudentDataInputSchema>;

const AnalyzeStudentDataOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights into the tendencies and patterns within the student dataset.'),
});
export type AnalyzeStudentDataOutput = z.infer<typeof AnalyzeStudentDataOutputSchema>;

export async function analyzeStudentData(input: AnalyzeStudentDataInput): Promise<AnalyzeStudentDataOutput> {
  return analyzeStudentDataFlow(input);
}

const analyzeStudentDataPrompt = ai.definePrompt({
  name: 'analyzeStudentDataPrompt',
  input: {schema: AnalyzeStudentDataInputSchema},
  output: {schema: AnalyzeStudentDataOutputSchema},
  prompt: `You are an AI data analyst tasked with identifying key tendencies and patterns within a dataset of student records.

  Analyze the following JSON data and provide a concise summary of the key trends, correlations, and outliers observed. Focus on aspects such as:

  - Distribution of students across departments
  - Correlation between HSC GPA and semester performance
  - Common subjects taken by students in each department
  - Overall grade distribution
  - Any other notable patterns or anomalies

  Data: {{{studentData}}}

  Provide your analysis in a well-structured paragraph.`,
});

const analyzeStudentDataFlow = ai.defineFlow(
  {
    name: 'analyzeStudentDataFlow',
    inputSchema: AnalyzeStudentDataInputSchema,
    outputSchema: AnalyzeStudentDataOutputSchema,
  },
  async input => {
    try {
      const parsedData = JSON.parse(input.studentData);
      if (!Array.isArray(parsedData)) {
        throw new Error('Input data must be a JSON array of student records.');
      }

      const {output} = await analyzeStudentDataPrompt(input);
      return output!;
    } catch (error: any) {
      console.error('Error analyzing student data:', error);
      return {insights: `Error analyzing data: ${error.message}`};
    }
  }
);
