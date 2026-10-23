import React, { useState, useRef } from "react";
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  Lock,
  Building,
  MapPin,
  BadgeCheck,
  Radio,
  FileCheck,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/store/useProfileStore";
import { useTranslation } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateProfile, resetProfile } = useProfileStore();

  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    department: profile.department,
    primaryDistrict: profile.primaryDistrict,
    commandUnit: profile.commandUnit,
    station: profile.station,
    badgeNumber: profile.badgeNumber,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.photoUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      updateProfile({ photoUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    updateProfile({ photoUrl: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateProfile(formData);
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage(t('profile.profileSaved'));
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      {successMessage && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400 font-medium animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 cols): Identity & Officer Photo Card */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {t('profile.leftCardTitle')}
                  </span>
                  <Badge variant="tactical" className="text-[10px]">
                    {t('profile.demoBadgeNote')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {/* Photo Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-border/60">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-surface-elevated border-2 border-primary/40 overflow-hidden shadow-inner">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Officer" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-primary/60" />
                    )}
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {t('profile.changePhoto')}
                      </Button>
                      {photoPreview && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleRemovePhoto}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {t('profile.uploadNote')}
                    </p>
                  </div>
                </div>

                {/* Left Card Form Fields */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-muted-foreground block font-medium mb-1">
                      {t('profile.name')}
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-foreground font-semibold focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block font-medium mb-1">
                      {t('profile.email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-foreground font-mono focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block font-medium mb-1">
                      Official Contact Phone
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-foreground font-mono focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[11px] mb-1">
                        {t('profile.role')}
                      </span>
                      <Badge variant="tactical" className="w-full justify-center py-1 text-xs">
                        {profile.role}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px] mb-1">
                        {t('profile.clearance')}
                      </span>
                      <div className="rounded border border-primary/30 bg-primary/10 px-2.5 py-1 text-center font-mono text-xs font-bold text-primary">
                        {profile.securityClearance}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-muted-foreground block text-[11px] mb-1">
                      {t('profile.authProvider')}
                    </span>
                    <div className="rounded border border-border bg-surface-elevated/80 px-3 py-1.5 font-mono text-[11px] text-foreground flex items-center justify-between">
                      <span>{profile.authProvider}</span>
                      <BadgeCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => setShowSignOutConfirm(true)}
                    >
                      <LogOut className="h-4 w-4" />
                      {t('profile.signOut')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (7 cols): Operational Credentials + Security Audits */}
          <div className="lg:col-span-7 space-y-6">
            {/* Operational Credentials Card */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Building className="h-4 w-4 text-secondary" />
                  {t('profile.rightCardTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted-foreground block font-medium mb-1">
                      {t('profile.department')}
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block font-medium mb-1">
                      {t('profile.primaryDistrict')}
                    </label>
                    <input
                      type="text"
                      name="primaryDistrict"
                      value={formData.primaryDistrict}
                      onChange={handleInputChange}
                      className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block font-medium mb-1">
                      {t('profile.commandUnit')}
                    </label>
                    <input
                      type="text"
                      name="commandUnit"
                      value={formData.commandUnit}
                      onChange={handleInputChange}
                      className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block font-medium mb-1">
                      {t('profile.station')}
                    </label>
                    <input
                      type="text"
                      name="station"
                      value={formData.station}
                      onChange={handleInputChange}
                      className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-muted-foreground block font-medium mb-1">
                    {t('profile.badge')}
                  </label>
                  <input
                    type="text"
                    name="badgeNumber"
                    value={formData.badgeNumber}
                    onChange={handleInputChange}
                    className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary font-mono font-bold tracking-wider focus:border-primary focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security & Compliance Audits Card */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    {t('profile.securityCardTitle')}
                  </span>
                  <Badge variant="tactical" className="text-[10px]">
                    STATUTORY AUDIT PASS
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4 text-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded border border-border bg-surface-elevated/50">
                    <div className="flex items-center gap-2.5">
                      <Lock className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-foreground">{t('profile.mfa')}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {profile.mfaEnforced ? t('profile.mfaActive') : t('profile.mfaInactive')}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                      ACTIVE
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-border bg-surface-elevated/50">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">{t('profile.chainOfCustody')}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {t('profile.cocActive')}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      VERIFIED
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-border bg-surface-elevated/50">
                    <div className="flex items-center gap-2.5">
                      <Radio className="h-4 w-4 text-[#63E6D2]" />
                      <div>
                        <div className="font-semibold text-foreground">{t('profile.sessionSecurity')}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {t('profile.sessionActive')} • 30m idle timeout
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-[#63E6D2]/40 text-[#63E6D2]">
                      SECURE
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {t('profile.auditNotice')}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/settings")}
                    className="text-xs"
                  >
                    System Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6"
              >
                <Save className="h-4 w-4" />
                {isSaving ? t('profile.saving') : t('profile.saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Sign Out Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="font-semibold text-lg text-foreground">
                {t('profile.signOutConfirm')}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('profile.signOutPrompt')}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 rounded text-xs font-semibold border border-border bg-surface-elevated hover:bg-surface-elevated/80 text-foreground transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  navigate("/overview");
                }}
                className="px-4 py-2 rounded text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white transition-colors"
              >
                {t('profile.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
