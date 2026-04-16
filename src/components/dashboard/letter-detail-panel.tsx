"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { CoverLetter } from "@/lib/types";
import { getAtsDetails } from "@/lib/ats";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  X,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from "lucide-react";

interface LetterDetailPanelProps {
  letter: CoverLetter;
  onClose: () => void;
}

function AtsGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-500" : score >= 45 ? "text-yellow-500" : "text-red-500";
  const bg =
    score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-red-500";
  const label =
    score >= 70 ? "Strong" : score >= 45 ? "Moderate" : "Weak";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">ATS Score</span>
        <span className={cn("text-lg font-bold", color)}>
          {score}% <span className="text-xs font-normal text-muted-foreground">({label})</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", bg)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function LetterDetailPanel({ letter, onClose }: LetterDetailPanelProps) {
  const [tab, setTab] = useState<"preview" | "ats" | "regenerate">("preview");
  const [instructions, setInstructions] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const { getApiKey, resumeProfiles, activeProfile, updateCoverLetter } = useAppStore();

  const ats = getAtsDetails(letter.jobDescription, letter.content);

  async function handleCopy() {
    await navigator.clipboard.writeText(letter.content);
    toast.success("Copied to clipboard");
  }

  function handleDownload() {
    const blob = new Blob([letter.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${letter.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRegenerate() {
    if (!instructions.trim()) {
      toast.error("Add instructions first");
      return;
    }
    const resume =
      resumeProfiles.find((p) => p.id === letter.resumeProfileId) ?? activeProfile;
    if (!resume) {
      toast.error("No resume available to regenerate");
      return;
    }

    setRegenerating(true);
    try {
      const apiKey = await getApiKey();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          cvContent: resume.content,
          jobTitle: letter.jobTitle,
          companyName: letter.companyName,
          hiringManager: letter.hiringManager,
          description: letter.jobDescription,
          additionalNotes: letter.additionalNotes,
          customInstructions: instructions,
          language: letter.language,
          tone: letter.tone,
          model: letter.model,
        }),
      });

      if (!response.ok) throw new Error("Regeneration failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Missing stream");
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
      }

      await updateCoverLetter(letter.id, content);
      setInstructions("");
      toast.success("Letter regenerated");
      setTab("preview");
    } catch {
      toast.error("Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  }

  const TABS = [
    { id: "preview" as const, label: "Preview" },
    { id: "ats" as const, label: `ATS (${ats.score}%)` },
    { id: "regenerate" as const, label: "Regenerate" },
  ];

  return (
    <div className="fade-in rounded-xl border bg-card shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{letter.title}</p>
          <p className="text-xs text-muted-foreground">
            {letter.language} · {letter.tone} ·{" "}
            {format(new Date(letter.timestamp), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} title="Download TXT">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b px-5 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "pb-2 px-1 text-sm font-medium border-b-2 transition-colors",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {/* Preview */}
        {tab === "preview" && (
          <div className="max-h-[500px] overflow-y-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm dark:prose-invert max-w-none"
            >
              {letter.content}
            </ReactMarkdown>
          </div>
        )}

        {/* ATS breakdown */}
        {tab === "ats" && (
          <div className="space-y-5">
            <AtsGauge score={ats.score} />

            {ats.tips.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Improvement Tips
                </p>
                <ul className="space-y-1.5">
                  {ats.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-sm text-muted-foreground"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Matched Keywords
                  <span className="ml-auto text-xs text-muted-foreground">
                    {ats.matched.length}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ats.matched.length > 0 ? (
                    ats.matched.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">None yet</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Missing Keywords
                  <span className="ml-auto text-xs text-muted-foreground">
                    {ats.missing.length}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ats.missing.length > 0 ? (
                    ats.missing.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">All covered!</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setTab("regenerate")}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate to fix missing keywords
            </Button>
          </div>
        )}

        {/* Regenerate */}
        {tab === "regenerate" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Instructions for regeneration
              </label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={`E.g. Include these keywords: ${ats.missing.slice(0, 3).join(", ")}. Make it more concise and highlight leadership.`}
                className="min-h-28"
                disabled={regenerating}
              />
              <p className="text-xs text-muted-foreground">
                Describe what to change — keywords to add, tone adjustments, sections to emphasise.
              </p>
            </div>

            {ats.missing.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Quick-add missing keywords:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ats.missing.slice(0, 8).map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() =>
                        setInstructions((v) =>
                          v ? `${v}, ${kw}` : `Include these keywords: ${kw}`
                        )
                      }
                      className="rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleRegenerate}
              disabled={regenerating || !instructions.trim()}
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {regenerating ? "Regenerating…" : "Regenerate Letter"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
