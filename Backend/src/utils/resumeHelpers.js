export function extractEmail(line) {
  if (!line || typeof line !== 'string') return '';
  try {
    const emailMatch = line.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : '';
  } catch (e) {
    return '';
  }
}

export function extractPhone(line) {
  if (!line || typeof line !== 'string') return '';
  try {
    const phonePatterns = [
      /\(\+\d{1,3}\)\s*\d{6,}/,
      /\(\+\d{1,3}\)\s*\d{3}\s*\d{3}\s*\d{4}/,
      /\+\d{1,3}\s*\d{6,}/,
      /\+\d{1,3}\s*\d{3}\s*\d{3}\s*\d{4}/,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
      /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/,
      /\d{10}/
    ];
    for (const pattern of phonePatterns) {
      const match = line.match(pattern);
      if (match) {
        let phone = match[0].trim();
        phone = phone.replace(/\s+/g, ' ');
        return phone;
      }
    }
    return '';
  } catch (e) {
    return '';
  }
}

export function extractLinkedIn(line) {
  if (!line || typeof line !== 'string') return '';
  try {
    const linkedinMatch = line.match(/https?:\/\/.*linkedin\.com\/[^\s]*/);
    return linkedinMatch ? linkedinMatch[0] : '';
  } catch (e) {
    return '';
  }
}

export function extractGitHub(line) {
  if (!line || typeof line !== 'string') return '';
  try {
    const githubMatch = line.match(/https?:\/\/.*github\.com\/[^\s]*/);
    return githubMatch ? githubMatch[0] : '';
  } catch (e) {
    return '';
  }
}

export function filterUnwantedContent(text) {
  if (!text) return text;
  
  let filtered = text.replace(/,\s*,+/g, ',');
  filtered = filtered.replace(/^\s*,+\s*|\s*,+\s*$/g, '');
  filtered = filtered.replace(/[ \t]+/g, ' ').trim();
  
  return filtered;
}

export function getEmptyResumeData() {
  return {
    name: '',
    title: '',
    contact: {
      phone: '',
      email: '',
      linkedin: '',
      location: '',
      github: ''
    },
    summary: '',
    skills: [],
    technologies: [],
    softSkills: [],
    languages: [],
    experience: [],
    education: [],
    projects: [],
    responsibilities: [],
    certifications: [],
    extracurricular: []
  };
}

export function isHeaderLine(line) {
  if (!line || typeof line !== 'string') return false;
  
  const headerPatterns = [
    /^PROFESSIONAL\s+SUMMARY$/i,
    /^SUMMARY$/i,
    /^OBJECTIVE$/i,
    /^TECHNICAL\s+SKILLS$/i,
    /^SKILLS$/i,
    /^CORE\s+SKILLS$/i,
    /^COMPETENCIES$/i,
    /^KEY\s+EXPERTISE$/i,
    /^SOFT\s+SKILLS$/i,
    /^EDUCATION$/i,
    /^ACADEMIC\s+QUALIFICATIONS?$/i,
    /^EXPERIENCE$/i,
    /^WORK\s+EXPERIENCE$/i,
    /^PROFESSIONAL\s+EXPERIENCE$/i,
    /^EMPLOYMENT\s+HISTORY$/i,
    /^CAREER\s+HISTORY$/i,
    /^INTERNSHIP$/i,
    /^INTERNSHIPS?$/i,
    /^PROJECTS?$/i,
    /^ACADEMIC\s+PROJECTS?$/i,
    /^POSITION\s+OF\s+RESPONSIBILITY$/i,
    /^LEADERSHIP$/i,
    /^EXTRACURRICULAR\s+ACTIVITY$/i,
    /^EXTRACURRICULAR\s+ACTIVITIES?$/i,
    /^CERTIFICATIONS?$/i,
    /^ACHIEVEMENTS?$/i,
    /^AWARDS?$/i,
    /^LANGUAGES?$/i,
    /^LANGUAGES?\s+KNOWN$/i,
    /^INTERESTS?$/i,
    /^HOBBIES$/i,
    /^REFERENCES?$/i,
    /^PUBLICATIONS?$/i,
    /^VOLUNTEER\s+WORK$/i
  ];
  
  return headerPatterns.some(pattern => pattern.test(line.trim()));
}

