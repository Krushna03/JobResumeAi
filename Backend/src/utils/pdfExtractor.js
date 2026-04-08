import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import PDFParser from 'pdf2json';
import { cleanExtractedText } from './textCleaner.js';

const require = createRequire(import.meta.url);

let pdfJsLegacy = null;
let pdfJsWorkerConfigured = false;

function getPdfJsLegacy() {
  if (!pdfJsLegacy) {
    pdfJsLegacy = require('pdfjs-dist/legacy/build/pdf.js');
  }
  return pdfJsLegacy;
}

function ensurePdfJsWorker() {
  if (pdfJsWorkerConfigured) return;
  const pdfjs = getPdfJsLegacy();
  const workerPath = fileURLToPath(
    new URL('../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js', import.meta.url)
  );
  pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
  pdfJsWorkerConfigured = true;
}

/**
 * Extract URI actions from PDF link annotations using Mozilla pdf.js.
 * pdf2json often misses or mis-shapes annotations; this pass fills the gap.
 */
async function extractHyperlinksWithPdfJs(filePath) {
  ensurePdfJsWorker();
  const pdfjs = getPdfJsLegacy();
  const buf = fs.readFileSync(filePath);
  const data = new Uint8Array(buf);
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;
  const hyperlinks = [];
  let globalIdx = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    let annotations;
    try {
      annotations = await page.getAnnotations({ intent: 'display' });
    } catch (e) {
      console.warn(`[PDF.js] getAnnotations failed for page ${pageNum}:`, e.message);
      continue;
    }

    for (const annot of annotations) {
      if (annot.subtype !== 'Link') continue;
      const rawUri = annot.url || annot.unsafeUrl;
      if (!rawUri || typeof rawUri !== 'string') continue;

      let uri = rawUri.trim();
      if (!/^https?:\/\//i.test(uri) && !/^mailto:/i.test(uri)) {
        if (/^www\./i.test(uri)) uri = 'https://' + uri;
        else continue;
      }
      uri = uri.replace(/[)\].,;:!?]+$/, '');

      const rect = Array.isArray(annot.rect) ? annot.rect : [0, 0, 0, 0];
      hyperlinks.push({
        id: `pdfjs_p${pageNum}_${globalIdx}_${Date.now()}`,
        uri,
        page: pageNum - 1,
        x: rect[0] ?? 0,
        y: rect[1] ?? 0,
        w: Math.max(0, (rect[2] ?? 0) - (rect[0] ?? 0)),
        h: Math.max(0, (rect[3] ?? 0) - (rect[1] ?? 0)),
        source: 'pdfjs_annotation',
      });
      globalIdx++;
    }
  }

  console.log(
    `[PDF.js] Extracted ${hyperlinks.length} hyperlink(s):`,
    hyperlinks.map((l) => ({ uri: l.uri, page: l.page }))
  );
  return hyperlinks;
}

function mergePdfHyperlinks(baseLinks, pdfJsLinks) {
  const seen = new Set();
  const out = [];
  for (const link of [...(baseLinks || []), ...(pdfJsLinks || [])]) {
    const uri = (link.uri || '').trim();
    if (!uri) continue;
    const key = uri.toLowerCase().replace(/[)\].,;:!?]+$/, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(link);
  }
  return out;
}

