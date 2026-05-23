import PDFDocument from 'pdfkit';
import { model } from '../config/gemini.js';
import { resumePrompt } from '../utils/prompt.js';
import { extractTextFromPDF } from '../utils/pdfExtractor.js';
import { parseResumeData } from '../utils/resumeParser.js';
import { sanitizeResumeTextForParsing } from '../utils/textCleaner.js';
import { drawContactLine, drawProjectHeader } from '../utils/pdfLinkRenderer.js';
import { Resume } from '../model/Resume.model.js';

// Mongoose returns binary fields from `.lean()` queries as a BSON Binary
// instance, not a Node Buffer. Express's `res.end(...)` only accepts
// string | Buffer | Uint8Array, so coerce here before sending.
function toBuffer(value) {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  // BSON Binary objects expose the raw bytes via .buffer
  if (value.buffer && Buffer.isBuffer(value.buffer)) return value.buffer;
  if (value.buffer) return Buffer.from(value.buffer);
  if (value instanceof Uint8Array) return Buffer.from(value);
  return null;
}

// Best-effort: take the first non-empty line of the JD as the job title.
function deriveJobTitle(jobDescription) {
  if (!jobDescription) return '';
  const firstLine = jobDescription
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return '';
  return firstLine.length > 80 ? firstLine.slice(0, 77) + '…' : firstLine;
}


async function generateTailoredResume(resumeText, jobDescription) {
  try {
    const prompt = resumePrompt(resumeText, jobDescription);
    const result = await model.generateContent(prompt);
    const response = result.response;

    const candidate = response?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      console.warn(
        `[generateTailoredResume] Gemini finished early with reason=${finishReason}.`,
      );
      if (finishReason === 'MAX_TOKENS') {
        throw new Error(
          'The model ran out of output tokens before finishing the resume. ' +
            'Increase generationConfig.maxOutputTokens.',
        );
      }
    }

    return response.text();
  } catch (error) {
    throw new Error('Failed to generate tailored resume: ' + error.message);
  }
}

