import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  BrainCircuit,
  Network,
  Scale,
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Languages,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KestrelLogo } from "@/components/layout/KestrelLogo";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useTranslation } from "@/lib/i18n";

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguageStore();
  const { login, loginWithGoogle } = useAuthStore();

  const [username, setUsername] = useState("ashwin.nethan");
  const [password, setPassword] = useState("kestrel2024");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        setSuccessMessage(t("auth.successRedirect"));
        setTimeout(() => {
          navigate("/overview");
        }, 500);
      } else {
        setErrorMessage(t(result.error || "auth.errorInvalidCredentials"));
      }
    } catch (err: any) {
      setErrorMessage(err.message || t("auth.errorInvalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        setSuccessMessage(t("auth.successRedirect"));
        setTimeout(() => {
          navigate("/overview");
        }, 500);
      } else {
        setErrorMessage(t(result.error || "auth.errorInvalidCredentials"));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "SSO Authentication failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row bg-background text-foreground font-sans select-none overflow-x-hidden">
      {/* Top Floating Controls: Language Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded border border-border bg-card/80 backdrop-blur-md px-3 py-1.5 text-xs font-mono text-foreground hover:border-primary/50 transition-colors shadow-lg"
          title="Toggle Language (English / ಕನ್ನಡ)"
          aria-label="Change Language"
        >
          <Languages className="h-4 w-4 text-primary" />
          <span className="font-bold text-xs uppercase">{language === "en" ? "EN" : "ಕನ್ನಡ"}</span>
        </button>
      </div>

      {/* LEFT COLUMN: Editorial Branding, Hero Statement, and Feature Highlights */}
      <div className="lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-border bg-sidebar/60 relative overflow-hidden">
        {/* Subtle Background Tactical Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <KestrelLogo showWordmark={true} size={32} />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="tactical" className="text-[10px] py-0.5 px-2">
              KARNATAKA STATE POLICE
            </Badge>
            <span className="text-muted-foreground text-xs font-mono">• COMMAND INTELLIGENCE SOC</span>
          </div>
        </div>

        {/* Center Brand Statements */}
        <div className="relative z-10 my-12 lg:my-0 space-y-6 max-w-xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground leading-tight tracking-tight">
            {t("auth.mainHeading")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {t("auth.description")}
          </p>

          {/* Three Feature Highlights */}
          <div className="space-y-4 pt-4">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-lg border border-border/70 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <div className="h-8 w-8 rounded bg-[#63E6D2]/15 border border-[#63E6D2]/30 flex items-center justify-center text-[#63E6D2] shrink-0">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold text-foreground font-sans">
                  {t("auth.feature1Title")}
                </h2>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {t("auth.feature1Desc")}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-lg border border-border/70 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <div className="h-8 w-8 rounded bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Network className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold text-foreground font-sans">
                  {t("auth.feature2Title")}
                </h2>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {t("auth.feature2Desc")}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-lg border border-border/70 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <div className="h-8 w-8 rounded bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0">
                <Scale className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold text-foreground font-sans">
                  {t("auth.feature3Title")}
                </h2>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {t("auth.feature3Desc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Audit Notice */}
        <div className="relative z-10 text-[11px] text-muted-foreground font-mono">
          {t("auth.notice")}
        </div>
      </div>

      {/* RIGHT COLUMN: Clean, Elevated Tactical Sign-in Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-tactical-grid">
        <div className="w-full max-w-md rounded-xl border border-border bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {/* Card Title */}
          <div className="space-y-1.5 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>{t("auth.cardTitle")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("auth.cardSubtitle")}
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                {t("auth.usernameLabel")}
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("auth.usernamePlaceholder")}
                  className="w-full h-10 rounded-md border border-border bg-surface-elevated/70 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                {t("auth.passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="w-full h-10 rounded-md border border-border bg-surface-elevated/70 pl-9 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full h-10 gap-2 font-mono text-xs font-bold uppercase tracking-wider"
              variant="tactical"
            >
              {isLoading ? (
                <span>{t("auth.authenticating")}</span>
              ) : (
                <>
                  <span>{t("auth.signInButton")}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative px-3 bg-card text-[10px] font-mono text-muted-foreground uppercase">
              {t("auth.orDivider")}
            </div>
          </div>

          {/* Google / Official SSO Button */}
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-10 gap-2.5 font-sans text-xs border-border hover:border-primary/50 bg-surface-elevated/60 text-foreground transition-colors"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isGoogleLoading ? t("auth.authenticating") : t("auth.googleSignIn")}</span>
          </Button>

          {/* Officer Demo Quick Note */}
          <div className="pt-2 text-center text-[10px] text-muted-foreground font-mono">
            Demo Credentials Pre-filled • Press <b className="text-primary font-bold">Authenticate</b> to launch
          </div>
        </div>
      </div>
    </div>
  );
}
