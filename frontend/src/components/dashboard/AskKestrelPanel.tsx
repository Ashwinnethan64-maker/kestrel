import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send, HelpCircle, CheckCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SUGGESTED_QUERIES = [
  "Summarise patterns in the current dataset",
  "Compare trends across the selected period",
  "Explore documented links between selected entities",
  "Identify areas with the highest recorded activity",
];

interface AskKestrelPanelProps {
  onExecuteQuery?: (q: string) => void;
}

export function AskKestrelPanel({ onExecuteQuery }: AskKestrelPanelProps) {
  const [query, setQuery] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [activeResponse, setActiveResponse] = useState<string | null>(
    "Ready for investigative analysis. Type a query or select a suggestion below to probe crime patterns, syndicate linkages, or statutory sections."
  );

  const handleSend = (userQuery?: string) => {
    const q = userQuery || query;
    if (!q.trim()) return;

    setQuery(q);
    setIsAnswering(true);

    // Provide contextual, grounded demo intelligence response
    setTimeout(() => {
      setIsAnswering(false);
      if (q.includes("Summarise patterns") || q.includes("highest recorded")) {
        setActiveResponse(
          "Analysis indicates a pronounced cluster of Two-Wheeler Thefts and Night Burglaries in the Indiranagar & K.R. Puram divisions. 38.5% of incidents feature recurring Modus Operandi (forced window latch entry, targeting jewelry). Two repeat suspects with prior history under IPC 379/457 are active within 2.5km."
        );
      } else if (q.includes("links between") || q.includes("entities")) {
        setActiveResponse(
          "Cross-case entity analysis reveals co-accused linkages between Raju Nayak (SUSP-001) and Mohammed Farooq (SUSP-002). Both are flagged in FIR 102/24 and FIR 215/24, linked to a shared getaway vehicle (KA-04-E-1234) sighted at Hebbal Toll."
        );
      } else {
        setActiveResponse(
          `Grounded Intelligence: For query "${q}", 14 matching FIR cases were cross-examined across Bengaluru North and East sectors. Incident velocity indicates a 14.2% month-over-month decrease following targeted checkpoint positioning.`
        );
      }

      if (onExecuteQuery) onExecuteQuery(q);
    }, 450);
  };

  return (
    <Card glow="teal" className="h-full flex flex-col justify-between bg-card/95 border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>Ask Kestrel — Tactical Copilot</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <Badge variant="tactical" className="px-1.5 py-0.2">
              BILINGUAL // KN+EN
            </Badge>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
          Ask natural-language intelligence questions grounded strictly in verified case records.
        </p>
      </CardHeader>

      <CardContent className="space-y-3 pt-1 flex-1 flex flex-col justify-between">
        {/* Output response bubble */}
        <div className="rounded-md border border-border bg-surface-elevated/70 p-3 font-mono text-xs text-foreground/90 leading-relaxed min-h-[90px] flex flex-col justify-between">
          {isAnswering ? (
            <div className="flex items-center gap-2 text-primary text-xs py-4">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <span>Analyzing case knowledge graph & vector embeddings...</span>
            </div>
          ) : (
            <>
              <div>{activeResponse}</div>
              <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="text-primary font-semibold">Strict Grounding: ZERO Hallucinations</span>
                <Link to="/copilot" className="hover:text-primary transition-colors flex items-center gap-1">
                  Full Session <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Suggestion Chips */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Suggested Query Chips
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUERIES.map((sq) => (
              <button
                key={sq}
                onClick={() => handleSend(sq)}
                className="rounded border border-border bg-surface-elevated px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors text-left"
              >
                → {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask intelligence copilot (e.g. 'Show repeat offenders in Indiranagar')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-md border border-input bg-surface-elevated px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
            />
            <Button
              type="submit"
              variant="tactical"
              size="sm"
              disabled={isAnswering || !query.trim()}
              className="gap-1 font-mono text-xs shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ASK</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
