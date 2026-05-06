"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Download, FileText, Loader2, RefreshCw } from "lucide-react"
import { HomeHeader, HomeFooter } from "@/components/home"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getApiBase, getStoredToken } from "@/lib/api"

import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core"
import "@react-pdf-viewer/core/lib/styles/index.css"

const PDF_WORKER_URL =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js"

type ResumePreviewState = {
  downloadUrl?: string
  fileName?: string
  message?: string
  jobDescription?: string
  resumeFile?: File
  resumeFileName?: string
}

export default function ResumePreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const state = (location.state ?? {}) as ResumePreviewState
  const {
    downloadUrl,
    fileName,
    message,
    jobDescription,
    resumeFile,
    resumeFileName,
  } = state

  const absoluteUrl = useMemo(() => {
    if (!downloadUrl) return null
    return `${getApiBase()}${downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`}`
  }, [downloadUrl])

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null)
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(absoluteUrl))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!absoluteUrl) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    const load = async () => {
      try {
        const headers = new Headers()
        const token = getStoredToken()
        if (token) headers.set("Authorization", `Bearer ${token}`)

        const res = await fetch(absoluteUrl, {
          headers,
          credentials: "include",
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error("Could not load your tailored resume.")
        }

        const blob = await res.blob()

        if (blob.type !== "application/pdf") {
          throw new Error("Invalid file type received from server.")
        }

        setPdfBlob(blob)
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return

        const msg = e instanceof Error ? e.message : "Something went wrong."
        setError(msg)

        toast({
          title: "Could not display resume",
          description: msg,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    load()

    return () => controller.abort()
  }, [absoluteUrl, toast])

  useEffect(() => {
    if (!pdfBlob) return

    const url = URL.createObjectURL(pdfBlob)
    setGeneratedFileUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [pdfBlob])

  useEffect(() => {
    if (!resumeFile) return

    const url = URL.createObjectURL(resumeFile)
    setOriginalFileUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [resumeFile])

  const handleDownload = () => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)

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
                {message || "Compare your inputs with the tailored output."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} disabled={!pdfBlob}>
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
              {!absoluteUrl ? (
                <EmptyState />
              ) : isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin" />
                </div>
              ) : error ? (
                <ErrorState message={error} onRetry={() => navigate(0)} />
              ) : generatedFileUrl ? (
                <div className="pdf-viewer-no-scrollbar h-full w-full">
                  <Worker workerUrl={PDF_WORKER_URL}>
                    <Viewer
                      theme="dark"
                      fileUrl={generatedFileUrl}
                      defaultScale={SpecialZoomLevel.PageWidth}
                    />
                  </Worker>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="text-red-500">{message}</p>
      <Button onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" /> Retry
      </Button>
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
