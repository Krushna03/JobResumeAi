"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Zap, Target, CheckCircle, ArrowRight, Brain, Rocket } from "lucide-react"

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [dragActive, setDragActive] = useState(false)

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

  const handleGenerate = () => {
    if (resumeFile && jobDescription.trim()) {
      console.log("Generating resume with:", { resumeFile, jobDescription })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-7 w-7 text-white" />
            <span className="text-xl font-semibold text-white">JobResumeAI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors text-sm">
              How it Works
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors text-sm">
              Pricing
            </a>
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 text-sm">
              Log in
            </Button>
            <Button className="bg-white text-black hover:bg-gray-100 text-sm font-medium px-4 py-2 rounded-full">
              Book a demo →
            </Button>
          </nav>
        </div>
      </header>

      {/* Case Study Banner */}
      {/* <section className="container mx-auto px-6 py-6">
        <div className="flex justify-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 text-sm text-gray-300">
            <span>Case study: How Sarah increased interview calls by 300% →</span>
          </div>
        </div>
      </section> */}

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-10 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
            Generate 10x better
            <br />
            <span className="text-gray-400">resumes with AI</span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Upload your resume and job description to create perfectly tailored resumes that pass ATS systems and get
            you more interviews.
          </p>

          {/* CTA Buttons */}
          {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <div className="relative">
              <Input
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-12 w-80 rounded-full px-6"
              />
            </div>
            <Button className="bg-white text-black hover:bg-gray-100 h-12 px-8 rounded-full font-medium">
              Start generating
            </Button>
          </div> */}
        </div>
      </section>

      {/* Main Generator Section */}
      <section className="container mx-auto px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8 rounded-2xl">
            <div className="space-y-8">
              {/* Resume Upload Area */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Upload Your Resume</h3>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    dragActive ? "border-white/40 bg-white/10" : "border-white/20 hover:border-white/30"
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
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                      {resumeFile ? (
                        <FileText className="h-8 w-8 text-green-400" />
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {resumeFile ? (
                      <div>
                        <p className="text-green-400 font-medium">{resumeFile.name}</p>
                        <p className="text-sm text-gray-400">File uploaded successfully</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white font-medium">Add your resume here</p>
                        <p className="text-sm text-gray-400">Drag and drop or click to browse</p>
                        <p className="text-xs text-gray-500 mt-2">Supports PDF, DOC, DOCX files</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description Input */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Job Description</h3>
                <div className="relative">
                  <Textarea
                    placeholder="Paste the job description here to tailor your resume perfectly..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400 min-h-[120px] resize-none rounded-2xl"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-500">{jobDescription.length}/2000</div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!resumeFile || !jobDescription.trim()}
                className="w-full h-14 bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium rounded-2xl"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Generate AI-Powered Resume
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Why Choose ResumeAI?</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our AI-powered platform helps you create resumes that stand out and get results
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/5 border-white/10 p-8 hover:bg-white/10 transition-colors rounded-2xl">
            <Target className="h-12 w-12 text-white mb-6" />
            <h3 className="text-xl font-semibold mb-4 text-white">ATS Optimized</h3>
            <p className="text-gray-400 leading-relaxed">
              Our AI ensures your resume passes through Applicant Tracking Systems with the right keywords and
              formatting.
            </p>
          </Card>

          <Card className="bg-white/5 border-white/10 p-8 hover:bg-white/10 transition-colors rounded-2xl">
            <Zap className="h-12 w-12 text-white mb-6" />
            <h3 className="text-xl font-semibold mb-4 text-white">Lightning Fast</h3>
            <p className="text-gray-400 leading-relaxed">
              Generate a perfectly tailored resume in seconds, not hours. Save time and apply to more jobs.
            </p>
          </Card>

          <Card className="bg-white/5 border-white/10 p-8 hover:bg-white/10 transition-colors rounded-2xl">
            <CheckCircle className="h-12 w-12 text-white mb-6" />
            <h3 className="text-xl font-semibold mb-4 text-white">Proven Results</h3>
            <p className="text-gray-400 leading-relaxed">
              Join thousands of professionals who've landed their dream jobs with AI-generated resumes.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">How It Works</h2>
          <p className="text-gray-400 text-lg">Simple, fast, and effective</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Upload Resume</h3>
            <p className="text-gray-400">Upload your existing resume in PDF or Word format</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Add Job Description</h3>
            <p className="text-gray-400">Paste the job description you're applying for</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Get Tailored Resume</h3>
            <p className="text-gray-400">Download your optimized resume in seconds</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-white" />
              <span className="text-xl font-semibold text-white">ResumeAI</span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>

          <div className="text-center mt-8 pt-8 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              © 2024 ResumeAI. All rights reserved. Powered by advanced AI technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
