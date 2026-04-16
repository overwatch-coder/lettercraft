"use client";

import { useEffect, useState } from "react";
import { Key, X, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAppStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function ApiKeyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { apiKey, setApiKey } = useAppStore();
  const [value, setValue] = useState("");
  const provider = value.startsWith("sk-") ? "OpenAI" : value ? "Gemini/Google" : "";
  const hasExistingKey = Boolean(apiKey);

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Key className="h-5 w-5 text-primary" />
              AI API Key
            </h2>
            <p className="text-sm text-muted-foreground">Stored encrypted in IndexedDB.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {hasExistingKey && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm text-primary">API key configured and encrypted</span>
          </div>
        )}

        {!hasExistingKey && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
            <span className="text-sm text-destructive">No API key configured yet</span>
          </div>
        )}

        <Input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={hasExistingKey ? "Enter a new key to replace existing…" : "sk-... or AI..."}
          className="mb-2"
        />
        {provider && (
          <Badge variant="secondary" className="mb-4">{`Detected: ${provider}`}</Badge>
        )}

        <div className="flex gap-3 mt-4">
          <Button
            type="button"
            onClick={async () => {
              if (!value.trim()) return;
              await setApiKey(value);
              toast.success("API key saved successfully");
              onClose();
            }}
            className="flex-1"
            disabled={!value.trim()}
          >
            {hasExistingKey ? "Update Key" : "Save Key"}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
