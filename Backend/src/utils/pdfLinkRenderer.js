/**
 * pdfkit helpers for rendering text + clickable hyperlinks.
 * Centralizes the chained `continued: true` calls so other parts of the PDF
 * generator stay readable.
 */

export function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function labelForLink(uri) {
  const lower = (uri || "").toLowerCase();
  if (lower.includes("github.com")) return "GitHub";
  if (
    lower.includes("vercel.app") ||
    lower.includes("netlify.app") ||
    lower.includes("onrender.com") ||
    lower.includes("railway.app") ||
    lower.includes("fly.dev")
  ) {
    return "Live";
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "Demo";
  if (lower.includes("drive.google.com")) return "Drive";
  if (lower.includes("linkedin.com")) return "LinkedIn";
  return "Live";
}

function uniqueLinkUris(links) {
  const seen = new Set();
  return (links || [])
    .map((l) => (typeof l === "string" ? l : l?.uri))
    .filter(isHttpUrl)
    .filter((uri) => {
      const key = uri.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Renders the contact line with clickable email / LinkedIn / GitHub / Portfolio.
 * Returns the height consumed so the caller can advance the cursor.
 */
export function drawContactLine(
  doc,
  contact,
  { x, y, width, linkColor, plainColor, fontSize = 10 },
) {
  const segments = [];

  if (contact.phone) segments.push({ text: contact.phone });
  if (contact.email) {
    segments.push({ text: contact.email, link: `mailto:${contact.email}` });
  }
  if (isHttpUrl(contact.linkedin)) {
    segments.push({ text: "LinkedIn", link: contact.linkedin });
  } else if (contact.linkedin) {
    segments.push({ text: contact.linkedin });
  }
  if (isHttpUrl(contact.github)) {
    segments.push({ text: "GitHub", link: contact.github });
  } else if (contact.github) {
    segments.push({ text: contact.github });
  }
  if (isHttpUrl(contact.portfolio)) {
    segments.push({ text: "Portfolio", link: contact.portfolio });
  } else if (contact.portfolio) {
    segments.push({ text: contact.portfolio });
  }
  if (contact.location) segments.push({ text: contact.location });

  if (segments.length === 0) return 0;

  doc.fontSize(fontSize).font("Helvetica");

  segments.forEach((seg, i) => {
    const isFirst = i === 0;
    const isLast = i === segments.length - 1;

    doc.fillColor(seg.link ? linkColor : plainColor);

    const segOpts = {
      link: seg.link || null,
      underline: !!seg.link,
      continued: !isLast,
    };

    if (isFirst) {
      doc.text(seg.text, x, y, { width, ...segOpts });
    } else {
      doc.text(seg.text, segOpts);
    }

    if (!isLast) {
      doc
        .fillColor(plainColor)
        .text(" | ", { link: null, underline: false, continued: true });
    }
  });

  const flat = segments.map((s) => s.text).join(" | ");
  return doc.heightOfString(flat, { width });
}

/**
 * Renders a project name plus inline clickable badges for each link
 * (e.g. "Cold Mailer AI · GitHub · Live").
 */
export function drawProjectHeader(
  doc,
  project,
  { x, y, width, textColor, linkColor, fontSize = 11 },
) {
  const name = project?.name?.trim() || "";
  if (!name) return 0;

  const uris = uniqueLinkUris(project.links);

  doc.fontSize(fontSize).font("Helvetica-Bold").fillColor(textColor);

  if (uris.length === 0) {
    doc.text(name, x, y, {
      width,
      ellipsis: false,
      break: true,
      link: null,
      underline: false,
    });
    return doc.heightOfString(name, { width });
  }

  doc.text(name, x, y, {
    width,
    link: null,
    underline: false,
    continued: true,
  });

  uris.forEach((uri, idx) => {
    const isLast = idx === uris.length - 1;
    doc
      .font("Helvetica")
      .fillColor(textColor)
      .text("  \u00B7  ", {
        link: null,
        underline: false,
        continued: true,
      });

    doc
      .font("Helvetica")
      .fillColor(linkColor)
      .text(labelForLink(uri), {
        link: uri,
        underline: true,
        continued: !isLast,
      });
  });

  const flat = `${name} ${uris.map(labelForLink).join(" \u00B7 ")}`;
  return doc.heightOfString(flat, { width });
}
