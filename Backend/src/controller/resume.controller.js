import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';
const PDFDocument = (await import('pdfkit')).default;
import { model } from "../index.js"
import resumeSchema from 'resume-schema';
import { resumePrompt } from '../utils/prompt.js';


// Extract text from PDF using pdf2json with improved accuracy
export async function extractTextFromPDF(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('PDF file does not exist: ' + filePath);
  }

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error('PDF parsing error: ' + errData.parserError));
    });
    
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let fullText = '';
        
        // Process only first 2 pages for performance
        const maxPages = Math.min(pdfData.Pages?.length || 0, 2);
        
        for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
          const page = pdfData.Pages[pageIndex];
          
          if (page.Texts) {
            // Group texts by lines with more precise Y-coordinate grouping
            const lines = {};
            const lineThreshold = 0.3; // More precise line detection
            
            page.Texts.forEach((textObj) => {
              if (textObj.R && textObj.R.length > 0) {
                const text = decodeURIComponent(textObj.R[0].T || '').replace(/\s+/g, ' ');
                const y = Math.round(textObj.y * 100) / 100; // Round to 2 decimal places
                
                // Find existing line within threshold
                let lineKey = y;
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
                  x: textObj.x,
                  text: text,
                  fontSize: textObj.R[0].TS?.[1] || 12,
                  isBold: textObj.R[0].TS?.[2] === 1
                });
              }
            });
            
            // Sort lines by Y position and process each line
            const sortedLineKeys = Object.keys(lines).sort((a, b) => parseFloat(a) - parseFloat(b));
            
            sortedLineKeys.forEach((lineKey, lineIndex) => {
              const lineTexts = lines[lineKey];
              
              // Sort texts in line by X position
              lineTexts.sort((a, b) => a.x - b.x);
              
              let lineContent = '';
              let prevX = -1;
              
              lineTexts.forEach((textItem, textIndex) => {
                const { text, x } = textItem;
                
                // Add appropriate spacing based on X position difference
                if (prevX !== -1) {
                  const xDiff = x - prevX;
                  if (xDiff > 1.5) { // Significant gap - likely different sections/columns
                    lineContent += '    '; // Add tab-like spacing
                  } else if (xDiff > 0.2) { // Normal spacing
                    lineContent += ' ';
                  }
                }
                
                lineContent += text;
                prevX = x + (text.length * 0.5); // Estimate end position
              });
              
              // Add the line to full text with proper formatting
              if (lineContent.trim()) {
                fullText += lineContent.trim() + '\n';
              }
            }); 
          }
        }

        // UPDATED SECTION: Process the extracted text for proper header spacing
        const rawLines = fullText.split('\n');
        let processedText = '';
        let previousWasHeader = false;

        for (let i = 0; i < rawLines.length; i++) {
          const currentLine = rawLines[i];
          const trimmedLine = currentLine.trim();
          
          // Skip empty lines
          if (!trimmedLine) continue;
          
          // Check if current line is a header
          if (isHeaderLine(trimmedLine)) {
            // Add space before header (except for the first header and after another header)
            if (processedText.length > 0 && !previousWasHeader) {
              processedText += '\n';
            }
            // Add the header
            processedText += trimmedLine + '\n';
            previousWasHeader = true;
          } else {
            // For non-header lines, just add them normally
            processedText += trimmedLine + '\n';
            previousWasHeader = false;
          }
        }

        console.log("cleanText: ", processedText);
        
        resolve(processedText);
      } catch (error) {
        reject(new Error('Failed to process PDF data: ' + error.message));
      }
    });
    
    pdfParser.loadPDF(filePath);
  });
}

// Helper function to identify header lines
const isHeaderLine = (line) => {
  const headerPatterns = [
    /^PROFESSIONAL\s+SUMMARY$/i,
    /^TECHNICAL\s+SKILLS$/i,
    /^EDUCATION$/i,
    /^EXPERIENCE$/i,
    /^PROJECTS$/i,
    /^POSITION\s+OF\s+RESPONSIBILITY$/i
  ];
  
  return headerPatterns.some(pattern => pattern.test(line.trim()));
};

