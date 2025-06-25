const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  masterResume: {
    originalText: String,
    parsedData: {
      personalInfo: Object,
      summary: String,
      experience: Array,
      education: Array,
      skills: Array,
      projects: Array,
      certifications: Array
    }
  },
  tailoredResumes: [{
    jobTitle: String,
    company: String,
    jobDescription: String,
    tailoredContent: Object,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);