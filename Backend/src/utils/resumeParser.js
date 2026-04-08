import { 
  extractEmail, 
  extractPhone, 
  extractLinkedIn, 
  extractGitHub, 
  filterUnwantedContent, 
  getEmptyResumeData,
  isHeaderLine
} from './resumeHelpers.js';
import { processLinks, matchLinksToProjects, matchContactLinks } from './linkMatcher.js';

export function parseResumeData(resumeText, extractedLinks = []) {
  // Validate input
  if (!resumeText || typeof resumeText !== 'string') {
    console.warn('Invalid resume text provided to parseResumeData');
    return getEmptyResumeData();
  }

  try {
    const lines = resumeText.split('\n').filter(line => line && line.trim());
    if (lines.length === 0) {
      console.warn('No lines found in resume text');
      return getEmptyResumeData();
    }

    const resumeData = {
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

    let currentSection = '';
    let currentExperience = null;
    let currentEducation = null;
    let currentProject = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const upperLine = line.toUpperCase();

      if (!line) continue;

      // Improved name detection - check first few lines for name
      if (!resumeData.name && i < 8 && line.length > 2 && line.length < 60 && 
          !line.includes('@') && !line.includes('http') && !line.match(/^\+?\d/) && 
          !line.includes('(') && !line.includes('|') && !line.includes('||') &&
          !isHeaderLine(line) && !line.match(/^\d+[rdthnd]+\s+Year/i)) {
        const hasCapital = /[A-Z]/.test(line);
        const isAllCaps = line === line.toUpperCase() && line.length < 30;
        if (hasCapital || isAllCaps) {
          resumeData.name = line;
          continue;
        }
      }

      // Detect title/position
      if (!resumeData.title && resumeData.name && i < 10 && line.length > 5 && line.length < 100 &&
          !line.includes('@') && !line.includes('http') && !line.match(/^\+?\d/) &&
          !isHeaderLine(line) && (line.toUpperCase().includes('ENGINEERING') || 
          line.toUpperCase().includes('DEVELOPER') || line.toUpperCase().includes('B.TECH') ||
          line.toUpperCase().includes('BACHELOR') || line.toUpperCase().includes('MASTER'))) {
        resumeData.title = line;
        continue;
      }

      // Improved contact info parsing
      if ((line.includes('@') || line.includes('|') || line.match(/\(\+\d+\)/) || line.match(/\+\d{10,}/)) && !currentSection) {
        const separator = line.includes('||') ? '||' : (line.includes('|') ? '|' : null);
        if (separator) {
          const parts = line.split(separator).map(p => p.trim());
          
          parts.forEach(part => {
            if (!resumeData.contact.phone && part.match(/\(\+\d+\)/)) {
              const phoneMatch = part.match(/\((\+\d+)\)\s*(\d+)/);
              if (phoneMatch) {
                resumeData.contact.phone = `(${phoneMatch[1]}) ${phoneMatch[2]}`;
              } else {
                resumeData.contact.phone = extractPhone(part);
              }
            }
            if (!resumeData.contact.email && part.includes('@')) {
              resumeData.contact.email = extractEmail(part);
            }
            if (!resumeData.contact.linkedin && (part.toLowerCase().includes('linkedin') || part.includes('linkedin.com'))) {
              if (part.includes('linkedin.com')) {
                resumeData.contact.linkedin = extractLinkedIn(part);
              } else if (part.toLowerCase().includes('linkedin')) {
                resumeData.contact.linkedin = 'LinkedIn';
              }
            }
            if (!resumeData.contact.github && (part.toLowerCase().includes('github') || part.includes('github.com'))) {
              if (part.includes('github.com')) {
                resumeData.contact.github = extractGitHub(part);
              } else if (part.toLowerCase().includes('github')) {
                resumeData.contact.github = 'GitHub';
              }
            }
            if (!resumeData.contact.location && (part.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+/) || part.match(/\(\d{6}\)/))) {
              resumeData.contact.location = part;
            }
          });
          
          continue;
        } else {
          if (line.includes('@') && !resumeData.contact.email) {
            resumeData.contact.email = extractEmail(line);
            continue;
          }
          if (line.match(/\(\+\d+\)/) && !resumeData.contact.phone) {
            resumeData.contact.phone = extractPhone(line);
            continue;
          }
          if (line.includes('linkedin.com') && !resumeData.contact.linkedin) {
            resumeData.contact.linkedin = extractLinkedIn(line);
            continue;
          }
          if (line.includes('github.com') && !resumeData.contact.github) {
            resumeData.contact.github = extractGitHub(line);
            continue;
          }
        }
      }
      
      // Improved location detection
      if (!resumeData.contact.location && 
          (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s*\(\d{6}\))?/) || 
           line.match(/^[A-Z][a-z]+,\s*[A-Z][a-z]+\s*\(\d{6}\)/) ||
           (line.match(/^[A-Z][a-z]+,\s*[A-Z][a-z]+/) && !line.includes('http') && !line.includes('@') && !line.includes('|') && !line.includes('College') && !line.includes('University')))) {
        resumeData.contact.location = line;
        continue;
      }

      const normalizedLine = upperLine.replace(/\s+/g, ' ').trim();
      
      // Enhanced section detection
      if (normalizedLine === 'PROFESSIONAL SUMMARY' || 
          normalizedLine === 'SUMMARY' ||
          normalizedLine === 'OBJECTIVE' ||
          (normalizedLine.includes('PROFESSIONAL') && normalizedLine.includes('SUMMARY') && !normalizedLine.includes('EXPERIENCE'))) {
        currentSection = 'summary';
        continue;
      } else if (normalizedLine === 'KEY EXPERTISE' ||
                 (normalizedLine.includes('KEY') && normalizedLine.includes('EXPERTISE'))) {
        currentSection = 'skills';
        continue;
      } else if (normalizedLine === 'SOFT SKILLS' ||
                 (normalizedLine.includes('SOFT') && normalizedLine.includes('SKILLS'))) {
        currentSection = 'softskills';
        continue;
      } else if (normalizedLine === 'TECHNICAL SKILLS' || 
                 normalizedLine === 'SKILLS' ||
                 normalizedLine === 'CORE SKILLS' ||
                 normalizedLine === 'COMPETENCIES' ||
                 (normalizedLine.includes('TECHNICAL') && normalizedLine.includes('SKILLS')) ||
                 (normalizedLine.includes('SKILL') && !normalizedLine.includes('SOFT') && !normalizedLine.includes('LANGUAGE'))) {
        currentSection = 'skills';
        continue;
      } else if (normalizedLine === 'LANGUAGES' ||
                 normalizedLine === 'LANGUAGES KNOWN' ||
                 (normalizedLine.includes('LANGUAGE') && normalizedLine.includes('KNOWN'))) {
        currentSection = 'languages';
        continue;
      } else if (normalizedLine === 'INTERNSHIP' ||
                 normalizedLine === 'INTERNSHIPS' ||
                 normalizedLine.startsWith('INTERNSHIP')) {
        currentSection = 'internship';
        continue;
      } else if (normalizedLine === 'EXPERIENCE' || 
                 normalizedLine.startsWith('EXPERIENCE') ||
                 normalizedLine === 'WORK EXPERIENCE' || 
                 normalizedLine === 'PROFESSIONAL EXPERIENCE' ||
                 normalizedLine === 'EMPLOYMENT HISTORY' ||
                 normalizedLine === 'CAREER HISTORY' ||
                 normalizedLine.startsWith('EXPERIENCE (INTERNSHIPS)')) {
        currentSection = 'experience';
        continue;
      } else if (normalizedLine === 'EDUCATION' ||
                 normalizedLine === 'ACADEMIC QUALIFICATIONS' ||
                 normalizedLine === 'ACADEMIC QUALIFICATION') {
        currentSection = 'education';
        continue;
      } else if (normalizedLine === 'ACADEMIC PROJECTS' ||
                 (normalizedLine.includes('ACADEMIC') && normalizedLine.includes('PROJECT'))) {
        currentSection = 'projects';
        continue;
      } else if (normalizedLine === 'PROJECTS' ||
                 normalizedLine === 'PROJECT') {
        currentSection = 'projects';
        continue;
      } else if (normalizedLine === 'EXTRACURRICULAR ACTIVITY' ||
                 normalizedLine === 'EXTRACURRICULAR ACTIVITIES' ||
                 (normalizedLine.includes('EXTRACURRICULAR') && normalizedLine.includes('ACTIVITY'))) {
        currentSection = 'extracurricular';
        continue;
      } else if (normalizedLine === 'POSITION OF RESPONSIBILITY' || 
                 normalizedLine === 'LEADERSHIP' ||
                 (normalizedLine.includes('POSITION') && normalizedLine.includes('RESPONSIBILITY'))) {
        currentSection = 'responsibility';
        continue;
      } else if (normalizedLine.includes('CERTIFICATION') ||
                 normalizedLine.includes('CERTIFICATE')) {
        currentSection = 'certifications';
        continue;
      }

      switch (currentSection) {
        case 'summary':
          if (line.length > 10 && !upperLine.includes('TECHNICAL') && !upperLine.includes('SKILLS') && !upperLine.includes('EDUCATION') && !upperLine.includes('EXPERIENCE')) {
            const filteredLine = filterUnwantedContent(line);
            if (filteredLine && filteredLine.length > 0) {
              resumeData.summary += (resumeData.summary ? ' ' : '') + filteredLine;
            }
          }
          break;

        case 'skills':
          if (line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const category = line.substring(0, colonIndex).trim();
            const content = line.substring(colonIndex + 1).trim();
            
            if (content) {
              const filteredContent = filterUnwantedContent(content);
              if (!filteredContent) continue;
              
              const items = filteredContent.split(/[,;]/).map(s => filterUnwantedContent(s.trim())).filter(s => s && s.length > 0);
              
              const catLower = category.toLowerCase();
              if (catLower.includes('language') && !catLower.includes('programming')) {
                resumeData.skills.push(...items);
              } else if (catLower.includes('frontend') || catLower.includes('backend') || catLower.includes('cloud') || catLower.includes('other')) {
                resumeData.technologies.push(...items);
              } else if (catLower.includes('testing') || catLower.includes('dev tool') || catLower.includes('developer tool') || catLower.includes('dev tools')) {
                resumeData.skills.push(...items);
              } else {
                resumeData.technologies.push(...items);
              }
            }
          }
          else if (!upperLine.includes('EDUCATION') && !upperLine.includes('EXPERIENCE') && 
                  !upperLine.includes('PROJECTS') && !upperLine.includes('INTERNSHIP') &&
                  !line.includes('Government') && !isHeaderLine(line) &&
                  line.length < 150 && !line.includes('•') && !line.includes('|') && !line.match(/^\d+[rdthnd]+/i)) {
            if (line.length > 2 && line.length < 100) {
              const filteredLine = filterUnwantedContent(line);
              if (filteredLine && filteredLine.length > 0) {
                resumeData.technologies.push(filteredLine);
              }
            }
          }
          break;

        case 'softskills':
          if (!isHeaderLine(line) && !upperLine.includes('TECHNICAL') && !upperLine.includes('LANGUAGES') &&
              line.length > 2 && line.length < 50 && !line.includes('•') && !line.includes('|') && !line.includes(':')) {
            const filteredLine = filterUnwantedContent(line);
            if (filteredLine && filteredLine.length > 0) {
              resumeData.softSkills.push(filteredLine);
            }
          }
          break;

        case 'languages':
          if (line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const language = line.substring(0, colonIndex).trim();
            const proficiency = line.substring(colonIndex + 1).trim();
            if (language && language.length > 1) {
              resumeData.languages.push(`${language} (${proficiency})`);
            }
          } else if (!isHeaderLine(line) && line.length > 2 && line.length < 80 && 
                     !line.includes('•') && !line.includes('|') && !upperLine.includes('KNOWN')) {
            const filteredLine = filterUnwantedContent(line);
            if (filteredLine && filteredLine.length > 0) {
              resumeData.languages.push(filteredLine);
            }
          }
          break;

        case 'internship':
          if (line.length > 5 && line.length < 400 && !line.startsWith('•') && !line.startsWith('-') && !line.match(/^\d+%/)) {
            const hasDatePattern = /\(?([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4}|[A-Z][a-z]+\s*\d{4}\s*[–\-]\s*Present|\d{1,2}\s+[A-Z][a-z]+,\s*\d{4}\s*[–\-]\s*\d{1,2}\s+[A-Z][a-z]+,\s*\d{4})/i.test(line);
            
            if (line.includes('|') || hasDatePattern || line.match(/\(LOR\)/i)) {
              if (currentExperience) {
                resumeData.experience.push(currentExperience);
              }
              
              let title = '';
              let company = '';
              let duration = '';
              
              if (line.includes('|')) {
                const parts = line.split('|').map(p => p.trim());
                title = parts[0] || '';
                const remaining = parts.slice(1).join(' | ').trim();
                
                const durationPatterns = [
                  /\(([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4})\)/,
                  /\(([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4}|Present)\)/i,
                  /\((\d{1,2}\s+[A-Z][a-z]+\s*\d{4}\s*[–\-]\s*\d{1,2}\s+[A-Z][a-z]+\s*\d{4})\)/i,
                  /([A-Z][a-z]+\s+\d{4}\s*[–\-]\s*[A-Z][a-z]+\s+\d{4})/,
                  /([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4})/,
                  /(\d{4}\s*[–\-]\s*\d{4})/,
                  /(\d{1,2}\/\d{4}\s*[–\-]\s*\d{1,2}\/\d{4})/,
                  /([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*Present)/i,
                  /(\d{4}\s*[–\-]\s*Present)/i
                ];
                
                let durationMatch = null;
                for (const pattern of durationPatterns) {
                  durationMatch = remaining.match(pattern);
                  if (durationMatch) break;
                }
                
                if (durationMatch) {
                  duration = durationMatch[1].trim();
                  company = remaining.replace(durationMatch[0], '').trim();
                  company = company.replace(/^\(LOR\)/i, '').trim();
                } else {
                  company = remaining;
                }
              } else {
                const dateMatch = line.match(/^(.+?)\s*\(([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4}|[A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4})\)/i);
                if (dateMatch) {
                  company = dateMatch[1].trim();
                  duration = dateMatch[2].trim();
                } else {
                  company = line;
                }
              }
              
              currentExperience = {
                title: title.trim() || 'Intern',
                company: company.trim(),
                duration: duration.trim(),
                description: []
              };
            }
          } else if (currentExperience && (line.startsWith('•') || line.startsWith('-'))) {
            const description = filterUnwantedContent(line.replace(/^[•\-]\s*/, '').trim());
            if (description && description.length > 0) {
              currentExperience.description.push(description);
            }
          }
          break;

        case 'experience':
          if (line.length > 5 && line.length < 400 && !line.startsWith('•') && !line.startsWith('-') && !line.match(/^\d+%/)) {
            if (line.includes('|')) {
              if (currentExperience) {
                resumeData.experience.push(currentExperience);
              }
              
              const parts = line.split('|').map(p => p.trim());
              const title = parts[0] || '';
              const remaining = parts.slice(1).join(' | ').trim();
              
              let company = '';
              let duration = '';
              
              const durationPatterns = [
                /\(([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4})\)/,
                /\(([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4}|Present)\)/i,
                /([A-Z][a-z]+\s+\d{4}\s*[–\-]\s*[A-Z][a-z]+\s+\d{4})/,
                /([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4})/,
                /(\d{4}\s*[–\-]\s*\d{4})/,
                /(\d{1,2}\/\d{4}\s*[–\-]\s*\d{1,2}\/\d{4})/,
                /([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*Present)/i,
                /(\d{4}\s*[–\-]\s*Present)/i
              ];
              
              let durationMatch = null;
              for (const pattern of durationPatterns) {
                durationMatch = remaining.match(pattern);
                if (durationMatch) break;
              }
              
              if (durationMatch) {
                duration = durationMatch[1].trim();
                company = remaining.replace(durationMatch[0], '').trim();
                company = company.replace(/^\(LOR\)/i, '').trim();
              } else {
                company = remaining;
              }
              
              currentExperience = {
                title: title.trim(),
                company: company.trim(),
                duration: duration.trim(),
                description: []
              };
            }
          } else if (currentExperience) {
            const isBulletPoint = line.startsWith('•') || 
                                 line.startsWith('-') || 
                                 line.startsWith('*') ||
                                 (line.match(/^\d+\./) && line.length > 10) ||
                                 (line.length > 20 && line.length < 300 && !isHeaderLine(line) && 
                                  !line.includes('|') && !line.includes('@') && 
                                  !line.match(/^\d{4}/) && !line.match(/^[A-Z][a-z]+\s+\d{4}/) &&
                                  !upperLine.includes('EDUCATION') && !upperLine.includes('PROJECTS') &&
                                  !upperLine.includes('SKILLS') && !upperLine.includes('INTERNSHIP'));
          
            if (isBulletPoint) {
              const description = filterUnwantedContent(line.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim());
              if (description && description.length > 0) {
                currentExperience.description.push(description);
              }
            }
          }
          break;

        case 'education':
          const locationWithDateMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((\d{4}\s*[–\-]\s*\d{4})\)/);
          if (locationWithDateMatch) {
            if (currentEducation) {
              resumeData.education.push(currentEducation);
            }
            currentEducation = {
              institution: '',
              location: locationWithDateMatch[1].trim(),
              degree: '',
              year: locationWithDateMatch[2].trim(),
              grade: ''
            };
            continue;
          }
          
          const degreeWithDateMatch = line.match(/^(.+?)\s*\((\d{4}\s*[–\-]\s*\d{4}|[A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4})\)/i);
          if (degreeWithDateMatch) {
            if (currentEducation) {
              resumeData.education.push(currentEducation);
            }
            currentEducation = {
              institution: '',
              location: '',
              degree: degreeWithDateMatch[1].trim(),
              year: degreeWithDateMatch[2].trim(),
              grade: ''
            };
            continue;
          }
          
          if (line.length > 5 && (line.includes('College') || line.includes('University') || 
              line.includes('School') || line.includes('Institute') || 
              line.includes('Academy') || line.includes('Polytechnic') ||
              line.includes('Government') || line.match(/[A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z][a-z]+/) ||
              line.match(/[A-Z][a-z]+\s+(College|University|School|Institute|Polytechnic)/i))) {
            
            if (currentEducation) {
              resumeData.education.push(currentEducation);
            }
            
            let institution = line;
            let location = '';
            
            if (line.includes(',')) {
              const parts = line.split(',').map(p => p.trim());
              if (parts.length >= 2) {
                institution = parts[0];
                location = parts[parts.length - 1];
                if (parts.length > 2) {
                  location = parts.slice(1).join(', ');
                }
              }
            } else {
              const locationMatch = line.match(/^(.+?)\s{2,}([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/);
              if (locationMatch) {
                institution = locationMatch[1].trim();
                location = locationMatch[2].trim();
              }
            }
            
            institution = institution.replace(/([a-z])([A-Z])/g, '$1 $2');
            
            currentEducation = {
              institution: institution.trim(),
              location: location.trim(),
              degree: currentEducation?.degree || '',
              year: currentEducation?.year || '',
              grade: currentEducation?.grade || ''
            };
          } else if (currentEducation) {
            if (line.match(/(B\.?\s*Tech|Bachelor|B\.?\s*E\.?|B\.?\s*S\.?|B\.?\s*A\.?|M\.?\s*Tech|Master|M\.?\s*E\.?|M\.?\s*S\.?|M\.?\s*A\.?|Ph\.?\s*D|Doctorate)/i)) {
              const cgpaMatch = line.match(/([\d.]+)\s*CGPA/i);
              const gpaMatch = line.match(/([\d.]+)\s*GPA/i);
              const dateMatch = line.match(/\((\d{4}\s*[–\-]\s*\d{4}|[A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4})\)/i);
              
              if (dateMatch && !currentEducation.year) {
                currentEducation.year = dateMatch[1].trim();
              }
              
              if (cgpaMatch) {
                currentEducation.grade = `${cgpaMatch[1]} CGPA`;
                currentEducation.degree = line.replace(/\s*[\d.]+\s*CGPA.*/i, '').replace(/\([^)]*\)/g, '').trim();
              } else if (gpaMatch) {
                currentEducation.grade = `${gpaMatch[1]} GPA`;
                currentEducation.degree = line.replace(/\s*[\d.]+\s*GPA.*/i, '').replace(/\([^)]*\)/g, '').trim();
              } else {
                currentEducation.degree = line.replace(/\([^)]*\)/g, '').trim();
              }
              currentEducation.degree = currentEducation.degree.replace(/([a-z])([A-Z])/g, '$1 $2');
            } else if (line.match(/(Diploma|SSC|HSC|High\s+School|Secondary)/i)) {
              const dateMatch = line.match(/\(([A-Z][a-z]+\s*\d{4})\)/i);
              if (dateMatch) {
                currentEducation.year = dateMatch[1].trim();
                currentEducation.degree = line.replace(/\([^)]*\)/g, '').trim();
              } else {
                currentEducation.degree = line;
              }
            } else if (line.match(/(CGPA|GPA|Percentage|Percent)/i)) {
              const percentMatch = line.match(/([\d.]+)\s*%/);
              const cgpaMatch = line.match(/([\d.]+)\s*CGPA/i);
              if (percentMatch) {
                currentEducation.grade = `${percentMatch[1]}%`;
              } else if (cgpaMatch) {
                currentEducation.grade = `${cgpaMatch[1]} CGPA`;
              } else {
                currentEducation.grade = line;
              }
            } else if (line.match(/[A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4}/) || 
                       line.match(/\d{4}\s*[–\-]\s*\d{4}/) ||
                       line.match(/[A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4}/i)) {
              const dateLine = line.replace(/([A-Z][a-z]+)(\d{4})/g, '$1 $2').trim();
              if (!currentEducation.year) {
                currentEducation.year = dateLine;
              }
            } else if (line.match(/^[A-Z][a-z]+\s+\d{4}\s*[–\-]\s*[A-Z][a-z]+\s+\d{4}$/i)) {
              if (!currentEducation.year) {
                currentEducation.year = line;
              }
            } else if (!currentEducation.institution && line.length > 3 && line.length < 100 && 
                       !line.includes('•') && !line.includes('|') && !isHeaderLine(line) &&
                       !line.match(/^\d+[rdthnd]+/i)) {
              if (!line.match(/(CGPA|GPA|Percentage|Percent|\d{4})/i) && 
                  (line.includes('College') || line.includes('University') || 
                   line.includes('School') || line.includes('Institute') ||
                   line.includes('Polytechnic') || line.includes('Academy'))) {
                currentEducation.institution = line;
              }
            }
          }
          break;

        case 'projects':
          const projectWithDateMatch = line.match(/^"(.+?)"\s*\(([A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4}|[A-Z][a-z]+\s*\d{4}\s*[–\-]\s*[A-Z][a-z]+\s*\d{4})\)/i);
          if (projectWithDateMatch) {
            if (currentProject) {
              resumeData.projects.push(currentProject);
            }
            currentProject = {
              name: `${projectWithDateMatch[1].trim()} (${projectWithDateMatch[2].trim()})`,
              technologies: [],
              description: [],
              links: []
            };
            continue;
          }
          
          if (line.length > 2 && !line.startsWith('•') && !line.startsWith('-')) {
            if (line.includes('|') || (!isHeaderLine(line) && line.length < 300 && !line.includes('@') && !line.includes('http') && !line.startsWith('-'))) {
              if (line.includes('|')) {
                if (currentProject) {
                  resumeData.projects.push(currentProject);
                }
                
                const parts = line.split('|').map(p => p.trim());
                const projectName = parts[0] || '';
                let technologies = [];
                
                for (let j = 1; j < parts.length; j++) {
                  const part = parts[j];
                  if (part.toLowerCase().includes('live-link') || 
                      part.toLowerCase().includes('github-link') ||
                      part.match(/\d+\+\s*(active|users)/i)) {
                    continue;
                  }
                  if (part.toLowerCase().includes('stack') || 
                      part.includes(',') || 
                      part.match(/(api|js|react|node|mongo|express|sql|websocket|socket)/i)) {
                    technologies = part.split(',').map(t => filterUnwantedContent(t.trim())).filter(t => t && t.length > 0 && !t.toLowerCase().includes('link'));
                    break;
                  }
                }
                
                // Extract URLs from project name or parts with IDs
                const projectLinks = [];
                const urlInParts = parts.join(' ').match(/https?:\/\/[^\s\)]+/gi);
                if (urlInParts) {
                  urlInParts.forEach((url, idx) => {
                    const cleanUrl = url.trim().replace(/[.,;:!?]+$/, '');
                    if (cleanUrl) {
                      projectLinks.push({
                        id: `proj_name_${projectName.replace(/\s+/g, '_')}_${idx}_${Date.now()}`,
                        uri: cleanUrl,
                        source: 'project_name'
                      });
                    }
                  });
                }
                
                currentProject = {
                  name: projectName.trim(),
                  technologies: technologies,
                  description: [],
                  links: projectLinks
                };
              } else {
                if (currentProject) {
                  resumeData.projects.push(currentProject);
                }
                if (!line.startsWith('-')) {
                  const quotedMatch = line.match(/^"(.+?)"/);
                  // Extract URLs from line with IDs
                  const lineLinks = [];
                  const urlInLine = line.match(/https?:\/\/[^\s\)]+/gi);
                  if (urlInLine) {
                    urlInLine.forEach((url, idx) => {
                      const cleanUrl = url.trim().replace(/[.,;:!?]+$/, '');
                      if (cleanUrl) {
                        const projectNameForId = quotedMatch ? quotedMatch[1].trim() : line.trim();
                        lineLinks.push({
                          id: `proj_init_${projectNameForId.replace(/\s+/g, '_')}_${idx}_${Date.now()}`,
                          uri: cleanUrl,
                          source: 'project_initialization'
                        });
                      }
                    });
                  }
                  
                  if (quotedMatch) {
                    currentProject = {
                      name: quotedMatch[1].trim(),
                      technologies: [],
                      description: [],
                      links: lineLinks
                    };
                  } else {
                    currentProject = {
                      name: line.trim(),
                      technologies: [],
                      description: [],
                      links: lineLinks
                    };
                  }
                }
              }
            }
          } else if (currentProject) {
            const isBulletPoint = line.startsWith('•') || 
                                 (line.startsWith('-') && !line.match(/^-\s*[A-Z]/)) ||
                                 line.startsWith('*') ||
                                 (line.match(/^\d+\./) && line.length > 10) ||
                                 (line.length > 20 && line.length < 200 && !isHeaderLine(line) && 
                                  !line.includes('|') && !line.includes('@') && 
                                  !line.match(/^\d{4}/) && !line.match(/^[A-Z][a-z]+\s+\d{4}/) &&
                                  !line.toUpperCase().includes('STACK') && !line.toUpperCase().includes('TECHNOLOGIES'));
            
            if (isBulletPoint) {
              const description = filterUnwantedContent(line.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim());
              if (description && description.length > 0) {
                currentProject.description.push(description);
                
                // Extract URLs from description with IDs
                const urlMatch = description.match(/https?:\/\/[^\s\)]+/gi);
                if (urlMatch) {
                  urlMatch.forEach((url, idx) => {
                    const cleanUrl = url.trim().replace(/[.,;:!?]+$/, '');
                    if (cleanUrl) {
                      const existingLink = currentProject.links.find(l => {
                        const existingUri = typeof l === 'string' ? l : l.uri;
                        return existingUri === cleanUrl;
                      });
                      
                      if (!existingLink) {
                        currentProject.links.push({
                          id: `proj_desc_${currentProject.name.replace(/\s+/g, '_')}_${idx}_${Date.now()}`,
                          uri: cleanUrl,
                          source: 'project_description'
                        });
                      }
                    }
                  });
                }
              }
            } else if (line.match(/https?:\/\/[^\s\)]+/gi)) {
              // If line contains URL and we're in a project, add it
              const urlMatch = line.match(/https?:\/\/[^\s\)]+/gi);
              if (urlMatch) {
                urlMatch.forEach((url, idx) => {
                  const cleanUrl = url.trim().replace(/[.,;:!?]+$/, '');
                  if (cleanUrl) {
                    const existingLink = currentProject.links.find(l => {
                      const existingUri = typeof l === 'string' ? l : l.uri;
                      return existingUri === cleanUrl;
                    });
                    
                    if (!existingLink) {
                      currentProject.links.push({
                        id: `proj_line_${currentProject.name.replace(/\s+/g, '_')}_${idx}_${Date.now()}`,
                        uri: cleanUrl,
                        source: 'project_line'
                      });
                    }
                  }
                });
              }
            }
          }
          break;
      
        case 'extracurricular':
          if (line.includes(':') || line.startsWith('-') || line.match(/^\d+[rdthnd]+\s+Year/i)) {
            let year = '';
            let title = '';
            let description = '';
            
            if (line.includes(':')) {
              const colonIndex = line.indexOf(':');
              const beforeColon = line.substring(0, colonIndex).trim();
              const afterColon = line.substring(colonIndex + 1).trim();
              
              const yearMatch = beforeColon.match(/(\d+[rdthnd]+)\s+Year/i);
              if (yearMatch) {
                year = yearMatch[1];
              }
              
              if (afterColon.startsWith('-')) {
                const dashIndex = afterColon.indexOf('-');
                title = afterColon.substring(dashIndex + 1).trim();
              } else {
                title = afterColon;
              }
            } else if (line.startsWith('-')) {
              title = line.substring(1).trim();
            } else {
              title = line;
            }
            
            let fullDescription = '';
            let j = i + 1;
            while (j < lines.length && (lines[j].trim().startsWith('•') || lines[j].trim().startsWith('-') || 
                   (!isHeaderLine(lines[j].trim()) && lines[j].trim().length > 0 && !lines[j].trim().match(/^\d+[rdthnd]+/i)))) {
              const descLine = lines[j].trim().replace(/^[•\-]\s*/, '');
              if (descLine.toLowerCase().includes('skill')) {
                const skillsMatch = descLine.match(/[Ss]kills?:\s*(.+)/i);
                if (skillsMatch) {
                  fullDescription += (fullDescription ? ' ' : '') + `Skills: ${skillsMatch[1]}`;
                }
              } else if (descLine.length > 0) {
                fullDescription += (fullDescription ? ' ' : '') + descLine;
              }
              j++;
            }
            
            resumeData.extracurricular.push({
              year: year,
              title: title.trim(),
              description: fullDescription.trim()
            });
            
            if (j > i + 1) {
              i = j - 1;
            }
          }
          break;

        case 'responsibility':
          if (line.startsWith('-') || line.includes(':')) {
            const content = line.startsWith('-') ? line.substring(1).trim() : line.trim();
            let title = '';
            let organization = '';
            let description = '';
            
            const dashMatch = content.match(/^(.+?)[–-]\s*(.+)$/);
            const colonMatch = content.match(/^(.+?):\s*(.+)$/);
            
            if (dashMatch) {
              const beforeDash = dashMatch[1].trim();
              description = dashMatch[2].trim();
              
              if (beforeDash.includes(',')) {
                const parts = beforeDash.split(',').map(p => p.trim());
                title = parts[0] || '';
                organization = parts.slice(1).join(', ') || '';
              } else {
                title = beforeDash;
              }
            } else if (colonMatch) {
              const beforeColon = colonMatch[1].trim();
              description = colonMatch[2].trim();
              
              if (beforeColon.includes(',')) {
                const parts = beforeColon.split(',').map(p => p.trim());
                title = parts[0] || '';
                organization = parts.slice(1).join(', ') || '';
              } else {
                title = beforeColon;
              }
            } else {
              if (content.includes(',')) {
                const parts = content.split(',').map(p => p.trim());
                title = parts[0] || '';
                organization = parts.slice(1).join(', ') || '';
              } else {
                title = content;
              }
            }
            
            let fullDescription = description;
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim();
              if (!nextLine.startsWith('-') && !isHeaderLine(nextLine) && nextLine.length > 0 && !nextLine.includes(':')) {
                fullDescription += ' ' + nextLine;
                i++;
              }
            }
            
            resumeData.responsibilities.push({
              title: title.trim(),
              organization: organization.trim(),
              description: fullDescription.trim()
            });
          }
          break;

        case 'certifications':
          if (line.length > 5 && line.length < 80) {
            resumeData.certifications.push(line);
          }
          break;
      }
    }

    // Push any remaining entries
    if (currentExperience) resumeData.experience.push(currentExperience);
    if (currentProject) resumeData.projects.push(currentProject);
    if (currentEducation) resumeData.education.push(currentEducation);

    resumeData.projects = resumeData.projects.filter(project => {
      return project && project.name && project.name.trim().length > 0;
    });
    
    const seenProjects = new Set();
    resumeData.projects = resumeData.projects.filter(project => {
      const name = project.name.trim();
      if (seenProjects.has(name)) {
        return false;
      }
      seenProjects.add(name);
      return true;
    });

    // Process and match links
    const uniqueLinks = processLinks(resumeText, extractedLinks);
    resumeData.projects = matchLinksToProjects(uniqueLinks, resumeData.projects);
    resumeData.contact = matchContactLinks(uniqueLinks, resumeData.contact);

    // Ensure arrays are valid
    resumeData.experience = Array.isArray(resumeData.experience) ? resumeData.experience : [];
    resumeData.education = Array.isArray(resumeData.education) ? resumeData.education : [];
    resumeData.projects = Array.isArray(resumeData.projects) ? resumeData.projects : [];
    resumeData.skills = Array.isArray(resumeData.skills) ? resumeData.skills : [];
    resumeData.technologies = Array.isArray(resumeData.technologies) ? resumeData.technologies : [];
    resumeData.softSkills = Array.isArray(resumeData.softSkills) ? resumeData.softSkills : [];
    resumeData.languages = Array.isArray(resumeData.languages) ? resumeData.languages : [];
    resumeData.certifications = Array.isArray(resumeData.certifications) ? resumeData.certifications : [];
    resumeData.responsibilities = Array.isArray(resumeData.responsibilities) ? resumeData.responsibilities : [];
    resumeData.extracurricular = Array.isArray(resumeData.extracurricular) ? resumeData.extracurricular : [];

    // Validate experience entries
    resumeData.experience = resumeData.experience.map(exp => ({
      title: exp?.title || '',
      company: exp?.company || '',
      duration: exp?.duration || '',
      description: Array.isArray(exp?.description) ? exp.description : []
    }));

    // Validate education entries
    resumeData.education = resumeData.education.map(edu => ({
      institution: edu?.institution || '',
      location: edu?.location || '',
      degree: edu?.degree || '',
      year: edu?.year || '',
      grade: edu?.grade || ''
    }));

    // Validate project entries - ensure links are objects with IDs
    resumeData.projects = resumeData.projects.map(proj => ({
      name: proj?.name || '',
      technologies: Array.isArray(proj?.technologies) ? proj.technologies : [],
      description: Array.isArray(proj?.description) ? proj.description : [],
      links: Array.isArray(proj?.links) ? proj.links.map(link => {
        // Convert string links to objects with IDs
        if (typeof link === 'string') {
          return {
            id: `validated_${Date.now()}_${Math.random()}`,
            uri: link,
            source: 'validated_string'
          };
        }
        // Ensure link objects have required fields
        return {
          id: link.id || `validated_${Date.now()}_${Math.random()}`,
          uri: link.uri || link,
          source: link.source || 'validated'
        };
      }) : []
    }));

    return resumeData;
  } catch (error) {
    console.error('Error parsing resume data:', error);
    return getEmptyResumeData();
  }
}

