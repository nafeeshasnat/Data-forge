"use client"

import { useState } from "react"
import { GenerationForm } from "@/components/app/generation-form"
import { ChartGrid } from "@/components/app/charts/chart-grid"
import type { GenerationParams, StudentWithCgpa } from "@/lib/types"

export default function Home() {
  const [students, setStudents] = useState<StudentWithCgpa[]>([])

  const handleGenerate = (params: GenerationParams) => {
    // Using a worker to avoid blocking the main thread
    const worker = new Worker(new URL("../../workers/generation-worker", import.meta.url))

    worker.onmessage = (event: MessageEvent<StudentWithCgpa[]>) => {
      setStudents(event.data)
      worker.terminate()
    }

    worker.postMessage(params)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold tracking-tight">Student Data Generator</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <GenerationForm onGenerate={handleGenerate} />
        </div>
        <div className="lg:col-span-2">
          {students.length > 0 ? (
            <ChartGrid students={students} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-gray-50 p-8">
              <p className="text-center text-gray-500">
                Generate data to see the charts.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