// Extract PDF metadata and styling information using pdf2json
async function extractPDFStyling(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', (errData) => {
      console.error('Error extracting PDF styling:', errData.parserError);
      resolve(getDefaultStyling());
    });
    
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        const pages = pdfData.Pages || [];
        const maxPages = Math.min(pages.length, 2);
        
        let totalTexts = 0;
        let totalTextLength = 0;
        let fontSizes = [];
        let hasHeaders = false;
        
        // Analyze first 2 pages
        for (let i = 0; i < maxPages; i++) {
          const page = pages[i];
          
          if (page.Texts) {
            totalTexts += page.Texts.length;
            
            page.Texts.forEach(textObj => {
              if (textObj.R && textObj.R.length > 0) {
                const textData = textObj.R[0];
                const text = decodeURIComponent(textData.T || '');
                totalTextLength += text.length;
                
                // Collect font sizes
                if (textData.TS && textData.TS[1]) {
                  fontSizes.push(textData.TS[1]);
                }
                
                // Check for headers (larger font size or bold)
                if (textData.TS && (textData.TS[2] === 1 || textData.TS[1] > 12)) {
                  hasHeaders = true;
                }
              }
            });
          }
        }
        
        // Calculate average font size
        const avgFontSize = fontSizes.length > 0 ? 
          Math.round(fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length) : 12;
        
        const styling = {
          pageCount: maxPages,
          hasImages: false, // pdf2json focuses on text
          estimatedLineCount: totalTexts,
          textLength: totalTextLength,
          fontSize: Math.max(10, Math.min(14, avgFontSize)), // Clamp between 10-14
          fontFamily: 'Helvetica',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          hasHeaders: hasHeaders,
          structure: {
            sections: [],
            hasMultipleColumns: detectMultipleColumns(pages),
            hasBulletPoints: false // Will be detected during text processing
          }
        };
        
        resolve(styling);
      } catch (error) {
        console.error('Error processing PDF styling:', error);
        resolve(getDefaultStyling());
      }
    });
    
    pdfParser.loadPDF(filePath);
  });
}

// Helper function to detect multiple columns in PDF
function detectMultipleColumns(pages) {
  if (!pages || pages.length === 0) return false;
  
  const page = pages[0]; // Check first page
  if (!page.Texts) return false;
  
  // Group texts by y-coordinate (same line)
  const lines = {};
  page.Texts.forEach(textObj => {
    const y = Math.round(textObj.y * 10) / 10;
    if (!lines[y]) lines[y] = [];
    lines[y].push(textObj.x);
  });
  
  // Check if any line has texts with significant x-distance (multiple columns)
  for (const y in lines) {
    const xPositions = lines[y].sort((a, b) => a - b);
    if (xPositions.length > 1) {
      const maxDistance = Math.max(...xPositions) - Math.min(...xPositions);
      if (maxDistance > 15) { // Significant distance suggests multiple columns
        return true;
      }
    }
  }
  
  return false;
}

// Default styling fallback
function getDefaultStyling() {
  return {
    pageCount: 1,
    hasImages: false,
    estimatedLineCount: 50,
    textLength: 2000,
    fontSize: 12,
    fontFamily: 'Helvetica',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    hasHeaders: true,
    structure: { sections: [], hasMultipleColumns: false, hasBulletPoints: false }
  };
}

