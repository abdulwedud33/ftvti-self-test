"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { ArrowLeft, ShieldCheck, UserCog, KeyRound } from "lucide-react";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [loading, user, router]);

  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "INSTRUCTOR") return "/instructor";
    return "/student";
  };

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const username = newUsername.trim();
    if (username.length < 3) {
      toast({ title: "Validation Error", description: "Username must be at least 3 characters", variant: "destructive" });
      return;
    }

    if (username === user.username) {
      toast({ title: "No Change", description: "Please enter a different username" });
      return;
    }

    setUsernameLoading(true);
    try {
      await authApi.updateProfile({ username });
      await refresh();
      toast({ title: "Success", description: "Username updated successfully" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update username";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Validation Error", description: "Confirm password does not match", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.updateProfile({ password: newPassword });
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Success", description: "Password updated successfully" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <UserCog className="w-7 h-7 text-primary" /> Profile Settings
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your account username and password securely.
            </p>
          </div>
          <Link href={getDashboardPath()}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Account Overview
            </CardTitle>
            <CardDescription>
              You are signed in as <span className="font-semibold">{user.username}</span> ({user.role}).
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Change Username</CardTitle>
            <CardDescription>
              Usernames must be unique. If already taken, you will see an error.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentUsername">Current Username</Label>
                <Input id="currentUsername" value={user.username} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUsername">New Username</Label>
                <Input
                  id="newUsername"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  minLength={3}
                  required
                />
              </div>
              <Button type="submit" disabled={usernameLoading} className="min-w-40">
                {usernameLoading ? "Updating..." : "Update Username"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> Change Password
            </CardTitle>
            <CardDescription>
              Password must be at least 6 characters and match the confirmation field.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" disabled={passwordLoading} className="min-w-40">
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
