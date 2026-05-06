import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';
const PDFDocument = (await import('pdfkit')).default;
import { model } from "../index.js"
import { resumePrompt } from '../utils/prompt.js';


export async function extractTextFromPDF(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('PDF file does not exist: ' + filePath);
  }

  try {
    const text = await extractWithPdf2Json(filePath);
    if (text && text.trim().length > 50) {
      return text;
    }
  } catch (error) {}
  try {
    const text = await extractWithPdfParse(filePath);
    return text;
  } catch (error) {
    throw new Error('Both PDF extraction methods failed. pdf-parse error: ' + error.message);
  }
}

async function extractWithPdf2Json(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    
    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error('PDF parsing error: ' + errData.parserError));
    });
    
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let fullText = '';
        const totalPages = pdfData.Pages?.length || 0;
        
        if (totalPages === 0) {
          reject(new Error('No pages found in PDF'));
          return;
        }
        
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          const page = pdfData.Pages[pageIndex];
          
          if (page.Texts && page.Texts.length > 0) {
            const lines = {};
            const lineThreshold = 0.5;
            
            page.Texts.forEach((textObj) => {
              if (textObj.R && textObj.R.length > 0) {
                let text = '';
                textObj.R.forEach((run) => {
                  if (run.T) {
                    try {
                      text += decodeURIComponent(run.T);
                    } catch (e) {
                      text += run.T;
                    }
                  }
                });
                
                text = text.replace(/\s+/g, ' ').trim();
                if (!text) return;
                
                const y = Math.round(textObj.y * 100) / 100;
                const x = textObj.x || 0;
                let lineKey = y.toString();
                for (const existingY of Object.keys(lines)) {
                  if (Math.abs(parseFloat(existingY) - y) < lineThreshold) {
                    lineKey = existingY;
                    break;
                  }
                }
                
                if (!lines[lineKey]) {
                  lines[lineKey] = [];
                }
                
                lines[lineKey].push({
                  x: x,
                  text: text,
                  fontSize: textObj.R[0].TS?.[1] || 12,
                  isBold: textObj.R[0].TS?.[2] === 1
                });
              }
            });
            
            const sortedLineKeys = Object.keys(lines).sort((a, b) => parseFloat(a) - parseFloat(b));
            
            sortedLineKeys.forEach((lineKey) => {
              const lineTexts = lines[lineKey];
              lineTexts.sort((a, b) => a.x - b.x);
              
              let lineContent = '';
              let prevX = -1;
              let prevWidth = 0;
              
              lineTexts.forEach((textItem) => {
                const { text, x } = textItem;
                
                if (prevX !== -1) {
                  const xDiff = x - (prevX + prevWidth);
                  if (xDiff > 4) {
                    lineContent += '    ';
                  } else if (xDiff > 1.5) {
                    lineContent += ' ';
                  } else if (xDiff > 0.3) {
                    lineContent += ' ';
                  } else if (xDiff > 0.05) {
                    lineContent += ' ';
                  }
                }
                
                lineContent += text;
                const charWidth = (textItem.fontSize / 12) * 0.6;
                const estimatedWidth = text.length * charWidth;
                prevX = x;
                prevWidth = estimatedWidth;
              });
              
              const trimmedLine = lineContent.trim();
              if (trimmedLine) {
                fullText += trimmedLine + '\n';
              }
            });
            
            if (pageIndex < totalPages - 1) {
              fullText += '\n';
            }
          }
        }

        const processedText = processExtractedText(fullText);
        resolve(processedText);
      } catch (error) {
        reject(new Error('Failed to process PDF data: ' + error.message));
      }
    });
    
    pdfParser.loadPDF(filePath);
  });
}

async function extractWithPdfParse(filePath) {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const processedText = processExtractedText(data.text);
    return processedText;
  } catch (error) {
    throw new Error('pdf-parse extraction failed: ' + error.message);
  }
}

