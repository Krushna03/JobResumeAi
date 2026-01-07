import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';
const PDFDocument = (await import('pdfkit')).default;
import { model } from "../index.js"
import { resumePrompt, preprocessingPrompt } from '../utils/prompt.js';
import { cleanExtractedText } from '../utils/textCleaner.js';


export async function extractTextFromPDF(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('PDF file does not exist: ' + filePath);
  }

  try {
    const text = await extractWithPdf2Json(filePath);
    console.log('text1>>>>>>>>>>>>>>>>>>>>>>', text);
    console.log('------------------------------------------------------');
    if (text && text.trim().length > 50) {
      return text;
    }
  } catch (error) {
    console.warn('pdf2json extraction failed, trying pdf-parse:', error.message);
  }
  try {
    const text = await extractWithPdfParse(filePath);
    console.log('text2>>>>>>>>>>>>>>>>>>>>>>', text);
    console.log('------------------------------------------------------');
    if (text && text.trim().length > 0) {
      return text;
    }
    throw new Error('Extracted text is empty');
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
                const { text, x, fontSize } = textItem;
                
                if (prevX !== -1) {
                  const xDiff = x - (prevX + prevWidth);
                  // Improved spacing detection based on font size and character width
                  const avgCharWidth = (fontSize / 12) * 0.5;
                  const spaceWidth = avgCharWidth * 0.3;
                  
                  // If gap is larger than expected space, add space
                  if (xDiff > avgCharWidth * 0.8) {
                    // Check if previous text ends with letter and current starts with letter
                    // This might indicate a broken word that should be joined
                    const prevEndsWithLetter = /[a-zA-Z]$/.test(lineContent.trim());
                    const currentStartsWithLetter = /^[a-zA-Z]/.test(text);
                    
                    if (prevEndsWithLetter && currentStartsWithLetter && xDiff < avgCharWidth * 1.5) {
                      // Likely a broken word - join without space
                      lineContent += text;
                    } else if (xDiff > avgCharWidth * 2) {
                      // Large gap - definitely a space
                      lineContent += ' ';
                    } else if (xDiff > spaceWidth) {
                      // Medium gap - likely a space
                      lineContent += ' ';
                    }
                    // Small gaps (< spaceWidth) are likely part of the same word
                  }
                }
                
                lineContent += text;
                const charWidth = (fontSize / 12) * 0.6;
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
  // First apply enhanced text cleaning
  let text = cleanExtractedText(rawText);
  
  // Then apply format-specific fixes
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
};


async function preprocessResumeText(messyText) {
  try {
    // Check if text seems messy (has concatenated words, corrupted patterns, etc.)
    const hasConcatenatedWords = /[a-z][A-Z][a-z]/.test(messyText);
    const hasCorruptedPatterns = /[A-Z]{3,}[a-z]|[a-z]{3,}[A-Z]{2,}/.test(messyText);
    const hasManyDuplicates = (messyText.match(/\n/g) || []).length > 0 && 
                              new Set(messyText.split('\n').slice(0, 20).map(l => l.trim().toLowerCase())).size < 10;
    
    // If text seems relatively clean, skip AI preprocessing
    if (!hasConcatenatedWords && !hasCorruptedPatterns && !hasManyDuplicates) {
      console.log('Text appears clean, skipping AI preprocessing');
      return messyText;
    }
    
    console.log('Text appears messy, applying AI preprocessing...');
    const prompt = preprocessingPrompt(messyText);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const cleanedText = response.text();
    
    console.log('AI preprocessing completed');
    return cleanedText;
  } catch (error) {
    console.warn('AI preprocessing failed, using original text:', error.message);
    // If preprocessing fails, return original text
    return messyText;
  }
}

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
  
  // Only clean up formatting issues, don't remove legitimate content
  // Remove multiple consecutive commas
  let filtered = text.replace(/,\s*,+/g, ',');
  // Remove leading/trailing commas
  filtered = filtered.replace(/^\s*,+\s*|\s*,+\s*$/g, '');
  // Normalize multiple spaces (but preserve newlines)
  filtered = filtered.replace(/[ \t]+/g, ' ').trim();
  
  return filtered;
}

