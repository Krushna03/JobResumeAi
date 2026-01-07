/**
 * Enhanced text cleaning utilities for handling messy PDF extraction
 */

/**
 * Detects and fixes concatenated words (e.g., "Engineerseeking" -> "Engineer seeking")
 */
export function fixConcatenatedWords(text) {
  if (!text) return text;
  
  // Common patterns for concatenated words
  // Pattern: lowercase letter followed by uppercase letter (word boundary)
  let cleaned = text.replace(/([a-z])([A-Z][a-z])/g, '$1 $2');
  
  // Fix common concatenations in resume context
  const commonPatterns = [
    // Education patterns
    { pattern: /([a-z])(B\.?Tech|Bachelor|Master|Diploma|Degree)/gi, replacement: '$1 $2' },
    { pattern: /([a-z])(College|University|School|Institute)/gi, replacement: '$1 $2' },
    
    // Experience patterns
    { pattern: /([a-z])(Experience|Internship|Project)/gi, replacement: '$1 $2' },
    { pattern: /([a-z])(Company|Organization|Services)/gi, replacement: '$1 $2' },
    
    // Skills patterns
    { pattern: /([a-z])(Skills|Technologies|Tools|Languages)/gi, replacement: '$1 $2' },
    
    // Common words
    { pattern: /([a-z])(seeking|seeking|utilize|contribute|growth)/gi, replacement: '$1 $2' },
    { pattern: /([a-z])(position|organization|reputable)/gi, replacement: '$1 $2' },
    
    // Contact patterns
    { pattern: /([a-z])(Email|Phone|LinkedIn|GitHub|Contact)/gi, replacement: '$1 $2' },
    
    // Date patterns
    { pattern: /([a-z])(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/gi, replacement: '$1 $2' },
    { pattern: /([a-z])(\d{4})/g, replacement: '$1 $2' },
  ];
  
  commonPatterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });
  
  return cleaned;
}

/**
 * Removes duplicate content blocks
 */
export function removeDuplicates(text) {
  if (!text) return text;
  
  const lines = text.split('\n');
  const seen = new Set();
  const uniqueLines = [];
  let consecutiveDuplicates = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const normalizedLine = line.toLowerCase().replace(/\s+/g, ' ');
    
    // Skip empty lines
    if (!line) {
      uniqueLines.push(lines[i]);
      continue;
    }
    
    // Check for exact duplicates
    if (seen.has(normalizedLine)) {
      consecutiveDuplicates++;
      if (consecutiveDuplicates > 5) {
        continue; 
      }
    } else {
      consecutiveDuplicates = 0;
      seen.add(normalizedLine);
    }
    
    uniqueLines.push(lines[i]);
  }
  
  // Also check for large duplicate blocks (like the entire resume repeated)
  const textBlocks = uniqueLines.join('\n').split(/\n{3,}/);
  const uniqueBlocks = [];
  const seenBlocks = new Set();
  
  for (const block of textBlocks) {
    const normalizedBlock = block.toLowerCase().replace(/\s+/g, ' ').trim();
    // Only remove duplicate blocks if they're very large (more than 200 chars) to avoid removing legitimate content
    if (normalizedBlock.length > 200 && seenBlocks.has(normalizedBlock)) {
      continue; // Skip duplicate block
    }
    seenBlocks.add(normalizedBlock);
    uniqueBlocks.push(block);
  }
  
  return uniqueBlocks.join('\n\n');
}

/**
 * Fixes corrupted text patterns (e.g., "CYGes Ph Aw" -> attempts to fix)
 */
export function fixCorruptedText(text) {
  if (!text) return text;
  
  // Common corruption patterns
  const corruptionFixes = [
    // Fix common character substitutions
    { pattern: /CYGes/gi, replacement: 'CGPA' },
    { pattern: /Ph Aw/gi, replacement: 'CGPA' },
    { pattern: /GDoivpelronmmeanint/gi, replacement: 'Diploma' },
    { pattern: /PCoivlyitle/gi, replacement: 'Polytechnic' },
    { pattern: /Ecnhngicin/gi, replacement: 'Engineering' },
    { pattern: /Neagrpinugr/gi, replacement: 'Nagpur' },
    
    // Fix spacing issues in corrupted text
    { pattern: /([a-z])([A-Z]{2,})/g, replacement: '$1 $2' },
    
    // Fix number-letter combinations
    { pattern: /(\d)([A-Za-z])/g, replacement: '$1 $2' },
    { pattern: /([A-Za-z])(\d)/g, replacement: '$1 $2' },
  ];
  
  let cleaned = text;
  corruptionFixes.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });
  
  return cleaned;
}

/**
 * Intelligently adds spaces between words using common resume patterns
 */
export function intelligentSpaceInsertion(text) {
  if (!text) return text;
  
  // List of common resume words/phrases to help with word boundary detection
  const resumeKeywords = [
    'B.Tech', 'B.TECH', 'Bachelor', 'Master', 'Diploma', 'Degree',
    'College', 'University', 'School', 'Institute',
    'Experience', 'Internship', 'Project', 'Skills', 'Education',
    'Email', 'Phone', 'LinkedIn', 'GitHub', 'Contact',
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    'CGPA', 'GPA', 'Percentage', 'Year', 'Years',
    'Company', 'Organization', 'Services', 'Ltd', 'PVT', 'LLC',
    'Civil', 'Engineering', 'Computer', 'Science', 'Information', 'Technology'
  ];
  
  let cleaned = text;
  
  // Try to find and fix known patterns
  resumeKeywords.forEach(keyword => {
    // Find keyword without spaces around it
    const regex = new RegExp(`([a-z])(${keyword.replace(/\./g, '\\.')})([a-z])`, 'gi');
    cleaned = cleaned.replace(regex, `$1 $2 $3`);
    
    // Find keyword at start of concatenated word
    const regexStart = new RegExp(`([a-z])(${keyword.replace(/\./g, '\\.')})`, 'gi');
    cleaned = cleaned.replace(regexStart, `$1 $2`);
    
    // Find keyword at end of concatenated word
    const regexEnd = new RegExp(`(${keyword.replace(/\./g, '\\.')})([A-Z][a-z])`, 'gi');
    cleaned = cleaned.replace(regexEnd, `$1 $2`);
  });
  
  return cleaned;
}

/**
 * Main text cleaning function that applies all cleaning steps
 */
export function cleanExtractedText(rawText) {
  if (!rawText) return rawText;
  
  let cleaned = rawText;
  
  // Step 1: Fix corrupted text patterns
  cleaned = fixCorruptedText(cleaned);
  
  // Step 2: Fix concatenated words
  cleaned = fixConcatenatedWords(cleaned);
  
  // Step 3: Intelligent space insertion
  cleaned = intelligentSpaceInsertion(cleaned);
  
  // Step 4: Remove duplicates
  cleaned = removeDuplicates(cleaned);
  
  // Step 5: Normalize whitespace (preserve line breaks)
  // Only normalize multiple spaces within lines, not newlines
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines
  cleaned = cleaned.replace(/[ \t]+\n/g, '\n'); // Remove trailing spaces before newlines
  cleaned = cleaned.replace(/\n[ \t]+/g, '\n'); // Remove leading spaces after newlines
  
  return cleaned.trim();
}

