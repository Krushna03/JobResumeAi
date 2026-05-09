import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, ArrowRight, Rocket, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiBase, getStoredToken } from "@/lib/api"

type GenerateResumeError = {
  error?: string
  message?: string
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const match = /filename\*?=(?:UTF-\d+'')?"?([^";]+)"?/i.exec(header)
  return match ? decodeURIComponent(match[1].trim()) : null
}

export function HomeResumeGenerator() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0])
    }
  }

  const handleGenerate = async () => {
    if (!resumeFile || !jobDescription.trim()) return

    const isPdf = resumeFile.type === "application/pdf" || resumeFile.name.toLowerCase().endsWith(".pdf")
    
    if (!isPdf) {
      toast({
        title: "PDF required",
        description: "Tailoring currently supports PDF resumes. Please convert your file to PDF and try again.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)
      formData.append("jobDescription", jobDescription.trim())

      const headers = new Headers()
      const token = getStoredToken()
      if (token) headers.set("Authorization", `Bearer ${token}`)

      const res = await fetch(`${getApiBase()}/api/v1/resume/generate-resume`, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      })

      const contentType = res.headers.get("content-type") || ""

      if (!res.ok) {
        let message = res.statusText || "Request failed"
        if (contentType.includes("application/json")) {
          const data = (await res.json().catch(() => ({}))) as GenerateResumeError
          message = data.error || data.message || message
        } else {
          const text = await res.text().catch(() => "")
          if (text) message = text
        }
        throw new Error(message)
      }

      if (!contentType.includes("application/pdf")) {
        throw new Error("Unexpected response from the server. Expected a PDF.")
      }

      const generatedBlob = await res.blob()
      const generatedFileName =
        res.headers.get("X-Resume-Filename") ||
        parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ||
        `tailored-resume-${Date.now()}.pdf`
      const resumeId = res.headers.get("X-Resume-Id")

      toast({
        title: "Resume ready",
        description: "Your tailored resume is ready to preview.",
      })

      const previewPath = resumeId ? `/resume-preview/${resumeId}` : "/resume-preview"
      navigate(previewPath, {
        state: {
          generatedBlob,
          fileName: generatedFileName,
          jobDescription: jobDescription.trim(),
          resumeFile,
          resumeFileName: resumeFile.name,
          resumeId: resumeId ?? undefined,
        },
      })
    } catch (e) {
      toast({
        title: "Could not tailor resume",
        description: e instanceof Error ? e.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="relative py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Tailor your resume in minutes</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
            Drop your file, paste the role, and we’ll align wording and emphasis to what recruiters scan for first.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-5xl md:mt-12">
          <Card className="rounded-2xl border border-border bg-card/80 p-6 shadow-none backdrop-blur-sm sm:p-8 md:p-10">
            <div className="flex flex-col gap-8 md:gap-10">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                <div className="flex min-h-0 min-w-0 flex-col gap-3 md:gap-4 lg:h-full">
                  <h3 className="shrink-0 text-base font-medium text-foreground">Upload your resume</h3>
                  <div
                    className={`relative flex min-h-[220px] flex-1 flex-col justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-8 lg:min-h-[260px] ${
                      dragActive ? "border-primary/50 bg-primary/10" : "border-border hover:border-primary/30"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Upload resume file"
                    />
                    <div className="space-y-4">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 md:h-16 md:w-16">
                        {resumeFile ? (
                          <FileText className="h-7 w-7 text-emerald-400 md:h-8 md:w-8" />
                        ) : (
                          <Upload className="h-7 w-7 text-muted-foreground md:h-8 md:w-8" />
                        )}
                      </div>
                      {resumeFile ? (
                        <div>
                          <p className="break-all font-medium text-emerald-400">{resumeFile.name}</p>
                          <p className="text-sm text-muted-foreground">Ready to tailor</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-foreground">Add your resume here</p>
                          <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
                          <p className="mt-2 text-xs text-muted-foreground/80">PDF, DOC, or DOCX</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 min-w-0 flex-col gap-3 md:gap-4 lg:h-full">
                  <h3 className="shrink-0 text-base font-medium text-foreground">Job description</h3>
                  <div className="relative flex min-h-[220px] flex-1 flex-col lg:min-h-[260px]">
                    <Textarea
                      placeholder="Paste the job description here…"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      maxLength={2000}
                      className="box-border min-h-[220px] w-full flex-1 resize-none rounded-2xl border-border bg-background/50 py-3 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 lg:min-h-0"
                    />
                    <div className="pointer-events-none absolute bottom-3 right-3 text-xs text-muted-foreground/80">
                      {jobDescription.length}/2000
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => void handleGenerate()}
                disabled={!resumeFile || !jobDescription.trim() || isGenerating}
                className="h-12 w-full shrink-0 rounded-2xl border-0 text-base font-medium gradient-primary text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 md:h-14 md:text-lg"
              >
                {isGenerating && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                )}
                {isGenerating ? "Tailoring your resume…" : "Generate tailored resume"}
                {!isGenerating && (
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
