import * as resumeService from '../service/resume.service.js';

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

    const { pdfBuffer, outputFileName, resumeId } =
      await resumeService.createTailoredResume({
        resumeFile,
        jobDescription,
        userId: req.user?._id,
      });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${outputFileName}"`);
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
    const items = await resumeService.listResumes(req.user._id);

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

    const data = await resumeService.getResumeMeta(id, req.user._id);

    if (!data) return res.status(404).json({ error: 'Resume not found' });

    return res.json({ success: true, data });

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

    const pdf = await resumeService.getGeneratedPdf(id, req.user._id);

    if (!pdf) {
      return res.status(404).json({ error: 'Generated PDF not found' });
    }

    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);
    res.setHeader('Content-Length', pdf.buffer.length);
    res.setHeader('X-Resume-Filename', pdf.fileName);

    return res.status(200).end(pdf.buffer);
  
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
   
    const pdf = await resumeService.getOriginalPdf(id, req.user._id);

    if (!pdf) {
      return res.status(404).json({ error: 'Original PDF not found' });
    }

    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);
    res.setHeader('Content-Length', pdf.buffer.length);
    res.setHeader('X-Resume-Filename', pdf.fileName);
 
    return res.status(200).end(pdf.buffer);
 
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
    
    const deleted = await resumeService.deleteResume(id, req.user._id);
    
    if (!deleted) return res.status(404).json({ error: 'Resume not found' });

    return res.json({ success: true });

  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to delete resume: ' + error.message });
  }
};