function processExtractedText(rawText) {
  let text = rawText;
  text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
  text = text.replace(/(PROFESSIONAL)(SUMMARY)/gi, '$1 $2');
  text = text.replace(/(TECHNICAL)(SKILLS)/gi, '$1 $2');
  text = text.replace(/(WORK)(EXPERIENCE)/gi, '$1 $2');
  text = text.replace(/(PROFESSIONAL)(EXPERIENCE)/gi, '$1 $2');
  text = text.replace(/(POSITION)(OF)(RESPONSIBILITY)/gi, '$1 $2 $3');
  text = text.replace(/([a-zA-Z])(\()/g, '$1 $2');
  text = text.replace(/,(?=[^\s])/g, ', ');
  text = text.replace(/\|/g, ' | ');
  
  const lines = text.split('\n');
  let processedText = '';
  let previousWasHeader = false;
  let previousLine = '';

  for (let i = 0; i < lines.length; i++) {
    let currentLine = lines[i].trim();
    
    if (!currentLine) {
      if (previousLine) {
        processedText += '\n';
        previousLine = '';
      }
      continue;
    }
    
    if (isHeaderLine(currentLine)) {
      if (processedText.length > 0 && !previousWasHeader) {
        processedText += '\n';
      }
      processedText += currentLine + '\n';
      previousWasHeader = true;
      previousLine = currentLine;
    } else {
      processedText += currentLine + '\n';
      previousWasHeader = false;
      previousLine = currentLine;
    }
  }

  processedText = processedText.replace(/\n{3,}/g, '\n\n');
  return processedText.trim();
}

const isHeaderLine = (line) => {
  const headerPatterns = [
    /^PROFESSIONAL\s+SUMMARY$/i,
    /^SUMMARY$/i,
    /^TECHNICAL\s+SKILLS$/i,
    /^SKILLS$/i,
    /^EDUCATION$/i,
    /^EXPERIENCE$/i,
    /^WORK\s+EXPERIENCE$/i,
    /^PROFESSIONAL\s+EXPERIENCE$/i,
    /^PROJECTS$/i,
    /^POSITION\s+OF\s+RESPONSIBILITY$/i,
    /^CERTIFICATIONS?$/i,
    /^ACHIEVEMENTS?$/i,
    /^AWARDS?$/i,
    /^LANGUAGES?$/i,
    /^INTERESTS?$/i,
    /^REFERENCES?$/i
  ];
  
  return headerPatterns.some(pattern => pattern.test(line.trim()));
};


async function generateTailoredResume(resumeText, jobDescription) {
  try {
    const prompt = resumePrompt(resumeText, jobDescription);
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    throw new Error('Failed to generate tailored resume: ' + error.message);
  }
}

function filterUnwantedContent(text) {
  if (!text) return text;
  
  let filtered = text.replace(/Cloudinary\s*,\s*and\s+state\s+management\s+using\s+Redux/gi, '');
  filtered = filtered.replace(/Cloudinary\s*,\s*state\s+management\s+using\s+Redux/gi, '');
  filtered = filtered.replace(/Cloudinary/gi, '');
  filtered = filtered.replace(/state\s+management\s+using\s+Redux/gi, '');
  filtered = filtered.replace(/,\s*state\s+management\s+using\s+Redux/gi, '');
  filtered = filtered.replace(/state\s+management\s+using\s+Redux\s*,/gi, '');
  filtered = filtered.replace(/,\s*,/g, ',');
  filtered = filtered.replace(/^\s*,\s*|\s*,\s*$/g, '');
  filtered = filtered.replace(/\s+/g, ' ').trim();
  
  return filtered;
}

function parseResumeData(resumeText) {
  const lines = resumeText.split('\n').filter(line => line.trim());
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
    experience: [],
    education: [],
    projects: [],
    responsibilities: [],
    certifications: []
  };

  let currentSection = '';
  let currentExperience = null;
  let currentEducation = null;
  let currentProject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const upperLine = line.toUpperCase();

    if (!line) continue;

    if (!resumeData.name && i < 5 && line.length > 2 && line.length < 50 && 
        !line.includes('@') && !line.includes('http') && !line.match(/^\+?\d/) && !line.includes('(')) {
      resumeData.name = line;
      continue;
    }

    if ((line.includes('@') || line.includes('|') || line.match(/\(\+\d+\)/)) && !currentSection) {
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        
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
    
    if (!resumeData.contact.location && line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+/) && !line.includes('http') && !line.includes('@') && !line.includes('|')) {
      resumeData.contact.location = line;
      continue;
    }

    const normalizedLine = upperLine.replace(/\s+/g, ' ').trim();
    
    if (normalizedLine === 'PROFESSIONAL SUMMARY' || 
        (normalizedLine.includes('PROFESSIONAL') && normalizedLine.includes('SUMMARY') && !normalizedLine.includes('EXPERIENCE'))) {
      currentSection = 'summary';
      continue;
    } else if (normalizedLine === 'TECHNICAL SKILLS' || 
               (normalizedLine.includes('TECHNICAL') && normalizedLine.includes('SKILLS'))) {
      currentSection = 'skills';
      continue;
    } else if (normalizedLine === 'EXPERIENCE' || 
               normalizedLine.startsWith('EXPERIENCE') ||
               normalizedLine === 'WORK EXPERIENCE' || 
               normalizedLine === 'PROFESSIONAL EXPERIENCE' ||
               normalizedLine.startsWith('EXPERIENCE (INTERNSHIPS)')) {
      currentSection = 'experience';
      continue;
    } else if (normalizedLine === 'EDUCATION') {
      currentSection = 'education';
      continue;
    } else if (normalizedLine === 'PROJECTS') {
      currentSection = 'projects';
      continue;
    } else if (normalizedLine === 'POSITION OF RESPONSIBILITY' || 
               normalizedLine.includes('POSITION') && normalizedLine.includes('RESPONSIBILITY')) {
      currentSection = 'responsibility';
      continue;
    } else if (normalizedLine.includes('CERTIFICATION')) {
      currentSection = 'certifications';
      continue;
    }

    switch (currentSection) {
      case 'summary':
        if (line.length > 20 && !upperLine.includes('TECHNICAL') && !upperLine.includes('SKILLS') && !upperLine.includes('EDUCATION')) {
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
            
            const items = filteredContent.split(',').map(s => filterUnwantedContent(s.trim())).filter(s => s && s.length > 0);
            
            if (category.toLowerCase().includes('language')) {
              resumeData.skills.push(...items);
            } else if (category.toLowerCase().includes('frontend')) {
              resumeData.technologies.push(...items);
            } else if (category.toLowerCase().includes('backend')) {
              resumeData.technologies.push(...items);
            } else if (category.toLowerCase().includes('cloud')) {
              resumeData.technologies.push(...items);
            } else if (category.toLowerCase().includes('testing')) {
              resumeData.skills.push(...items);
            } else if (category.toLowerCase().includes('dev tool') || category.toLowerCase().includes('developer tool')) {
              resumeData.skills.push(...items);
            } else if (category.toLowerCase().includes('other')) {
              resumeData.technologies.push(...items);
            } else {
              resumeData.technologies.push(...items);
            }
          }
        }
        else if (!upperLine.includes('EDUCATION') && !upperLine.includes('EXPERIENCE') && 
                !upperLine.includes('PROJECTS') && !line.includes('Government') &&
                line.length < 100 && !line.includes('•') && !line.includes('|')) {
          if (line.length > 2 && line.length < 80) {
            const filteredLine = filterUnwantedContent(line);
            if (filteredLine && filteredLine.length > 0) {
              resumeData.skills.push(filteredLine);
            }
          }
        }
        break;

      case 'experience':
        if (line.length > 5 && line.length < 200 && !line.startsWith('•') && !line.startsWith('-') && !line.match(/^\d+%/)) {
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
              /\(([A-Z][a-z]+\s*\d{4}\s*[–-]\s*[A-Z][a-z]+\s*\d{4})\)/,
              /([A-Z][a-z]+\s+\d{4}\s*[–-]\s*[A-Z][a-z]+\s+\d{4})/,
              /([A-Z][a-z]+\s*\d{4}\s*[–-]\s*[A-Z][a-z]+\s*\d{4})/
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
        } else if (currentExperience && (line.startsWith('•') || line.startsWith('-'))) {
          const description = filterUnwantedContent(line.replace(/^[•\-]\s*/, '').trim());
          if (description && description.length > 0) {
            currentExperience.description.push(description);
          }
        }
        break;

      case 'education':
        if (line.length > 10 && (line.includes('College') || line.includes('University') || 
            line.includes('School') || line.includes('Institute') || 
            line.includes('Government') || line.match(/[A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z][a-z]+/))) {
          
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
            degree: '',
            year: '',
            grade: ''
          };
        } else if (currentEducation) {
          if (line.includes('B. Tech') || line.includes('Bachelor') || line.includes('B.Tech') || line.includes('Tech')) {
            const cgpaMatch = line.match(/([\d.]+)\s*CGPA/i);
            if (cgpaMatch) {
              currentEducation.grade = `${cgpaMatch[1]} CGPA`;
              currentEducation.degree = line.replace(/\s*[\d.]+\s*CGPA.*/i, '').trim();
            } else {
              currentEducation.degree = line;
            }
            currentEducation.degree = currentEducation.degree.replace(/([a-z])([A-Z])/g, '$1 $2');
          } else if (line.includes('Diploma') || line.includes('SSC')) {
            currentEducation.degree = line;
          } else if (line.includes('CGPA') || line.includes('GPA')) {
            currentEducation.grade = line;
          } else if (line.match(/[A-Z][a-z]+\s*\d{4}\s*[–-]\s*[A-Z][a-z]+\s*\d{4}/) || 
                     line.match(/\d{4}\s*[–-]\s*\d{4}/)) {
            currentEducation.year = line.replace(/([A-Z][a-z]+)(\d{4})/g, '$1 $2').trim();
          }
        }
        break;

      case 'projects':
        if (line.length > 2 && !line.startsWith('•') && !line.startsWith('-')) {
          if (line.includes('|') || (!isHeaderLine(line) && line.length < 100 && !line.includes('@') && !line.includes('http') && !line.startsWith('-'))) {
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
              
              currentProject = {
                name: projectName.trim(),
                technologies: technologies,
                description: [],
                links: []
              };
            } else {
              if (currentProject) {
                resumeData.projects.push(currentProject);
              }
              if (!line.startsWith('-')) {
                currentProject = {
                  name: line.trim(),
                  technologies: [],
                  description: [],
                  links: []
                };
              }
            }
          }
        } else if (currentProject && (line.startsWith('•') || (line.startsWith('-') && !line.match(/^-\s*[A-Z]/)))) {
          const description = filterUnwantedContent(line.replace(/^[•\-]\s*/, '').trim());
          if (description && description.length > 0) {
            currentProject.description.push(description);
          }
        }
        break;
      
      case 'responsibility':
        if (line.startsWith('-') && line.length > 10) {
          const content = line.substring(1).trim();
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
            if (!nextLine.startsWith('-') && !isHeaderLine(nextLine) && nextLine.length > 0) {
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

  return resumeData;
  function extractEmail(line) {
    const emailMatch = line.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : '';
  }

  function extractPhone(line) {
    const phoneMatch = line.match(/\(\+\d+\)\s*\d+|\+\d{1,3}\s*\d{10}/);
    return phoneMatch ? phoneMatch[0] : '';
  }

  function extractLinkedIn(line) {
    const linkedinMatch = line.match(/https?:\/\/.*linkedin\.com\/[^\s]*/);
    return linkedinMatch ? linkedinMatch[0] : '';
  }

  function extractGitHub(line) {
    const githubMatch = line.match(/https?:\/\/.*github\.com\/[^\s]*/);
    return githubMatch ? githubMatch[0] : '';
  }
}


async function createATSFriendlyPDF(resumeData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftColumnWidth = pageWidth * 0.35;
      const rightColumnWidth = pageWidth * 0.62;
      const columnGap = pageWidth * 0.03;
      
      let leftY = doc.page.margins.top;
      let rightY = doc.page.margins.top;

      const primaryColor = '#2563eb';
      const textColor = '#1f2937';
      const lightGray = '#6b7280';
      if (resumeData.name) {
        doc.fontSize(20).font('Helvetica-Bold').fillColor(textColor)
           .text(resumeData.name, doc.page.margins.left, leftY, {
             width: pageWidth,
             align: 'left',
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(resumeData.name, { width: pageWidth }) + 8;
        rightY = leftY;
      }

      if (resumeData.title) {
        doc.fontSize(14).font('Helvetica').fillColor(primaryColor)
           .text(resumeData.title, doc.page.margins.left, leftY, {
             width: pageWidth,
             align: 'left',
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(resumeData.title, { width: pageWidth }) + 8;
        rightY = leftY;
      }

      let contactInfo = [];
      if (resumeData.contact.phone) contactInfo.push(resumeData.contact.phone);
      if (resumeData.contact.email) contactInfo.push(resumeData.contact.email);
      if (resumeData.contact.linkedin) contactInfo.push(resumeData.contact.linkedin);
      if (resumeData.contact.location) contactInfo.push(resumeData.contact.location);

      if (contactInfo.length > 0) {
        const contactText = contactInfo.join(' | ');
        doc.fontSize(10).font('Helvetica').fillColor(lightGray)
           .text(contactText, doc.page.margins.left, leftY, {
             width: pageWidth,
             align: 'left',
             ellipsis: true,
             lineGap: 2
           });
        leftY += doc.heightOfString(contactText, { width: pageWidth }) + 5;
        rightY = leftY;
      }

      doc.strokeColor('#e5e7eb').lineWidth(1)
         .moveTo(doc.page.margins.left, leftY)
         .lineTo(doc.page.width - doc.page.margins.right, leftY)
         .stroke();
      leftY += 15;
      rightY += 15;

      const leftColumnX = doc.page.margins.left;
      if (resumeData.summary) {
        leftY = addSectionHeader(doc, 'SUMMARY', leftColumnX, leftY, primaryColor);
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(resumeData.summary, leftColumnX, leftY, { 
             width: leftColumnWidth, 
             align: 'left',
             lineGap: 3,
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(resumeData.summary, { width: leftColumnWidth, lineGap: 3 }) + 20;
      }
      if (resumeData.skills.length > 0) {
        leftY = addSectionHeader(doc, 'SKILLS', leftColumnX, leftY, primaryColor);
        const skillsText = resumeData.skills.join(' • ');
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(skillsText, leftColumnX, leftY, { 
             width: leftColumnWidth,
             align: 'left',
             lineGap: 3,
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(skillsText, { width: leftColumnWidth, lineGap: 3 }) + 20;
      }
      if (resumeData.technologies.length > 0) {
        leftY = addSectionHeader(doc, 'TECHNOLOGIES', leftColumnX, leftY, primaryColor);
        const techText = resumeData.technologies.join(' • ');
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(techText, leftColumnX, leftY, { 
             width: leftColumnWidth,
             align: 'left',
             lineGap: 3,
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(techText, { width: leftColumnWidth, lineGap: 3 }) + 20;
      }
      if (resumeData.certifications.length > 0) {
        leftY = addSectionHeader(doc, 'CERTIFICATIONS', leftColumnX, leftY, primaryColor);
        resumeData.certifications.forEach(cert => {
          doc.fontSize(10).font('Helvetica').fillColor(textColor)
             .text(`• ${cert}`, leftColumnX, leftY, { 
               width: leftColumnWidth,
               align: 'left',
               lineGap: 2,
               ellipsis: false,
               break: true
             });
          leftY += doc.heightOfString(`• ${cert}`, { width: leftColumnWidth, lineGap: 2 }) + 8;
        });
        leftY += 15;
      }

      const rightColumnX = doc.page.margins.left + leftColumnWidth + columnGap;
      if (resumeData.experience.length > 0) {
        rightY = addSectionHeader(doc, 'EXPERIENCE', rightColumnX, rightY, primaryColor);
        
        resumeData.experience.forEach((exp, index) => {
          doc.fontSize(12).font('Helvetica-Bold').fillColor(textColor)
             .text(exp.title, rightColumnX, rightY, { 
               width: rightColumnWidth,
               align: 'left',
               ellipsis: false,
               break: true
             });
          rightY += doc.heightOfString(exp.title, { width: rightColumnWidth }) + 5;

          let companyDuration = '';
          if (exp.company && exp.duration) {
            companyDuration = `${exp.company} | ${exp.duration}`;
          } else if (exp.company) {
            companyDuration = exp.company;
          } else if (exp.duration) {
            companyDuration = exp.duration;
          }

          if (companyDuration) {
            doc.fontSize(10).font('Helvetica').fillColor(primaryColor)
               .text(companyDuration, rightColumnX, rightY, { 
                 width: rightColumnWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            rightY += doc.heightOfString(companyDuration, { width: rightColumnWidth }) + 8;
          }

          if (exp.description && exp.description.length > 0) {
            exp.description.forEach(desc => {
              const cleanDesc = desc.trim();
              if (cleanDesc) {
                doc.fontSize(10).font('Helvetica').fillColor(textColor)
                   .text(`• ${cleanDesc}`, rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     lineGap: 3,
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(`• ${cleanDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;
              }
            });
          }

          rightY += 15;

          if (rightY > doc.page.height - doc.page.margins.bottom - 50) {
            doc.addPage();
            rightY = doc.page.margins.top;
            leftY = doc.page.margins.top;
          }
        });
      }

      if (resumeData.education.length > 0) {
        rightY = addSectionHeader(doc, 'EDUCATION', rightColumnX, rightY, primaryColor);
        
        resumeData.education.forEach(edu => {
          if (edu.degree) {
            doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor)
               .text(edu.degree, rightColumnX, rightY, { 
                 width: rightColumnWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            rightY += doc.heightOfString(edu.degree, { width: rightColumnWidth }) + 5;
          }

          let eduDetails = '';
          if (edu.institution && edu.year) {
            eduDetails = `${edu.institution} | ${edu.year}`;
          } else if (edu.institution) {
            eduDetails = edu.institution;
          } else if (edu.year) {
            eduDetails = edu.year;
          }

          if (eduDetails) {
            doc.fontSize(10).font('Helvetica').fillColor(primaryColor)
               .text(eduDetails, rightColumnX, rightY, { 
                 width: rightColumnWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            rightY += doc.heightOfString(eduDetails, { width: rightColumnWidth }) + 12;
          }
        });
        rightY += 10;
      }

      if (resumeData.projects.length > 0) {
        rightY = addSectionHeader(doc, 'PROJECTS', rightColumnX, rightY, primaryColor);
        
        resumeData.projects.forEach(project => {
          if (project.name) {
            doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor)
               .text(project.name, rightColumnX, rightY, { 
                 width: rightColumnWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            rightY += doc.heightOfString(project.name, { width: rightColumnWidth }) + 8;
          }

          if (project.description && project.description.length > 0) {
            project.description.forEach(desc => {
              const cleanDesc = desc.trim();
              if (cleanDesc) {
                doc.fontSize(10).font('Helvetica').fillColor(textColor)
                   .text(`• ${cleanDesc}`, rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     lineGap: 3,
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(`• ${cleanDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;
              }
            });
          }
          rightY += 15;
        });
      }

      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}


function addSectionHeader(doc, title, x, y, color) {
  doc.fontSize(12).font('Helvetica-Bold').fillColor(color)
     .text(title, x, y);
  
  const titleWidth = doc.widthOfString(title);
  doc.strokeColor(color).lineWidth(1)
     .moveTo(x, y + 15)
     .lineTo(x + titleWidth, y + 15)
     .stroke();
  
  return y + 25;
}


export const createNewResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        error: 'Job description not provided in body'
      });
    }

    const resumeFile = req.file;
    if (!resumeFile) {
      return res.status(400).json({
        error: 'Please upload a resume PDF file'
      });
    }

    const resumeText = await extractTextFromPDF(resumeFile?.path);
    
    const tailoredResumeText = await generateTailoredResume(resumeText, jobDescription);
    const resumeData = parseResumeData(tailoredResumeText);

    const outputFileName = `tailored-resume-${Date.now()}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const outputPath = path.join(uploadsDir, outputFileName);

    await createATSFriendlyPDF(resumeData, outputPath);
    fs.unlinkSync(resumeFile?.path);

    return res.json({
      success: true,
      message: 'ATS-friendly resume tailored successfully',
      downloadUrl: `/uploads/${outputFileName}`,
      fileName: outputFileName
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to process resume: ' + error.message
    });
  }
}