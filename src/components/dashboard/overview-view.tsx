"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { FileText, Languages, Mic2, UserCircle } from "lucide-react";

const STAT_ICONS = [FileText, Languages, Mic2, UserCircle];

export function OverviewView() {
  const { coverLetters, resumeProfiles } = useAppStore();

  const stats = useMemo(() => {
    const languages = new Set(coverLetters.map((l) => l.language));
    const tones = new Set(coverLetters.map((l) => l.tone));
    return [
      { label: "Total Letters", value: coverLetters.length },
      { label: "Languages", value: languages.size },
      { label: "Tones", value: tones.size },
      { label: "Resumes", value: resumeProfiles.length },
    ];
  }, [coverLetters, resumeProfiles]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Overview</h1>
        <p className="text-muted-foreground">Your cover letter generation at a glance.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = STAT_ICONS[i];
          return (
            <Card key={stat.label} className="p-5 fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {coverLetters.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">No letters yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Head to the Generate page to create your first AI-powered cover letter.
          </p>
        </Card>
      )}

      {coverLetters.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Recent Letters</h2>
          <div className="space-y-2">
            {coverLetters.slice(0, 5).map((letter) => (
              <div
                key={letter.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{letter.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {letter.language} · {letter.tone}
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {new Date(letter.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