// Builds the PDF entirely in memory and resolves with a Buffer.
// Avoids any filesystem writes so this works on serverless runtimes.
async function createATSFriendlyPDF(resumeData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));

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

      const contactHeight = drawContactLine(doc, resumeData.contact, {
        x: doc.page.margins.left,
        y: leftY,
        width: pageWidth,
        linkColor: primaryColor,
        plainColor: lightGray,
      });
      if (contactHeight > 0) {
        leftY += contactHeight + 5;
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
            const headerHeight = drawProjectHeader(doc, project, {
              x: rightColumnX,
              y: rightY,
              width: rightColumnWidth,
              textColor,
              linkColor: primaryColor,
            });
            rightY += headerHeight + 8;
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
                     break: true,
                     link: null,
                     underline: false,
                   });
                rightY += doc.heightOfString(`• ${cleanDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;
              }
            });
          }
          rightY += 15;
        });
      }

      doc.end();
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
    if (!resumeFile || !resumeFile.buffer) {
      return res.status(400).json({
        error: 'Please upload a resume PDF file'
      });
    }

    const reqStart = Date.now();
    const stage = (label, t0) =>
      console.log(`[createNewResume] ${label} took ${Date.now() - t0}ms`);

    let t0 = Date.now();
    const { text: resumeText, links: extractedLinks } = await extractTextFromPDF(
      resumeFile.buffer,
    );
    stage(`pdf-extract (chars=${resumeText.length}, links=${extractedLinks?.length || 0})`, t0);

    t0 = Date.now();
    console.log('[createNewResume] generating tailored resume via LLM...');
    const tailoredRaw = await generateTailoredResume(resumeText, jobDescription);
    stage(`llm-generate (chars=${tailoredRaw.length})`, t0);

    t0 = Date.now();
    const tailoredResumeText = sanitizeResumeTextForParsing(tailoredRaw);
    const resumeData = parseResumeData(tailoredResumeText, extractedLinks);
    stage('parse', t0);

    t0 = Date.now();
    const pdfBuffer = await createATSFriendlyPDF(resumeData);
    stage(`pdf-render (bytes=${pdfBuffer.length})`, t0);

    const outputFileName = `tailored-resume-${Date.now()}.pdf`;
    console.log(`[createNewResume] total elapsed=${Date.now() - reqStart}ms`);

    // Persist the resume only when the request is authenticated. Anonymous
    // generations still succeed but won't show up in the dashboard or be
    // reachable later by ID.
    let resumeId = null;
    if (req.user?._id) {
      try {
        const saved = await Resume.create({
          user: req.user._id,
          jobDescription,
          jobTitle: deriveJobTitle(jobDescription),
          originalText: resumeText,
          originalPdf: {
            data: resumeFile.buffer,
            contentType: resumeFile.mimetype || 'application/pdf',
            fileName: resumeFile.originalname || 'resume.pdf',
            size: resumeFile.size || resumeFile.buffer.length,
          },
          tailoredText: tailoredResumeText,
          parsedData: resumeData,
          generatedPdf: {
            data: pdfBuffer,
            contentType: 'application/pdf',
            fileName: outputFileName,
            size: pdfBuffer.length,
          },
        });
        resumeId = saved._id.toString();
      } catch (persistError) {
        console.error('[createNewResume] failed to persist resume:', persistError);
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${outputFileName}"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Resume-Filename', outputFileName);
    if (resumeId) res.setHeader('X-Resume-Id', resumeId);
    return res.status(200).end(pdfBuffer);
  } catch (error) {
    if (res.headersSent) return;
    res.status(500).json({
      error: 'Failed to process resume: ' + error.message
    });
  }
}

// List resumes belonging to the current user, newest first. Excludes the
// heavy binary fields from the response.
export const listMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select(
        'jobTitle jobDescription createdAt updatedAt generatedPdf.fileName generatedPdf.size originalPdf.fileName originalPdf.size',
      )
      .lean();

    const items = resumes.map((r) => ({
      id: r._id.toString(),
      jobTitle: r.jobTitle || 'Tailored resume',
      jobDescriptionPreview: (r.jobDescription || '').slice(0, 220),
      generatedFileName: r.generatedPdf?.fileName || '',
      generatedFileSize: r.generatedPdf?.size || 0,
      originalFileName: r.originalPdf?.fileName || '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.json({ success: true, count: items.length, items });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to list resumes: ' + error.message });
  }
};

// Get a single resume's metadata (no binaries) belonging to the current user.
export const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, user: req.user._id })
      .select('-originalPdf.data -generatedPdf.data')
      .lean();

    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    return res.json({
      success: true,
      data: {
        id: resume._id.toString(),
        jobTitle: resume.jobTitle || 'Tailored resume',
        jobDescription: resume.jobDescription,
        originalFileName: resume.originalPdf?.fileName || '',
        generatedFileName: resume.generatedPdf?.fileName || '',
        hasOriginalPdf: !!resume.originalPdf?.size,
        hasGeneratedPdf: !!resume.generatedPdf?.size,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to fetch resume: ' + error.message });
  }
};

// Stream the generated tailored PDF for a resume.
export const getGeneratedResumePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, user: req.user._id })
      .select('+generatedPdf.data generatedPdf.fileName generatedPdf.contentType')
      .lean();

    const pdfBuffer = toBuffer(resume?.generatedPdf?.data);
    if (!resume || !pdfBuffer) {
      return res.status(404).json({ error: 'Generated PDF not found' });
    }

    const fileName =
      resume.generatedPdf.fileName || `tailored-resume-${id}.pdf`;
    res.setHeader(
      'Content-Type',
      resume.generatedPdf.contentType || 'application/pdf',
    );
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Resume-Filename', fileName);
    return res.status(200).end(pdfBuffer);
  } catch (error) {
    if (res.headersSent) return;
    return res
      .status(500)
      .json({ error: 'Failed to fetch PDF: ' + error.message });
  }
};

// Stream the originally uploaded PDF for a resume.
export const getOriginalResumePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, user: req.user._id })
      .select('+originalPdf.data originalPdf.fileName originalPdf.contentType')
      .lean();

    const pdfBuffer = toBuffer(resume?.originalPdf?.data);
    if (!resume || !pdfBuffer) {
      return res.status(404).json({ error: 'Original PDF not found' });
    }

    const fileName =
      resume.originalPdf.fileName || `original-resume-${id}.pdf`;
    res.setHeader(
      'Content-Type',
      resume.originalPdf.contentType || 'application/pdf',
    );
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Resume-Filename', fileName);
    return res.status(200).end(pdfBuffer);
  } catch (error) {
    if (res.headersSent) return;
    return res
      .status(500)
      .json({ error: 'Failed to fetch PDF: ' + error.message });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Resume.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });
    if (!result) return res.status(404).json({ error: 'Resume not found' });
    return res.json({ success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to delete resume: ' + error.message });
  }
};