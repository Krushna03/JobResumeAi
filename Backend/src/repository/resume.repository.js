import { Resume } from '../model/Resume.model.js';

// Data-access layer for the Resume collection. Keeps all Mongoose query
// details in one place so services stay free of persistence concerns.

export function createResume(payload) {
  return Resume.create(payload);
}


export function listResumesByUser(userId) {
  return Resume.find({ user: userId })
    .sort({ createdAt: -1 })
    .select(
      'jobTitle jobDescription createdAt updatedAt generatedPdf.fileName generatedPdf.size originalPdf.fileName originalPdf.size',
    )
    .lean();
}


export function findResumeMetaForUser(id, userId) {
  return Resume.findOne({ _id: id, user: userId })
    .select('-originalPdf.data -generatedPdf.data')
    .lean();
}


export function findGeneratedPdfForUser(id, userId) {
  return Resume.findOne({ _id: id, user: userId })
    .select('+generatedPdf.data generatedPdf.fileName generatedPdf.contentType')
    .lean();
}


export function findOriginalPdfForUser(id, userId) {
  return Resume.findOne({ _id: id, user: userId })
    .select('+originalPdf.data originalPdf.fileName originalPdf.contentType')
    .lean();
}


export function deleteResumeForUser(id, userId) {
  return Resume.findOneAndDelete({ _id: id, user: userId });
}
