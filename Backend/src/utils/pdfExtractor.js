import { createRequire } from "module";
import { fileURLToPath } from "url";
import PDFParser from "pdf2json";
import { cleanExtractedText } from "./textCleaner.js";

const require = createRequire(import.meta.url);

let pdfJsLegacy = null;
let pdfJsWorkerConfigured = false;

function getPdfJsLegacy() {
  if (!pdfJsLegacy) {
    pdfJsLegacy = require("pdfjs-dist/legacy/build/pdf.js");
  }
  return pdfJsLegacy;
}

function ensurePdfJsWorker() {
  if (pdfJsWorkerConfigured) return;
  const pdfjs = getPdfJsLegacy();
  const workerPath = fileURLToPath(
    new URL("../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js", import.meta.url),
  );
  pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
  pdfJsWorkerConfigured = true;
}

function normalizeUri(raw) {
  if (!raw || typeof raw !== "string") return null;
  let uri = raw.trim();
  if (!/^https?:\/\//i.test(uri) && !/^mailto:/i.test(uri)) {
    if (/^www\./i.test(uri)) uri = `https://${uri}`;
    else return null;
  }
  return uri.replace(/[)\].,;:!?]+$/, "");
}

function mergePdfHyperlinks(...linkLists) {
  const seen = new Set();
  const out = [];
  for (const list of linkLists) {
    for (const link of list || []) {
      const uri = normalizeUri(link.uri);
      if (!uri) continue;
      const key = uri.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...link, uri });
    }
  }
  return out;
}

function extractUrlsFromText(text, sourcePrefix = "text") {
  const pattern = /https?:\/\/[^\s)\]|]+/gi;
  const links = [];
  let match;
  let idx = 0;
  while ((match = pattern.exec(text)) !== null) {
    const uri = normalizeUri(match[0]);
    if (uri) {
      links.push({
        id: `${sourcePrefix}_${idx}_${Date.now()}`,
        uri,
        page: 0,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        source: sourcePrefix,
      });
      idx++;
    }
  }
  return links;
}

async function extractHyperlinksWithPdfJs(buffer) {
  ensurePdfJsWorker();
  const pdfjs = getPdfJsLegacy();
  const data = new Uint8Array(buffer);
  const pdf = await pdfjs
    .getDocument({
      data,
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
    })
    .promise;

  const hyperlinks = [];
  let globalIdx = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    let annotations;
    try {
      annotations = await page.getAnnotations({ intent: "display" });
    } catch {
      continue;
    }

    for (const annot of annotations) {
      if (annot.subtype !== "Link") continue;
      const uri = normalizeUri(annot.url || annot.unsafeUrl);
      if (!uri) continue;
      const rect = Array.isArray(annot.rect) ? annot.rect : [0, 0, 0, 0];
      hyperlinks.push({
        id: `pdfjs_p${pageNum}_${globalIdx}_${Date.now()}`,
        uri,
        page: pageNum - 1,
        x: rect[0] ?? 0,
        y: rect[1] ?? 0,
        w: Math.max(0, (rect[2] ?? 0) - (rect[0] ?? 0)),
        h: Math.max(0, (rect[3] ?? 0) - (rect[1] ?? 0)),
        source: "pdfjs_annotation",
      });
      globalIdx++;
    }
  }

  console.log(`[PDF.js] Extracted ${hyperlinks.length} hyperlink(s)`);
  return hyperlinks;
}

