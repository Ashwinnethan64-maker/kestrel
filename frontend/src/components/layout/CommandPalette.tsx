import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FolderGit2, Share2, MapPin, Sparkles, BarChart3, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // handled in parent or toggle
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: "Cases & FIR Records", path: "/cases", icon: FolderGit2, hint: "FIR Explorer" },
    { label: "Entity Network Graph", path: "/network", icon: Share2, hint: "Syndicate Links" },
    { label: "Geographic Intel Map", path: "/gis", icon: MapPin, hint: "Patrol & Hotspots" },
    { label: "AI Copilot Analysis", path: "/copilot", icon: Sparkles, hint: "Natural Language RAG" },
    { label: "Tactical Analytics", path: "/analytics", icon: BarChart3, hint: "KPIs & Trends" },
    { label: "Intelligence Reports", path: "/reports", icon: FileText, hint: "Classified Dossiers" },
  ];

  const filteredNav = quickNav.filter((n) =>
    n.label.toLowerCase().includes(query.toLowerCase()) ||
    n.hint.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Palette Card */}
      <div className="relative z-50 w-full max-w-xl rounded-lg border border-primary/40 bg-card p-4 shadow-2xl animate-fade-in font-mono">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Search className="h-4 w-4 text-primary shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, suspect name, or navigate to a view..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="mt-3 space-y-1 max-h-72 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">
            Navigation & Actions
          </div>
          {filteredNav.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No tactical results found for "{query}"
            </div>
          ) : (
            filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between rounded px-3 py-2 text-xs text-left text-foreground hover:bg-surface-elevated hover:text-primary transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-sans">
                    {item.hint}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Navigation: <kbd className="bg-surface-elevated px-1 py-0.5 rounded">↑</kbd> <kbd className="bg-surface-elevated px-1 py-0.5 rounded">↓</kbd></span>
          <span>Select: <kbd className="bg-surface-elevated px-1 py-0.5 rounded">ENTER</kbd></span>
          <span>Close: <kbd className="bg-surface-elevated px-1 py-0.5 rounded">ESC</kbd></span>
        </div>
      </div>
    </div>
  );
}
