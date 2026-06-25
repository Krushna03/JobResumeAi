"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react"
import { HomeHeader, HomeFooter } from "@/components/home"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

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
  resumeId?: string
}

type ResumeMetadata = {
  id: string
  jobTitle: string
  jobDescription: string
  originalFileName: string
  generatedFileName: string
  hasOriginalPdf: boolean
  hasGeneratedPdf: boolean
  createdAt: string
  updatedAt: string
}

export default function ResumePreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { id: idFromRoute } = useParams<{ id?: string }>()

  const state = (location.state ?? {}) as ResumePreviewState

  // ---------- Fast-path: data passed via navigation state ----------
  // Use it to render immediately while the by-id fetch (if any) loads.
  const [jobDescription, setJobDescription] = useState<string | undefined>(
    state.jobDescription,
  )
  const [generatedFileName, setGeneratedFileName] = useState<string | undefined>(
    state.fileName,
  )
  const [originalFileName, setOriginalFileName] = useState<string | undefined>(
    state.resumeFileName,
  )
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(
    state.generatedBlob ?? null,
  )
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(
    state.resumeFile ?? null,
  )

  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(
    Boolean(idFromRoute) && !state.generatedBlob,
  )
  const [loadError, setLoadError] = useState<string | null>(null)

  // ---------- Fetch by ID (when arriving via /resume-preview/:id) ----------
  useEffect(() => {
    if (!idFromRoute) return

    const controller = new AbortController()
    let cancelled = false

    const fetchAll = async () => {
      try {
        // 1) Metadata (always fetch — gives us up-to-date JD, file names, etc.)
        const metaRes = await apiFetch(
          `/api/v1/resume/${idFromRoute}`,
          { signal: controller.signal },
        )
        if (!metaRes.ok) {
          if (metaRes.status === 401) throw new Error("Please log in to view this resume.")
          if (metaRes.status === 404) throw new Error("This resume could not be found.")
          throw new Error("Failed to load this resume.")
        }
        const metaJson = (await metaRes.json()) as { data: ResumeMetadata }
        if (cancelled) return
        const meta = metaJson.data
        setJobDescription(meta.jobDescription)
        setGeneratedFileName(meta.generatedFileName || `tailored-resume-${meta.id}.pdf`)
        setOriginalFileName(meta.originalFileName || "")

        // 2) Generated PDF — skip if we already have it from navigation state.
        if (!generatedBlob && meta.hasGeneratedPdf) {
          const pdfRes = await apiFetch(
            `/api/v1/resume/${meta.id}/pdf`,
            { signal: controller.signal },
          )
          if (pdfRes.ok) {
            const blob = await pdfRes.blob()
            if (!cancelled) setGeneratedBlob(blob)
          }
        }

        // 3) Original PDF — also skip if we already have it.
        if (!originalBlob && meta.hasOriginalPdf) {
          const origRes = await apiFetch(
            `/api/v1/resume/${meta.id}/original`,
            { signal: controller.signal },
          )
          if (origRes.ok) {
            const blob = await origRes.blob()
            if (!cancelled) setOriginalBlob(blob)
          }
        }
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === "AbortError")) return
        const msg = e instanceof Error ? e.message : "Something went wrong."
        setLoadError(msg)
        toast({
          title: "Could not load resume",
          description: msg,
          variant: "destructive",
        })
      } finally {
        if (!cancelled) setIsLoadingMetadata(false)
      }
    }

    void fetchAll()

    return () => {
      cancelled = true
      controller.abort()
    }
    // We intentionally don't depend on generatedBlob/originalBlob: they're
    // populated by this effect itself and would cause an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFromRoute])

  const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null)
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!generatedBlob) return
    const url = URL.createObjectURL(generatedBlob)
    setGeneratedFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [generatedBlob])

  useEffect(() => {
    if (!originalBlob) return
    const url = URL.createObjectURL(originalBlob)
    setOriginalFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [originalBlob])

  const handleDownload = () => {
    if (!generatedBlob) return
    const url = URL.createObjectURL(generatedBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = generatedFileName || "tailored-resume.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const originalResumeIsPdf = useMemo(() => {
    if (!originalBlob) return false
    if (originalBlob instanceof File) {
      return (
        originalBlob.type === "application/pdf" ||
        originalBlob.name.toLowerCase().endsWith(".pdf")
      )
    }
    if (originalBlob.type) return originalBlob.type === "application/pdf"
    return originalFileName?.toLowerCase().endsWith(".pdf") ?? true
  }, [originalBlob, originalFileName])

  // No id and no state → user landed here without going through generation.
  const hasAnyData = generatedBlob || idFromRoute

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
            <div className="flex flex-col gap-4 lg:col-span-2 lg:h-[90vh]">
              {/* Job Description */}
              <Card className="flex min-h-[280px] flex-1 flex-col overflow-hidden lg:min-h-0">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
                  <h2 className="text-sm font-semibold">Job description</h2>
                  {jobDescription ? (
                    <span className="text-xs text-muted-foreground">
                      {jobDescription.length} chars
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 overflow-auto p-4 text-sm leading-relaxed text-muted-foreground">
                  {isLoadingMetadata && !jobDescription ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : jobDescription ? (
                    <p className="whitespace-pre-wrap">{jobDescription}</p>
                  ) : (
                    <p className="italic text-muted-foreground/70">
                      No job description available.
                    </p>
                  )}
                </div>
              </Card>

              {/* Original Resume */}
              <Card className="flex min-h-[280px] flex-1 flex-col overflow-hidden lg:min-h-0">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
                  <h2 className="text-sm font-semibold">Original resume</h2>
                  {originalFileName ? (
                    <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                      {originalFileName}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 overflow-hidden">
                  {isLoadingMetadata && !originalFileUrl ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : originalFileUrl && originalResumeIsPdf ? (
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
                        {originalFileName
                          ? "Preview unavailable for this file type."
                          : "Original resume not available."}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right column — generated PDF */}
            <Card className="h-[90vh] overflow-hidden lg:col-span-3">
              {!hasAnyData ? (
                <EmptyState />
              ) : loadError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-sm text-destructive">{loadError}</p>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    Go to dashboard
                  </Button>
                </div>
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
