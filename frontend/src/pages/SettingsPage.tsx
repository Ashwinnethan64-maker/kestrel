import React, { useState } from "react";
import {
  UserRound,
  ShieldCheck,
  Save,
  KeyRound,
  Monitor,
  CheckCircle2,
  CircleAlert,
  HelpCircle,
  X,
  Clock,
  Laptop,
  Smartphone,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function SettingsPage() {
  // Profile Information State (Exact 6 fields)
  const [fullName, setFullName] = useState("Inspector R. Sharma");
  const [badgeNumber, setBadgeNumber] = useState("KSP-4491");
  const [emailAddress, setEmailAddress] = useState("r.sharma.ksp@karnataka.gov.in");
  const [phoneNumber, setPhoneNumber] = useState("+91 94481 99042");
  const [department, setDepartment] = useState("Crime Investigation Division (CID)");
  const [policeStation, setPoliceStation] = useState("Indiranagar Police Station");

  // Interaction State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Security Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);

  // Handle Profile Save
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);

    // Persist to local station session
    setTimeout(() => {
      try {
        localStorage.setItem(
          "kestrel-officer-profile",
          JSON.stringify({
            fullName,
            badgeNumber,
            emailAddress,
            phoneNumber,
            department,
            policeStation,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        // ignore
      }
      setIsSaving(false);
      setSaveSuccess("Profile changes successfully updated.");
      setTimeout(() => setSaveSuccess(null), 3000);
    }, 450);
  };

  // Handle Password Submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordFeedback({ type: "error", message: "Please provide your current password." });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }

    setPasswordFeedback({ type: "success", message: "Password updated successfully for this session." });
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, preferences, and security settings."
        badge={
          <Badge variant="tactical" dot={true}>
            OFFICER PROFILE // VERIFIED
          </Badge>
        }
      />

      {/* Global Success / Alert Banner */}
      {saveSuccess && (
        <div className="p-3 rounded bg-positive/10 border border-positive/30 text-positive font-mono text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />
            <span>{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Responsive Two-Column Layout (2/3 Profile + 1/3 Security, 24px gap) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* A. Profile Information Card (~2/3 on desktop -> 8 cols) */}
        <Card className="lg:col-span-8 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-mono font-bold flex items-center gap-2.5 text-foreground">
              <UserRound className="h-5 w-5 text-primary shrink-0" />
              <span>Profile Information</span>
            </CardTitle>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              BADGE VERIFIED
            </span>
          </CardHeader>

          <CardContent className="p-5 pt-4">
            <form onSubmit={handleSaveChanges} className="space-y-5 font-mono text-xs">
              {/* Row 1: Full Name & Badge Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="full-name" className="text-[11px] text-muted-foreground block font-semibold uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
                    placeholder="e.g. Inspector R. Sharma"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="badge-number" className="text-[11px] text-muted-foreground block font-semibold uppercase tracking-wider">
                    Badge Number
                  </label>
                  <input
                    id="badge-number"
                    type="text"
                    required
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    placeholder="e.g. KSP-4491"
                  />
                </div>
              </div>

              {/* Row 2: Email Address & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="email-address" className="text-[11px] text-muted-foreground block font-semibold uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
                    placeholder="officer@karnataka.gov.in"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone-number" className="text-[11px] text-muted-foreground block font-semibold uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    id="phone-number"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    placeholder="+91 94481 00000"
                  />
                </div>
              </div>

              {/* Row 3: Department & Police Station */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="department" className="text-[11px] text-muted-foreground block font-semibold uppercase tracking-wider">
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
                    placeholder="Department / Division"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="police-station" className="text-[11px] text-muted-foreground block font-semibold uppercase tracking-wider">
                    Police Station
                  </label>
                  <input
                    id="police-station"
                    type="text"
                    required
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
                    placeholder="Station Jurisdiction"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-border/80 flex items-center justify-end">
                <Button
                  type="submit"
                  variant="tactical"
                  disabled={isSaving}
                  className="h-9 px-4 gap-2 font-mono text-xs font-bold"
                >
                  <Save className="h-4 w-4 shrink-0" />
                  <span>{isSaving ? "SAVING..." : "Save Changes"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* B. Security Card (~1/3 on desktop -> 4 cols) */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-border/80">
            <CardTitle className="text-sm font-mono font-bold flex items-center gap-2.5 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <span>Security</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 pt-4 space-y-4 font-mono text-xs">
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Ensure your account is using a strong password and review your recent login sessions.
            </p>

            <div className="space-y-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full h-10 justify-center gap-2 font-mono text-xs border-border hover:border-primary/60 hover:bg-surface-elevated"
              >
                <KeyRound className="h-4 w-4 text-primary shrink-0" />
                <span>Change Password</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSessionsModalOpen(true)}
                className="w-full h-10 justify-center gap-2 font-mono text-xs border-border hover:border-secondary/60 hover:bg-surface-elevated"
              >
                <Monitor className="h-4 w-4 text-secondary shrink-0" />
                <span>View Active Sessions</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordFeedback(null);
        }}
        title="Change Account Password"
        description="Update your credentials for the authenticated officer workstation."
        size="md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4 font-mono text-xs">
          {passwordFeedback && (
            <div
              className={`p-3 rounded border text-xs flex items-center gap-2 ${
                passwordFeedback.type === "success"
                  ? "bg-positive/10 border-positive/30 text-positive"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              {passwordFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <CircleAlert className="h-4 w-4 shrink-0" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] text-muted-foreground block uppercase">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border bg-surface-elevated text-foreground focus:outline-none focus:border-primary text-xs"
              placeholder="••••••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-muted-foreground block uppercase">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border bg-surface-elevated text-foreground focus:outline-none focus:border-primary text-xs"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-muted-foreground block uppercase">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border bg-surface-elevated text-foreground focus:outline-none focus:border-primary text-xs"
              placeholder="Re-enter new password"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordFeedback(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="tactical" size="sm" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              <span>Update Password</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Active Sessions Modal */}
      <Modal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        title="Active Officer Sessions"
        description="Review all authenticated terminals and workstations currently logged into this account."
        size="lg"
      >
        <div className="space-y-4 font-mono text-xs">
          <div className="space-y-2.5">
            <div className="p-3 rounded border border-primary/30 bg-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Laptop className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <span>Indiranagar SOC Desktop (Current Station)</span>
                    <Badge variant="tactical" className="text-[9px]">THIS DEVICE</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-sans">
                    IP: 10.14.88.24 • Bengaluru Metro Tactical Subnet
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-positive font-semibold">ACTIVE NOW</span>
            </div>

            <div className="p-3 rounded border border-border bg-surface-elevated/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-secondary shrink-0" />
                <div>
                  <div className="font-bold text-foreground">
                    Patrol Tablet // Mobile Dispatch Unit
                  </div>
                  <div className="text-[10px] text-muted-foreground font-sans">
                    IP: 10.14.92.110 • Karnataka State Police Cellular APN
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">LAST SEEN: 42M AGO</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-surface-elevated/40 border border-border/60 text-[11px] text-muted-foreground font-sans">
            Authentication sessions expire automatically after 8 hours of inactivity under KSP Cyber Security Directive 2024.
          </div>

          <div className="pt-2 border-t border-border flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsSessionsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
