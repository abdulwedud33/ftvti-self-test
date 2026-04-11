"use client";

import { useEffect, useState } from "react";
import { adminApi, ExamConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { Settings, Key, Clock, ShieldCheck } from "lucide-react";

export default function ExamConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ password: "", durationMins: 60 });

  useEffect(() => {
    adminApi.examConfig().then((c) => {
      if (c) {
        setConfig(c as ExamConfig);
        setForm({ password: (c as ExamConfig).password, durationMins: (c as ExamConfig).durationMins });
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminApi.updateExamConfig(form) as ExamConfig;
      setConfig(updated);
      toast({ title: "Saved", description: "Exam configuration updated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" /> Exam Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure exam password and duration for students</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Active Configuration</CardTitle>
          <CardDescription>Students must enter the exam password to begin. Share this password with them when ready.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="w-4 h-4" /> Exam Password
              </Label>
              <Input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter exam access password"
                required
                minLength={4}
              />
              <p className="text-xs text-muted-foreground">Give this password to students when you want them to take the exam.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Exam Duration (minutes)
              </Label>
              <Input
                type="number"
                value={form.durationMins}
                onChange={(e) => setForm({ ...form, durationMins: parseInt(e.target.value) })}
                min={5}
                max={300}
                required
              />
              <p className="text-xs text-muted-foreground">Students will have this many minutes to complete the exam before it auto-submits.</p>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={saving} className="gap-2">
                <ShieldCheck className="w-4 h-4" />
                {saving ? "Saving…" : "Save Configuration"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {config && (
        <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-blue-800 mb-3">Current Active Settings</p>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Exam Password:</span>
                <code className="bg-white px-2 py-0.5 rounded font-mono font-bold">{config.password}</code>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold">{config.durationMins} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-700 font-semibold">● Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
