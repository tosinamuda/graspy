/**
 * Processes content to replace custom LaTeX tags with standard delimiters for rendering.
 *
 * Replaces:
 * <latex-inline>math</latex-inline> -> $math$
 * <latex-block>math</latex-block> -> $$math$$
 *
 * This ensures compatibility with rehype-katex used in ReactMarkdown.
 */
export function processLatex(content: string | undefined | null): string {
  if (!content) return "";

  // Replace block tags
  let processed = content
    .replace(/<latex-block>/g, "$$$$")
    .replace(/<\/latex-block>/g, "$$$$");

  // Replace inline tags
  processed = processed
    .replace(/<latex-inline>/g, "$")
    .replace(/<\/latex-inline>/g, "$");

  // Replace standard block delimiters \[ ... \] -> $$ ... $$
  processed = processed.replace(/\\\[/g, "$$$$").replace(/\\\]/g, "$$$$");

  // Replace standard inline delimiters \( ... \) -> $ ... $
  processed = processed.replace(/\\\(/g, "$").replace(/\\\)/g, "$");

  return processed;
}