// Generate tailored resume using AI (keeping your original logic)
async function generateTailoredResume(resumeText, jobDescription) {
  try {
    
    const prompt = resumePrompt(resumeText, jobDescription)

    const result = await model.generateContent(prompt);
    const response = result.response;
    const tailoredResume = response.text();

    console.log("tailoredResume: ", tailoredResume);
    
    return tailoredResume;
  } catch (error) {
    throw new Error('Failed to generate tailored resume: ' + error.message);
  }
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
      location: ''
    },
    summary: '',
    skills: [],
    technologies: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  };

  let currentSection = '';
  let currentExperience = null;
  let currentEducation = null;
  let currentProject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const upperLine = line.toUpperCase();

    // Detect name (usually first non-empty line or contains common name patterns)
    if (!resumeData.name && i < 5 && line.length > 2 && line.length < 50 && 
        !line.includes('@') && !line.includes('http') && !line.match(/^\d/)) {
      resumeData.name = line;
      continue;
    }

    // Detect title (usually follows name)
    if (resumeData.name && !resumeData.title && i < 8 && line.length > 5 && line.length < 80 &&
        !line.includes('@') && !line.includes('http') && !line.match(/^\d/)) {
      resumeData.title = line;
      continue;
    }

    // Detect contact information
    if (line.includes('@') || line.includes('phone') || line.includes('linkedin') || 
        line.includes('location') || line.match(/\+?\d{10,}/)) {
      if (line.includes('@')) resumeData.contact.email = extractEmail(line);
      if (line.match(/\+?\d{10,}/)) resumeData.contact.phone = extractPhone(line);
      if (line.includes('linkedin')) resumeData.contact.linkedin = extractLinkedIn(line);
      if (line.includes('location') || line.match(/[A-Z][a-z]+,\s*[A-Z]/)) {
        resumeData.contact.location = extractLocation(line);
      }
      continue;
    }

    // Detect sections
    if (upperLine.includes('SUMMARY') || upperLine.includes('PROFILE') || upperLine.includes('OBJECTIVE')) {
      currentSection = 'summary';
      continue;
    } else if (upperLine.includes('SKILL')) {
      currentSection = 'skills';
      continue;
    } else if (upperLine.includes('TECHNOLOG') || upperLine.includes('TOOLS')) {
      currentSection = 'technologies';
      continue;
    } else if (upperLine.includes('EXPERIENCE') || upperLine.includes('EMPLOYMENT')) {
      currentSection = 'experience';
      continue;
    } else if (upperLine.includes('EDUCATION')) {
      currentSection = 'education';
      continue;
    } else if (upperLine.includes('PROJECT')) {
      currentSection = 'projects';
      continue;
    } else if (upperLine.includes('CERTIFICATION') || upperLine.includes('CERTIFICATE')) {
      currentSection = 'certifications';
      continue;
    }

    // Process content based on current section
    switch (currentSection) {
      case 'summary':
        if (line.length > 20) {
          resumeData.summary += (resumeData.summary ? ' ' : '') + line;
        }
        break;

      case 'skills':
        if (line.includes('•') || line.includes('-') || line.includes(',')) {
          const skills = line.replace(/[•\-]/g, '').split(',').map(s => s.trim()).filter(s => s);
          resumeData.skills.push(...skills);
        } else if (line.length > 2 && line.length < 30) {
          resumeData.skills.push(line);
        }
        break;

      case 'technologies':
        if (line.includes('•') || line.includes('-') || line.includes(',')) {
          const techs = line.replace(/[•\-]/g, '').split(',').map(s => s.trim()).filter(s => s);
          resumeData.technologies.push(...techs);
        } else if (line.length > 2 && line.length < 30) {
          resumeData.technologies.push(line);
        }
        break;

      case 'experience':
        // Check if line is a job title/company (usually bold or first line of experience)
        if (line.length > 5 && line.length < 80 && !line.startsWith('•') && !line.startsWith('-')) {
          if (currentExperience) {
            resumeData.experience.push(currentExperience);
          }
          currentExperience = {
            title: line,
            company: '',
            duration: '',
            description: []
          };
          
          // Try to extract company and duration from next few lines
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.match(/\d{4}/) && (nextLine.includes('-') || nextLine.includes('to'))) {
              currentExperience.duration = nextLine;
            } else if (!nextLine.startsWith('•') && !nextLine.startsWith('-') && nextLine.length < 50) {
              currentExperience.company = nextLine;
            }
          }
        } else if (currentExperience && (line.startsWith('•') || line.startsWith('-'))) {
          currentExperience.description.push(line.replace(/^[•\-]\s*/, ''));
        }
        break;

      case 'education':
        if (line.length > 5 && line.length < 80 && !line.startsWith('•')) {
          currentEducation = {
            degree: line,
            institution: '',
            year: ''
          };
          resumeData.education.push(currentEducation);
          
          // Extract year and institution from surrounding lines
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.match(/\d{4}/)) {
              currentEducation.year = nextLine;
            } else if (!nextLine.includes('EDUCATION') && nextLine.length < 50) {
              currentEducation.institution = nextLine;
            }
          }
        }
        break;

      case 'projects':
        if (line.length > 5 && line.length < 80 && !line.startsWith('•')) {
          if (currentProject) {
            resumeData.projects.push(currentProject);
          }
          currentProject = {
            name: line,
            description: []
          };
        } else if (currentProject && (line.startsWith('•') || line.startsWith('-'))) {
          currentProject.description.push(line.replace(/^[•\-]\s*/, ''));
        }
        break;

      case 'certifications':
        if (line.length > 5 && line.length < 80) {
          resumeData.certifications.push(line);
        }
        break;
    }
  }

  // Add last items
  if (currentExperience) resumeData.experience.push(currentExperience);
  if (currentProject) resumeData.projects.push(currentProject);

  return resumeData;
}

// Helper functions for contact extraction
function extractEmail(text) {
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  return emailMatch ? emailMatch[0] : '';
}

function extractPhone(text) {
  const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{10,}/);
  return phoneMatch ? phoneMatch[0].trim() : '';
}

function extractLinkedIn(text) {
  const linkedinMatch = text.match(/linkedin\.com\/[\w\/-]+/);
  return linkedinMatch ? linkedinMatch[0] : '';
}

function extractLocation(text) {
  const locationMatch = text.match(/[A-Z][a-z]+,\s*[A-Z]{2}/);
  return locationMatch ? locationMatch[0] : text.trim();
}

