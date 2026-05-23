/**
 * Normalizes raw PDF text and removes AI / prompt artifacts before parsing.
 */

const DELIMITER_LINE =
  /^-{2,}\s*(?:END|START)?\s*(?:RESUME|MESSY\s*TEXT|JOB\s*DESCRIPTION)?\s*-{2,}$/i;

const PROMPT_LABEL_LINE =
  /^(?:TAILORED\s+RESUME|CLEANED\s+RESUME|ORIGINAL\s+RESUME|TARGET\s+JOB|JOB\s+DESCRIPTION):?\s*$/i;

/** Lines that are only decoration (dashes/underscores) or prompt scaffolding. */
export function isDelimiterOrArtifactLine(line) {
  if (!line || typeof line !== "string") return true;
  const t = line.trim();
  if (!t) return true;
  if (DELIMITER_LINE.test(t)) return true;
  if (PROMPT_LABEL_LINE.test(t)) return true;
  if (/^-{3,}\s*END\b/i.test(t) || /^-{3,}\s*START\b/i.test(t)) return true;
  if (/^[-_*=]{4,}\s*$/.test(t)) return true;
  if (/^---+END\s+RESUME---+$/i.test(t.replace(/\s/g, ""))) return true;
  return false;
}

/** Strip delimiter blocks from full document text (including inline). */
export function stripPromptDelimiters(text) {
  if (!text) return "";
  return text
    .replace(/---\s*START\s+RESUME\s*---/gi, "")
    .replace(/---\s*END\s+RESUME\s*---/gi, "")
    .replace(/---\s*START\s+MESSY\s+TEXT\s*---/gi, "")
    .replace(/---\s*END\s+MESSY\s+TEXT\s*---/gi, "")
    .replace(/---\s*START\s+JOB\s+DESCRIPTION\s*---/gi, "")
    .replace(/---\s*END\s+JOB\s+DESCRIPTION\s*---/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeResumeTextForParsing(text) {
  const stripped = stripPromptDelimiters(text);
  return stripped
    .split(/\r?\n/)
    .filter((line) => !isDelimiterOrArtifactLine(line))
    .join("\n")
    .trim();
}

export function cleanExtractedText(rawText) {
  if (!rawText) return "";

  let text = rawText;

  // Fix common PDF extraction glitches (concatenated headers/words).
  text = text.replace(/(PROFESSIONAL)(SUMMARY)/gi, "$1 $2");
  text = text.replace(/(TECHNICAL)(SKILLS)/gi, "$1 $2");
  text = text.replace(/(WORK)(EXPERIENCE)/gi, "$1 $2");
  text = text.replace(/(PROFESSIONAL)(EXPERIENCE)/gi, "$1 $2");
  text = text.replace(/(POSITION)(OF)(RESPONSIBILITY)/gi, "$1 $2 $3");
  text = text.replace(/(ACADEMIC)(PROJECTS)/gi, "$1 $2");
  text = text.replace(/([a-zA-Z])(\()/g, "$1 $2");
  text = text.replace(/,(?=[^\s])/g, ", ");
  text = text.replace(/\|/g, " | ");

  text = text.replace(/([a-z])([A-Z][a-z])/g, "$1 $2");

  const lines = text.split("\n");
  let processedText = "";
  let previousWasHeader = false;
  let previousLine = "";

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    if (!currentLine) {
      if (previousLine) {
        processedText += "\n";
        previousLine = "";
      }
      continue;
    }
    if (isDelimiterOrArtifactLine(currentLine)) continue;

    if (isLikelySectionHeader(currentLine)) {
      if (processedText.length > 0 && !previousWasHeader) {
        processedText += "\n";
      }
      processedText += currentLine + "\n";
      previousWasHeader = true;
      previousLine = currentLine;
    } else {
      processedText += currentLine + "\n";
      previousWasHeader = false;
      previousLine = currentLine;
    }
  }

  return processedText.replace(/\n{3,}/g, "\n\n").trim();
}

export function isLikelySectionHeader(line) {
  const headerPatterns = [
    /^PROFESSIONAL\s+SUMMARY$/i,
    /^SUMMARY$/i,
    /^OBJECTIVE$/i,
    /^TECHNICAL\s+SKILLS$/i,
    /^SKILLS$/i,
    /^CORE\s+SKILLS$/i,
    /^EDUCATION$/i,
    /^EXPERIENCE$/i,
    /^WORK\s+EXPERIENCE$/i,
    /^PROFESSIONAL\s+EXPERIENCE$/i,
    /^INTERNSHIP$/i,
    /^INTERNSHIPS?$/i,
    /^PROJECTS?$/i,
    /^ACADEMIC\s+PROJECTS?$/i,
    /^POSITION\s+OF\s+RESPONSIBILITY$/i,
    /^CERTIFICATIONS?$/i,
    /^ACHIEVEMENTS?$/i,
    /^AWARDS?$/i,
    /^LANGUAGES?$/i,
    /^REFERENCES?$/i,
  ];
  const t = line.trim();
  return headerPatterns.some((p) => p.test(t));
}
