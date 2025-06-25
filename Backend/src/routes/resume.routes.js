import express from "express"
import { createNewResume, processResume } from "../controller/resume.controller.js";
// import { verifyJWT } from "../middleware/auth.middleware.js";
const router = express()
import { upload } from "../middleware/multer.middleware.js"

// router.route('/generate-resume').post(upload.single('resume'), processResume)
router.route('/generate-resume').post(upload.single('resume'), createNewResume)


// app.get('/api/health', (req, res) => {
//   res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
// });

export default router;