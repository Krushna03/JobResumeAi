import express from "express";
import {
  createNewResume,
  listMyResumes,
  getResumeById,
  getGeneratedResumePdf,
  getOriginalResumePdf,
  deleteResume,
} from "../controller/resume.controller.js";
import { optionalJWT, verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.route("/generate-resume").post(optionalJWT, upload.single("resume"), createNewResume);

// Read endpoints — all require auth so users only ever see their own data.
router.route("/mine").get(verifyJWT, listMyResumes);
router.route("/:id").get(verifyJWT, getResumeById);
router.route("/:id").delete(verifyJWT, deleteResume);
router.route("/:id/pdf").get(verifyJWT, getGeneratedResumePdf);
router.route("/:id/original").get(verifyJWT, getOriginalResumePdf);

export default router;