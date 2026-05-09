import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      default: "",
    },
    originalText: {
      type: String,
      default: "",
    },
    originalPdf: {
      data: { type: Buffer, select: false },
      contentType: { type: String, default: "application/pdf" },
      fileName: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },
    tailoredText: {
      type: String,
      default: "",
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedPdf: {
      data: { type: Buffer, select: false },
      contentType: { type: String, default: "application/pdf" },
      fileName: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Resume = mongoose.models.Resume || mongoose.model("Resume", resumeSchema);

export default Resume;
