import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { CurriculumModule } from "@/lib/types"

/** Curriculum as an accordion: module titles scan quickly, lessons expand on demand. First module open. */
export function CourseCurriculum({ curriculum }: { curriculum: CurriculumModule[] }) {
  const totalLessons = curriculum.reduce((sum, module) => sum + module.lessons.length, 0)

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {curriculum.length} {curriculum.length === 1 ? "module" : "modules"} · {totalLessons}{" "}
        {totalLessons === 1 ? "lesson" : "lessons"}
      </p>
      <Accordion type="multiple" defaultValue={["module-0"]} className="rounded-xl border border-border bg-card px-6">
        {curriculum.map((module, index) => (
          <AccordionItem key={`${module.module}-${index}`} value={`module-${index}`}>
            <AccordionTrigger>
              <span className="flex items-start gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <span>
                  {module.module}
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    {module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="ml-11 list-decimal space-y-2 pl-4 marker:text-muted-foreground">
                {module.lessons.map((lesson, lessonIndex) => (
                  <li key={`${lesson}-${lessonIndex}`} className="text-foreground">
                    {lesson}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
