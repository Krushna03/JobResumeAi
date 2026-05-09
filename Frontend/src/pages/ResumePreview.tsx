"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react"
import { HomeHeader, HomeFooter } from "@/components/home"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core"
import "@react-pdf-viewer/core/lib/styles/index.css"

const PDF_WORKER_URL =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js"

type ResumePreviewState = {
  generatedBlob?: Blob
  fileName?: string
  jobDescription?: string
  resumeFile?: File
  resumeFileName?: string
}

export default function ResumePreview() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = (location.state ?? {}) as ResumePreviewState
  const {
    generatedBlob,
    fileName,
    jobDescription,
    resumeFile,
    resumeFileName,
  } = state

  const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null)
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!generatedBlob) return
    const url = URL.createObjectURL(generatedBlob)
    setGeneratedFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [generatedBlob])

  useEffect(() => {
    if (!resumeFile) return
    const url = URL.createObjectURL(resumeFile)
    setOriginalFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [resumeFile])

  const handleDownload = () => {
    if (!generatedBlob) return
    const url = URL.createObjectURL(generatedBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName || "tailored-resume.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const originalResumeIsPdf = useMemo(() => {
    if (!resumeFile) return false
    return (
      resumeFile.type === "application/pdf" ||
      resumeFile.name.toLowerCase().endsWith(".pdf")
    )
  }, [resumeFile])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeHeader />

      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-1">
            <div>
              <Button variant="ghost" className="-px-1 hover:bg-transparent" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <h1 className="text-2xl font-bold">Your tailored resume</h1>
              <p className="text-muted-foreground">
                Compare your inputs with the tailored output.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} disabled={!generatedBlob}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </div>

          {/* Two-column layout: inputs left, generated PDF right */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Left column — inputs */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              {/* Job Description */}
              <Card className="flex h-[39vh] min-h-[280px] flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
                  <h2 className="text-sm font-semibold">Job description</h2>
                  {jobDescription ? (
                    <span className="text-xs text-muted-foreground">
                      {jobDescription.length} chars
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 overflow-auto p-4 text-sm leading-relaxed text-muted-foreground">
                  {jobDescription ? (
                    <p className="whitespace-pre-wrap">{jobDescription}</p>
                  ) : (
                    <p className="italic text-muted-foreground/70">
                      No job description provided.
                    </p>
                  )}
                </div>
              </Card>

              {/* Original Resume */}
              <Card className="flex h-[39vh] min-h-[280px] flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
                  <h2 className="text-sm font-semibold">Original resume</h2>
                  {resumeFileName ? (
                    <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                      {resumeFileName}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 overflow-hidden">
                  {originalFileUrl && originalResumeIsPdf ? (
                    <div className="pdf-viewer-no-scrollbar h-full w-full">
                      <Worker workerUrl={PDF_WORKER_URL}>
                        <Viewer
                          theme="dark"
                          fileUrl={originalFileUrl}
                          defaultScale={SpecialZoomLevel.PageWidth}
                        />
                      </Worker>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {resumeFileName
                          ? "Preview unavailable for this file type."
                          : "Original resume not available. Please re-upload."}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right column — generated PDF */}
            <Card className="h-[90vh] overflow-hidden lg:col-span-3">
              {!generatedBlob ? (
                <EmptyState />
              ) : !generatedFileUrl ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="pdf-viewer-no-scrollbar h-full w-full">
                  <Worker workerUrl={PDF_WORKER_URL}>
                    <Viewer
                      theme="dark"
                      fileUrl={generatedFileUrl}
                      defaultScale={SpecialZoomLevel.PageWidth}
                    />
                  </Worker>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p>No resume to preview</p>
      <Link to="/tailor">
        <Button>Generate one</Button>
      </Link>
    </div>
  )
}
