import { useState } from 'react';
import { generateDataAction, processUploadedData } from '@/app/actions';
import { defaultGenerationParams } from '@/lib/config';
import type { GenerationParams, GenerationResult, Student } from '@/lib/types';

export function useGeneration() {
  const [params, setParams] = useState<GenerationParams>({
    ...defaultGenerationParams,
    numStudents: 250,
    highPerformanceChance: 0.2,
    failChance: 0.1,
    preGradScoreInfluence: 0.5,
    exceptionPercentage: 0.1,
  });

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await generateDataAction(params);
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const upload = async (data: Student[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await processUploadedData(data);
      setResult(res);
    } catch (err: any) { 
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const download = () => {
    if (result) {
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'dataset.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return { params, setParams, result, isLoading, error, generate, upload, download };
}