// Create ATS-Friendly PDF with enhanced professional layout
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

      // Colors
      const primaryColor = '#2563eb'; // Professional blue
      const textColor = '#1f2937';    // Dark gray
      const lightGray = '#6b7280';    // Light gray for dates/details

      // HEADER SECTION (Full Width)
      if (resumeData.name) {
        doc.fontSize(20).font('Helvetica-Bold').fillColor(textColor)
           .text(resumeData.name, doc.page.margins.left, leftY);
        leftY += 25;
        rightY += 25;
      }

      if (resumeData.title) {
        doc.fontSize(14).font('Helvetica').fillColor(primaryColor)
           .text(resumeData.title, doc.page.margins.left, leftY);
        leftY += 20;
        rightY += 20;
      }

      // Contact information (single line)
      let contactInfo = [];
      if (resumeData.contact.phone) contactInfo.push(resumeData.contact.phone);
      if (resumeData.contact.email) contactInfo.push(resumeData.contact.email);
      if (resumeData.contact.linkedin) contactInfo.push(resumeData.contact.linkedin);
      if (resumeData.contact.location) contactInfo.push(resumeData.contact.location);

      if (contactInfo.length > 0) {
        doc.fontSize(10).font('Helvetica').fillColor(lightGray)
           .text(contactInfo.join(' | '), doc.page.margins.left, leftY);
        leftY += 25;
        rightY += 25;
      }

      // Draw a subtle line separator
      doc.strokeColor('#e5e7eb').lineWidth(1)
         .moveTo(doc.page.margins.left, leftY)
         .lineTo(doc.page.width - doc.page.margins.right, leftY)
         .stroke();
      leftY += 15;
      rightY += 15;

      // LEFT COLUMN
      const leftColumnX = doc.page.margins.left;

      // SUMMARY Section
      if (resumeData.summary) {
        leftY = addSectionHeader(doc, 'SUMMARY', leftColumnX, leftY, primaryColor);
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(resumeData.summary, leftColumnX, leftY, { 
             width: leftColumnWidth, 
             align: 'left',
             lineGap: 2
           });
        leftY += doc.heightOfString(resumeData.summary, { width: leftColumnWidth }) + 20;
      }

      // SKILLS Section
      if (resumeData.skills.length > 0) {
        leftY = addSectionHeader(doc, 'SKILLS', leftColumnX, leftY, primaryColor);
        const skillsText = resumeData.skills.join(' • ');
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(skillsText, leftColumnX, leftY, { 
             width: leftColumnWidth,
             lineGap: 2
           });
        leftY += doc.heightOfString(skillsText, { width: leftColumnWidth }) + 20;
      }

      // TECHNOLOGIES Section
      if (resumeData.technologies.length > 0) {
        leftY = addSectionHeader(doc, 'TECHNOLOGIES', leftColumnX, leftY, primaryColor);
        const techText = resumeData.technologies.join(' • ');
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(techText, leftColumnX, leftY, { 
             width: leftColumnWidth,
             lineGap: 2
           });
        leftY += doc.heightOfString(techText, { width: leftColumnWidth }) + 20;
      }

      // CERTIFICATIONS Section
      if (resumeData.certifications.length > 0) {
        leftY = addSectionHeader(doc, 'CERTIFICATIONS', leftColumnX, leftY, primaryColor);
        resumeData.certifications.forEach(cert => {
          doc.fontSize(10).font('Helvetica').fillColor(textColor)
             .text(`• ${cert}`, leftColumnX, leftY, { width: leftColumnWidth });
          leftY += doc.heightOfString(`• ${cert}`, { width: leftColumnWidth }) + 8;
        });
        leftY += 15;
      }

      // RIGHT COLUMN
      const rightColumnX = doc.page.margins.left + leftColumnWidth + columnGap;

      // EXPERIENCE Section
      if (resumeData.experience.length > 0) {
        rightY = addSectionHeader(doc, 'EXPERIENCE', rightColumnX, rightY, primaryColor);
        
        resumeData.experience.forEach((exp, index) => {
          // Job Title
          doc.fontSize(12).font('Helvetica-Bold').fillColor(textColor)
             .text(exp.title, rightColumnX, rightY, { width: rightColumnWidth });
          rightY += 15;

          // Company and Duration
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
               .text(companyDuration, rightColumnX, rightY, { width: rightColumnWidth });
            rightY += 15;
          }

          // Description bullets
          if (exp.description && exp.description.length > 0) {
            exp.description.forEach(desc => {
              doc.fontSize(10).font('Helvetica').fillColor(textColor)
                 .text(`• ${desc}`, rightColumnX, rightY, { 
                   width: rightColumnWidth,
                   lineGap: 2
                 });
              rightY += doc.heightOfString(`• ${desc}`, { width: rightColumnWidth }) + 5;
            });
          }

          rightY += 15; // Space between experiences

          // Check if we need a new page
          if (rightY > doc.page.height - doc.page.margins.bottom - 50) {
            doc.addPage();
            rightY = doc.page.margins.top;
            leftY = doc.page.margins.top;
          }
        });
      }

      // EDUCATION Section
      if (resumeData.education.length > 0) {
        rightY = addSectionHeader(doc, 'EDUCATION', rightColumnX, rightY, primaryColor);
        
        resumeData.education.forEach(edu => {
          doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor)
             .text(edu.degree, rightColumnX, rightY, { width: rightColumnWidth });
          rightY += 12;

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
               .text(eduDetails, rightColumnX, rightY, { width: rightColumnWidth });
            rightY += 15;
          }
        });
        rightY += 10;
      }

      // PROJECTS Section
      if (resumeData.projects.length > 0) {
        rightY = addSectionHeader(doc, 'PROJECTS', rightColumnX, rightY, primaryColor);
        
        resumeData.projects.forEach(project => {
          doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor)
             .text(project.name, rightColumnX, rightY, { width: rightColumnWidth });
          rightY += 15;

          if (project.description && project.description.length > 0) {
            project.description.forEach(desc => {
              doc.fontSize(10).font('Helvetica').fillColor(textColor)
                 .text(`• ${desc}`, rightColumnX, rightY, { 
                   width: rightColumnWidth,
                   lineGap: 2
                 });
              rightY += doc.heightOfString(`• ${desc}`, { width: rightColumnWidth }) + 5;
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

// Helper function to add section headers
function addSectionHeader(doc, title, x, y, color) {
  doc.fontSize(12).font('Helvetica-Bold').fillColor(color)
     .text(title, x, y);
  
  // Add underline
  const titleWidth = doc.widthOfString(title);
  doc.strokeColor(color).lineWidth(1)
     .moveTo(x, y + 15)
     .lineTo(x + titleWidth, y + 15)
     .stroke();
  
  return y + 25;
}

// Main controller function (keeping your exact logic and flow)
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

    // Extract text from resume using improved method
    const resumeText = await extractTextFromPDF(resumeFile?.path);
    const jobDescText = jobDescription; 

    // Generate tailored resume using Gemini
    const tailoredResumeText = await generateTailoredResume(resumeText, jobDescText);

    // Parse the AI-generated resume into structured data
    const resumeData = parseResumeData(tailoredResumeText);

    // Create new PDF with ATS-friendly format
    const outputFileName = `tailored-resume-${Date.now()}.pdf`;
    const outputPath = path.join('uploads', outputFileName);

    await createATSFriendlyPDF(resumeData, outputPath);

    // Clean up uploaded file
    fs.unlinkSync(resumeFile?.path);

    console.log('ATS-friendly resume created successfully:', outputFileName);

    return res.json({
      success: true,
      message: 'ATS-friendly resume tailored successfully',
      downloadUrl: `/uploads/${outputFileName}`,
      fileName: outputFileName
    });

  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({
      error: 'Failed to process resume: ' + error.message
    });
  }
}








// interface TextBlock {
//   text: string;
//   isBold: boolean;
//   fontSize: number;
// }
export async function extractStructuredResumeData(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath.path)) {
      throw new Error('Uploaded file does not exist');
    }

    if (path.extname(filePath.originalname).toLowerCase() !== '.pdf') {
      throw new Error('Only PDF files are supported');
    }

    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', (errData) => {
        reject(new Error('PDF parsing error: ' + errData.parserError));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          const allTextBlocks = [];
          
          const maxPages = Math.min(pdfData.Pages?.length || 0, 3);
          
          // Extract all text blocks with their formatting and position
          for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
            const page = pdfData.Pages[pageIndex];
            
            if (page.Texts) {
              console.log("Processing page", pageIndex + 1);
              const textBlocks = extractTextBlocks(page.Texts);
              allTextBlocks.push(...textBlocks);
            }
          }
          
          console.log("Total text blocks:", allTextBlocks.length);
          
          // Parse the resume using the text blocks
          const structuredResume = parseResumeFromBlocks(allTextBlocks);
          
          // Clean up: Delete the temporary file after processing
          fs.unlink(filePath.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
          
          resolve(structuredResume);
        } catch (error) {
          // Ensure temp file is deleted even if processing fails
          fs.unlink(filePath.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
          reject(new Error('Failed to process PDF data: ' + error.message));
        }
      });
      
      // Read the file buffer and parse it
      const fileBuffer = fs.readFileSync(filePath.path);
      pdfParser.parseBuffer(fileBuffer);
    });
  } catch (error) {
    throw error;
  }
}

