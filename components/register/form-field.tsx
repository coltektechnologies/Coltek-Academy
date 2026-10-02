import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  hint?: ReactNode
  error?: string
  /**
   * The control. A single element (Input, Textarea) receives the id/aria props automatically;
   * pass a function for composite controls (e.g. Select) to place the props on the right element.
   */
  children: ReactNode | ((controlProps: ControlProps) => ReactNode)
}

export interface ControlProps {
  id: string
  "aria-invalid"?: true
  "aria-describedby"?: string
  "aria-required"?: true
}

/**
 * Label + control + hint + error for the enrollment form (DESIGN_SYSTEM.md §14).
 * Errors are linked with aria-describedby and the control is marked aria-invalid.
 */
export function FormField({ id, label, required, hint, error, children }: FormFieldProps) {
  const hintId = hint && !error ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  const controlProps: ControlProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": required ? true : undefined,
  }
  const control =
    typeof children === "function"
      ? children(controlProps)
      : isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, { ...controlProps })
        : children

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
