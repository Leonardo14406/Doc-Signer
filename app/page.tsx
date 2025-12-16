"use client"

import { useState } from "react"
import { Upload, Pen, Download, Check, Edit3 } from "lucide-react"
import FileUpload from "@/components/file-upload"
import SignaturePad from "@/components/signature-pad"
import DownloadStep from "@/components/download-step"
import DocumentEditor from "@/components/document-editor"
import { Button } from "@/components/ui/button"

type Step = "upload" | "edit" | "sign" | "download"

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null)

  const steps = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "edit", label: "Edit", icon: Edit3 },
    { id: "sign", label: "Sign", icon: Pen },
    { id: "download", label: "Download", icon: Download },
  ]

  const handleFileUploaded = (uploadedFile: File, html: string) => {
    setFile(uploadedFile)
    setHtmlContent(html)
    setCurrentStep("edit")
  }

  const handleEditorContinue = (generatedPdf: Uint8Array) => {
    setPdfBytes(generatedPdf)
    setCurrentStep("sign")
  }

  const handleSignatureComplete = (signedPdf: Uint8Array) => {
    setSignedPdfBytes(signedPdf)
    setCurrentStep("download")
  }

  const handleStartOver = () => {
    setFile(null)
    setHtmlContent(null)
    setPdfBytes(null)
    setSignedPdfBytes(null)
    setCurrentStep("upload")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Navbar */}
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Pen className="h-5 w-5" />
            </div>
            <span>SignFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Features</a>
            <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#" className="hover:text-foreground transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Log in</Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section (Only show on upload step or if we want it persistent) */}
        {/* We'll keep it persistent but smaller when not in upload? No, let's keep it simple. */}

        <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl flex flex-col">
          {/* Step Wizard */}
          <div className="mb-12 mt-8">
            <div className="flex items-center justify-center gap-2 md:gap-4 max-w-4xl mx-auto overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = steps.findIndex((s) => s.id === currentStep) > index
                const isFuture = !isActive && !isCompleted

                return (
                  <div key={step.id} className="flex items-center min-w-fit">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                          ? "bg-primary text-primary-foreground scale-110 shadow-xl shadow-primary/20"
                          : isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-5 h-5 md:w-6 md:h-6" />}
                      </div>
                      <span
                        className={`text-xs md:text-sm font-medium transition-colors ${isActive ? "text-foreground" : isCompleted ? "text-foreground/80" : "text-muted-foreground"
                          }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-8 md:w-16 h-[2px] mx-2 md:mx-4 rounded-full transition-all duration-500 mb-6 ${isCompleted ? "bg-primary" : "bg-muted"
                          }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {currentStep === "upload" && (
              <div className="space-y-8 text-center max-w-2xl mx-auto">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Sign Documents Fast.
                  </h1>
                  <p className="text-xl text-muted-foreground text-balance">
                    Securely edit, sign, and download your Word documents as PDFs. No registration required.
                  </p>
                </div>
                <FileUpload onFileProcessed={handleFileUploaded} />
              </div>
            )}

            {currentStep === "edit" && htmlContent && (
              <div className="w-full">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold">Review & Edit</h2>
                  <p className="text-muted-foreground">Make any necessary changes before converting to PDF.</p>
                </div>
                <DocumentEditor
                  initialHtml={htmlContent}
                  onContinue={handleEditorContinue}
                  onCancel={handleStartOver}
                />
              </div>
            )}



            {currentStep === "sign" && pdfBytes && (
              <SignaturePad pdfBytes={pdfBytes} onSignatureComplete={handleSignatureComplete} />
            )}

            {currentStep === "download" && signedPdfBytes && (
              <DownloadStep
                signedPdfBytes={signedPdfBytes}
                fileName={file?.name || "document"}
                onStartOver={handleStartOver}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SignFlow. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
