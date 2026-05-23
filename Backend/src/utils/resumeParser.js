import { sanitizeResumeTextForParsing, isDelimiterOrArtifactLine } from "./textCleaner.js";
import {
  extractEmail,
  extractPhone,
  extractLinkedIn,
  extractGitHub,
  extractUrl,
  filterUnwantedContent,
  getEmptyResumeData,
  isHeaderLine,
  isBulletLine,
  extractBulletContent,
  normalizeSectionKey,
} from "./resumeHelpers.js";
import {
  processLinks,
  matchContactLinks,
  matchLinksToProjects,
} from "./linkMatcher.js";

export function parseResumeData(resumeText, extractedLinks = []) {
  if (!resumeText || typeof resumeText !== "string") {
    console.warn("[parseResumeData] invalid input");
    return getEmptyResumeData();
  }

  const sanitized = sanitizeResumeTextForParsing(resumeText);
  const lines = sanitized.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    console.warn("[parseResumeData] no lines after sanitize");
    return getEmptyResumeData();
  }

  const resumeData = getEmptyResumeData();
  let currentSection = "";
  let currentExperience = null;
  let currentEducation = null;
  let currentProject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isDelimiterOrArtifactLine(line)) continue;

    const upperLine = line.toUpperCase();

    if (
      !resumeData.name &&
      i < 5 &&
      line.length > 2 &&
      line.length < 50 &&
      !line.includes("@") &&
      !line.includes("http") &&
      !line.match(/^\+?\d/) &&
      !line.includes("(") &&
      !isHeaderLine(line)
    ) {
      resumeData.name = line;
      continue;
    }

    if (
      (line.includes("@") || line.includes("|") || line.match(/\(\+\d+\)/)) &&
      !currentSection
    ) {
      applyContactLine(resumeData.contact, line);
      continue;
    }

    if (
      !resumeData.contact.location &&
      line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+/) &&
      !line.includes("http") &&
      !line.includes("@") &&
      !line.includes("|")
    ) {
      resumeData.contact.location = line;
      continue;
    }

    const sectionKey = normalizeSectionKey(line);
    if (sectionKey) {
      currentSection = sectionKey;
      continue;
    }

    switch (currentSection) {
      case "summary":
        if (
          line.length > 20 &&
          !upperLine.includes("TECHNICAL") &&
          !upperLine.includes("SKILLS") &&
          !upperLine.includes("EDUCATION")
        ) {
          const filtered = filterUnwantedContent(line);
          if (filtered) {
            resumeData.summary += (resumeData.summary ? " " : "") + filtered;
          }
        }
        break;

      case "skills":
        parseSkillsLine(resumeData, line, upperLine);
        break;

      case "experience":
        if (
          line.length > 5 &&
          line.length < 200 &&
          !isBulletLine(line) &&
          !line.match(/^\d+%/)
        ) {
          if (line.includes("|")) {
            if (currentExperience) resumeData.experience.push(currentExperience);
            const parts = line.split("|").map((p) => p.trim());
            const title = parts[0] || "";
            const remaining = parts.slice(1).join(" | ").trim();
            let company = "";
            let duration = "";
            const durationPatterns = [
              /\(([A-Z][a-z]+\s*\d{4}\s*[–-]\s*(?:[A-Z][a-z]+\s*)?\d{4}|Present)\)/i,
              /([A-Z][a-z]+\s+\d{4}\s*[–-]\s*(?:[A-Z][a-z]+\s+)?\d{4}|Present)/i,
            ];
            let durationMatch = null;
            for (const pattern of durationPatterns) {
              durationMatch = remaining.match(pattern);
              if (durationMatch) break;
            }
            if (durationMatch) {
              duration = durationMatch[1].trim();
              company = remaining.replace(durationMatch[0], "").trim();
            } else {
              company = remaining;
            }
            company = company.replace(/^\(LOR\)/i, "").trim();
            currentExperience = {
              title: title.trim(),
              company,
              duration: duration.trim(),
              description: [],
            };
          }
        } else if (currentExperience && isBulletLine(line)) {
          const description = extractBulletContent(line);
          if (description && !isDelimiterOrArtifactLine(description)) {
            currentExperience.description.push(description);
          }
        }
        break;

      case "education": {
        const eduResult = parseEducationLine(resumeData, line, currentEducation);
        currentEducation = eduResult.currentEducation;
        break;
      }

      case "projects":
        currentProject = parseProjectLine(
          resumeData,
          line,
          currentProject,
        );
        break;

      case "responsibility":
        parseResponsibilityLine(resumeData, line, lines, i);
        if (parseResponsibilityLine.skipNext) {
          i++;
          parseResponsibilityLine.skipNext = false;
        }
        break;

      case "certifications":
        if (line.length > 5 && line.length < 120 && !isBulletLine(line)) {
          resumeData.certifications.push(line);
        }
        break;

      default:
        break;
    }
  }

  if (currentExperience) resumeData.experience.push(currentExperience);
  if (currentProject) resumeData.projects.push(currentProject);
  if (currentEducation) resumeData.education.push(currentEducation);

  resumeData.projects = dedupeProjects(resumeData.projects);

  const uniqueLinks = processLinks(sanitized, extractedLinks);
  resumeData.contact = matchContactLinks(uniqueLinks, resumeData.contact);
  resumeData.projects = matchLinksToProjects(uniqueLinks, resumeData.projects);

  return resumeData;
}

