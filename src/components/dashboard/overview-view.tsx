"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { FileText, Languages, Mic2, UserCircle, Eye, Trash2 } from "lucide-react";
import type { CoverLetter } from "@/lib/types";
import { LetterDetailPanel } from "./letter-detail-panel";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STAT_ICONS = [FileText, Languages, Mic2, UserCircle];

export function OverviewView() {
  const { coverLetters, resumeProfiles, removeCoverLetter } = useAppStore();
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const selectedLetter = useMemo(() => coverLetters.find(l => l.id === selectedLetterId) || null, [coverLetters, selectedLetterId]);

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
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedLetterId(letter.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{letter.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {letter.language} · {letter.tone}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="hidden sm:inline-block text-xs text-muted-foreground mr-2">
                    {new Date(letter.timestamp).toLocaleDateString()}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedLetterId(letter.id)} title="Preview">
                    <Eye className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the cover letter for &quot;{letter.title}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (selectedLetterId === letter.id) setSelectedLetterId(null);
                            removeCoverLetter(letter.id);
                            toast.success("Letter deleted");
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-4xl shadow-xl max-h-full overflow-hidden flex flex-col">
            <LetterDetailPanel
              letter={selectedLetter}
              onClose={() => setSelectedLetterId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
