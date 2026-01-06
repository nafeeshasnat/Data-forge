"use client"

import { useState } from "react"
import { ParameterSidebar } from "@/components/app/parameter-sidebar"
import { ChartGrid } from "@/components/app/charts/chart-grid"
import type { GenerationParams, StudentWithCgpa } from "@/lib/types"
import { MainDashboard } from "@/components/app/main-page"

export default function Home() {
  const [students, setStudents] = useState<StudentWithCgpa[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [params, setParams] = useState<GenerationParams | null>(null)

  const handleGenerate = (newParams: GenerationParams) => {
    setIsGenerating(true)
    setParams(newParams)
    // Using a worker to avoid blocking the main thread
    const worker = new Worker(new URL("../../workers/generation-worker", import.meta.url))

    worker.onmessage = (event: MessageEvent<StudentWithCgpa[]>) => {
      setStudents(event.data)
      setIsGenerating(false)
      worker.terminate()
    }

    worker.postMessage(newParams)
  }

  return (
    <MainDashboard 
      sidebar={<ParameterSidebar onGenerate={handleGenerate} isGenerating={isGenerating}/>}
    >
      {students.length > 0 && params ? (
        <ChartGrid students={students} params={params} />
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-gray-50 p-8">
          <p className="text-center text-gray-500">
            {isGenerating ? 'Generating data...' : 'Generate data to see the charts.'}
          </p>
        </div>
      )}
    </MainDashboard>
  )
}
