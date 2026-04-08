
export const preprocessingPrompt = (messyText) => {
  return `
You are an expert at cleaning and normalizing resume text extracted from PDFs. The text may have parsing errors, concatenated words, corrupted characters, or formatting issues.

YOUR TASK:
Clean and normalize the following resume text by:
1. Fixing concatenated words (e.g., "Engineerseeking" → "Engineer seeking")
2. Correcting corrupted text patterns (e.g., "CYGes Ph Aw" → "CGPA")
3. Adding proper spacing between words
4. Removing duplicate content blocks
5. Organizing content into proper resume sections
6. Fixing common parsing errors while preserving all original information
7. Verifying and correcting institution/company names using your knowledge (you can use web search if needed)
8. Ensuring proper formatting for dates, contact info, and sections

IMPORTANT:
- Preserve ALL original information - do not remove any content
- Maintain the resume structure (Name, Contact, Education, Experience, Skills, etc.)
- Fix errors but keep the meaning and content intact
- If you're unsure about a word or phrase, make your best educated guess based on context
- For institutions/companies, use your knowledge to correct obvious misspellings
- Ensure proper spacing and readability

MESSY RESUME TEXT:
---START MESSY TEXT---
${messyText}
---END MESSY TEXT---

Return ONLY the cleaned and normalized resume text. No explanations, no comments. Start with the candidate's name and maintain proper resume structure.

CLEANED RESUME:
`;
};


export const resumePrompt = (resumeText, jobDescription) => {
  return `
You are an expert ATS-optimized resume writer. Your task is to tailor the provided resume to match the job description by ONLY rephrasing existing content. You must NOT add any new content.

**CRITICAL: SINGLE-PAGE CONSTRAINT**
The resume MUST fit on exactly ONE page. This is non-negotiable. To achieve this:
- Include 3-5 bullet points per experience entry (prioritize JD-relevant ones)
- Include 3-4 bullet points per project (prioritize JD-relevant ones)
- Keep summary to 3-4 concise sentences maximum
- Include all relevant skills/technologies (prioritize JD keywords but include all from original)
- Use concise, action-oriented language
- Include ALL sections from the original resume (Skills, Technical Skills, Experience/Internships, Education, Projects, Position of Responsibility, etc.)
- If you must choose, prioritize recent experiences and most relevant projects, but try to include as much as possible

IMPORTANT: The resume text may have been extracted from a PDF and may contain some formatting quirks. Use your intelligence to:
- Understand context even if some words are slightly off
- Match text patterns correctly (e.g., "B.Tech" variations, company names, dates)
- Place information in the correct sections based on context
- Verify institution/company names using your knowledge (you can use web search if needed)
- Handle any remaining parsing artifacts intelligently

CRITICAL RULES - READ CAREFULLY:
1. You can ONLY use content that exists in the original resume
2. You can ONLY rephrase existing text to match job description keywords
3. You CANNOT add new technologies, skills, experiences, or achievements
4. You CANNOT add new bullet points or sections
5. You MUST preserve the exact same format, structure, and layout
6. Use intelligent text matching to understand and correctly place information even if formatting is imperfect
7. **SINGLE-PAGE PRIORITY: Include ALL bullet points from the original resume. Do NOT remove any bullet points. If the original has 5 bullet points, include all 5. Only rephrase them to match job description keywords.**
8. **For internships, projects, and experience: Include EVERY SINGLE bullet point from the original. Rephrase the wording to match job description keywords, but preserve the complete content.**

ORIGINAL RESUME TO TAILOR:
---START RESUME---
${resumeText}

TARGET JOB DESCRIPTION:
---START JOB DESCRIPTION---
${jobDescription}
---END JOB DESCRIPTION---

WHAT YOU CAN DO:
✅ Rephrase existing bullet points to incorporate JD keywords naturally
✅ Reword existing descriptions to emphasize JD-relevant aspects
✅ Reorder existing skills/technologies to prioritize JD-relevant ones (but only if they exist in original)
✅ Adjust existing summary text to highlight JD-relevant experience
✅ Use synonyms and alternative phrasing from existing content
✅ Intelligently interpret and correct minor parsing errors while preserving original meaning
✅ Verify and standardize institution/company names using your knowledge

WHAT YOU CANNOT DO:
❌ Add ANY new technologies that aren't in the original resume
❌ Add ANY new skills that aren't in the original resume
❌ Add ANY new experiences, projects, or achievements
❌ Add new bullet points or description lines
❌ Add new sections or content
❌ Change dates, company names, educational institutions (but you can correct obvious misspellings)
❌ Change the format, structure, or layout
❌ Remove existing content (unless it's completely irrelevant - but keep structure)

CONTENT RESTRICTIONS (SINGLE-PAGE FOCUS):
- TECHNOLOGIES/SKILLS: Include ALL technologies/skills from the original resume. Do not remove any. Group them logically (Languages, Frontend, Backend, etc.) but include everything.
- EXPERIENCE/INTERNSHIPS: Include ALL bullet points from each entry. Do NOT remove any bullet points. If original has 5 bullet points, output must have 5. Only rephrase them to match job description keywords.
- PROJECTS: Include ALL bullet points from each project. Do NOT remove any bullet points. If original has 4 bullet points, output must have 4. Only rephrase them to match job description keywords.
- SUMMARY: Keep to 3-4 concise sentences maximum. Only rephrase using information already present in the resume.
- EDUCATION: Include ALL education entries with complete details: degree, institution, location, dates, and grades/CGPA.
- OTHER SECTIONS: Include ALL sections from original: Position of Responsibility, Certifications, Extracurricular Activities, Languages, etc. Include ALL entries from each section. Keep descriptions complete.

TEXT MATCHING & INTELLIGENCE:
- Use context clues to understand concatenated or corrupted words
- Match similar patterns (e.g., "B.Tech", "B.TECH", "BTech" all mean the same)
- Understand date formats even if slightly malformed
- Recognize institution names even with minor spelling variations
- Place information in correct sections based on semantic understanding

FORMATTING REQUIREMENTS:
- Preserve EXACT format, line breaks, spacing, and structure
- Keep all section headers exactly as formatted
- Maintain all bullet points and indentation
- Preserve contact information layout
- Keep the same number of lines and sections

OUTPUT FORMAT:
Return ONLY the tailored resume text in the EXACT same format as the input. Start with the candidate's name and end with the last line of the original resume. No explanations, no comments, no additional text.

TAILORED RESUME:
`;
};