function applyContactLine(contact, line) {
  if (line.includes("|")) {
    line.split("|").map((p) => p.trim()).forEach((part) => fillContactPart(contact, part));
    return;
  }
  fillContactPart(contact, line);
}

function fillContactPart(contact, part) {
  if (!contact.phone && part.match(/\(\+\d+\)|\+\d/)) {
    contact.phone = extractPhone(part) || part;
  }
  if (!contact.email && part.includes("@")) {
    contact.email = extractEmail(part);
  }
  const url = extractUrl(part);
  if (url) {
    if (url.includes("linkedin.com")) contact.linkedin = url;
    else if (url.includes("github.com")) contact.github = url;
    else if (!contact.portfolio) contact.portfolio = url;
    return;
  }
  const lower = part.toLowerCase();
  if (!contact.linkedin && lower.includes("linkedin")) {
    contact.linkedin = part.includes("linkedin.com")
      ? extractLinkedIn(part)
      : "LinkedIn";
  }
  if (!contact.github && lower.includes("github")) {
    contact.github = part.includes("github.com")
      ? extractGitHub(part)
      : "GitHub";
  }
  if (!contact.portfolio && lower.includes("portfolio")) {
    contact.portfolio = part;
  }
}

function parseSkillsLine(resumeData, line, upperLine) {
  if (line.includes(":")) {
    const colonIndex = line.indexOf(":");
    const category = line.substring(0, colonIndex).trim().toLowerCase();
    const content = filterUnwantedContent(line.substring(colonIndex + 1).trim());
    if (!content) return;
    const items = content
      .split(",")
      .map((s) => filterUnwantedContent(s.trim()))
      .filter(Boolean);
    const bucket =
      category.includes("language") ||
      category.includes("testing") ||
      category.includes("dev tool")
        ? resumeData.skills
        : resumeData.technologies;
    bucket.push(...items);
    return;
  }
  if (
    !upperLine.includes("EDUCATION") &&
    !upperLine.includes("EXPERIENCE") &&
    !upperLine.includes("PROJECTS") &&
    line.length < 100 &&
    !line.includes("•") &&
    !line.includes("|")
  ) {
    const filtered = filterUnwantedContent(line);
    if (filtered && filtered.length > 2 && filtered.length < 80) {
      resumeData.skills.push(filtered);
    }
  }
}

function parseEducationLine(resumeData, line, currentEducation) {
  if (
    line.length > 10 &&
    (line.includes("College") ||
      line.includes("University") ||
      line.includes("School") ||
      line.includes("Institute") ||
      line.includes("Government") ||
      line.match(/[A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z][a-z]+/))
  ) {
    if (currentEducation) resumeData.education.push(currentEducation);

    let institution = line;
    let location = "";
    if (line.includes(",")) {
      const parts = line.split(",").map((p) => p.trim());
      institution = parts[0];
      location = parts.length > 2 ? parts.slice(1).join(", ") : parts[1] || "";
    }

    institution = institution.replace(/([a-z])([A-Z])/g, "$1 $2");
    currentEducation = {
      institution: institution.trim(),
      location: location.trim(),
      degree: "",
      year: "",
      grade: "",
    };
  } else if (currentEducation) {
    if (
      line.includes("B. Tech") ||
      line.includes("Bachelor") ||
      line.includes("B.Tech") ||
      line.includes("Tech")
    ) {
      const cgpaMatch = line.match(/([\d.]+)\s*CGPA/i);
      if (cgpaMatch) {
        currentEducation.grade = `${cgpaMatch[1]} CGPA`;
        currentEducation.degree = line.replace(/\s*[\d.]+\s*CGPA.*/i, "").trim();
      } else {
        currentEducation.degree = line;
      }
      currentEducation.degree = currentEducation.degree.replace(
        /([a-z])([A-Z])/g,
        "$1 $2",
      );
    } else if (line.includes("Diploma") || line.includes("SSC")) {
      currentEducation.degree = line;
    } else if (line.includes("CGPA") || line.includes("GPA")) {
      currentEducation.grade = line;
    } else if (
      line.match(/[A-Z][a-z]+\s*\d{4}\s*[–-]\s*[A-Z][a-z]+\s*\d{4}/i) ||
      line.match(/\d{4}\s*[–-]\s*\d{4}/)
    ) {
      currentEducation.year = line.replace(/([A-Z][a-z]+)(\d{4})/g, "$1 $2").trim();
    }
  }
  return { currentEducation };
}

