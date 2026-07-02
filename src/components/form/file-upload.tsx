"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import mammoth from "mammoth";
import pdfToText from "react-pdftotext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function FileUpload() {
  const {
    setCvContent,
    activeProfile,
    setActiveProfile,
    resumeProfiles,
    addResumeProfile,
    removeResumeProfile,
  } = useAppStore();
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showExisting, setShowExisting] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setProcessing(true);
      setFileName(acceptedFiles.length > 1 ? `${acceptedFiles.length} files` : acceptedFiles[0].name);

      let firstProcessed = false;

      for (const file of acceptedFiles) {
        try {
          let text = "";
          if (file.name.toLowerCase().endsWith(".docx")) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
          } else if (file.name.toLowerCase().endsWith(".pdf")) {
            text = await pdfToText(file);
          } else {
            text = await file.text();
          }

          let fileData = "";
          try {
            fileData = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          } catch (e) {
            console.warn("Could not read file data for preview", e);
          }

          const profile = {
            id: crypto.randomUUID(),
            name: file.name,
            content: text,
            uploadedAt: Date.now(),
            fileData,
          };

          if (!firstProcessed) {
            setCvContent(text);
            setActiveProfile(profile);
            firstProcessed = true;
          } else {
            addResumeProfile(profile);
          }
          toast.success(`Processed ${file.name}`);
        } catch {
          toast.error(`Failed to process ${file.name}`);
        }
      }

      setFileName(null);
      setProcessing(false);
      setShowExisting(true); // Open the accordion automatically
    },
    [setActiveProfile, setCvContent, addResumeProfile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    disabled: processing,
  });

  function selectExisting(profile: (typeof resumeProfiles)[number]) {
    setCvContent(profile.content);
    setActiveProfile(profile);
    setPreviewId(null);
    toast.success(`Using "${profile.name}"`);
  }

  const savedResumes = resumeProfiles.filter(
    (p) => p.id !== activeProfile?.id
  );

  return (
    <div className="space-y-3">
      {/* Processing state */}
      {processing ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-6 text-center sm:p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Processing {fileName}…</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Extracting text from your resume
            </p>
          </div>
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div className="h-full animate-indeterminate rounded-full bg-primary" />
          </div>
        </div>
      ) : activeProfile ? (
        <div className="space-y-3 fade-in">
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {activeProfile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Active Resume
              </p>
            </div>
          </div>
          <div
            {...getRootProps()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm transition hover:bg-muted/50"
          >
            <input {...getInputProps()} />
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Add new resume</span>
          </div>
        </div>
      ) : (
        /* Empty dropzone */
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition sm:p-8 ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <input {...getInputProps()} />
          <Upload
            className={`h-8 w-8 ${isDragActive ? "text-primary" : "text-muted-foreground/50"}`}
          />
          <p className="text-sm font-medium text-foreground sm:text-base">
            {isDragActive ? "Drop to upload" : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
        </div>
      )}

      {/* Existing resumes toggle */}
      {savedResumes.length > 0 && !processing && (
        <div>
          <button
            type="button"
            onClick={() => {
              setShowExisting((v) => !v);
              setPreviewId(null);
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {showExisting ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showExisting ? "Hide" : "Use"} existing resume
            {savedResumes.length > 1 ? "s" : ""} ({savedResumes.length})
          </button>

          {showExisting && (
            <div className="mt-2 space-y-2">
              {savedResumes.map((profile) => {
                const isPreviewing = previewId === profile.id;
                return (
                  <div
                    key={profile.id}
                    className="rounded-lg border bg-card p-3 fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {profile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(profile.uploadedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Preview"
                          onClick={() => setPreviewId(profile.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeResumeProfile(profile.id);
                            if (previewId === profile.id) setPreviewId(null);
                            toast.success(`Deleted ${profile.name}`);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => selectExisting(profile)}
                        >
                          Use
                        </Button>
                      </div>
                    </div>

                    <Dialog open={isPreviewing} onOpenChange={(open) => !open && setPreviewId(null)}>
                      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
                        <DialogHeader className="mb-2 shrink-0">
                          <DialogTitle>Preview: {profile.name}</DialogTitle>
                        </DialogHeader>
                        <div className="overflow-auto rounded-lg border bg-muted/20 flex-1">
                          {profile.fileData && profile.fileData.startsWith("data:application/pdf") ? (
                            <object data={profile.fileData} type="application/pdf" className="w-full h-[70vh]">
                              <p className="p-3 text-sm text-muted-foreground text-center">
                                Your browser does not support PDFs.{" "}
                                <a href={profile.fileData} download={profile.name} className="text-primary hover:underline">
                                  Download
                                </a>{" "}
                                instead.
                              </p>
                            </object>
                          ) : profile.fileData && profile.fileData.startsWith("data:image/") ? (
                            <img src={profile.fileData} alt={profile.name} className="max-w-full h-auto max-h-[70vh] object-contain mx-auto" />
                          ) : (
                            <div className="max-h-[70vh] overflow-y-auto p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                              {profile.content}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
