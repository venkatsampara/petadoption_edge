import type { ZodIssue } from "zod";

export function getFieldErrors(issues: ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !errors[field]) {
      if (issue.code === "invalid_type") errors[field] = "Please complete this field.";
      else if (issue.code === "invalid_string" && issue.validation === "email") {
        errors[field] = "Enter a valid email address.";
      } else if (issue.code === "too_small") errors[field] = "Please add a little more information.";
      else if (issue.code === "too_big") errors[field] = "This entry is too long. Please shorten it.";
      else errors[field] = issue.message;
    }
  }
  return errors;
}
