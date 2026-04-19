"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppStore } from "@/lib/store";
import type { CoverLetterFormData } from "@/lib/types";
import { FileUpload } from "@/components/form/file-upload";
import { CoverLetterEditor } from "@/components/editor/cover-letter-editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoverLetterForm } from "@/components/form/cover-letter-form";
import { ApiKeyModal } from "@/components/form/api-key-modal";
import {
  Upload,
  FileText,
  Sparkles,
  Check,
  Key,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";

const STEPS = [
  { num: 1, label: "Upload Resume", icon: Upload },
  { num: 2, label: "Job Details", icon: FileText },
  { num: 3, label: "Result", icon: Sparkles },
];

export default function GeneratePage() {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [keyOpen, setKeyOpen] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const {
    cvContent,
    coverLetters,
    activeProfile,
    apiKey,
    addCoverLetter,
    removeCoverLetter,
    hydrate,
    getApiKey,
  } = useAppStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const latestLetter = useMemo(
    () => coverLetters[coverLetters.length - 1],
    [coverLetters]
  );

  async function handleGenerate(payload: CoverLetterFormData) {
    if (!cvContent) {
      toast.error("Upload a resume first");
      return;
    }
    setBusy(true);
    setDraftContent("");
    try {
      const key = await getApiKey();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, cvContent, apiKey: key }),
      });
      if (!response.ok) throw new Error("Generation request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Missing response stream");
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        content += chunk;
        setDraftContent(content);
      }
      addCoverLetter({
        title: payload.jobTitle,
        content,
        language: payload.language,
        tone: payload.tone,
        model: payload.model,
        jobTitle: payload.jobTitle,
        companyName: payload.companyName,
        hiringManager: payload.hiringManager,
        jobDescription: payload.description,
        additionalNotes: payload.additionalNotes,
        customInstructions: payload.customInstructions,
        resumeProfileId: activeProfile?.id ?? null,
      });
      setStage(3);
      toast.success("Cover letter generated");
    } catch (error) {
      console.error(error);
      setDraftContent("");
      toast.error("Generation failed");
    } finally {
      setBusy(false);
    }
  }

  const hasApiKey = Boolean(apiKey);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
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
        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-2"
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

      {/* Step indicator */}
      <div className="flex items-center gap-0">
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
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Input */}
        <div className="space-y-5">
          <Card className="p-5 sm:p-6 fade-in">
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

          <Card className="p-5 sm:p-6 fade-in">
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
              busy={busy}
              generated={Boolean(latestLetter)}
            />
          </Card>
        </div>

        {/* Right: Output */}
        <Card className="flex flex-col p-5 sm:p-6 fade-in">
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
            {latestLetter ? (
              <CoverLetterEditor letter={latestLetter} />
            ) : busy && draftContent ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                {draftContent}
                <span className="inline-block h-4 w-1 animate-pulse bg-primary ml-0.5" />
              </div>
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
      </div>

      <ApiKeyModal open={keyOpen} onClose={() => setKeyOpen(false)} />
    </div>
  );
}