function extractTextBlocks(texts) {
  const blocks = [];
  
  texts.forEach((textObj) => {
    if (textObj.R && textObj.R.length > 0) {
      // Extract and clean text
      const rawText = textObj.R.map(r => decodeURIComponent(r.T || '')).join('');
      const cleanText = rawText.replace(/\s+/g, ' ').trim();
      
      if (!cleanText) return;
      
      const firstR = textObj.R[0];
      blocks.push({
        text: cleanText,
        x: Math.round(textObj.x * 100) / 100,
        y: Math.round(textObj.y * 100) / 100,
        isBold: firstR.TS?.[2] === 1,
        fontSize: firstR.TS?.[1] || 12,
        fontFace: firstR.TS?.[0] || 0
      });
    }
  });
  
  // Sort by Y position (top to bottom) then by X position (left to right)
  return blocks.sort((a, b) => {
    if (Math.abs(a.y - b.y) < 0.5) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });
}

function parseResumeFromBlocks(blocks) {
  const resume = {
    basics: {},
    work: [],
    education: [],
    skills: [],
    projects: [],
    certificates: [],
    awards: [],
    volunteer: [],
    languages: []
  };
  
  // Find section boundaries
  const sections = findSections(blocks);
  console.log("Detected sections:", Object.keys(sections));
  
  // Parse each section
  resume.basics = parseBasics(sections.header || []);
  resume.basics.summary = parseSummary(sections.summary || []);
  resume.work = parseExperience(sections.experience || []);
  resume.education = parseEducation(sections.education || []);
  resume.skills = parseSkills(sections.skills || []);
  resume.projects = parseProjects(sections.projects || []);
  resume.volunteer = parseResponsibilities(sections.responsibilities || []);
  
  return resume;
}

