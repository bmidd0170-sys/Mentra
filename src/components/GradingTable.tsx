"use client"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Trash2, Plus } from "lucide-react"
import { useState } from "react"

export interface GradeEntry {
  grade: string
  minScore: number
  maxScore: number
  description: string
}

interface GradingTableProps {
  value: GradeEntry[]
  onChange: (entries: GradeEntry[]) => void
  disabled?: boolean
}

export function GradingTable({ value, onChange, disabled = false }: GradingTableProps) {
  const getDefaultGradingScale = (): GradeEntry[] => [
    { grade: "A", minScore: 90, maxScore: 100, description: "Excellent" },
    { grade: "B", minScore: 80, maxScore: 89, description: "Good" },
    { grade: "C", minScore: 70, maxScore: 79, description: "Satisfactory" },
    { grade: "D", minScore: 60, maxScore: 69, description: "Passing" },
    { grade: "F", minScore: 0, maxScore: 59, description: "Failing" },
  ]

  const [localEntries, setLocalEntries] = useState<GradeEntry[]>(value || getDefaultGradingScale())

  const handleAddRow = () => {
    const newEntry: GradeEntry = {
      grade: "",
      minScore: 0,
      maxScore: 0,
      description: "",
    }
    const updatedEntries = [...localEntries, newEntry]
    setLocalEntries(updatedEntries)
    onChange(updatedEntries)
  }

  const handleRemoveRow = (index: number) => {
    const updatedEntries = localEntries.filter((_, i) => i !== index)
    setLocalEntries(updatedEntries)
    onChange(updatedEntries)
  }

  const handleChange = (index: number, field: keyof GradeEntry, value: string | number) => {
    const updatedEntries = [...localEntries]
    if (field === "minScore" || field === "maxScore") {
      updatedEntries[index][field] = typeof value === "string" ? parseInt(value, 10) || 0 : value
    } else {
      updatedEntries[index][field] = value as string
    }
    setLocalEntries(updatedEntries)
    onChange(updatedEntries)
  }

  const usePreset = (preset: "letter" | "percentage" | "gpa") => {
    let presetEntries: GradeEntry[] = []

    if (preset === "letter") {
      presetEntries = [
        { grade: "A+", minScore: 97, maxScore: 100, description: "Outstanding" },
        { grade: "A", minScore: 90, maxScore: 96, description: "Excellent" },
        { grade: "B+", minScore: 87, maxScore: 89, description: "Very Good" },
        { grade: "B", minScore: 80, maxScore: 86, description: "Good" },
        { grade: "C+", minScore: 77, maxScore: 79, description: "Good" },
        { grade: "C", minScore: 70, maxScore: 76, description: "Satisfactory" },
        { grade: "D", minScore: 60, maxScore: 69, description: "Passing" },
        { grade: "F", minScore: 0, maxScore: 59, description: "Failing" },
      ]
    } else if (preset === "percentage") {
      presetEntries = [
        { grade: "90-100%", minScore: 90, maxScore: 100, description: "Excellent" },
        { grade: "80-89%", minScore: 80, maxScore: 89, description: "Good" },
        { grade: "70-79%", minScore: 70, maxScore: 79, description: "Satisfactory" },
        { grade: "60-69%", minScore: 60, maxScore: 69, description: "Passing" },
        { grade: "Below 60%", minScore: 0, maxScore: 59, description: "Failing" },
      ]
    } else if (preset === "gpa") {
      presetEntries = [
        { grade: "4.0", minScore: 97, maxScore: 100, description: "A+" },
        { grade: "4.0", minScore: 93, maxScore: 96, description: "A" },
        { grade: "3.7", minScore: 90, maxScore: 92, description: "A-" },
        { grade: "3.3", minScore: 87, maxScore: 89, description: "B+" },
        { grade: "3.0", minScore: 83, maxScore: 86, description: "B" },
        { grade: "2.7", minScore: 80, maxScore: 82, description: "B-" },
        { grade: "0.0", minScore: 0, maxScore: 79, description: "Below B-" },
      ]
    }

    setLocalEntries(presetEntries)
    onChange(presetEntries)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grading Scale</CardTitle>
        <CardDescription>
          Define how numeric scores map to grades. This helps the AI assign accurate grades and feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => usePreset("letter")}
            disabled={disabled}
          >
            Letter Grades (A-F)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => usePreset("percentage")}
            disabled={disabled}
          >
            Percentage Scale
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => usePreset("gpa")}
            disabled={disabled}
          >
            GPA Scale
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalEntries([])
              onChange([])
            }}
            disabled={disabled}
            className="ml-auto"
          >
            Clear All
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-semibold">Grade</th>
                <th className="px-3 py-2 text-left font-semibold">Min Score</th>
                <th className="px-3 py-2 text-left font-semibold">Max Score</th>
                <th className="px-3 py-2 text-left font-semibold">Description</th>
                <th className="px-3 py-2 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {localEntries.map((entry, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Input
                      value={entry.grade}
                      onChange={(e) => handleChange(index, "grade", e.target.value)}
                      placeholder="e.g., A, B+, 90-100%"
                      disabled={disabled}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={entry.minScore}
                      onChange={(e) => handleChange(index, "minScore", e.target.value)}
                      placeholder="0"
                      disabled={disabled}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={entry.maxScore}
                      onChange={(e) => handleChange(index, "maxScore", e.target.value)}
                      placeholder="100"
                      disabled={disabled}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={entry.description}
                      onChange={(e) => handleChange(index, "description", e.target.value)}
                      placeholder="e.g., Excellent, Good"
                      disabled={disabled}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      disabled={disabled || localEntries.length <= 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Grade Row
        </Button>

        {/* Preview */}
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Preview:</p>
          <div className="space-y-1">
            {localEntries.map((entry, index) => (
              <div key={index} className="text-xs text-foreground">
                <span className="font-semibold">{entry.grade}</span> ({entry.minScore}-{entry.maxScore}): {entry.description}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
