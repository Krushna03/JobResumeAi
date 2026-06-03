import express from "express";
import { createNewResume, importExistingResume, listMyResumes, getResumeById, getGeneratedResumePdf, getOriginalResumePdf, deleteResume } from "../controller/resume.controller.js";
import { optionalJWT, verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.route("/generate-resume").post(optionalJWT, upload.single("resume"), createNewResume);

router.route("/import").post(
  verifyJWT,
  upload.fields([
    { name: "original", maxCount: 1 },
    { name: "generated", maxCount: 1 },
  ]),
  importExistingResume,
);

router.route("/mine").get(verifyJWT, listMyResumes);

router.route("/:id").get(verifyJWT, getResumeById);

router.route("/:id").delete(verifyJWT, deleteResume);

router.route("/:id/pdf").get(verifyJWT, getGeneratedResumePdf);

router.route("/:id/original").get(verifyJWT, getOriginalResumePdf);

export default router;