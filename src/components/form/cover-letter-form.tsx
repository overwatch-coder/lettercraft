"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { coverLetterFormSchema, type CoverLetterFormData } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Loader2, Sparkles, RotateCcw } from "lucide-react";

const DEFAULT_VALUES: Partial<CoverLetterFormData> = {
  language: "English",
  tone: "professional",
  model: "gpt-4o-mini",
  customInstructions: "",
  jobTitle: "",
  companyName: "",
  description: "",
  hiringManager: "",
  additionalNotes: "",
};

export function CoverLetterForm({
  onSubmit,
  onStageChange,
  onClear,
  busy,
  generated,
}: {
  onSubmit: (data: CoverLetterFormData) => Promise<void>;
  onStageChange: (stage: 1 | 2 | 3) => void;
  onClear?: () => void;
  busy: boolean;
  generated?: boolean;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const { activeProfile, getApiKey } = useAppStore();
  const { register, handleSubmit, setValue, watch, reset } = useForm<CoverLetterFormData>({
    resolver: zodResolver(coverLetterFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function handleClear() {
    reset(DEFAULT_VALUES);
    setJobUrl("");
    setAdvancedOpen(false);
    onStageChange(1);
    onClear?.();
    toast.success("Form cleared");
  }

  async function handleFetchUrl() {
    const trimmed = jobUrl.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setFetching(true);
    try {
      const apiKey = await getApiKey();
      const res = await fetch("/api/scrape-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, apiKey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch job details");
      }

      const data = await res.json();

      if (data.jobTitle) setValue("jobTitle", data.jobTitle, { shouldValidate: true });
      if (data.companyName) setValue("companyName", data.companyName, { shouldValidate: true });
      if (data.description) setValue("description", data.description, { shouldValidate: true });
      if (data.hiringManager) setValue("hiringManager", data.hiringManager, { shouldValidate: true });

      toast.success("Job details filled from URL");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch job details");
    } finally {
      setFetching(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(async (data) => {
        onStageChange(2);
        await onSubmit(data);
      })}
    >
      {/* URL auto-fill */}
      <div className="space-y-1.5">
        <label htmlFor="jobUrl" className="text-sm font-medium">
          Import from URL
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="jobUrl"
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/... or any job listing URL"
              className="pl-9"
              disabled={fetching}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleFetchUrl();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={fetching || !jobUrl.trim()}
            onClick={handleFetchUrl}
            className="shrink-0"
          >
            {fetching ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
            {fetching ? "Fetching\u2026" : "Fetch"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a job listing URL to auto-fill the fields below
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />
        <span className="relative -top-2.5 inline-block bg-card px-2 text-xs text-muted-foreground">
          or fill manually
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="jobTitle" className="text-sm font-medium">
            Job Title <span className="text-destructive">*</span>
          </label>
          <Input id="jobTitle" {...register("jobTitle")} placeholder="e.g. Senior Software Engineer" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
          <Input id="companyName" {...register("companyName")} placeholder="e.g. Acme Corp" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">AI Model</label>
        <Select
          value={watch("model")}
          onValueChange={(value) =>
            setValue("model", value as CoverLetterFormData["model"], { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o-mini">GPT-4o mini</SelectItem>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Job Description <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Paste the full job description here..."
          className="min-h-32"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="customInstructions" className="text-sm font-medium">
          Custom Instructions
        </label>
        <Textarea
          id="customInstructions"
          {...register("customInstructions")}
          placeholder="E.g. Make it concise, emphasize leadership skills, target startup culture..."
          className="min-h-20"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Language</label>
          <Select
            value={watch("language")}
            onValueChange={(value) =>
              setValue("language", value as CoverLetterFormData["language"], { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {["English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Chinese", "Japanese", "Korean"].map(
                (lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tone</label>
          <Select
            value={watch("tone")}
            onValueChange={(value) =>
              setValue("tone", value as CoverLetterFormData["tone"], { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tone" />
            </SelectTrigger>
            <SelectContent>
              {["professional", "enthusiastic", "confident"].map((tone) => (
                <SelectItem key={tone} value={tone} className="capitalize">
                  {tone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="px-0 text-sm"
        onClick={() => setAdvancedOpen((v) => !v)}
      >
        {advancedOpen ? "Hide" : "Show"} advanced options
      </Button>

      {advancedOpen && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-1.5">
            <label htmlFor="hiringManager" className="text-sm font-medium">
              Hiring Manager
            </label>
            <Input
              id="hiringManager"
              {...register("hiringManager")}
              placeholder="e.g. Jane Smith"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="additionalNotes" className="text-sm font-medium">
              Additional Notes
            </label>
            <Textarea
              id="additionalNotes"
              {...register("additionalNotes")}
              placeholder="Any extra context..."
              className="min-h-20"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button disabled={busy || !activeProfile} className="flex-1">
          {busy ? "Generating..." : "Generate Cover Letter"}
        </Button>
        {generated && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={busy}
            title="Clear form for a new letter"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
