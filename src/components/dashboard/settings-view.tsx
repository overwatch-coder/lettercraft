"use client";

import { useAppStore, DEFAULT_MODELS } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

const PROVIDERS = [
  { id: "openai", label: "OpenAI", defaultModel: DEFAULT_MODELS.openai },
  { id: "google", label: "Google (Gemini)", defaultModel: DEFAULT_MODELS.google },
  { id: "anthropic", label: "Anthropic", defaultModel: DEFAULT_MODELS.anthropic },
  { id: "xai", label: "xAI (Grok)", defaultModel: DEFAULT_MODELS.xai },
  { id: "groq", label: "Groq", defaultModel: DEFAULT_MODELS.groq },
];

export function SettingsView() {
  const { providerModels, setProviderModel } = useAppStore();
  const [localModels, setLocalModels] = useState<Record<string, string>>(providerModels);

  const handleSave = async (provider: string) => {
    const val = localModels[provider];
    if (!val || val.trim() === "") {
      toast.error("Model name cannot be empty");
      return;
    }
    await setProviderModel(provider, val);
    toast.success(`${provider} model preference saved!`);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your AI provider preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Models</CardTitle>
          <CardDescription>
            Specify the default model to use for each provider. When you select a provider in the Generation tab (or use your active provider), this model will be used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {PROVIDERS.map((provider) => (
            <div key={provider.id} className="grid gap-2 sm:grid-cols-4 sm:items-center">
              <Label className="sm:text-right font-medium">{provider.label}</Label>
              <div className="sm:col-span-2">
                <Input
                  value={localModels[provider.id] || ""}
                  onChange={(e) => setLocalModels({ ...localModels, [provider.id]: e.target.value })}
                  placeholder={provider.defaultModel}
                />
              </div>
              <div className="sm:col-span-1">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleSave(provider.id)}
                  className="w-full sm:w-auto"
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
