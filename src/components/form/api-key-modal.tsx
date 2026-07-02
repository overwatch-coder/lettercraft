"use client";

import { useEffect, useState } from "react";
import { Key, X, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAppStore, DEFAULT_MODELS } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "google", label: "Google (Gemini)" },
  { id: "anthropic", label: "Anthropic" },
  { id: "xai", label: "xAI (Grok)" },
  { id: "groq", label: "Groq" },
];

export function ApiKeyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { activeProvider, apiKeys, setActiveProvider, setApiKey } = useAppStore();
  const [provider, setProvider] = useState(activeProvider);
  const [value, setValue] = useState("");

  const hasExistingKey = Boolean(apiKeys[provider]);

  useEffect(() => {
    if (open) {
      setProvider(activeProvider);
      setValue("");
    }
  }, [open, activeProvider]);

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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(val) => {
              setProvider(val);
              setValue("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            {hasExistingKey && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm text-primary">API key configured and encrypted</span>
              </div>
            )}
            {!hasExistingKey && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
                <span className="text-sm text-destructive">No API key configured for this provider</span>
              </div>
            )}
            <Input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={hasExistingKey ? "Enter a new key to replace existing…" : "sk-... or AI..."}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            onClick={async () => {
              if (value.trim()) {
                await setApiKey(provider, value);
              }
              await setActiveProvider(provider);
              toast.success("Settings saved successfully");
              onClose();
            }}
            className="flex-1"
          >
            {value.trim() ? "Save Key & Select" : "Select Provider"}
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
