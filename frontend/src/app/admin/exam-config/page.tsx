"use client";

import { useEffect, useState } from "react";
import { adminApi, ExamConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { Settings, Key, Clock, ShieldCheck, FlaskConical, Globe } from "lucide-react";

export default function ExamConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    naturalPassword: "", 
    socialPassword: "", 
    durationMins: 60 
  });

  useEffect(() => {
    adminApi.examConfig().then((c) => {
      if (c) {
        setConfig(c);
        setForm({ 
          naturalPassword: c.naturalPassword, 
          socialPassword: c.socialPassword, 
          durationMins: c.durationMins 
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminApi.updateExamConfig(form);
      setConfig(updated);
      toast({ title: "Saved", description: "Exam configuration updated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading settings…</div>;

  return (
    <div className="space-y-8 p-6 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" /> System Controls
        </h1>
        <p className="text-muted-foreground font-medium">Global examination parameters and access gates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-8 py-6 border-b">
              <CardTitle className="text-lg font-bold">Access Passwords</CardTitle>
              <CardDescription className="text-xs font-medium">Distinct passwords for Natural and Social streams</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2 font-bold text-emerald-600 uppercase text-[10px] tracking-widest">
                       <FlaskConical className="w-4 h-4" /> Natural Science Pass
                    </Label>
                    <div className="relative">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <Input
                         value={form.naturalPassword}
                         onChange={(e) => setForm({ ...form, naturalPassword: e.target.value })}
                         className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold tracking-widest"
                         placeholder="NAT-XXXX"
                         required
                       />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="flex items-center gap-2 font-bold text-blue-600 uppercase text-[10px] tracking-widest">
                       <Globe className="w-4 h-4" /> Social Science Pass
                    </Label>
                    <div className="relative">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <Input
                         value={form.socialPassword}
                         onChange={(e) => setForm({ ...form, socialPassword: e.target.value })}
                         className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold tracking-widest"
                         placeholder="SOC-XXXX"
                         required
                       />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label className="flex items-center gap-2 font-bold text-slate-800 uppercase text-[10px] tracking-widest">
                    <Clock className="w-4 h-4" /> Exam Session Duration
                  </Label>
                  <div className="flex items-center gap-6">
                     <Input
                       type="number"
                       value={form.durationMins}
                       onChange={(e) => setForm({ ...form, durationMins: parseInt(e.target.value) })}
                       min={5}
                       max={480}
                       className="h-14 w-32 rounded-2xl text-center text-xl font-black bg-slate-50 border-slate-100"
                       required
                     />
                     <div className="text-sm font-semibold text-slate-400">
                        Minutes allowed for each <br/> student attempt
                     </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" disabled={saving} className="h-14 px-8 rounded-2xl text-lg font-black shadow-lg shadow-primary/20">
                    <ShieldCheck className="w-5 h-5 mr-3" />
                    {saving ? "Updating System…" : "Sync Configuration"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-0 shadow-lg bg-indigo-600 text-white rounded-[2rem] p-8 space-y-6">
              <h3 className="font-black text-xl tracking-tight">Active Protocol</h3>
              <div className="space-y-6">
                 <div>
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Natural Science</p>
                    <code className="text-2xl font-black tracking-normal bg-white/10 px-3 py-1 rounded-lg block w-fit">{config?.naturalPassword}</code>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Social Science</p>
                    <code className="text-2xl font-black tracking-normal bg-white/10 px-3 py-1 rounded-lg block w-fit">{config?.socialPassword}</code>
                 </div>
                 <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Time Limit</p>
                    <p className="text-3xl font-black tracking-tight">{config?.durationMins}m</p>
                 </div>
              </div>
           </Card>

           <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-inner translate-y-1">
                 <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-amber-900 leading-relaxed">
                 Passwords are case-sensitive. Students will be prompted for these keys based on their assigned stream before starting any subject exam.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
