"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppStore } from "@/lib/store";
import toast from "react-hot-toast";
import type { CoverLetter } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CoverLetterEditor({
  letter,
}: {
  letter: CoverLetter;
}) {
  const { updateCoverLetter, getApiKey, resumeProfiles, activeProfile } = useAppStore();
  const [instructions, setInstructions] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letter.content);
    toast.success("Copied to clipboard");
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([letter.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${letter.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const popup = window.open("", "_blank", "width=900,height=1200");
    if (!popup) return;
    popup.document.write(`
      <html>
        <head>
          <title>${letter.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #111; }
            h1, h2, h3 { color: #111; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <pre>${letter.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const handleRegenerate = async () => {
    if (!instructions.trim()) return;
    setBusy(true);
    try {
      const resume = resumeProfiles.find((profile) => profile.id === letter.resumeProfileId) ?? activeProfile;
      if (!resume) {
        toast.error("No resume profile available");
        return;
      }

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

      if (!response.ok) {
        throw new Error("Regeneration failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Missing response stream");
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
    } catch (error) {
      console.error(error);
      toast.error("Regeneration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{letter.title}</p>
            <p className="text-sm text-muted-foreground">{letter.language} · {letter.tone}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTxt}>TXT</Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadPdf}>PDF</Button>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-muted/20 p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm dark:prose-invert max-w-none">
            {letter.content}
          </ReactMarkdown>
        </div>
      </div>
      <EditBox
        value={instructions}
        onChange={setInstructions}
        onSave={handleRegenerate}
        busy={busy}
      />
    </div>
  );
}

function EditBox({
  value,
  onChange,
  onSave,
  busy,
}: {
  value: string;
  onChange: (text: string) => void;
  onSave: () => void;
  busy: boolean;
}) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Refine with instructions..."
        className="min-h-24"
      />
      <Button
        type="button"
        onClick={onSave}
        disabled={busy || !value.trim()}
      >
        {busy ? "Regenerating..." : "Regenerate with instructions"}
      </Button>
    </div>
  );
}