function findSections(blocks) {
  const sections = {};
  let currentSection = 'header';
  let sectionStart = 0;
  
  // Define section headers with more flexible matching
  const sectionHeaders = {
    'PROFESSIONAL SUMMARY': 'summary',
    'TECHNICAL SKILLS': 'skills', 
    'EDUCATION': 'education',
    'EXPERIENCE (INTERNSHIP)': 'experience',
    'EXPERIENCE': 'experience',
    'PROJECTS': 'projects',
    'POSITION OF RESPONSIBILITY': 'responsibilities'
  };
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const text = block.text.trim().toUpperCase();
    
    // Check if this block is a section header (check for partial matches and bold text)
    let matchedSection = null;
    
    // Direct match first
    if (sectionHeaders[text]) {
      matchedSection = sectionHeaders[text];
    }
    // Check for partial matches if the text is bold or large font
    else if (block.isBold || block.fontSize > 12) {
      if (text.includes('PROFESSIONAL SUMMARY') || text === 'PROFESSIONAL SUMMARY') {
        matchedSection = 'summary';
      } else if (text.includes('TECHNICAL SKILLS') || text === 'TECHNICAL SKILLS') {
        matchedSection = 'skills';
      } else if (text === 'EDUCATION') {
        matchedSection = 'education';
      } else if (text.includes('EXPERIENCE')) {
        matchedSection = 'experience';
      } else if (text === 'PROJECTS') {
        matchedSection = 'projects';
      } else if (text.includes('POSITION OF RESPONSIBILITY') || text.includes('RESPONSIBILITY')) {
        matchedSection = 'responsibilities';
      }
    }
    
    if (matchedSection) {
      // Save the previous section
      if (i > sectionStart) {
        sections[currentSection] = blocks.slice(sectionStart, i);
      }
      
      currentSection = matchedSection;
      sectionStart = i + 1; // Start after the header
      console.log(`Found section: ${text} -> ${matchedSection} at index ${i}`);
    }
  }
  
  // Don't forget the last section
  if (sectionStart < blocks.length) {
    sections[currentSection] = blocks.slice(sectionStart);
  }
  
  return sections;
}

function parseBasics(headerBlocks) {
  const basics = {
    name: '',
    email: '',
    phone: '',
    location: { city: '', state: '', country: '' },
    profiles: []
  };
  
  if (!headerBlocks || headerBlocks.length === 0) return basics;
  
  const headerText = headerBlocks.map(b => b.text).join(' ');
  console.log("Header text:", headerText);
  
  // Extract name - look for the largest/bold text that looks like a name
  for (const block of headerBlocks) {
    if ((block.isBold || block.fontSize > 12) && 
        block.text.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/)) {
      basics.name = block.text.trim();
      break;
    }
  }
  
  // If no bold name found, try first block
  if (!basics.name && headerBlocks[0] && 
      headerBlocks[0].text.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/)) {
    basics.name = headerBlocks[0].text.trim();
  }
  
  // Extract phone number - more flexible patterns
  const phonePatterns = [
    /\(\+91\)\s*(\d{10})/,  // (+91) 1234567890
    /\+91[\s-]?(\d{10})/,   // +91 1234567890 or +91-1234567890
    /(\d{10})/              // 1234567890
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = headerText.match(pattern);
    if (phoneMatch) {
      basics.phone = phoneMatch[1].includes('+91') ? phoneMatch[1] : `+91 ${phoneMatch[1]}`;
      break;
    }
  }
  
  // Extract email
  const emailMatch = headerText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    basics.email = emailMatch[1];
  }
  
  // Extract profiles - look for LinkedIn and GitHub mentions
  const lowerHeaderText = headerText.toLowerCase();
  if (lowerHeaderText.includes('linkedin')) {
    // Try to extract username from the text
    const linkedinMatch = headerText.match(/linkedin\.com\/in\/([a-zA-Z0-9]+)/i) || 
                         headerText.match(/linkedin[:\s]+([a-zA-Z0-9]+)/i);
    const username = linkedinMatch ? linkedinMatch[1] : 'krushnasakhare965';
    
    basics.profiles.push({
      network: 'LinkedIn',
      username: username,
      url: `https://linkedin.com/in/${username}`
    });
  }
  
  if (lowerHeaderText.includes('github')) {
    const githubMatch = headerText.match(/github\.com\/([a-zA-Z0-9]+)/i) || 
                       headerText.match(/github[:\s]+([a-zA-Z0-9]+)/i);
    const username = githubMatch ? githubMatch[1] : 'krushnasakhare965';
    
    basics.profiles.push({
      network: 'GitHub',
      username: username,
      url: `https://github.com/${username}`
    });
  }
  
  return basics;
}

