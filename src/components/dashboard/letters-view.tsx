"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileText, Trash2, Eye, EyeOff } from "lucide-react";
import { LetterDetailPanel } from "./letter-detail-panel";
import type { CoverLetter } from "@/lib/types";
import { cn } from "@/lib/utils";
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

export function LettersView() {
  const { coverLetters, removeCoverLetter } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function toggleSelect(letter: CoverLetter) {
    setSelectedId((prev) => (prev === letter.id ? null : letter.id));
  }



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Letters</h1>
        <p className="text-muted-foreground">
          View, preview, analyse, and regenerate your cover letters.
        </p>
      </div>

      {coverLetters.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">No letters yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generated letters will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {coverLetters.map((letter) => {
            const isOpen = selectedId === letter.id;
            return (
              <div key={letter.id} className="space-y-2">
                <Card
                  className={cn(
                    "p-4 transition-colors",
                    isOpen && "border-primary/40 bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{letter.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {letter.companyName && `${letter.companyName} · `}
                        {letter.language} · {letter.tone} ·{" "}
                        {format(new Date(letter.timestamp), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant={isOpen ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSelect(letter)}
                      className="gap-1.5"
                    >
                      {isOpen ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {isOpen ? "Close" : "Preview & Analyse"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(letter.content);
                        toast.success("Copied to clipboard");
                      }}
                      className="gap-1.5"
                    >
                      Copy
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
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
                              if (isOpen) setSelectedId(null);
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
                </Card>

                {isOpen && (
                  <LetterDetailPanel
                    letter={letter}
                    onClose={() => setSelectedId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
