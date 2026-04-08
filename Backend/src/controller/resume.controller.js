import fs from 'fs';
import path from 'path';
import { model } from "../index.js";
import { resumePrompt, preprocessingPrompt } from '../utils/prompt.js';
import { extractTextFromPDF } from '../utils/pdfExtractor.js';
import { parseResumeData } from '../utils/resumeParser.js';
import { createATSFriendlyPDF } from '../utils/pdfGenerator.js';


async function preprocessResumeText(messyText) {
  try {
    const hasConcatenatedWords = /[a-z][A-Z][a-z]/.test(messyText);
    const hasCorruptedPatterns = /[A-Z]{3,}[a-z]|[a-z]{3,}[A-Z]{2,}/.test(messyText);
    const hasManyDuplicates = (messyText.match(/\n/g) || []).length > 0 && 
                              new Set(messyText.split('\n').slice(0, 20).map(l => l.trim().toLowerCase())).size < 10;
    
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

    // Step 1: Extract text and links from PDF
    const extractionResult = await extractTextFromPDF(resumeFile?.path);
    let resumeText = extractionResult.text;
    const extractedLinks = extractionResult.links || [];
    console.log('=== PDF EXTRACTION SUMMARY ===');
    console.log('Extracted text length:', resumeText.length);
    console.log('Extracted links count:', extractedLinks.length);
    console.log('Extracted text preview (first 1000 chars):', resumeText.substring(0, 1000));
    console.log('=== EXTRACTED LINKS WITH IDs ===');
    extractedLinks.forEach((link, idx) => {
      console.log(`Link ${idx + 1}:`, {
        id: link.id || `missing_${idx}`,
        uri: link.uri,
        source: link.source || 'unknown',
        page: link.page,
        position: { x: link.x, y: link.y }
      });
    });
    console.log('================================');
    
    // Step 2: Preprocess with AI to clean and normalize messy extraction
    resumeText = await preprocessResumeText(resumeText);
    console.log('Preprocessed text length:', resumeText.length);
    console.log('Preprocessed text preview (first 1000 chars):', resumeText);
    
    // Step 3: Generate tailored resume
    const tailoredResumeText = await generateTailoredResume(resumeText, jobDescription);
    console.log('Tailored resume text length:', tailoredResumeText.length);
    console.log('Tailored resume preview (first 1000 chars):', tailoredResumeText);
    
    // Step 4: Parse the tailored resume with links
    let resumeData;
    try {
      resumeData = parseResumeData(tailoredResumeText, extractedLinks);
      
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
        console.log(`  Project ${idx + 1}:`, proj.name || 'N/A', '| Descriptions:', proj.description.length, '| Links:', proj.links?.length || 0);
        if (proj.description.length > 0) {
          proj.description.forEach((desc, dIdx) => {
            console.log(`    Desc ${dIdx + 1}:`, desc.substring(0, 80));
          });
        } else {
          console.warn(`  ⚠️ WARNING: No descriptions found for project ${idx + 1}`);
        }
        if (proj.links && proj.links.length > 0) {
          proj.links.forEach((link, lIdx) => {
            const linkUri = typeof link === 'string' ? link : (link.uri || 'N/A');
            console.log(`    Link ${lIdx + 1}:`, linkUri);
          });
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