function parseSummary(summaryBlocks) {
  if (!summaryBlocks || summaryBlocks.length === 0) return '';
  
  return summaryBlocks
    .map(block => block.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSkills(skillBlocks) {
  const skills = [];
  
  if (!skillBlocks || skillBlocks.length === 0) return skills;
  
  let currentCategory = '';
  
  for (const block of skillBlocks) {
    const text = block.text.trim();
    
    // Check if this is a category header (ends with : or is bold)
    if (text.endsWith(':') || (block.isBold && !text.includes(','))) {
      currentCategory = text.replace(':', '').trim();
      continue;
    }
    
    // Parse skills from the text
    const skillItems = text.split(/[,&]/).map(s => s.trim()).filter(s => s);
    
    for (const skill of skillItems) {
      const cleanSkill = skill.replace(/[.,]/g, '').trim();
      if (cleanSkill && cleanSkill.length > 1) {
        skills.push({
          name: cleanSkill,
          level: '',
          keywords: [cleanSkill],
          category: currentCategory
        });
      }
    }
  }
  
  return skills;
}

function parseEducation(educationBlocks) {
  const educations = [];
  
  if (!educationBlocks || educationBlocks.length === 0) return educations;
  
  let currentEdu = null;
  
  for (const block of educationBlocks) {
    const text = block.text.trim();
    
    // Check if this is an institution name (bold, larger text, or contains "College"/"University"/"School")
    if ((block.isBold || block.fontSize > 12 || 
         text.includes('College') || text.includes('University') || text.includes('School')) &&
        !text.includes('Bachelor') && !text.includes('Diploma') && !text.includes('SSC') &&
        !text.match(/\d{4}/)) {
      
      // Save previous education
      if (currentEdu && currentEdu.institution) {
        educations.push(currentEdu);
      }
      
      currentEdu = {
        institution: text,
        area: '',
        studyType: '',
        startDate: '',
        endDate: '',
        gpa: '',
        location: ''
      };
    }
    // Check for degree information
    else if (currentEdu && (text.includes('Bachelor') || text.includes('Diploma') || text.includes('Completed') || text.includes('SSC'))) {
      if (text.includes('Bachelor of Technology') || text.includes('Bachelor')) {
        currentEdu.studyType = 'Bachelor of Technology';
        
        // Extract area of study
        const areaPatterns = [
          /in\s+([^w]+?)(?:\s+with|$)/i,
          /Bachelor of Technology\s+in\s+(.+?)(?:\s+with|\s+CGPA|$)/i,
          /Electronics\s*&?\s*Telecommunication/i
        ];
        
        for (const pattern of areaPatterns) {
          const areaMatch = text.match(pattern);
          if (areaMatch) {
            currentEdu.area = areaMatch[1].trim();
            break;
          }
        }
        
        // Extract GPA/CGPA
        const gpaMatch = text.match(/(\d+\.\d+)\s*CGPA/i);
        if (gpaMatch) {
          currentEdu.gpa = gpaMatch[1] + ' CGPA';
        }
        
      } else if (text.includes('Diploma')) {
        currentEdu.studyType = 'Diploma';
        const percentMatch = text.match(/(\d+\.\d+)%/);
        if (percentMatch) {
          currentEdu.gpa = percentMatch[1] + '%';
        }
        
      } else if (text.includes('SSC')) {
        currentEdu.studyType = 'SSC';
        const percentMatch = text.match(/(\d+)%/);
        if (percentMatch) {
          currentEdu.gpa = percentMatch[1] + '%';
        }
      }
    }
    // Check for dates and location
    else if (currentEdu && text.match(/\d{4}/)) {
      // Extract location
      const locationMatch = text.match(/([A-Za-z\s,]+?)(?:\s+\w+\s+\d{4}|$)/);
      if (locationMatch && !locationMatch[1].match(/\d{4}/)) {
        currentEdu.location = locationMatch[1].trim();
      }
      
      // Extract dates
      const datePatterns = [
        /(\w+\s+\d{4})\s*[–-]\s*(\w+\s*\d{4}|\w+)/,
        /(\d{4})\s*[–-]\s*(\d{4}|\w+)/
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = text.match(pattern);
        if (dateMatch) {
          currentEdu.startDate = dateMatch[1];
          currentEdu.endDate = dateMatch[2];
          break;
        }
      }
    }
  }
  
  // Don't forget the last education
  if (currentEdu && currentEdu.institution) {
    educations.push(currentEdu);
  }
  
  return educations;
}

function parseExperience(experienceBlocks) {
  const experiences = [];
  
  if (!experienceBlocks || experienceBlocks.length === 0) return experiences;
  
  let currentExp = null;
  
  for (const block of experienceBlocks) {
    const text = block.text.trim();
    
    // Check if this is a job title line (contains | and position/company info)
    if (text.includes('|') && 
        (text.includes('Developer') || text.includes('Intern') || text.includes('Software'))) {
      
      // Save previous experience
      if (currentExp && currentExp.position) {
        experiences.push(currentExp);
      }
      
      // Parse position and company
      const parts = text.split('|').map(p => p.trim());
      const position = parts[0];
      let companyInfo = parts[1] || '';
      
      // Extract company and dates from the company info
      let company = '';
      let dateRange = '';
      
      // Pattern: Company Name (Date Range)
      const companyDateMatch = companyInfo.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (companyDateMatch) {
        company = companyDateMatch[1].trim();
        dateRange = companyDateMatch[2];
      } else {
        company = companyInfo;
      }
      
      currentExp = {
        position: position,
        company: company,
        startDate: '',
        endDate: '',
        highlights: [],
        summary: ''
      };
      
      // Parse date range
      if (dateRange) {
        const dates = dateRange.split(/[–-]/).map(d => d.trim());
        currentExp.startDate = dates[0] || '';
        currentExp.endDate = dates[1] || '';
      }
    }
    // Check if this is a bullet point or description
    else if (currentExp && (text.startsWith('•') || text.startsWith('-') || 
                           (!text.includes('|') && text.length > 10))) {
      
      let content = text;
      if (text.startsWith('•') || text.startsWith('-')) {
        content = text.substring(1).trim();
      }
      
      // If it contains a colon, it might be a project or specific task
      if (content.includes(':')) {
        const parts = content.split(':');
        const projectName = parts[0].trim();
        const projectDesc = parts.slice(1).join(':').trim();
        currentExp.highlights.push(`${projectName}: ${projectDesc}`);
      } else {
        currentExp.highlights.push(content);
      }
    }
  }
  
  // Don't forget the last experience
  if (currentExp && currentExp.position) {
    experiences.push(currentExp);
  }
  
  return experiences;
}

function parseProjects(projectBlocks) {
  const projects = [];
  
  if (!projectBlocks || projectBlocks.length === 0) return projects;
  
  let currentProject = null;
  
  for (const block of projectBlocks) {
    const text = block.text.trim();
    
    // Check if this is a project title line (contains | or bold text with tech stack)
    if ((text.includes('|') || block.isBold || block.fontSize > 12) && 
        !text.startsWith('•') && !text.startsWith('-')) {
      
      // Save previous project
      if (currentProject && currentProject.name) {
        projects.push(currentProject);
      }
      
      let projectName = '';
      let technologies = [];
      let links = '';
      
      if (text.includes('|')) {
        const parts = text.split('|');
        const nameAndTech = parts[0].trim();
        links = parts[1] ? parts[1].trim() : '';
        
        // Check if name and tech are separated by another delimiter
        if (nameAndTech.includes('|')) {
          const innerParts = nameAndTech.split('|');
          projectName = innerParts[0].trim();
          if (innerParts[1]) {
            technologies = innerParts[1].split(',').map(t => t.trim());
          }
        } else {
          projectName = nameAndTech;
        }
      } else {
        projectName = text;
      }
      
      currentProject = {
        name: projectName,
        description: '',
        highlights: [],
        keywords: technologies,
        url: '',
        type: 'application'
      };
      
      // Extract links
      if (links.toLowerCase().includes('live')) {
        currentProject.url = 'Live demo available';
      }
      if (links.toLowerCase().includes('github')) {
        currentProject.url += (currentProject.url ? ' | ' : '') + 'GitHub repository available';
      }
    }
    // Check if this is a bullet point or description
    else if (currentProject && (text.startsWith('•') || text.startsWith('-'))) {
      const content = text.substring(1).trim();
      
      if (!currentProject.description) {
        currentProject.description = content;
      } else {
        currentProject.highlights.push(content);
      }
    }
    // Check if this is additional project info (technologies, links)
    else if (currentProject && text.includes(',') && 
             (text.includes('React') || text.includes('Node') || text.includes('MongoDB'))) {
      // This might be a technology list
      const techs = text.split(',').map(t => t.trim());
      currentProject.keywords = [...currentProject.keywords, ...techs];
    }
  }
  
  // Don't forget the last project
  if (currentProject && currentProject.name) {
    projects.push(currentProject);
  }
  
  return projects;
}

function parseResponsibilities(responsibilityBlocks) {
  const responsibilities = [];
  
  if (!responsibilityBlocks || responsibilityBlocks.length === 0) return responsibilities;
  
  for (const block of responsibilityBlocks) {
    const text = block.text.trim();
    
    if (text.startsWith('-') || text.startsWith('•')) {
      const content = text.substring(1).trim();
      const parts = content.split(':');
      
      if (parts.length >= 2) {
        responsibilities.push({
          organization: parts[0].trim(),
          position: 'Volunteer',
          description: parts.slice(1).join(':').trim(),
          startDate: '',
          endDate: ''
        });
      } else {
        // If no colon, treat the whole thing as description
        responsibilities.push({
          organization: 'Various',
          position: 'Volunteer',
          description: content,
          startDate: '',
          endDate: ''
        });
      }
    }
  }
  
  return responsibilities;
}

export const processResume = async (req, res) => {
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

    // Process the uploaded file
    const resumeData = await extractStructuredResumeData(req.file);
    
    console.log('Parsed Resume Data:', JSON.stringify(resumeData, null, 2));
    
    // Validate against resume-schema if available
    if (typeof resumeSchema !== 'undefined') {
      resumeSchema.validate(resumeData, (err, report) => {
        if (err) {
          console.error('Validation errors:', err);
        } else {
          console.log('Valid resume structure!');
        }
      });
    }
    
    // Return structured data
    res.json({
      success: true,
      data: resumeData,
      message: 'Resume processed successfully'
    });
    
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({
      error: 'Failed to process resume',
      details: error.message
    });
  }
}
// processResume();