function parseResumeData(resumeText) {
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
      // Check if line looks like a name (has capital letters, not all caps unless short)
      const hasCapital = /[A-Z]/.test(line);
      const isAllCaps = line === line.toUpperCase() && line.length < 30;
      if (hasCapital || isAllCaps) {
        resumeData.name = line;
        continue;
      }
    }

    // Detect title/position (usually appears after name)
    if (!resumeData.title && resumeData.name && i < 10 && line.length > 5 && line.length < 100 &&
        !line.includes('@') && !line.includes('http') && !line.match(/^\+?\d/) &&
        !isHeaderLine(line) && (line.toUpperCase().includes('ENGINEERING') || 
        line.toUpperCase().includes('DEVELOPER') || line.toUpperCase().includes('B.TECH') ||
        line.toUpperCase().includes('BACHELOR') || line.toUpperCase().includes('MASTER'))) {
      resumeData.title = line;
      continue;
    }

    // Improved contact info parsing - handle || separator and various formats
    if ((line.includes('@') || line.includes('|') || line.match(/\(\+\d+\)/) || line.match(/\+\d{10,}/)) && !currentSection) {
      // Handle || separator (double pipe)
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
          // Handle location in contact line
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
    
    // Improved location detection - handle various formats including postal codes
    if (!resumeData.contact.location && 
        (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s*\(\d{6}\))?/) || 
         line.match(/^[A-Z][a-z]+,\s*[A-Z][a-z]+\s*\(\d{6}\)/) ||
         (line.match(/^[A-Z][a-z]+,\s*[A-Z][a-z]+/) && !line.includes('http') && !line.includes('@') && !line.includes('|') && !line.includes('College') && !line.includes('University')))) {
      resumeData.contact.location = line;
      continue;
    }

    const normalizedLine = upperLine.replace(/\s+/g, ' ').trim();
    
    // Enhanced section detection with all variations
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
        // Reduced minimum length requirement and removed maximum length restriction
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
            
            // Split by comma, but also handle semicolon and other separators
            const items = filteredContent.split(/[,;]/).map(s => filterUnwantedContent(s.trim())).filter(s => s && s.length > 0);
            
            const catLower = category.toLowerCase();
            if (catLower.includes('language') && !catLower.includes('programming')) {
              resumeData.skills.push(...items);
            } else if (catLower.includes('frontend')) {
              resumeData.technologies.push(...items);
            } else if (catLower.includes('backend')) {
              resumeData.technologies.push(...items);
            } else if (catLower.includes('cloud')) {
              resumeData.technologies.push(...items);
            } else if (catLower.includes('testing')) {
              resumeData.skills.push(...items);
            } else if (catLower.includes('dev tool') || catLower.includes('developer tool') || catLower.includes('dev tools')) {
              resumeData.skills.push(...items);
            } else if (catLower.includes('other')) {
              resumeData.technologies.push(...items);
            } else {
              // Default to technologies for technical skills
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
        // Parse soft skills (like Adaptability, Teamwork, etc.)
        if (!isHeaderLine(line) && !upperLine.includes('TECHNICAL') && !upperLine.includes('LANGUAGES') &&
            line.length > 2 && line.length < 50 && !line.includes('•') && !line.includes('|') && !line.includes(':')) {
          const filteredLine = filterUnwantedContent(line);
          if (filteredLine && filteredLine.length > 0) {
            resumeData.softSkills.push(filteredLine);
          }
        }
        break;

      case 'languages':
        // Parse languages section - can have proficiency levels
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
        // Parse internship entries - similar to experience but can have different formats
        if (line.length > 5 && line.length < 400 && !line.startsWith('•') && !line.startsWith('-') && !line.match(/^\d+%/)) {
          // Check if this is a new internship entry
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
              
              // Extract duration and company
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
              // Handle format like "Company Name (JAN 2025 - JUNE 2025)"
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
        // Increased maximum length to 400 to capture longer job titles/company names
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
            
            // More flexible date patterns
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
          // More flexible bullet point detection - handle various formats
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
        // Improved education parsing - handle location with dates like "Nagpur, Maharashtra (2022-2025)"
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
        
        // Improved education parsing - handle degree with dates in parentheses
        // Check if line contains degree with dates like "B.Tech in Civil Engineering (2022-2025)"
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
        
        // Check for institution names
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
          // More flexible degree detection
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
            // Extract percentage or CGPA value
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
            // Better date parsing - handle formats like "Nov 2022 - May 2025" or "2022-2025"
            const dateLine = line.replace(/([A-Z][a-z]+)(\d{4})/g, '$1 $2').trim();
            if (!currentEducation.year) {
              currentEducation.year = dateLine;
            }
          } else if (line.match(/^[A-Z][a-z]+\s+\d{4}\s*[–\-]\s*[A-Z][a-z]+\s+\d{4}$/i)) {
            // Handle dates on separate lines like "Nov 2022 - May 2025"
            if (!currentEducation.year) {
              currentEducation.year = line;
            }
          } else if (!currentEducation.institution && line.length > 3 && line.length < 100 && 
                     !line.includes('•') && !line.includes('|') && !isHeaderLine(line) &&
                     !line.match(/^\d+[rdthnd]+/i)) {
            // If we don't have institution yet and line looks like an institution name
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
        // Improved project parsing - handle project names with dates in parentheses
        // Check for project name with dates like "E-WASTE CONCRETE" (JULY 2024 - MAY 2025)
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
        
        // Improved project parsing - handle project names with or without separators
        if (line.length > 2 && !line.startsWith('•') && !line.startsWith('-')) {
          // Increased maximum length to 300 to capture longer project names
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
                // Check if line has quotes (project name in quotes)
                const quotedMatch = line.match(/^"(.+?)"/);
                if (quotedMatch) {
                  currentProject = {
                    name: quotedMatch[1].trim(),
                    technologies: [],
                    description: [],
                    links: []
                  };
                } else {
                  currentProject = {
                    name: line.trim(),
                    technologies: [],
                    description: [],
                    links: []
                  };
                }
              }
            }
          }
        } else if (currentProject) {
          // More flexible bullet point detection - handle various formats
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
            }
          }
        }
        break;
      
      case 'extracurricular':
        // Parse extracurricular activities - format like "3rd Year: - Organizer for Sustainova"
        if (line.includes(':') || line.startsWith('-') || line.match(/^\d+[rdthnd]+\s+Year/i)) {
          let year = '';
          let title = '';
          let description = '';
          
          if (line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const beforeColon = line.substring(0, colonIndex).trim();
            const afterColon = line.substring(colonIndex + 1).trim();
            
            // Extract year if present
            const yearMatch = beforeColon.match(/(\d+[rdthnd]+)\s+Year/i);
            if (yearMatch) {
              year = yearMatch[1];
            }
            
            // Extract title and description
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
          
          // Check next lines for description
          let fullDescription = '';
          let j = i + 1;
          while (j < lines.length && (lines[j].trim().startsWith('•') || lines[j].trim().startsWith('-') || 
                 (!isHeaderLine(lines[j].trim()) && lines[j].trim().length > 0 && !lines[j].trim().match(/^\d+[rdthnd]+/i)))) {
            const descLine = lines[j].trim().replace(/^[•\-]\s*/, '');
            if (descLine.toLowerCase().includes('skill')) {
              // Skills line - extract skills
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
            i = j - 1; // Skip processed lines
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

    // Validate project entries
    resumeData.projects = resumeData.projects.map(proj => ({
      name: proj?.name || '',
      technologies: Array.isArray(proj?.technologies) ? proj.technologies : [],
      description: Array.isArray(proj?.description) ? proj.description : [],
      links: Array.isArray(proj?.links) ? proj.links : []
    }));

    return resumeData;
  } catch (error) {
    console.error('Error parsing resume data:', error);
    // Return empty structure instead of crashing
    return getEmptyResumeData();
  }

  function extractEmail(line) {
    if (!line || typeof line !== 'string') return '';
    try {
      const emailMatch = line.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      return emailMatch ? emailMatch[0] : '';
    } catch (e) {
      return '';
    }
  }

  function extractPhone(line) {
    if (!line || typeof line !== 'string') return '';
    try {
      // More flexible phone patterns - handle formats like "(+91) 7385664978", "+91 7385664978", etc.
      const phonePatterns = [
        /\(\+\d{1,3}\)\s*\d{6,}/,  // (+91) 7385664978
        /\(\+\d{1,3}\)\s*\d{3}\s*\d{3}\s*\d{4}/,  // (+91) 738 566 4978
        /\+\d{1,3}\s*\d{6,}/,  // +91 7385664978
        /\+\d{1,3}\s*\d{3}\s*\d{3}\s*\d{4}/,  // +91 738 566 4978
        /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,  // 738-566-4978
        /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/,  // (738) 566-4978
        /\d{10}/  // 7385664978 (10 digits)
      ];
      for (const pattern of phonePatterns) {
        const match = line.match(pattern);
        if (match) {
          // Clean up the match
          let phone = match[0].trim();
          // Normalize spacing
          phone = phone.replace(/\s+/g, ' ');
          return phone;
        }
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  function extractLinkedIn(line) {
    if (!line || typeof line !== 'string') return '';
    try {
      const linkedinMatch = line.match(/https?:\/\/.*linkedin\.com\/[^\s]*/);
      return linkedinMatch ? linkedinMatch[0] : '';
    } catch (e) {
      return '';
    }
  }

  function extractGitHub(line) {
    if (!line || typeof line !== 'string') return '';
    try {
      const githubMatch = line.match(/https?:\/\/.*github\.com\/[^\s]*/);
      return githubMatch ? githubMatch[0] : '';
    } catch (e) {
      return '';
    }
  }
}

function getEmptyResumeData() {
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


async function createATSFriendlyPDF(resumeData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Validate resumeData
      if (!resumeData || typeof resumeData !== 'object') {
        reject(new Error('Invalid resume data provided'));
        return;
      }

      // Ensure all required fields exist with defaults
      const safeResumeData = {
        name: resumeData.name || 'Resume',
        title: resumeData.title || '',
        contact: resumeData.contact || {},
        summary: resumeData.summary || '',
        skills: Array.isArray(resumeData.skills) ? resumeData.skills : [],
        technologies: Array.isArray(resumeData.technologies) ? resumeData.technologies : [],
        softSkills: Array.isArray(resumeData.softSkills) ? resumeData.softSkills : [],
        languages: Array.isArray(resumeData.languages) ? resumeData.languages : [],
        experience: Array.isArray(resumeData.experience) ? resumeData.experience : [],
        education: Array.isArray(resumeData.education) ? resumeData.education : [],
        projects: Array.isArray(resumeData.projects) ? resumeData.projects : [],
        responsibilities: Array.isArray(resumeData.responsibilities) ? resumeData.responsibilities : [],
        certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications : [],
        extracurricular: Array.isArray(resumeData.extracurricular) ? resumeData.extracurricular : []
      };

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 25, bottom: 200, left: 35, right: 35 }
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftColumnWidth = pageWidth * 0.35;
      const rightColumnWidth = pageWidth * 0.62;
      const columnGap = pageWidth * 0.03;
      
      // Calculate available vertical space for single page
      const pageHeight = doc.page.height;
      const availableHeight = pageHeight - doc.page.margins.top - doc.page.margins.bottom;
      const maxY = pageHeight - doc.page.margins.bottom;
      
      let leftY = doc.page.margins.top;
      let rightY = doc.page.margins.top;
      
      // Helper function to check if we have space and prevent new pages
      const checkSpace = (requiredHeight) => {
        return rightY + requiredHeight <= maxY;
      };
      
      // Limit arrays to fit on one page (increased limits to use more space)
      const limitItems = (items, maxItems) => {
        return items.slice(0, maxItems);
      };

      const primaryColor = '#2563eb';
      const textColor = '#1f2937';
      const lightGray = '#6b7280';
      
      if (safeResumeData.name) {
        try {
          doc.fontSize(20).font('Helvetica-Bold').fillColor(textColor)
             .text(String(safeResumeData.name), doc.page.margins.left, leftY, {
               width: pageWidth,
               align: 'left',
               ellipsis: false,
               break: true
             });
          leftY += doc.heightOfString(String(safeResumeData.name), { width: pageWidth }) + 8;
          rightY = leftY;
        } catch (e) {
          console.warn('Error rendering name:', e);
        }
      }

      if (safeResumeData.title) {
        try {
          doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
             .text(String(safeResumeData.title), doc.page.margins.left, leftY, {
               width: pageWidth,
               align: 'left',
               ellipsis: false,
               break: true
             });
          leftY += doc.heightOfString(String(safeResumeData.title), { width: pageWidth }) + 5;
          rightY = leftY;
        } catch (e) {
          console.warn('Error rendering title:', e);
        }
      }
      
      // Add institution name from first education entry if available
      if (safeResumeData.education && safeResumeData.education.length > 0) {
        const firstEdu = safeResumeData.education[0];
        if (firstEdu && firstEdu.institution) {
          try {
            doc.fontSize(10).font('Helvetica').fillColor(textColor)
               .text(String(firstEdu.institution), doc.page.margins.left, leftY, {
                 width: pageWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(String(firstEdu.institution), { width: pageWidth }) + 8;
            rightY = leftY;
          } catch (e) {
            console.warn('Error rendering institution:', e);
          }
        }
      }

      let contactInfo = [];
      const contact = safeResumeData.contact || {};
      if (contact.phone) contactInfo.push(String(contact.phone));
      if (contact.email) contactInfo.push(String(contact.email));
      if (contact.linkedin) contactInfo.push(String(contact.linkedin));
      if (contact.location) contactInfo.push(String(contact.location));

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
      leftY += 12;
      rightY += 12;

      const leftColumnX = doc.page.margins.left;
      if (safeResumeData.summary) {
        try {
          leftY = addSectionHeader(doc, 'SUMMARY', leftColumnX, leftY, primaryColor);
          doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
             .text(String(safeResumeData.summary), leftColumnX, leftY, { 
               width: leftColumnWidth, 
               align: 'left',
               lineGap: 1.5,
               ellipsis: false,
               break: true
             });
          leftY += doc.heightOfString(String(safeResumeData.summary), { width: leftColumnWidth, lineGap: 1.5 }) + 12;
        } catch (e) {
          console.warn('Error rendering summary:', e);
        }
      }
      if (safeResumeData.skills && safeResumeData.skills.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'SKILLS', leftColumnX, leftY, primaryColor);
          const skillsText = safeResumeData.skills.map(s => String(s || '')).filter(s => s).join(' • ');
          if (skillsText) {
            doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
               .text(skillsText, leftColumnX, leftY, { 
                 width: leftColumnWidth,
                 align: 'left',
                 lineGap: 1.5,
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(skillsText, { width: leftColumnWidth, lineGap: 1.5 }) + 10;
          }
        } catch (e) {
          console.warn('Error rendering skills:', e);
        }
      }
      if (safeResumeData.technologies && safeResumeData.technologies.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'TECHNICAL SKILLS', leftColumnX, leftY, primaryColor);
          // Show ALL technologies - no limit
          // Render technologies in a compact format (comma-separated)
          const techText = safeResumeData.technologies.filter(tech => tech).map(t => String(t)).join(', ');
          if (techText) {
            doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
               .text(techText, leftColumnX, leftY, { 
                 width: leftColumnWidth,
                 align: 'left',
                 lineGap: 1.5,
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(techText, { width: leftColumnWidth, lineGap: 1.5 }) + 10;
          }
        } catch (e) {
          console.warn('Error rendering technologies:', e);
        }
      }
      if (safeResumeData.softSkills && safeResumeData.softSkills.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'SOFT SKILLS', leftColumnX, leftY, primaryColor);
          // Increased limit
          const limitedSkills = limitItems(safeResumeData.softSkills, 8);
          const skillsText = limitedSkills.filter(skill => skill).map(s => String(s)).join(', ');
          if (skillsText) {
            doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
               .text(skillsText, leftColumnX, leftY, { 
                 width: leftColumnWidth,
                 align: 'left',
                 lineGap: 1.5,
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(skillsText, { width: leftColumnWidth, lineGap: 1.5 }) + 10;
          }
        } catch (e) {
          console.warn('Error rendering soft skills:', e);
        }
      }
      if (safeResumeData.languages && safeResumeData.languages.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'LANGUAGES KNOWN', leftColumnX, leftY, primaryColor);
          // Show ALL languages - no limit
          const langsText = safeResumeData.languages.filter(lang => lang).map(l => String(l)).join(', ');
          if (langsText) {
            doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
               .text(langsText, leftColumnX, leftY, { 
                 width: leftColumnWidth,
                 align: 'left',
                 lineGap: 1.5,
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(langsText, { width: leftColumnWidth, lineGap: 1.5 }) + 10;
          }
        } catch (e) {
          console.warn('Error rendering languages:', e);
        }
      }
      if (safeResumeData.extracurricular && safeResumeData.extracurricular.length > 0) {
        try {
          // Show all extracurricular activities
          leftY = addSectionHeader(doc, 'EXTRACURRICULAR ACTIVITY', leftColumnX, leftY, primaryColor);
          safeResumeData.extracurricular.forEach(extra => {
            if (!extra || typeof extra !== 'object') return;
              
              let extraText = '';
              if (extra.title) extraText += extra.title;
              if (extra.description) extraText += (extraText ? ' - ' : '') + String(extra.description);
              
              if (extraText) {
                doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                   .text(`• ${extraText}`, leftColumnX, leftY, { 
                     width: leftColumnWidth,
                     align: 'left',
                     lineGap: 1.5,
                     ellipsis: false,
                     break: true
                   });
                leftY += doc.heightOfString(`• ${extraText}`, { width: leftColumnWidth, lineGap: 1.5 }) + 3;
              }
            });
            leftY += 5;
        } catch (e) {
          console.warn('Error rendering extracurricular:', e);
        }
      }
      if (safeResumeData.certifications && safeResumeData.certifications.length > 0) {
        try {
          // Show all certifications
          leftY = addSectionHeader(doc, 'CERTIFICATIONS', leftColumnX, leftY, primaryColor);
          safeResumeData.certifications.forEach(cert => {
            if (!cert) return;
              const certText = String(cert);
              doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                 .text(`• ${certText}`, leftColumnX, leftY, { 
                   width: leftColumnWidth,
                   align: 'left',
                   lineGap: 1.5,
                   ellipsis: false,
                   break: true
                 });
              leftY += doc.heightOfString(`• ${certText}`, { width: leftColumnWidth, lineGap: 1.5 }) + 2;
            });
            leftY += 5;
        } catch (e) {
          console.warn('Error rendering certifications:', e);
        }
      }

      const rightColumnX = doc.page.margins.left + leftColumnWidth + columnGap;
      
      // Check if we have internships - they should be separate from experience
      const internships = safeResumeData.experience.filter(exp => 
        exp.title && (exp.title.toLowerCase().includes('intern') || 
        exp.company && exp.company.toLowerCase().includes('internship'))
      );
      const regularExperience = safeResumeData.experience.filter(exp => 
        !exp.title || (!exp.title.toLowerCase().includes('intern') && 
        (!exp.company || !exp.company.toLowerCase().includes('internship')))
      );
      
      // Render internships first if they exist - show all internships
      if (internships.length > 0) {
        rightY = addSectionHeader(doc, 'INTERNSHIP', rightColumnX, rightY, primaryColor);
        
        internships.forEach((exp, index) => {
          try {
            if (!exp || typeof exp !== 'object') return;
            
            const expTitle = exp.title || 'Intern';
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textColor)
               .text(String(expTitle), rightColumnX, rightY, { 
                 width: rightColumnWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            rightY += doc.heightOfString(String(expTitle), { width: rightColumnWidth }) + 2;

            let companyDuration = '';
            const company = exp.company || '';
            const duration = exp.duration || '';
            if (company && duration) {
              companyDuration = `${company} | ${duration}`;
            } else if (company) {
              companyDuration = company;
            } else if (duration) {
              companyDuration = duration;
            }

            if (companyDuration) {
              doc.fontSize(8.5).font('Helvetica').fillColor(primaryColor)
                 .text(`  ${companyDuration}`, rightColumnX, rightY, { 
                   width: rightColumnWidth,
                   align: 'left',
                   ellipsis: false,
                   break: true
                 });
              rightY += doc.heightOfString(`  ${companyDuration}`, { width: rightColumnWidth }) + 4;
            }

            // Show ALL bullet points - no limit
            const descriptions = Array.isArray(exp.description) ? exp.description : [];
            if (descriptions.length > 0) {
              descriptions.forEach(desc => {
                if (!desc) return;
                const cleanDesc = String(desc).trim();
                if (cleanDesc) {
                  doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                     .text(`  • ${cleanDesc}`, rightColumnX, rightY, { 
                       width: rightColumnWidth,
                       align: 'left',
                       lineGap: 1.5,
                       ellipsis: false,
                       break: true
                     });
                  rightY += doc.heightOfString(`  • ${cleanDesc}`, { width: rightColumnWidth, lineGap: 1.5 }) + 2;
                }
              });
            }
          } catch (e) {
            console.warn('Error rendering internship entry:', e);
          }

          rightY += 5;
        });
        rightY += 5;
      }
      
      // Render regular experience if any - show all experience
      if (regularExperience.length > 0) {
        rightY = addSectionHeader(doc, 'EXPERIENCE', rightColumnX, rightY, primaryColor);
        
        regularExperience.forEach((exp, index) => {
          try {
            if (!exp || typeof exp !== 'object') return;
            
            const expTitle = exp.title || '';
            if (expTitle) {
              doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textColor)
                 .text(String(expTitle), rightColumnX, rightY, { 
                   width: rightColumnWidth,
                   align: 'left',
                   ellipsis: false,
                   break: true
                 });
              rightY += doc.heightOfString(String(expTitle), { width: rightColumnWidth }) + 2;
            }

            let companyDuration = '';
            const company = exp.company || '';
            const duration = exp.duration || '';
            if (company && duration) {
              companyDuration = `${company} | ${duration}`;
            } else if (company) {
              companyDuration = company;
            } else if (duration) {
              companyDuration = duration;
            }

            if (companyDuration) {
              doc.fontSize(8.5).font('Helvetica').fillColor(primaryColor)
                 .text(String(companyDuration), rightColumnX, rightY, { 
                   width: rightColumnWidth,
                   align: 'left',
                   ellipsis: false,
                   break: true
                 });
              rightY += doc.heightOfString(String(companyDuration), { width: rightColumnWidth }) + 4;
            }

            // Show ALL bullet points - no limit
            const descriptions = Array.isArray(exp.description) ? exp.description : [];
            if (descriptions.length > 0) {
              descriptions.forEach(desc => {
                if (!desc) return;
                const cleanDesc = String(desc).trim();
                if (cleanDesc) {
                  doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                     .text(`• ${cleanDesc}`, rightColumnX, rightY, { 
                       width: rightColumnWidth,
                       align: 'left',
                       lineGap: 1.5,
                       ellipsis: false,
                       break: true
                     });
                  rightY += doc.heightOfString(`• ${cleanDesc}`, { width: rightColumnWidth, lineGap: 1.5 }) + 2;
                }
              });
            }
          } catch (e) {
            console.warn('Error rendering experience entry:', e);
          }

          rightY += 5;
        });
      }

      if (safeResumeData.education && safeResumeData.education.length > 0) {
        rightY = addSectionHeader(doc, 'EDUCATION', rightColumnX, rightY, primaryColor);
        
        // Show all education entries
        safeResumeData.education.forEach(edu => {
          try {
            if (!edu || typeof edu !== 'object') return;
              
              // Format: Location/Institution (Year) or Degree (Year)
              let firstLine = '';
              const location = edu.location || '';
              const institution = edu.institution || '';
              const degree = edu.degree || '';
              const year = edu.year || '';
              
              // Priority: location+year, then institution+year, then degree+year
              if (location && year) {
                firstLine = `${location} (${year})`;
              } else if (institution && year) {
                firstLine = `${institution} (${year})`;
              } else if (degree && year) {
                firstLine = `${degree} (${year})`;
              } else if (degree) {
                firstLine = degree;
              } else if (location) {
                firstLine = location;
              } else if (institution) {
                firstLine = institution;
              }
              
              if (firstLine) {
                doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                   .text(String(firstLine), rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(String(firstLine), { width: rightColumnWidth }) + 2;
              }
              
              // Grade/CGPA on same line
              const grade = edu.grade || '';
              if (grade) {
                doc.fontSize(8.5).font('Helvetica').fillColor(lightGray)
                   .text(`  • ${grade}`, rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(`  • ${grade}`, { width: rightColumnWidth }) + 2;
              }
              
              rightY += 3;
            } catch (e) {
              console.warn('Error rendering education entry:', e);
            }
          });
          rightY += 5;
      }

      // Filter out academic projects to save space - only show regular projects
      const regularProjects = safeResumeData.projects.filter(proj => 
        !proj.name || (!proj.name.toUpperCase().includes('ACADEMIC') && 
        !proj.description.some(desc => desc && desc.toLowerCase().includes('academic')))
      );
      
      // Render regular projects if any - show all projects
      if (regularProjects.length > 0) {
        rightY = addSectionHeader(doc, 'PROJECTS', rightColumnX, rightY, primaryColor);
        
        regularProjects.forEach(project => {
          try {
            if (!project || typeof project !== 'object') return;
              
              const projectName = project.name || '';
              if (projectName) {
                doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textColor)
                   .text(String(projectName), rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(String(projectName), { width: rightColumnWidth }) + 3;
              }

              // Show ALL bullet points - no limit
              const descriptions = Array.isArray(project.description) ? project.description : [];
              if (descriptions.length > 0) {
                descriptions.forEach(desc => {
                  if (!desc) return;
                  const cleanDesc = String(desc).trim();
                  if (cleanDesc) {
                    doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                       .text(`  • ${cleanDesc}`, rightColumnX, rightY, { 
                         width: rightColumnWidth,
                         align: 'left',
                         lineGap: 1.5,
                         ellipsis: false,
                         break: true
                       });
                    rightY += doc.heightOfString(`  • ${cleanDesc}`, { width: rightColumnWidth, lineGap: 1.5 }) + 2;
                  }
                });
              }
              rightY += 5;
            } catch (e) {
              console.warn('Error rendering project entry:', e);
            }
          });
      }

      if (safeResumeData.responsibilities && safeResumeData.responsibilities.length > 0) {
        rightY = addSectionHeader(doc, 'POSITION OF RESPONSIBILITY', rightColumnX, rightY, primaryColor);
        
        // Show all responsibilities
        safeResumeData.responsibilities.forEach(resp => {
          try {
            if (!resp || typeof resp !== 'object') return;
              
              let respText = '';
              if (resp.title) respText += resp.title;
              if (resp.organization) respText += (respText ? ', ' : '') + resp.organization;
              if (resp.description) respText += (respText ? ' - ' : '') + String(resp.description);
              
              if (respText) {
                doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                   .text(`• ${respText}`, rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     lineGap: 1.5,
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(`• ${respText}`, { width: rightColumnWidth, lineGap: 1.5 }) + 2;
              }
            } catch (e) {
              console.warn('Error rendering responsibility entry:', e);
            }
          });
          rightY += 5;
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
  doc.fontSize(10).font('Helvetica-Bold').fillColor(color)
     .text(title, x, y);
  
  const titleWidth = doc.widthOfString(title);
  doc.strokeColor(color).lineWidth(1)
     .moveTo(x, y + 10)
     .lineTo(x + titleWidth, y + 10)
     .stroke();
  
  return y + 17;
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

    // Step 1: Extract text from PDF
    let resumeText = await extractTextFromPDF(resumeFile?.path);
    console.log('Extracted text length:', resumeText.length);
    console.log('Extracted text preview (first 1000 chars):', resumeText);
    
    // Step 2: Preprocess with AI to clean and normalize messy extraction
    resumeText = await preprocessResumeText(resumeText);
    console.log('Preprocessed text length:', resumeText.length);
    console.log('Preprocessed text preview (first 1000 chars):', resumeText);
    
    // Step 3: Generate tailored resume
    const tailoredResumeText = await generateTailoredResume(resumeText, jobDescription);
    console.log('Tailored resume text length:', tailoredResumeText.length);
    console.log('Tailored resume preview (first 1000 chars):', tailoredResumeText);
    
    // Step 4: Parse the tailored resume
    let resumeData;
    try {
      resumeData = parseResumeData(tailoredResumeText);
      
      // Log parsed data for debugging
      console.log('=== PARSED RESUME DATA ===');
      console.log('- Name:', resumeData.name);
      console.log('- Experience entries:', resumeData.experience.length);
      resumeData.experience.forEach((exp, idx) => {
        console.log(`  Experience ${idx + 1}:`, exp.title || 'N/A', '|', exp.company || 'N/A', '| Descriptions:', exp.description.length);
        if (exp.description.length > 0) {
          exp.description.forEach((desc, dIdx) => {
            console.log(`    Desc ${dIdx + 1}:`, desc.substring(0, 80));
          });
        } else {
          console.warn(`  ⚠️ WARNING: No descriptions found for experience ${idx + 1}`);
        }
      });
      console.log('- Project entries:', resumeData.projects.length);
      resumeData.projects.forEach((proj, idx) => {
        console.log(`  Project ${idx + 1}:`, proj.name || 'N/A', '| Descriptions:', proj.description.length);
        if (proj.description.length > 0) {
          proj.description.forEach((desc, dIdx) => {
            console.log(`    Desc ${dIdx + 1}:`, desc.substring(0, 80));
          });
        } else {
          console.warn(`  ⚠️ WARNING: No descriptions found for project ${idx + 1}`);
        }
      });
      console.log('==========================');
      
      // Validate that we have at least some data
      if (!resumeData.name && (!resumeData.experience || resumeData.experience.length === 0) && 
          (!resumeData.education || resumeData.education.length === 0)) {
        console.warn('Parsed resume data appears to be empty or invalid');
      }
    } catch (parseError) {
      console.error('Error parsing resume data:', parseError);
      throw new Error('Failed to parse resume data: ' + parseError.message);
    }

    const outputFileName = `tailored-resume-${Date.now()}.pdf`;
    const outputPath = path.join('uploads', outputFileName);

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