async function extractWithPdf2Json(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(new Error("PDF parsing error: " + errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        let fullText = "";
        const hyperlinks = [];
        const totalPages = pdfData.Pages?.length || 0;

        if (totalPages === 0) {
          reject(new Error("No pages found in PDF"));
          return;
        }

        if (pdfData.Fillings && Array.isArray(pdfData.Fillings)) {
          pdfData.Fillings.forEach((filling, idx) => {
            const uri = normalizeUri(filling.URI);
            if (uri) {
              hyperlinks.push({
                id: `filling_${idx}_${Date.now()}`,
                uri,
                page: filling.page || 0,
                source: "filling",
              });
            }
          });
        }

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          const page = pdfData.Pages[pageIndex];
          if (page.Annots && Array.isArray(page.Annots)) {
            page.Annots.forEach((annot, idx) => {
              const uri = normalizeUri(annot.A?.URI);
              if (uri) {
                hyperlinks.push({
                  id: `annot_${pageIndex}_${idx}_${Date.now()}`,
                  uri,
                  page: pageIndex,
                  x: annot.Rect?.[0] || 0,
                  y: annot.Rect?.[1] || 0,
                  source: "annotation",
                });
              }
            });
          }

          if (!page.Texts?.length) continue;

          const lines = {};
          const lineThreshold = 0.5;

          page.Texts.forEach((textObj) => {
            if (!textObj.R?.length) return;
            let text = "";
            textObj.R.forEach((run) => {
              if (run.T) {
                try {
                  text += decodeURIComponent(run.T);
                } catch {
                  text += run.T;
                }
              }
            });
            text = text.replace(/\s+/g, " ").trim();
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
            if (!lines[lineKey]) lines[lineKey] = [];
            lines[lineKey].push({
              x,
              text,
              fontSize: textObj.R[0].TS?.[1] || 12,
            });
          });

          const sortedLineKeys = Object.keys(lines).sort(
            (a, b) => parseFloat(a) - parseFloat(b),
          );

          for (const lineKey of sortedLineKeys) {
            const lineTexts = lines[lineKey].sort((a, b) => a.x - b.x);
            let lineContent = "";
            let prevX = -1;
            let prevWidth = 0;

            lineTexts.forEach((textItem) => {
              const { text, x, fontSize } = textItem;
              if (prevX !== -1) {
                const xDiff = x - (prevX + prevWidth);
                const avgCharWidth = (fontSize / 12) * 0.5;
                if (xDiff > avgCharWidth * 0.8) {
                  const prevEndsLetter = /[a-zA-Z]$/.test(lineContent.trim());
                  const curStartsLetter = /^[a-zA-Z]/.test(text);
                  if (prevEndsLetter && curStartsLetter && xDiff < avgCharWidth * 1.5) {
                    lineContent += text;
                  } else if (xDiff > avgCharWidth * 2) {
                    lineContent += " ";
                  } else if (xDiff > avgCharWidth * 0.3) {
                    lineContent += " ";
                  }
                }
              }
              lineContent += text;
              prevX = x;
              prevWidth = text.length * ((fontSize / 12) * 0.6);
            });

            const trimmed = lineContent.trim();
            if (trimmed) fullText += trimmed + "\n";
          }

          if (pageIndex < totalPages - 1) fullText += "\n";
        }

        const processedText = cleanExtractedText(fullText);
        const textLinks = extractUrlsFromText(processedText, "pdf2json_text");
        console.log(
          `[PDF2JSON] text length=${processedText.length} annot links=${hyperlinks.length} text urls=${textLinks.length}`,
        );
        resolve({
          text: processedText,
          links: mergePdfHyperlinks(hyperlinks, textLinks),
        });
      } catch (error) {
        reject(new Error("Failed to process PDF data: " + error.message));
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

async function extractWithPdfParse(buffer) {
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = pdfParseModule.default || pdfParseModule;
  const data = await pdfParse(buffer);
  const processedText = cleanExtractedText(data.text);
  const textLinks = extractUrlsFromText(processedText, "pdf_parse_text");
  console.log(
    `[PDF-PARSE] text length=${processedText.length} text urls=${textLinks.length}`,
  );
  return { text: processedText, links: textLinks };
}

/**
 * Extract plain text and hyperlinks from a PDF buffer.
 * @returns {{ text: string, links: Array<{id, uri, page?, source}> }}
 */
export async function extractTextFromPDF(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("PDF buffer is required");
  }

  let pdfJsLinks = [];
  try {
    pdfJsLinks = await extractHyperlinksWithPdfJs(buffer);
  } catch (error) {
    console.warn("[PDF.js] Hyperlink extraction failed:", error.message);
  }

  try {
    const result = await extractWithPdf2Json(buffer);
    result.links = mergePdfHyperlinks(result.links, pdfJsLinks);
    if (result.text?.trim().length > 50) return result;
  } catch (error) {
    console.warn("[PDF2JSON] failed:", error.message);
  }

  try {
    const result = await extractWithPdfParse(buffer);
    result.links = mergePdfHyperlinks(result.links, pdfJsLinks);
    if (result.text?.trim().length > 0) return result;
    throw new Error("Extracted text is empty");
  } catch (error) {
    throw new Error("Both PDF extraction methods failed: " + error.message);
  }
}
