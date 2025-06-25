import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
    jobDescription: {
      type: String,
      required: true
    },
    resume: {
      type: String,
      required: true
    }
  }, 
  {
    withTimestamps: true
  }
)

export const Resume = mongoose.model('Resume', resumeSchema)

