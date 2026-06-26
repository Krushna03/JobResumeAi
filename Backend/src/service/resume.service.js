import { model } from '../config/gemini.js';
import { resumePrompt } from '../utils/prompt.js';
import { extractTextFromPDF } from '../utils/pdfExtractor.js';
import { parseResumeData } from '../utils/resumeParser.js';
import { sanitizeResumeTextForParsing } from '../utils/textCleaner.js';
import { createATSFriendlyPDF } from '../utils/resumePdf.js';
import * as resumeRepository from '../repository/resume.repository.js';

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



// Orchestrates the full tailoring pipeline: extract -> LLM -> parse -> render,
// then persists the result when a user is present. Returns the PDF buffer and
// metadata for the HTTP layer to stream back.
export async function createTailoredResume({ resumeFile, jobDescription, userId }) {
  const reqStart = Date.now();
  const stage = (label, t0) => console.log(`[createNewResume] ${label} took ${Date.now() - t0}ms`);

  let t0 = Date.now();
  
  const { text: resumeText, links: extractedLinks } = await extractTextFromPDF(resumeFile.buffer);
  
  stage(`pdf-extract (chars=${resumeText.length}, links=${extractedLinks?.length || 0})`, t0);

  t0 = Date.now();
  console.log('[createNewResume] generating tailored resume via LLM...');
  const tailoredRaw = await generateTailoredResume(resumeText, jobDescription);
  stage(`llm-generate (chars=${tailoredRaw.length})`, t0);

  t0 = Date.now();
  const tailoredResumeText = sanitizeResumeTextForParsing(tailoredRaw);
  const resumeData = parseResumeData(tailoredResumeText, extractedLinks);
  stage('parse', t0);

  console.log("[resumeData>>>>>]", resumeData);

  t0 = Date.now();
  const pdfBuffer = await createATSFriendlyPDF(resumeData);
  stage(`pdf-render (bytes=${pdfBuffer.length})`, t0);

  const outputFileName = `tailored-resume-${Date.now()}.pdf`;
  console.log(`[createNewResume] total elapsed=${Date.now() - reqStart}ms`);

  // Persist the resume only when the request is authenticated. Anonymous
  // generations still succeed but won't show up in the dashboard or be
  // reachable later by ID.
  let resumeId = null;
  if (userId) {
    try {
      const saved = await resumeRepository.createResume({
        user: userId,
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

  return { pdfBuffer, outputFileName, resumeId };
}



// Returns the dashboard list view for a user's resumes.
export async function listResumes(userId) {
  const resumes = await resumeRepository.listResumesByUser(userId);

  return resumes.map((r) => ({
    id: r._id.toString(),
    jobTitle: r.jobTitle || 'Tailored resume',
    jobDescriptionPreview: (r.jobDescription || '').slice(0, 220),
    generatedFileName: r.generatedPdf?.fileName || '',
    generatedFileSize: r.generatedPdf?.size || 0,
    originalFileName: r.originalPdf?.fileName || '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}



// Returns a single resume's metadata, or null when not found / not owned.
export async function getResumeMeta(id, userId) {
  const resume = await resumeRepository.findResumeMetaForUser(id, userId);
  if (!resume) return null;

  return {
    id: resume._id.toString(),
    jobTitle: resume.jobTitle || 'Tailored resume',
    jobDescription: resume.jobDescription,
    originalFileName: resume.originalPdf?.fileName || '',
    generatedFileName: resume.generatedPdf?.fileName || '',
    hasOriginalPdf: !!resume.originalPdf?.size,
    hasGeneratedPdf: !!resume.generatedPdf?.size,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}



// Returns the generated PDF buffer + metadata, or null when unavailable.
export async function getGeneratedPdf(id, userId) {
  const resume = await resumeRepository.findGeneratedPdfForUser(id, userId);
  const pdfBuffer = toBuffer(resume?.generatedPdf?.data);
  if (!resume || !pdfBuffer) return null;

  return {
    buffer: pdfBuffer,
    fileName: resume.generatedPdf.fileName || `tailored-resume-${id}.pdf`,
    contentType: resume.generatedPdf.contentType || 'application/pdf',
  };
}



// Returns the original uploaded PDF buffer + metadata, or null when unavailable.
export async function getOriginalPdf(id, userId) {
  const resume = await resumeRepository.findOriginalPdfForUser(id, userId);
  const pdfBuffer = toBuffer(resume?.originalPdf?.data);
  if (!resume || !pdfBuffer) return null;

  return {
    buffer: pdfBuffer,
    fileName: resume.originalPdf.fileName || `original-resume-${id}.pdf`,
    contentType: resume.originalPdf.contentType || 'application/pdf',
  };
}



// Deletes a resume owned by the user. Returns true when something was removed.
export async function deleteResume(id, userId) {
  const result = await resumeRepository.deleteResumeForUser(id, userId);
  return !!result;
}
