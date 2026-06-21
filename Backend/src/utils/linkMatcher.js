/**
 * Merge PDF-extracted links with URLs found in text; attach to contact + projects.
 */

function extractUrlsFromText(resumeText) {
  const pattern = /https?:\/\/[^\s)\]|]+/gi;
  const links = [];
  let match;
  let idx = 0;
  while ((match = pattern.exec(resumeText)) !== null) {
    const uri = match[0].trim().replace(/[.,;:!?)]+$/, "");
    links.push({
      id: `text_parse_${idx}_${Date.now()}`,
      uri,
      source: "text_parsing",
      page: 0,
    });
    idx++;
  }
  return links;
}

export function processLinks(resumeText, extractedLinks = []) {
  const textLinks = extractUrlsFromText(resumeText || "");
  const allLinks = [...(extractedLinks || []), ...textLinks];

  const linkMap = new Map();
  for (const link of allLinks) {
    const uri = (link.uri || link || "").trim();
    if (!uri) continue;
    const key = uri.toLowerCase();
    if (!linkMap.has(key)) {
      linkMap.set(
        key,
        typeof link === "string"
          ? { id: `dedup_${Date.now()}`, uri: link, source: "deduplicated" }
          : link,
      );
    }
  }

  const uniqueLinks = Array.from(linkMap.values());
  console.log(`[links] unique count=${uniqueLinks.length}`);
  return uniqueLinks;
}

export function matchContactLinks(uniqueLinks, contact) {
  if (!contact || uniqueLinks.length === 0) return contact;

  for (const linkObj of uniqueLinks) {
    const link = (linkObj.uri || linkObj).toLowerCase();
    if (link.includes("linkedin.com") && !contact.linkedin?.includes("http")) {
      contact.linkedin = linkObj.uri || linkObj;
    }
    if (link.includes("github.com") && !contact.github?.includes("http")) {
      contact.github = linkObj.uri || linkObj;
    }
    if (
      (link.includes("portfolio") ||
        link.includes("vercel.app") ||
        link.includes("netlify.app")) &&
      !contact.portfolio?.includes("http")
    ) {
      try {
        const host = new URL(linkObj.uri || linkObj).hostname;
        if (!host.includes("linkedin.com") && !host.includes("github.com")) {
          contact.portfolio = linkObj.uri || linkObj;
        }
      } catch {
        /* ignore invalid URL */
      }
    }
  }
  return contact;
}

export function matchLinksToProjects(uniqueLinks, projects) {
  if (!uniqueLinks.length || !projects.length) return projects;

  const contactHosts = ["linkedin.com", "mailto:"];

  for (const linkObj of uniqueLinks) {
    const uri = linkObj.uri || linkObj;
    const lower = uri.toLowerCase();
    if (contactHosts.some((h) => lower.includes(h))) continue;
    if (lower.includes("github.com") && !lower.includes("/")) continue;

    let bestIdx = -1;
    let bestScore = 0;

    projects.forEach((proj, idx) => {
      const name = (proj.name || "").toLowerCase();
      const blob = `${name} ${(proj.description || []).join(" ")}`.toLowerCase();
      let score = 0;
      const slug = name.replace(/\s+/g, "-");
      if (slug && lower.includes(slug)) score += 3;
      name.split(/\s+/).forEach((word) => {
        if (word.length > 3 && lower.includes(word)) score += 1;
      });
      if (blob.includes("live") && lower.includes("vercel")) score += 2;
      if (blob.includes("github") && lower.includes("github")) score += 2;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    const targetIdx = bestScore > 0 ? bestIdx : 0;
    if (targetIdx < 0) continue;

    const proj = projects[targetIdx];
    if (!proj.links) proj.links = [];
    const exists = proj.links.some((l) => (l.uri || l) === uri);
    if (!exists) {
      proj.links.push({
        id: linkObj.id || `matched_${Date.now()}`,
        uri,
        source: "project_match",
      });
    }
  }

  return projects;
}
