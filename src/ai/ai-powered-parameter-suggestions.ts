// This is a server-side file.
'use server';

/**
 * @fileOverview This file contains the AI-powered parameter suggestion flow.
 *
 * It provides suggestions for parameter settings based on historical data and statistical analysis of previous datasets.
 *
 * @interface ParameterSuggestionsInput - Defines the input schema for the parameter suggestion flow.
 * @interface ParameterSuggestionsOutput - Defines the output schema for the parameter suggestion flow.
 * @function getParameterSuggestions - The main function to get parameter suggestions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParameterSuggestionsInputSchema = z.object({
  studentCount: z.number().describe('The number of students to generate data for.'),
  creditsPerSubject: z.number().describe('The number of credits per subject.'),
  totalSubjects: z.number().describe('The total number of subjects.'),
  minCredit: z.number().describe('The minimum credit value.'),
  stdCredit: z.number().describe('The standard credit value.'),
  maxCredit: z.number().describe('The maximum credit value.'),
  departments: z.array(z.string()).describe('The list of departments.'),
});
export type ParameterSuggestionsInput = z.infer<typeof ParameterSuggestionsInputSchema>;

const ParameterSuggestionsOutputSchema = z.object({
  studentCount: z.object({
    suggestedValue: z.number(),
    reason: z.string(),
  }).optional(),
  creditsPerSubject: z.object({
    suggestedValue: z.number(),
    reason: z.string(),
  }).optional(),
  totalSubjects: z.object({
    suggestedValue: z.number(),
    reason: z.string(),
  }).optional(),
  minCredit: z.object({
    suggestedValue: z.number(),
    reason: z.string(),
  }).optional(),
  stdCredit: z.object({
    suggestedValue: z.number(),
    reason: z.string(),
  }).optional(),
  maxCredit: z.object({
    suggestedValue: z.number(),
    reason: z.string(),
  }).optional(),
  departments: z.object({
    suggestedValue: z.array(z.string()),
    reason: z.string(),
  }).optional(),
});
export type ParameterSuggestionsOutput = z.infer<typeof ParameterSuggestionsOutputSchema>;

export async function getParameterSuggestions(input: ParameterSuggestionsInput): Promise<ParameterSuggestionsOutput> {
  return parameterSuggestionsFlow(input);
}

const parameterSuggestionsPrompt = ai.definePrompt({
  name: 'parameterSuggestionsPrompt',
  input: {schema: ParameterSuggestionsInputSchema},
  output: {schema: ParameterSuggestionsOutputSchema},
  prompt: `Based on the provided historical data and statistical analysis, suggest realistic and meaningful parameter settings for synthetic student dataset generation.

Consider the interdependencies between parameters and provide a reason for each suggestion.

Input Parameters:
Student Count: {{{studentCount}}}
Credits per Subject: {{{creditsPerSubject}}}
Total Subjects: {{{totalSubjects}}}
Minimum Credit: {{{minCredit}}}
Standard Credit: {{{stdCredit}}}
Maximum Credit: {{{maxCredit}}}
Departments: {{{departments}}}

Suggestions (if a parameter looks reasonable, omit it from the suggestions, and only provide suggestions that deviate significantly):
`,
});

const parameterSuggestionsFlow = ai.defineFlow(
  {
    name: 'parameterSuggestionsFlow',
    inputSchema: ParameterSuggestionsInputSchema,
    outputSchema: ParameterSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await parameterSuggestionsPrompt(input);
    return output!;
  }
);
