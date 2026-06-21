import {
  isDelimiterOrArtifactLine,
  isLikelySectionHeader,
} from "./textCleaner.js";

export function getEmptyResumeData() {
  return {
    name: "",
    title: "",
    contact: {
      phone: "",
      email: "",
      linkedin: "",
      location: "",
      github: "",
      portfolio: "",
    },
    summary: "",
    skills: [],
    technologies: [],
    experience: [],
    education: [],
    projects: [],
    responsibilities: [],
    certifications: [],
  };
}

export function isHeaderLine(line) {
  return isLikelySectionHeader(line);
}

export function filterUnwantedContent(text) {
  if (!text) return text;
  let filtered = text.replace(
    /Cloudinary\s*,\s*and\s+state\s+management\s+using\s+Redux/gi,
    "",
  );
  filtered = filtered.replace(/Cloudinary/gi, "");
  filtered = filtered.replace(/state\s+management\s+using\s+Redux/gi, "");
  filtered = filtered.replace(/,\s*,/g, ",");
  filtered = filtered.replace(/^\s*,\s*|\s*,\s*$/g, "");
  return filtered.replace(/\s+/g, " ").trim();
}

export function extractEmail(line) {
  const m = line.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return m ? m[0].replace(/\s+/g, "") : "";
}

export function extractPhone(line) {
  const m = line.match(/\(\+\d+\)\s*[\d\s-]+|\+\d{1,3}[\s-]*\d{6,14}/);
  return m ? m[0].trim() : "";
}

export function extractLinkedIn(line) {
  const m = line.match(/https?:\/\/[^\s)]*linkedin\.com\/[^\s)]*/i);
  return m ? m[0].replace(/[.,;:!?)]+$/, "") : "";
}

export function extractGitHub(line) {
  const m = line.match(/https?:\/\/[^\s)]*github\.com\/[^\s)]*/i);
  return m ? m[0].replace(/[.,;:!?)]+$/, "") : "";
}

export function extractUrl(line) {
  const m = line.match(/https?:\/\/[^\s)|\]]+/i);
  return m ? m[0].replace(/[.,;:!?)]+$/, "") : "";
}

/** True when line is a resume bullet, not a decorative dash row or prompt artifact. */
export function isBulletLine(line) {
  if (!line || isDelimiterOrArtifactLine(line)) return false;
  const t = line.trim();

  if (/^[\u2022\u2023\u25E6\u2043\u2219•]\s*\S/.test(t)) return true;
  if (/^\*\s+\S/.test(t)) return true;
  if (/^\d+\.\s+\S/.test(t) && t.length > 8) return true;

  if (t.startsWith("-")) {
    const inner = t.replace(/^-+/, "").trim();
    if (!inner || /^END\s+RESUME/i.test(inner)) return false;
    const dashRatio = (t.match(/-/g) || []).length / t.length;
    if (dashRatio > 0.35 && inner.length < 24) return false;
    if (/^-\s*[A-Z][A-Z\s]{2,}$/.test(t)) return false;
    if (/^-\s+\S/.test(t)) return true;
  }

  return false;
}

export function extractBulletContent(line) {
  return filterUnwantedContent(
    line
      .trim()
      .replace(/^[\u2022\u2023\u25E6\u2043\u2219•*]\s*/, "")
      .replace(/^\d+\.\s*/, "")
      .replace(/^-\s*/, "")
      .trim(),
  );
}

export function normalizeSectionKey(line) {
  const normalized = line.toUpperCase().replace(/\s+/g, " ").trim();
  if (
    normalized === "PROFESSIONAL SUMMARY" ||
    (normalized.includes("PROFESSIONAL") &&
      normalized.includes("SUMMARY") &&
      !normalized.includes("EXPERIENCE"))
  ) {
    return "summary";
  }
  if (
    normalized === "TECHNICAL SKILLS" ||
    normalized === "SKILLS" ||
    (normalized.includes("TECHNICAL") && normalized.includes("SKILLS"))
  ) {
    return "skills";
  }
  if (
    normalized === "EXPERIENCE" ||
    normalized.startsWith("EXPERIENCE") ||
    normalized === "WORK EXPERIENCE" ||
    normalized === "PROFESSIONAL EXPERIENCE"
  ) {
    return "experience";
  }
  if (normalized === "EDUCATION") return "education";
  if (normalized === "PROJECTS" || normalized === "ACADEMIC PROJECTS") {
    return "projects";
  }
  if (
    normalized === "POSITION OF RESPONSIBILITY" ||
    (normalized.includes("POSITION") && normalized.includes("RESPONSIBILITY"))
  ) {
    return "responsibility";
  }
  if (normalized.includes("CERTIFICATION")) return "certifications";
  return "";
}