function parseProjectLine(resumeData, line, currentProject) {
  if (!isBulletLine(line) && line.length > 2) {
    if (
      line.includes("|") ||
      (!isHeaderLine(line) &&
        line.length < 300 &&
        !line.includes("@") &&
        !line.startsWith("http"))
    ) {
      if (line.includes("|")) {
        if (currentProject) resumeData.projects.push(currentProject);

        const parts = line.split("|").map((p) => p.trim());
        const projectName = parts[0] || "";
        let technologies = [];
        const projectLinks = [];

        for (let j = 1; j < parts.length; j++) {
          const part = parts[j];
          const partUrl = extractUrl(part);
          if (partUrl) {
            projectLinks.push({
              id: `proj_part_${j}_${Date.now()}`,
              uri: partUrl,
              source: "project_header",
            });
            continue;
          }
          if (
            /live[- ]?link|github[- ]?link/i.test(part) ||
            part.match(/\d+\+\s*(active|users)/i)
          ) {
            continue;
          }
          if (
            /stack|api|react|node|mongo|mern/i.test(part) ||
            part.includes(",")
          ) {
            technologies = part
              .split(",")
              .map((t) => filterUnwantedContent(t.trim()))
              .filter((t) => t && !/link/i.test(t));
          }
        }

        currentProject = {
          name: projectName.trim(),
          technologies,
          description: [],
          links: projectLinks,
        };
      } else if (!line.startsWith("-")) {
        if (currentProject) resumeData.projects.push(currentProject);
        currentProject = {
          name: line.trim(),
          technologies: [],
          description: [],
          links: [],
        };
      }
    }
  } else if (currentProject && isBulletLine(line)) {
    const description = extractBulletContent(line);
    if (description && !isDelimiterOrArtifactLine(description)) {
      currentProject.description.push(description);
      const url = extractUrl(description);
      if (url) {
        currentProject.links.push({
          id: `proj_desc_${Date.now()}`,
          uri: url,
          source: "project_description",
        });
      }
    }
  }
  return currentProject;
}

function parseResponsibilityLine(resumeData, line, lines, i) {
  parseResponsibilityLine.skipNext = false;
  if (!line.startsWith("-") || line.length <= 10) return;

  const content = line.substring(1).trim();
  let title = "";
  let organization = "";
  let description = "";

  const dashMatch = content.match(/^(.+?)[–-]\s*(.+)$/);
  const colonMatch = content.match(/^(.+?):\s*(.+)$/);

  if (dashMatch) {
    const before = dashMatch[1].trim();
    description = dashMatch[2].trim();
    if (before.includes(",")) {
      const parts = before.split(",").map((p) => p.trim());
      title = parts[0];
      organization = parts.slice(1).join(", ");
    } else {
      title = before;
    }
  } else if (colonMatch) {
    const before = colonMatch[1].trim();
    description = colonMatch[2].trim();
    if (before.includes(",")) {
      const parts = before.split(",").map((p) => p.trim());
      title = parts[0];
      organization = parts.slice(1).join(", ");
    } else {
      title = before;
    }
  } else if (content.includes(",")) {
    const parts = content.split(",").map((p) => p.trim());
    title = parts[0];
    organization = parts.slice(1).join(", ");
  } else {
    title = content;
  }

  if (i + 1 < lines.length) {
    const nextLine = lines[i + 1];
    if (
      !nextLine.startsWith("-") &&
      !isHeaderLine(nextLine) &&
      nextLine.length > 0 &&
      !isDelimiterOrArtifactLine(nextLine)
    ) {
      description += (description ? " " : "") + nextLine;
      parseResponsibilityLine.skipNext = true;
    }
  }

  resumeData.responsibilities.push({
    title: title.trim(),
    organization: organization.trim(),
    description: description.trim(),
  });
}

function dedupeProjects(projects) {
  const seen = new Set();
  return projects
    .filter((p) => p?.name?.trim())
    .filter((p) => {
      const name = p.name.trim();
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((p) => ({
      ...p,
      description: (p.description || []).filter(
        (d) => d && !isDelimiterOrArtifactLine(d),
      ),
    }));
}
