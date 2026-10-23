import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
  Download,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: { firNumber: string; title: string }[];
  isDemo?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  "Summarise patterns across Indiranagar burglary cases",
  "Identify connections between repeat suspects and vehicle KA-04-E-1234",
  "Show statutory sections applied for cyber fraud in Bengaluru East",
  "Recommend tactical patrol checkpoint deployment for high-risk night hours",
];

export function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      role: "assistant",
      content:
        "Welcome to the Kestrel Ambient AI Copilot. I analyze the active FIR database, suspect profiles, and geospatial clusters. I support natural language queries in English and Kannada with strict grounding against verified case records.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isDemo: true,
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsGenerating(true);

    // Contextual Grounded Response Engine (Demo Adapter with citations)
    setTimeout(() => {
      let responseText = "";
      let citations: { firNumber: string; title: string }[] = [];

      if (q.toLowerCase().includes("indiranagar") || q.toLowerCase().includes("burglary")) {
        responseText =
          "Analysis of Indiranagar division reveals 3 recorded burglaries within the past 48 hours. The incidents share an identical modus operandi: forced rear-window latches between 01:30 and 03:45 AM targeting gold jewelry. Repeat offender Raju Nayak (alias 'Snake'), bailed 4 days prior, resides within 1.2km of the cluster.";
        citations = [
          { firNumber: "FIR-2024-INDR-0102", title: "Burglary at 12th Main Indiranagar" },
          { firNumber: "FIR-2024-INDR-0105", title: "Residential Housebreak Defence Colony" },
        ];
      } else if (q.toLowerCase().includes("vehicle") || q.toLowerCase().includes("ka-04")) {
        responseText =
          "Cross-referencing vehicle registration KA-04-E-1234 (Black Sedan): Vehicle was reported stolen in K.R. Puram and subsequently sighted as the getaway vehicle in the Indiranagar Armed Robbery. It bridges suspects Raju Nayak (Indiranagar Syndicate) and Anand Kumar (K.R. Puram Network).";
        citations = [
          { firNumber: "FIR-2024-KRP-0215", title: "Vehicle Theft at K.R. Puram Market" },
          { firNumber: "FIR-2024-INDR-0102", title: "Armed Robbery Indiranagar Sector 2" },
        ];
      } else {
        responseText =
          `Grounded Intelligence: Evaluating query across 60+ indexed FIR cases and 10 accused profiles. Correlation indicates active investigation status with primary statutory sections under IPC 379, IPC 457, and IPC 392. Clearance rate across Bengaluru Metro stands at 74.6%.`;
        citations = [{ firNumber: "FIR-2024-METRO-0044", title: "Comprehensive Crime Audit" }];
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations,
        isDemo: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 700);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "msg-initial",
        role: "assistant",
        content: "Session refreshed. How can I assist your ongoing investigation today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isDemo: true,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Intelligence Copilot"
        subtitle="Bilingual (Kannada & English) conversational investigative assistant with strict relational and vector grounding."
        badge={
          <Badge variant="tactical" dot={true}>
            GROUNDED DEMO ADAPTER
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-1.5 font-mono text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>NEW CONVERSATION</span>
            </Button>
          </div>
        }
      />

      {/* Main Conversation Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chat History & Stream Container (3 cols) */}
        <Card className="lg:col-span-3 flex flex-col h-[600px]">
          <CardHeader className="py-3 px-4 border-b border-border/80 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <CardTitle className="text-xs font-mono">Investigative Stream</CardTitle>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
              <span>CONTEXT: 60 CURATED CASES</span>
              <span className="text-border">|</span>
              <span className="text-positive">GROUNDED // ZERO HALLUCINATIONS</span>
            </div>
          </CardHeader>

          {/* Messages Viewport */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-lg p-3 space-y-2 font-mono ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-surface-elevated border border-border text-foreground"
                  }`}
                >
                  <div className="text-xs font-sans leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>

                  {/* Citations section if present */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                        Verified Case Evidence Citations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.citations.map((c) => (
                          <Link
                            key={c.firNumber}
                            to="/cases"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-card border border-border text-[10px] text-primary hover:border-primary transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            <span>{c.firNumber}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message footer */}
                  <div className="flex items-center justify-between text-[10px] opacity-70 pt-1">
                    <span>{m.timestamp}</span>
                    {m.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="hover:opacity-100 flex items-center gap-1 text-[10px]"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-2.5 w-2.5 text-positive" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-2.5 w-2.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {m.role === "user" && (
                  <div className="h-7 w-7 rounded bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 text-secondary">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-3 text-xs justify-start animate-pulse">
                <div className="h-7 w-7 rounded bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-lg bg-surface-elevated border border-border text-primary font-mono text-xs flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span>Synthesizing intelligence telemetry & citing case records...</span>
                </div>
              </div>
            )}
          </CardContent>

          {/* Composer Input Area */}
          <div className="p-3 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask intelligence questions (e.g. 'Show repeat offenders in Indiranagar')..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isGenerating}
                className="flex-1 rounded-md border border-input bg-surface-elevated px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
              />
              <Button
                type="submit"
                variant="tactical"
                size="sm"
                disabled={isGenerating || !inputQuery.trim()}
                className="gap-1.5 font-mono text-xs h-9 px-4"
              >
                <Send className="h-3.5 w-3.5" />
                <span>SEND</span>
              </Button>
            </form>
          </div>
        </Card>

        {/* Tactical Query Sidebar (1 col) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span>Suggested Query Prompts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEFAULT_SUGGESTIONS.map((sq) => (
                <button
                  key={sq}
                  onClick={() => handleSend(sq)}
                  className="w-full text-left p-2.5 rounded bg-surface-elevated/70 border border-border/70 hover:border-primary/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-all group"
                >
                  <div className="flex items-start gap-1.5">
                    <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    <span>{sq}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono">Telemetry Grounding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-xs text-muted-foreground">
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <div className="text-foreground font-bold text-[11px] mb-0.5">Bilingual Support</div>
                <div className="text-[10px]">Natural query support for Kannada (ಕನ್ನಡ) & English.</div>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <div className="text-foreground font-bold text-[11px] mb-0.5">Zero Hallucinations</div>
                <div className="text-[10px]">Restricted exclusively to records registered in the state database.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
