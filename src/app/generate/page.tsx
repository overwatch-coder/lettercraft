"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import type { CoverLetterFormData } from "@/lib/types";
import { FileUpload } from "@/components/form/file-upload";
import { CoverLetterEditor } from "@/components/editor/cover-letter-editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoverLetterForm } from "@/components/form/cover-letter-form";
import { ApiKeyModal } from "@/components/form/api-key-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCompletion } from "@ai-sdk/react";
import {
  Upload,
  FileText,
  Sparkles,
  Check,
  CheckCircle2,
  Loader2,
  Key,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const STEPS = [
  { num: 1, label: "Upload Resume", icon: Upload },
  { num: 2, label: "Job Details", icon: FileText },
  { num: 3, label: "Result", icon: Sparkles },
];

export default function GeneratePage() {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [keyOpen, setKeyOpen] = useState(false);
  const currentPayloadRef = useRef<CoverLetterFormData | null>(null);
  const [generationModalOpen, setGenerationModalOpen] = useState(false);
  const [generationStep, setGenerationStep] = useState<"idle" | "extracting" | "generating" | "complete">("idle");
  
  const {
    cvContent,
    coverLetters,
    activeProfile,
    apiKeys,
    activeProvider,
    providerModels,
    addCoverLetter,
    removeCoverLetter,
    hydrate,
    getApiKey,
    setActiveProvider,
  } = useAppStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const latestLetter = useMemo(
    () => coverLetters[0],
    [coverLetters]
  );

  const { completion: draftContent, complete, isLoading: busy, setCompletion: setDraftContent } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
    onFinish: (prompt, result) => {
      const payload = currentPayloadRef.current;
      if (payload) {
        addCoverLetter({
          title: payload.companyName 
            ? `${payload.jobTitle || "Untitled Position"} at ${payload.companyName}`
            : payload.jobTitle || "Untitled Position",
          content: result,
          language: payload.language,
          tone: payload.tone,
          model: providerModels[activeProvider] || "gpt-4o-mini",
          jobTitle: payload.jobTitle,
          companyName: payload.companyName,
          hiringManager: payload.hiringManager,
          jobDescription: payload.description,
          additionalNotes: payload.additionalNotes,
          customInstructions: payload.customInstructions,
          resumeProfileId: activeProfile?.id ?? null,
        });
        setGenerationStep("complete");
        toast.success("Cover letter generated");
        setDraftContent("");
        setTimeout(() => {
          setGenerationModalOpen(false);
          setStage(3);
        }, 1500);
      }
    },
    onError: (error) => {
      console.error(error);
      setDraftContent("");
      setGenerationStep("idle");
      setGenerationModalOpen(false);
      toast.error("Generation failed: " + error.message);
    }
  });

  async function handleGenerate(payload: CoverLetterFormData) {
    if (!cvContent) {
      toast.error("Upload a resume first");
      return;
    }
    
    currentPayloadRef.current = payload;
    
    try {
      const key = await getApiKey(activeProvider);
      const model = providerModels[activeProvider] || "gpt-4o-mini";
      
      setGenerationStep("extracting");
      setGenerationModalOpen(true);
      
      // Step 1: Extract keywords
      const kwResponse = await fetch("/api/ats-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: payload.description,
          provider: activeProvider,
          apiKey: key,
          model: model,
        }),
      });
      
      let keywords: string[] = [];
      if (kwResponse.ok) {
        const data = await kwResponse.json();
        keywords = data.keywords || [];
      }
      
      setGenerationStep("generating");

      // Step 2: Stream cover letter
      await complete("", {
        body: {
          ...payload,
          cvContent,
          apiKey: key,
          provider: activeProvider,
          model: model,
          keywords,
        }
      });
    } catch (error) {
      setGenerationStep("idle");
      setGenerationModalOpen(false);
      // Handled by onError in useCompletion
    }
  }

  const hasApiKey = Boolean(apiKeys[activeProvider]);

  return (
    <div className="container mx-auto max-w-[90rem] px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
            Create your cover letter
          </h1>
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
            Upload your resume, describe the role, and let AI craft a tailored
            letter in seconds.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="w-fit gap-2 h-10"
            onClick={() => setKeyOpen(true)}
          >
            {hasApiKey ? (
              <ShieldCheck className="h-4 w-4 text-primary" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-destructive" />
            )}
            <Key className="h-3.5 w-3.5" />
            {hasApiKey ? "Key configured" : "Configure API Key"}
          </Button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = stage === step.num;
          const isCompleted = stage > step.num;
          return (
            <div key={step.num} className="flex items-center">
              {i > 0 && (
                <div
                  className={`hidden h-px w-8 sm:block md:w-16 ${
                    isCompleted ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => setStage(step.num as 1 | 2 | 3)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : isCompleted
                      ? "border-primary/20 bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.num}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-5xl transition-all duration-300">
        
        {stage === 1 && (
          <div className="space-y-6 fade-in">
            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Resume</h2>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
                </div>
                {activeProfile && (
                  <Badge variant="secondary" className="ml-auto">
                    {activeProfile.name}
                  </Badge>
                )}
              </div>
              <FileUpload />
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStage(2)} 
                disabled={!activeProfile}
                className="gap-2"
              >
                Continue to Job Details <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {stage === 2 && (
          <div className="space-y-6 fade-in">
            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Job Details</h2>
                  <p className="text-xs text-muted-foreground">
                    Describe the role and add custom instructions
                  </p>
                </div>
              </div>
              <CoverLetterForm
                onStageChange={setStage}
                onSubmit={handleGenerate}
                onClear={() => {
                  if (latestLetter) removeCoverLetter(latestLetter.id);
                  setDraftContent("");
                }}
                busy={busy || generationStep !== "idle"}
                generated={Boolean(latestLetter)}
              />
            </Card>

            <div className="flex justify-start">
              <Button 
                variant="outline" 
                onClick={() => setStage(1)} 
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Resume
              </Button>
            </div>
          </div>
        )}

        {stage === 3 && (
          <div className="space-y-6 fade-in">
            <Card className="flex flex-col p-5 sm:p-6 min-h-[500px]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Generated Letter</h2>
                  <p className="text-xs text-muted-foreground">
                    AI-generated & editable
                  </p>
                </div>
                {(latestLetter || draftContent) && !busy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto gap-1.5 text-muted-foreground hover:text-foreground"
                    title="Clear generated letter"
                    onClick={() => {
                      if (latestLetter) removeCoverLetter(latestLetter.id);
                      setDraftContent("");
                      setStage(1);
                      toast.success("Letter cleared");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex-1">
                {busy || draftContent ? (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                    {draftContent}
                    {busy && <span className="inline-block h-4 w-1 animate-pulse bg-primary ml-0.5" />}
                  </div>
                ) : latestLetter ? (
                  <CoverLetterEditor letter={latestLetter} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Your letter will appear here
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Fill in the details and hit generate
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-start">
              <Button 
                variant="outline" 
                onClick={() => setStage(2)} 
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Edit Job Details
              </Button>
            </div>
          </div>
        )}
      </div>

      <ApiKeyModal open={keyOpen} onClose={() => setKeyOpen(false)} />

      <Dialog open={generationModalOpen} onOpenChange={setGenerationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generating Your Cover Letter</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-4">
            <div className="flex items-center gap-4">
              {generationStep === "extracting" ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-500 animate-in zoom-in" />
              )}
              <span className={generationStep === "extracting" ? "font-medium" : "text-muted-foreground"}>
                Extracting ATS Keywords
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {generationStep === "idle" || generationStep === "extracting" ? (
                <div className="h-6 w-6 rounded-full border-2 border-muted" />
              ) : generationStep === "generating" ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-500 animate-in zoom-in" />
              )}
              <span className={generationStep === "generating" ? "font-medium" : "text-muted-foreground"}>
                Writing Cover Letter
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
