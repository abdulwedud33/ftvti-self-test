"use client";

import { useEffect, useState } from "react";
import { studentApi, ExamAttempt } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { Trophy, XCircle, Clock, CalendarDays, Download, X } from "lucide-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { generatePremiumResultsPDFBlob, downloadPDFBlob } from "@/lib/pdf-report";
import { useAuth } from "@/hooks/use-auth";
dayjs.extend(duration);

export default function MyResultsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  useEffect(() => {
    studentApi
      .results()
      .then(setResults)
      .catch(() =>
        toast({ title: "Error", description: "Failed to load results", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  const passCount = results.filter((r) => r.score / r.totalQuestions >= 0.5).length;
  const avgPct = results.length
    ? Math.round(results.reduce((a, r) => a + (r.score / r.totalQuestions) * 100, 0) / results.length)
    : 0;
  const best = results.length
    ? Math.max(...results.map((r) => Math.round((r.score / r.totalQuestions) * 100)))
    : 0;

  /**
   * Handles downloading the premium results report as PDF
   * First generates the PDF, then shows a preview modal for confirmation
   */
  const handleDownloadReport = async () => {
    if (results.length === 0) {
      toast({
        title: "No Results",
        description: "Please take at least one exam before generating a report",
        variant: "destructive",
      });
      return;
    }

    if (!user?.student) {
      toast({
        title: "Error",
        description: "Unable to retrieve student information",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPDF(true);
    try {
      // Generate the PDF blob
      const blob = await generatePremiumResultsPDFBlob(
        user.student.fullName,
        user.student.studentId,
        user.student.stream || "NATURAL_SCIENCE",
        results
      );
      
      // Store the blob and create a preview URL
      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewURL(url);
      
      // Open the preview modal
      setPreviewOpen(true);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  /**
   * Confirms the download and saves the PDF file
   */
  const handleConfirmDownload = () => {
    if (!pdfBlob || !user?.student) return;

    const date = new Date().toISOString().split("T")[0];
    const filename = `FTVTI_Results_${user.student.studentId}_${date}.pdf`;
    
    downloadPDFBlob(pdfBlob, filename);
    
    setPreviewOpen(false);
    setPdfBlob(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
    }
    
    toast({
      title: "Success",
      description: "Your premium results report has been downloaded!",
    });
  };

  /**
   * Cancels the preview and cleans up resources
   */
  const handleCancelPreview = () => {
    setPreviewOpen(false);
    setPdfBlob(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6" /> My Results
          </h1>
          <p className="text-muted-foreground text-sm">{results.length} exam attempt(s) recorded</p>
        </div>

          {/* Download Report Button - Prominent placement with premium styling */}
        <Button
          onClick={handleDownloadReport}
          disabled={results.length === 0 || generatingPDF}
          className="gap-2 px-6 py-2 rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all"
        >
          <Download className="w-4 h-4" />
          {generatingPDF ? "Generating..." : "Download Report"}
        </Button>
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={handleCancelPreview}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <DialogTitle className="text-2xl font-bold">Preview Your Report</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelPreview}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          {/* PDF Preview Container */}
          <div className="flex-1 overflow-hidden bg-gray-100 rounded-lg">
            {previewURL ? (
              <iframe
                src={previewURL}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading preview...</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Action Buttons */}
          <DialogFooter className="border-t pt-4 flex flex-row justify-between">
            <div className="text-sm text-muted-foreground">
              Report ready to download
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancelPreview}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDownload}
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg"
              >
                <Download className="w-4 h-4" />
                Confirm Download
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{results.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Attempts</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{passCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Passed</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{best}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Best Score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {results.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 text-muted-foreground opacity-40" />
            </div>
            <p className="font-medium">No exam attempts yet</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
              You haven't taken any exams yet. Please go to{" "}
              <a href="/student/exam" className="text-indigo-600 underline font-medium">
                Take Exam
              </a>{" "}
              section, select a subject and year, and complete at least one exam to generate your results report.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((r, idx) => {
            const pct = Math.round((r.score / r.totalQuestions) * 100);
            const passed = pct >= 50;
            const durationMins = r.endTime
              ? dayjs(r.endTime).diff(dayjs(r.startTime), "minute")
              : null;

            return (
              <Card key={r.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${passed ? "bg-green-100" : "bg-red-100"}`}>
                      {passed
                        ? <Trophy className="w-5 h-5 text-green-600" />
                        : <XCircle className="w-5 h-5 text-red-500" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          Attempt #{results.length - idx}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                          {passed ? "Passed" : "Failed"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {dayjs(r.createdAt).format("MMM D, YYYY")}
                        </span>
                        {durationMins !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {durationMins}m taken
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${passed ? "bg-green-500" : "bg-red-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    </div>

                    {/* Score badge */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-bold ${passed ? "text-green-600" : "text-red-500"}`}>
                        {r.score}
                        <span className="text-sm text-muted-foreground font-normal">/{r.totalQuestions}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {results.length > 0 && (
        <div className="text-center">
          <a href="/student/exam" className="text-sm text-indigo-600 hover:underline">
            Take another attempt →
          </a>
        </div>
      )}
    </div>
  );
}
