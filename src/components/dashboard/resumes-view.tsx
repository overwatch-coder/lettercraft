"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";
import { toast } from "sonner";
import { UserCircle, Trash2, Eye, EyeOff } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ResumesView() {
  const { resumeProfiles, removeResumeProfile } = useAppStore();
  const [previewId, setPreviewId] = useState<string | null>(null);

  function handleDelete(id: string, name: string) {
    removeResumeProfile(id);
    if (previewId === id) setPreviewId(null);
    toast.success(`"${name}" deleted`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Resumes</h1>
        <p className="text-muted-foreground">Your uploaded resume profiles.</p>
      </div>

      {resumeProfiles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <UserCircle className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">No resumes uploaded</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a resume on the Generate page to see it here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resumeProfiles.map((profile) => {
            const isPreviewing = previewId === profile.id;
            return (
              <Card key={profile.id} className="p-5 fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <UserCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {format(new Date(profile.uploadedAt), "PPP")}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewId(profile.id)}
                  >
                    <Eye className="mr-1 h-3 w-3" /> Preview
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the resume profile for &quot;{profile.name}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(profile.id, profile.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Dialog open={isPreviewing} onOpenChange={(open) => !open && setPreviewId(null)}>
                  <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
                    <DialogHeader className="mb-2 shrink-0">
                      <DialogTitle>Preview: {profile.name}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-auto rounded-lg border bg-muted/20 flex-1 min-h-0">
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
