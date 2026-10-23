import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 font-mono">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/30 mb-4 animate-pulse">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-1 uppercase tracking-wider">
        404 // SECTOR OUT OF BOUNDS
      </h1>
      <p className="text-xs text-muted-foreground font-sans max-w-sm mb-6 leading-relaxed">
        The requested tactical vector or route does not exist within the current jurisdiction grid.
      </p>
      <Link to="/overview">
        <Button variant="tactical" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> RETURN TO COMMAND DECK
        </Button>
      </Link>
    </div>
  );
}
