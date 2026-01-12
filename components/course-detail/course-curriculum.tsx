"use client"

import { useState } from "react"
import { ChevronDown, PlayCircle } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { CurriculumModule } from "@/lib/types"

interface CourseCurriculumProps {
  curriculum: CurriculumModule[]
}

export function CourseCurriculum({ curriculum }: CourseCurriculumProps) {
  const [openModules, setOpenModules] = useState<string[]>([curriculum[0]?.module])

  const toggleModule = (module: string) => {
    setOpenModules((prev) => (prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]))
  }

  const totalLessons = curriculum.reduce((acc, module) => acc + module.lessons.length, 0)

  return (
    <section className="py-12 border-b border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Course Curriculum</h2>
        <span className="text-sm text-muted-foreground">
          {curriculum.length} modules • {totalLessons} lessons
        </span>
      </div>

      <div className="space-y-3">
        {curriculum.map((module, index) => (
          <Collapsible
            key={module.module}
            open={openModules.includes(module.module)}
            onOpenChange={() => toggleModule(module.module)}
          >
            <div className="border border-border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-foreground text-left">{module.module}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{module.lessons.length} lessons</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${openModules.includes(module.module) ? "rotate-180" : ""}`}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="divide-y divide-border">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <li key={lessonIndex} className="px-6 py-3 flex items-center gap-4 hover:bg-secondary/20">
                      <PlayCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">{lesson}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </section>
  )
}
