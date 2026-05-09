import multer from "multer"

// Use memory storage so the uploaded file lives in `req.file.buffer`.
// Required for serverless (Vercel) where the filesystem is read-only
// outside of /tmp and ephemeral per invocation.
const storage = multer.memoryStorage()

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed"), false)
    }
  },
})
