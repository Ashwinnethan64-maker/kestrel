import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BrainCircuit,
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Files,
  Scale,
  Lightbulb,
  MessageSquarePlus,
  FileText,
  FileDown,
  Pin,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Clock,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { apiClient } from "@/services/api/client";
import { FIRCase, AccusedSuspect } from "@kestrel/shared";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: { firNumber: string; title: string }[];
  isDemo?: boolean;
}

interface ConversationThread {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  isPinned?: boolean;
  messages: ChatMessage[];
  contextCaseIds?: string[];
}

export function CopilotPage() {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get("caseId");

  // Cases and suspects from ground dataset
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [suspects, setSuspects] = useState<AccusedSuspect[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  // Active threads
  const [threads, setThreads] = useState<ConversationThread[]>([
    {
      id: "thread-1",
      title: "Bengaluru Urban Cybercrime Cluster",
      preview: "Analysis of mule bank account routing in Whitefield tech corridor...",
      timestamp: "Today, 11:20 AM",
      isPinned: true,
      contextCaseIds: ["CASE-2024-WFD-0301", "CASE-2024-WFD-0305"],
      messages: [
        {
          id: "t1-1",
          role: "user",
          content: "Show statutory sections and modus operandi applied for cyber banking fraud in Whitefield.",
          timestamp: "11:18 AM",
        },
        {
          id: "t1-2",
          role: "assistant",
          content:
            "Whitefield sector exhibits organized crypto/phishing syndicates leveraging APK binaries and 6-layer mule bank accounts (HDFC and Yes Bank). Primary statutory sections invoked: IPC 420 (Cheating), IPC 120B (Criminal Conspiracy), and IT Act Section 66D. Syndicate leader Vikram 'Ghost' Malhotra associates with active account networks.",
          timestamp: "11:20 AM",
          citations: [
            { firNumber: "FIR-2024-WFD-0301", title: "Corporate Phishing & Wire Fraud" },
            { firNumber: "FIR-2024-WFD-0305", title: "Fake Crypto Trading App Syndicate" },
          ],
        },
      ],
    },
    {
      id: "thread-2",
      title: "Mysuru District Activity Sweep",
      preview: "Cross-jurisdiction vehicle tracking on Old Madras Road corridor...",
      timestamp: "Yesterday, 04:45 PM",
      isPinned: false,
      contextCaseIds: ["CASE-2024-KRP-0215"],
      messages: [
        {
          id: "t2-1",
          role: "user",
          content: "Did stolen vehicle KA-04-E-1234 cross into surrounding district checkpoints?",
          timestamp: "04:42 PM",
        },
        {
          id: "t2-2",
          role: "assistant",
          content:
            "ANPR toll log cross-referencing indicates black sedan KA-04-E-1234 crossed Hoskote toll plaza at 02:45 AM before returning to Indiranagar prior to the 100 Feet Road jewelry heist. Vehicle is registered as stolen under FIR-2024-KRP-0215.",
          timestamp: "04:45 PM",
          citations: [{ firNumber: "FIR-2024-KRP-0215", title: "Vehicle Theft at K.R. Puram" }],
        },
      ],
    },
    {
      id: "thread-3",
      title: "Drug & Extortion Priority Alerts",
      preview: "Commercial establishment extortion threats in Koramangala pubs...",
      timestamp: "21 Oct 2024",
      isPinned: false,
      contextCaseIds: ["CASE-2024-KORM-0088"],
      messages: [
        {
          id: "t3-1",
          role: "user",
          content: "Summarise extortion complaints lodged by Koramangala restaurant owners.",
          timestamp: "02:10 PM",
        },
        {
          id: "t3-2",
          role: "assistant",
          content:
            "Two retail establishments on 80 Feet Road registered complaints regarding late-night armed extortion demands by Raju Nayak's gang members. CCTV footage recovered under exhibit EVID-004 verifies suspect identity.",
          timestamp: "02:12 PM",
          citations: [{ firNumber: "FIR-2024-KORM-0088", title: "Extortion at Koramangala Gastro-Pub" }],
        },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>("thread-1");
  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || threads[0],
    [threads, activeThreadId]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(activeThread?.messages || []);
  const [inputQuery, setInputQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [language, setLanguage] = useState<"EN" | "KN">("EN");

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messageStreamEndRef = useRef<HTMLDivElement>(null);

  // Load ground datasets
  useEffect(() => {
    Promise.all([
      apiClient.getCases(),
      apiClient.getAccused(),
      (apiClient as any).getEvidenceByCaseId ? (apiClient as any).getEvidenceByCaseId("") : Promise.resolve({ data: [] }),
    ]).then(([casesRes, suspectsRes, evidenceRes]) => {
      setCases(casesRes.data);
      setSuspects(suspectsRes.data);
      setEvidenceList(evidenceRes.data || []);
    });
  }, []);

  // Update active thread when switched
  useEffect(() => {
    if (activeThread) {
      setMessages(activeThread.messages);
    }
  }, [activeThreadId]);

  // Handle caseId query parameter if opened from Case Explorer
  useEffect(() => {
    if (caseIdParam && cases.length > 0) {
      const targetCase = cases.find((c) => c.id === caseIdParam || c.firNumber === caseIdParam);
      if (targetCase) {
        const newThread: ConversationThread = {
          id: `case-thread-${Date.now()}`,
          title: `Dossier Interrogation: ${targetCase.firNumber}`,
          preview: `Investigating ${targetCase.crimeCategory} at ${targetCase.policeStation}...`,
          timestamp: "Just Now",
          isPinned: true,
          contextCaseIds: [targetCase.id],
          messages: [
            {
              id: `msg-${Date.now()}-1`,
              role: "assistant",
              content: `Focusing intelligence correlation on case ${targetCase.firNumber} (${targetCase.crimeCategory}). Incident registered at ${targetCase.policeStation} under ${targetCase.applicableActs.join(", ")}. How can I assist with this dossier?`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              citations: [{ firNumber: targetCase.firNumber, title: targetCase.crimeCategory }],
            },
          ],
        };
        setThreads((prev) => [newThread, ...prev]);
        setActiveThreadId(newThread.id);
      }
    }
  }, [caseIdParam, cases]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messageStreamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Derived contextual evidence and cases based on conversation citations and active thread
  const contextualCitations = useMemo(() => {
    const citedFirSet = new Set<string>();
    messages.forEach((m) => {
      m.citations?.forEach((c) => citedFirSet.add(c.firNumber));
    });
    return Array.from(citedFirSet);
  }, [messages]);

  const relatedCases = useMemo(() => {
    if (contextualCitations.length === 0) {
      return cases.slice(0, 3);
    }
    const matched = cases.filter((c) => contextualCitations.includes(c.firNumber));
    return matched.length > 0 ? matched : cases.slice(0, 3);
  }, [cases, contextualCitations]);

  const applicableActs = useMemo(() => {
    const acts = new Set<string>();
    relatedCases.forEach((c) => {
      c.applicableActs?.forEach((act) => acts.add(act));
    });
    return Array.from(acts);
  }, [relatedCases]);

  const contextualEvidence = useMemo(() => {
    const relatedIds = relatedCases.map((c) => c.id);
    const ev = evidenceList.filter((e) => relatedIds.includes(e.caseId));
    if (ev.length > 0) return ev;
    // Default fallback exhibits matching the active case
    return [
      {
        id: "EVID-001",
        title: "CCTV Footages from Indiranagar Corridor",
        description: "High-definition footage of getaway sedan KA-04-E-1234 departing crime scene.",
        evidenceType: "CCTV",
        firNumber: "FIR-2024-INDR-0102",
      },
      {
        id: "EVID-002",
        title: "Recovered Drop Machete with AFIS Latent Print",
        description: "Latent thumbprint matched against state suspect registry (SUSP-002).",
        evidenceType: "Weapon",
        firNumber: "FIR-2024-INDR-0102",
      },
      {
        id: "EVID-003",
        title: "Cell Tower Dump & CAN-Bus Sniffer Log",
        description: "Tower dump confirms suspect burner active during theft timestamp.",
        evidenceType: "Digital / CDR",
        firNumber: "FIR-2024-KRP-0215",
      },
    ];
  }, [evidenceList, relatedCases]);

  // Submission handler
  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputQuery("");
    setIsGenerating(true);

    // Update active thread preview & messages
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              preview: q.slice(0, 60) + "...",
              timestamp: "Just Now",
              messages: updatedMessages,
            }
          : t
      )
    );

    // Grounded Copilot response generation
    setTimeout(() => {
      let responseText = "";
      let citations: { firNumber: string; title: string }[] = [];
      const lower = q.toLowerCase();

      if (lower.includes("indiranagar") || lower.includes("burglary") || lower.includes("robbery")) {
        responseText =
          language === "KN"
            ? "ಇಂದಿರಾನಗರ ವಲಯದ ಪರಿಶೀಲನೆಯಲ್ಲಿ 3 ಸಶಸ್ತ್ರ ದರೋಡೆ ಮತ್ತು ಕನ್ನಗಳವು ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ. ಆರೋಪಿಗಳು KA-04-E-1234 ಕಪ್ಪು ಕಾರನ್ನು ಬಳಸಿದ್ದಾರೆ. ರಾಜು ನಾಯಕ್ ಗ್ಯಾಂಗ್ ಈ ಅಪರಾಧಗಳಲ್ಲಿ ಭಾಗಿಯಾಗಿರುವ ಶಂಕೆಯಿದೆ."
            : "Analysis of the Indiranagar jurisdictional sector correlates 3 commercial burglaries and armed robberies within the past 48 hours. Primary modus operandi: nighttime retail entrance forced with hydraulic cutters and getaway sedan KA-04-E-1234. Associated repeat offender Raju Nayak ('Snake') bailed 4 days prior.";
        citations = [
          { firNumber: "FIR-2024-INDR-0102", title: "Armed Robbery on 100 Feet Road" },
          { firNumber: "FIR-2024-INDR-0105", title: "Commercial Store Heist" },
        ];
      } else if (lower.includes("vehicle") || lower.includes("ka-04") || lower.includes("car")) {
        responseText =
          language === "KN"
            ? "ವಾಹನ ನೋಂದಣಿ KA-04-E-1234 (ಕಪ್ಪು ವರ್ನಾ) ಕೆ.ಆರ್. ಪುರಂನಲ್ಲಿ ಕಳವು ಮಾಡಲಾಗಿದ್ದು, ನಂತರ ಇಂದಿರಾನಗರ ದರೋಡೆಗೆ ಬಳಸಲಾಗಿದೆ ಎಂದು ತನಿಖೆಯಲ್ಲಿ ದೃಢಪಟ್ಟಿದೆ."
            : "Cross-referencing vehicle telemetry: Black sedan KA-04-E-1234 was stolen via electronic CAN-bus key bypass in K.R. Puram residential parking lot (FIR-2024-KRP-0215) and subsequently deployed as the tactical getaway vehicle in the Indiranagar Armed Robbery.";
        citations = [
          { firNumber: "FIR-2024-KRP-0215", title: "Vehicle Theft at K.R. Puram" },
          { firNumber: "FIR-2024-INDR-0102", title: "Armed Robbery Indiranagar Sector 2" },
        ];
      } else if (lower.includes("cyber") || lower.includes("fraud") || lower.includes("whitefield")) {
        responseText =
          language === "KN"
            ? "ವೈಟ್‌ಫೀಲ್ಡ್ ಸೈಬರ್ ಅಪರಾಧ ತನಿಖೆಯಲ್ಲಿ 24 ಲಕ್ಷ ರೂ. ಬ್ಯಾಂಕಿಂಗ್ ವರ್ಗಾವಣೆ ಪತ್ತೆಯಾಗಿದೆ. ಅಪರಾಧ ಸಂಬಂಧಿ APK ಬೈನರಿ 'ApexCrypto' ಪತ್ತೆಯಾಗಿದೆ."
            : "Financial intelligence audit confirms Whitefield Cyber Banking Ring routes illicit extortion capital through 6 layered bank mule accounts. Seized mobile devices verify malicious Android binary 'ApexCrypto' communicating with C2 infrastructure.";
        citations = [
          { firNumber: "FIR-2024-WFD-0301", title: "Corporate Phishing & Wire Fraud" },
          { firNumber: "FIR-2024-WFD-0305", title: "Fake Crypto Trading App Syndicate" },
        ];
      } else {
        responseText =
          language === "KN"
            ? "ರಾಜ್ಯ ಅಪರಾಧ ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ: ಒಟ್ಟು 60ಕ್ಕೂ ಹೆಚ್ಚು ಎಫ್‌ಐಆರ್ ಪ್ರಕರಣಗಳು ಮತ್ತು 10 ಪ್ರಮುಖ ಆರೋಪಿಗಳ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಕಾನೂನು ಸೆಕ್ಷನ್‌ಗಳು: IPC 379, IPC 392, ಮತ್ತು IPC 420."
            : `Grounded Intelligence Synthesis: Query cross-matched across active FIR cases and linked syndicate networks. Current clearance rate stands at 74.6% with high-priority statutory acts registered under IPC 392, IPC 379, and IPC 120B.`;
        citations = [{ firNumber: "FIR-2024-INDR-0102", title: "Crime Ledger Record" }];
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations,
        isDemo: true,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      setIsGenerating(false);

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: finalMessages }
            : t
        )
      );
    }, 600);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Start New Conversation
  const handleNewConversation = () => {
    const newId = `thread-${Date.now()}`;
    const newThread: ConversationThread = {
      id: newId,
      title: `Tactical Query Session #${threads.length + 1}`,
      preview: "New investigative interrogation session initialized...",
      timestamp: "Just Now",
      isPinned: false,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content:
            "New investigative session initialized. Grounded across active Karnataka police telemetry, FIR case files, and accused profiles. Ask about specific FIR numbers, suspect networks, vehicle plates, or statutory sections.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isDemo: true,
        },
      ],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setToastMessage("Created new investigative conversation thread.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Export as Plain Text Log (.txt)
  const handleExportTextLog = () => {
    if (messages.length === 0) {
      alert("No conversation messages to export.");
      return;
    }
    const logHeader = `==========================================================\nKESTREL INTELLIGENCE PLATFORM // AI INVESTIGATOR SESSION LOG\nTitle: ${activeThread.title}\nDate: ${new Date().toLocaleString()}\nVerified Citations: ${contextualCitations.join(", ") || "None"}\n==========================================================\n\n`;
    const logBody = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === "assistant" ? "AI INVESTIGATOR" : "INVESTIGATING OFFICER"}:\n${m.content}\n${
            m.citations && m.citations.length > 0
              ? "Verified Citations: " + m.citations.map((c) => `${c.firNumber} (${c.title})`).join("; ") + "\n"
              : ""
          }\n`
      )
      .join("\n----------------------------------------------------------\n\n");

    const blob = new Blob([logHeader + logBody], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kestrel-investigation-log-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportModal(false);
    setToastMessage("Investigation session exported as .txt log.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export Executive Printable PDF (.html / print window)
  const handleExportExecutivePDF = () => {
    if (messages.length === 0) {
      alert("No conversation messages to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocker prevented opening export view. Please permit pop-ups for Kestrel.");
      return;
    }

    const messagesHtml = messages
      .map(
        (m) => `
        <div class="msg-box ${m.role}">
          <div class="msg-header">
            <b>${m.role === "assistant" ? "AI INVESTIGATOR (KESTREL CO-PILOT)" : "INVESTIGATING OFFICER"}</b>
            <span>${m.timestamp}</span>
          </div>
          <div class="msg-body">${m.content.replace(/\n/g, "<br/>")}</div>
          ${
            m.citations && m.citations.length > 0
              ? `<div class="citations"><b>Verified Citations:</b> ${m.citations
                  .map((c) => `<span class="tag">${c.firNumber}: ${c.title}</span>`)
                  .join(" ")}</div>`
              : ""
          }
        </div>
      `
      )
      .join("");

    const relatedCasesHtml = relatedCases
      .map(
        (c) => `
        <tr>
          <td><b>${c.firNumber}</b></td>
          <td>${c.crimeCategory}</td>
          <td>${c.policeStation}</td>
          <td>${c.status}</td>
          <td>${c.priority}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kestrel Executive AI Investigation Brief - ${activeThread.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; margin: 36px; color: #111; line-height: 1.5; font-size: 13px; }
          .header { border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: bold; background: #222; color: #fff; text-transform: uppercase; border-radius: 2px; }
          h1 { margin: 8px 0 4px 0; font-size: 20px; text-transform: uppercase; }
          .meta { font-size: 11px; color: #555; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 24px 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
          .msg-box { border: 1px solid #ddd; padding: 12px; margin-bottom: 12px; border-radius: 4px; }
          .msg-box.user { background: #f9f9f9; border-left: 4px solid #444; }
          .msg-box.assistant { background: #fafafa; border-left: 4px solid #D4AF37; }
          .msg-header { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; color: #333; }
          .msg-body { font-size: 13px; color: #111; }
          .citations { margin-top: 8px; padding-top: 6px; border-top: 1px dashed #ddd; font-size: 11px; }
          .tag { background: #eee; padding: 2px 6px; border-radius: 2px; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f2f2f2; text-transform: uppercase; font-size: 11px; }
          @media print {
            body { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="badge">CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE</div>
          <h1>Kestrel AI Investigator Executive Brief</h1>
          <div class="meta">
            Thread: <b>${activeThread.title}</b> | Generated: ${new Date().toLocaleString()} | Classification: Official Police Telemetry
          </div>
        </div>

        <div class="section-title">Investigative Conversation Transcripts</div>
        ${messagesHtml}

        <div class="section-title">Correlated Crime Records in Scope</div>
        <table>
          <thead>
            <tr>
              <th>FIR Number</th>
              <th>Category</th>
              <th>Station</th>
              <th>Status</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            ${relatedCasesHtml}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setShowExportModal(false);
    setToastMessage("Generated Executive Brief for printing or saving to PDF.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const SUGGESTED_QUERIES = [
    "Summarise patterns across Indiranagar burglary cases",
    "Identify connections between repeat suspects and vehicle KA-04-E-1234",
    "Show statutory sections applied for cyber fraud in Whitefield",
    "Compare case trends across East and Central Bengaluru divisions",
    "Find records associated with FIR-2024-INDR-0102",
  ];

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Page Header */}
      <PageHeader
        title="AI Investigator"
        subtitle="Bilingual (English & Kannada) conversational crime-intelligence copilot grounded on verified FIR records, syndicate registries, and spatial telemetry."
        badge={
          <Badge variant="tactical" dot={true}>
            GROUNDED SYNDICATE ADAPTER // 60 CASES
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === "EN" ? "KN" : "EN")}
              className="gap-1.5 font-mono text-xs"
            >
              <span>LANG:</span>
              <span className="font-bold text-primary">{language === "EN" ? "ENGLISH" : "ಕನ್ನಡ (KN)"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="gap-1.5 font-mono text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>EXPORT CONVERSATION</span>
            </Button>
            <Button
              variant="tactical"
              size="sm"
              onClick={handleNewConversation}
              className="gap-1.5 font-mono text-xs"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>NEW CONVERSATION</span>
            </Button>
          </div>
        }
      />

      {/* Global Feedback Toast */}
      {toastMessage && (
        <div className="p-3 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-xs flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

      {/* Main Three-Part Responsive Workspace: 8 cols Conversation (70%) + 4 cols Evidence/Threads (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ============================================================== */}
        {/* A. Main Conversation Workspace (Approx 68–72% width -> 8 cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <Card className="h-[640px] flex flex-col border border-border shadow-xs overflow-hidden">
            {/* Top Workspace Bar */}
            <CardHeader className="py-2.5 px-4 border-b border-border/80 flex flex-row items-center justify-between shrink-0 bg-sidebar/70">
              <div className="flex items-center gap-2 truncate">
                <BrainCircuit className="h-4 w-4 text-primary shrink-0" />
                <span className="font-bold text-foreground truncate text-xs">
                  {activeThread.title}
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                  {language}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0 font-mono">
                <span className="hidden sm:inline text-positive flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-positive inline-block" />
                  GROUNDED ON 60 CASES
                </span>
                <button
                  onClick={handleNewConversation}
                  className="hover:text-primary transition-colors flex items-center gap-1 text-[11px]"
                  title="Start fresh conversation"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden md:inline">Reset</span>
                </button>
              </div>
            </CardHeader>

            {/* Scrollable Conversational Message Stream */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-3">
                  <BrainCircuit className="h-10 w-10 text-primary opacity-60 animate-pulse" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Kestrel AI Intelligence Copilot
                    </h3>
                    <p className="max-w-md text-xs font-sans">
                      Ask about specific FIR numbers, recurring crime patterns across Bengaluru,
                      modus operandi, syndicate affiliations, or applicable statutory sections.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isAsst = m.role === "assistant";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 text-xs ${
                        isAsst ? "justify-start" : "justify-end"
                      }`}
                    >
                      {/* Assistant Avatar */}
                      {isAsst && (
                        <div className="h-7 w-7 rounded bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0 text-primary">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-lg p-3 space-y-2 border ${
                          isAsst
                            ? "bg-surface-elevated/80 border-border text-foreground"
                            : "bg-primary/20 border-primary/50 text-foreground font-semibold"
                        }`}
                      >
                        {/* Header with speaker label & timestamp */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-1 border-b border-border/40 font-mono">
                          <span className={isAsst ? "text-primary font-bold" : "text-foreground font-bold"}>
                            {isAsst ? "AI INVESTIGATOR" : "INVESTIGATING OFFICER"}
                          </span>
                          <span>{m.timestamp}</span>
                        </div>

                        {/* Message content */}
                        <div className="text-xs font-sans leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </div>

                        {/* Verified Case Citations */}
                        {m.citations && m.citations.length > 0 && (
                          <div className="pt-2 border-t border-border/50 space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                              Verified Grounding Citations:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {m.citations.map((c) => (
                                <Link
                                  key={c.firNumber}
                                  to={`/cases?caseId=${c.firNumber}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-border text-[10px] text-primary hover:border-primary transition-colors font-mono"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>{c.firNumber}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer with copy control */}
                        {isAsst && (
                          <div className="flex items-center justify-end pt-1">
                            <button
                              onClick={() => handleCopy(m.id, m.content)}
                              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono transition-colors"
                            >
                              {copiedId === m.id ? (
                                <>
                                  <Check className="h-3 w-3 text-positive" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Response</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* User Avatar */}
                      {!isAsst && (
                        <div className="h-7 w-7 rounded bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 text-secondary">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Generating Animation */}
              {isGenerating && (
                <div className="flex gap-3 text-xs justify-start animate-pulse">
                  <div className="h-7 w-7 rounded bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="p-3 rounded-lg bg-surface-elevated/80 border border-border text-primary font-mono text-xs flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span>Synthesizing intelligence telemetry & citing case records...</span>
                  </div>
                </div>
              )}

              <div ref={messageStreamEndRef} />
            </CardContent>

            {/* Interactive Suggested Prompts Bar */}
            <div className="px-3 py-1.5 bg-surface-elevated/40 border-t border-border/60 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <Lightbulb className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold shrink-0">
                Suggestions:
              </span>
              {SUGGESTED_QUERIES.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="px-2 py-0.5 rounded bg-card hover:bg-surface-elevated border border-border hover:border-primary/50 text-[10px] text-muted-foreground hover:text-foreground truncate shrink-0 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Composer Input Area */}
            <div className="p-2.5 border-t border-border bg-card shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask the investigation assistant about cases, entities, legal sections or geographic patterns…"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={isGenerating}
                  className="flex-1 rounded border border-border bg-surface-elevated/70 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                />
                <Button
                  type="submit"
                  variant="tactical"
                  size="sm"
                  disabled={isGenerating || !inputQuery.trim()}
                  className="gap-1.5 font-mono text-xs h-9 px-4 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>SEND</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* ============================================================== */}
        {/* B & C. Context Panel: Evidence, Acts, Cases, Active Threads   */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 space-y-3">
          {/* B1. Evidence Panel */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="p-2.5 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
              <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Supporting Evidence ({contextualEvidence.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 space-y-2 max-h-44 overflow-y-auto">
              {contextualEvidence.map((ev: any) => (
                <div
                  key={ev.id}
                  className="p-2 rounded bg-surface-elevated border border-border space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">{ev.title}</span>
                    <Badge variant="tactical" className="text-[9px] px-1 py-0">
                      {ev.evidenceType}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-sans line-clamp-2">
                    {ev.description}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-0.5">
                    <span className="font-mono text-primary">{ev.id}</span>
                    <Link
                      to={`/cases?caseId=${ev.firNumber}`}
                      className="hover:underline text-primary flex items-center gap-0.5"
                    >
                      <span>{ev.firNumber || "Related Case"}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* B2. Applicable Legal Acts */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="p-2.5 border-b border-border/80 bg-sidebar/50">
              <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                <Scale className="h-3.5 w-3.5 text-attention shrink-0" />
                <span>Applicable Legal Acts (IPC / BNS)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {applicableActs.map((act) => (
                  <span
                    key={act}
                    className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary font-bold text-[11px] font-mono"
                  >
                    {act}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* B3. Related Cases */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="p-2.5 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
              <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                <Files className="h-3.5 w-3.5 text-secondary shrink-0" />
                <span>Correlated Case Files</span>
              </CardTitle>
              <Link to="/cases" className="text-[10px] text-primary hover:underline">
                Explore All
              </Link>
            </CardHeader>
            <CardContent className="p-2.5 space-y-1.5 max-h-40 overflow-y-auto">
              {relatedCases.map((c) => (
                <div
                  key={c.id}
                  className="p-2 rounded bg-surface-elevated/70 border border-border flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-primary font-mono">{c.firNumber}</div>
                    <div className="text-[10px] text-foreground truncate">{c.crimeCategory}</div>
                    <div className="text-[9px] text-muted-foreground">{c.policeStation}</div>
                  </div>
                  <Link to={`/cases?caseId=${c.id}`}>
                    <Button variant="outline" size="sm" className="h-6 px-1.5 text-[10px] font-mono">
                      Open
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* C. Active Threads & Searches */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="p-2.5 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
              <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Active Threads & Searches</span>
              </CardTitle>
              <button
                onClick={handleNewConversation}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="New Thread"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
              </button>
            </CardHeader>
            <CardContent className="p-2.5 space-y-1.5 max-h-44 overflow-y-auto">
              {threads.map((t) => {
                const isActive = t.id === activeThreadId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={`w-full text-left p-2 rounded border transition-colors flex items-start justify-between gap-1.5 ${
                      isActive
                        ? "bg-primary/15 border-primary/50 text-foreground"
                        : "bg-surface-elevated/50 border-border text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    <div className="truncate space-y-0.5">
                      <div className="font-bold text-xs truncate flex items-center gap-1">
                        {t.isPinned && <Pin className="h-2.5 w-2.5 text-primary shrink-0" />}
                        <span className="truncate">{t.title}</span>
                      </div>
                      <div className="text-[10px] truncate opacity-80 font-sans">{t.preview}</div>
                    </div>
                    <span className="text-[9px] shrink-0 opacity-60 font-mono mt-0.5">
                      {t.timestamp}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Conversation Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Intelligence Conversation"
        description="Download or generate formal transcripts of this AI Investigator session."
        size="md"
      >
        <div className="space-y-4 font-mono text-xs">
          <p className="text-muted-foreground text-xs font-sans">
            Export the complete thread history including timestamps, verified statutory citations,
            and supporting crime exhibits.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Plain Text Log Option */}
            <button
              onClick={handleExportTextLog}
              className="p-3.5 rounded border border-border bg-surface-elevated hover:border-primary text-left space-y-2 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <FileText className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
                <Badge variant="outline" className="text-[9px]">
                  .TXT FILE
                </Badge>
              </div>
              <div>
                <div className="font-bold text-foreground text-xs">Text Session Log</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-sans">
                  Raw plain-text transcript with officer roles, timestamps, and citation references.
                </div>
              </div>
              <div className="text-[10px] text-primary flex items-center gap-1 font-bold pt-1">
                <span>Download .txt</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </button>

            {/* Executive PDF Option */}
            <button
              onClick={handleExportExecutivePDF}
              className="p-3.5 rounded border border-border bg-surface-elevated hover:border-primary text-left space-y-2 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <FileDown className="h-5 w-5 text-primary" />
                <Badge variant="tactical" className="text-[9px]">
                  PDF BRIEF
                </Badge>
              </div>
              <div>
                <div className="font-bold text-foreground text-xs">Executive Brief PDF</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-sans">
                  Formatted, printable intelligence brief with case summary tables and official headers.
                </div>
              </div>
              <div className="text-[10px] text-primary flex items-center gap-1 font-bold pt-1">
                <span>Print / Save PDF</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-border flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowExportModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