export async function extractTextFromPDF(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('PDF file does not exist: ' + filePath);
  }

  let pdfJsLinks = [];
  try {
    pdfJsLinks = await extractHyperlinksWithPdfJs(filePath);
  } catch (error) {
    console.warn('[PDF.js] Hyperlink extraction failed:', error.message);
  }

  try {
    const result = await extractWithPdf2Json(filePath);
    result.links = mergePdfHyperlinks(result.links, pdfJsLinks);
    console.log(
      '[PDF extract] pdf2json text length:',
      result.text?.length,
      '| merged links:',
      result.links?.length
    );
    if (result.text && result.text.trim().length > 50) {
      return result;
    }
  } catch (error) {
    console.warn('pdf2json extraction failed, trying pdf-parse:', error.message);
  }
  try {
    const result = await extractWithPdfParse(filePath);
    result.links = mergePdfHyperlinks(result.links, pdfJsLinks);
    console.log(
      '[PDF extract] pdf-parse text length:',
      result.text?.length,
      '| merged links:',
      result.links?.length
    );
    if (result.text && result.text.trim().length > 0) {
      return result;
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
        const hyperlinks = [];
        
        if (totalPages === 0) {
          reject(new Error('No pages found in PDF'));
          return;
        }
        
        // Extract hyperlinks from Fillings property
        if (pdfData.Fillings && Array.isArray(pdfData.Fillings)) {
          pdfData.Fillings.forEach((filling, idx) => {
            if (filling.URI && filling.URI.trim()) {
              hyperlinks.push({
                id: `filling_${idx}_${Date.now()}`,
                uri: filling.URI.trim(),
                page: filling.page || 0,
                x: filling.x || 0,
                y: filling.y || 0,
                w: filling.w || 0,
                h: filling.h || 0,
                source: 'filling'
              });
            }
          });
        }
        
        // Also check for links in Annots (Annotations) on each page
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          const page = pdfData.Pages[pageIndex];
          if (page.Annots && Array.isArray(page.Annots)) {
            page.Annots.forEach((annot, idx) => {
              if (annot.A && annot.A.URI && annot.A.URI.trim()) {
                hyperlinks.push({
                  id: `annot_${pageIndex}_${idx}_${Date.now()}`,
                  uri: annot.A.URI.trim(),
                  page: pageIndex,
                  x: annot.Rect?.[0] || 0,
                  y: annot.Rect?.[1] || 0,
                  w: annot.Rect ? (annot.Rect[2] - annot.Rect[0]) : 0,
                  h: annot.Rect ? (annot.Rect[3] - annot.Rect[1]) : 0,
                  source: 'annotation'
                });
              }
            });
          }
        }
        
        console.log(`[PDF2JSON] Extracted ${hyperlinks.length} hyperlinks:`, hyperlinks.map(l => ({ id: l.id, uri: l.uri, source: l.source })));
        
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
                  const avgCharWidth = (fontSize / 12) * 0.5;
                  const spaceWidth = avgCharWidth * 0.3;
                  
                  if (xDiff > avgCharWidth * 0.8) {
                    const prevEndsWithLetter = /[a-zA-Z]$/.test(lineContent.trim());
                    const currentStartsWithLetter = /^[a-zA-Z]/.test(text);
                    
                    if (prevEndsWithLetter && currentStartsWithLetter && xDiff < avgCharWidth * 1.5) {
                      lineContent += text;
                    } else if (xDiff > avgCharWidth * 2) {
                      lineContent += ' ';
                    } else if (xDiff > spaceWidth) {
                      lineContent += ' ';
                    }
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
        resolve({ text: processedText, links: hyperlinks });
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
    
    // Extract URLs from text (fallback for pdf-parse which doesn't extract hyperlinks directly)
    const urlPattern = /https?:\/\/[^\s\)]+/gi;
    const extractedLinks = [];
    let match;
    let linkIndex = 0;
    while ((match = urlPattern.exec(data.text)) !== null) {
      extractedLinks.push({
        id: `text_${linkIndex}_${Date.now()}`,
        uri: match[0].trim(),
        page: 0,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        source: 'text_extraction'
      });
      linkIndex++;
    }
    
    console.log(`[PDF-PARSE] Extracted ${extractedLinks.length} URLs from text:`, extractedLinks.map(l => ({ id: l.id, uri: l.uri, source: l.source })));
    
    return { text: processedText, links: extractedLinks };
  } catch (error) {
    throw new Error('pdf-parse extraction failed: ' + error.message);
  }
}

function processExtractedText(rawText) {
  let text = cleanExtractedText(rawText);
  
  // Format-specific fixes
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

function isHeaderLine(line) {
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

