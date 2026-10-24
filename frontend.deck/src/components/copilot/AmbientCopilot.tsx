import React, { useState, useRef, useEffect } from 'react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { useIntelClient } from '@/services/api/intelClient';
import { useQuery } from '@tanstack/react-query';
import { ActiveCaseboard } from './ActiveCaseboard';
import {
  Sparkles,
  Send,
  Languages,
  AlertTriangle,
  Zap,
  HelpCircle,
  FileText,
  StopCircle,
  Bot,
  User,
  ShieldAlert,
} from 'lucide-react';
import type { CopilotResponseChunk, CopilotPromptEnvelope } from '@kestrel/shared';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp: string;
}

export const AmbientCopilot: React.FC = () => {
  const client = useIntelClient();
  const getPromptContextEnvelope = useCommandDeckStore((s) => s.getPromptContextEnvelope);
  const activeCaseId = useCommandDeckStore((s) => s.activeCaseId);
  const openCaseNexus = useCommandDeckStore((s) => s.openCaseNexus);

  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Tactical Ambient Copilot active. Monitoring live Bengaluru East operational stream. Context envelopes auto-synchronized with your tactical canvas lens.',
      citations: ['FIR-2024-INDR-0102'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load cases, suspects, and evidence to populate active caseboard
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => client.getCases(),
  });

  const { data: suspects = [] } = useQuery({
    queryKey: ['suspects'],
    queryFn: () => client.getSuspects(),
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence', activeCaseId || 'all'],
    queryFn: () => (activeCaseId ? client.getEvidence(activeCaseId) : Promise.resolve([])),
  });

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Contextual Threat Flash Detection
  const activeCase = cases.find((c) => c.id === activeCaseId);
  const showThreatBanner = activeCaseId === 'CASE-2024-INDR-0102' || activeCase?.priority === 'Critical';

  // Handle Query Submission
  const handleSend = (text?: string) => {
    const queryText = (text || inputQuery).trim();
    if (!queryText || isStreaming) return;

    setInputQuery('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMessageId = `assist-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    const baseEnvelope = getPromptContextEnvelope();
    const fullEnvelope: CopilotPromptEnvelope = {
      ...baseEnvelope,
      query: queryText,
      language,
    };

    abortControllerRef.current = client.streamCopilotQuery(fullEnvelope, {
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: msg.content + token } : msg
          )
        );
      },
      onCitation: (citations) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, citations } : msg
          )
        );
      },
      onAction: (chunk) => {
        if (chunk.suggestedAction?.actionType === 'FOCUS_SUSPECT') {
          // Can focus suspect if directed
        }
      },
      onDone: () => {
        setIsStreaming(false);
      },
      onError: (err) => {
        console.error('[Copilot Stream Error]:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + '\n\n*(Error encountered during stream)*' }
              : msg
          )
        );
        setIsStreaming(false);
      },
    });
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050b14] text-slate-100 select-text overflow-hidden">
      {/* ── Copilot Rail Top HUD Bar ───────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#081528] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-beacon-ping" />
          <span className="text-[11px] font-mono font-bold text-cyan-400 tracking-wider">
            AMBIENT COPILOT
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            GROQ LLM
          </span>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0a182d] border border-cyan-900/60 hover:border-cyan-500/50 text-[10px] font-mono text-cyan-300 transition-colors"
          title="Toggle English / Kannada Response Generation"
        >
          <Languages className="w-3 h-3 text-cyan-400" />
          <span>{language === 'en' ? 'EN ↔ ಕನ್ನಡ' : 'ಕನ್ನಡ ↔ EN'}</span>
        </button>
      </div>

      {/* ── Proactive Threat Flash Banner ──────────────────────────────── */}
      {showThreatBanner && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-red-950/80 via-[#190a12] to-amber-950/40 border-b border-red-900/80 text-xs shrink-0 animate-fade-in">
          <div className="flex items-start gap-2 text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-[11px] leading-snug">
              <span className="font-mono font-bold text-rose-400 uppercase">
                PROACTIVE MO MATCH:
              </span>{' '}
              7.65mm shell casings and Pulsar getaway pattern match un-recovered firearm in{' '}
              <button
                onClick={() => openCaseNexus('CASE-2024-KRP-0215')}
                className="underline font-mono text-cyan-300 hover:text-cyan-200"
              >
                FIR-2024-KRP-0215
              </button>
              . Suspect Raju Nayak bailed 6 days ago.
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Message Stream ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-1 px-1">
              {m.role === 'user' ? (
                <>
                  <span>You</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400">Kestrel AI</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[92%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                  : 'bg-[#0a1322] border border-cyan-900/40 text-slate-200 rounded-bl-none shadow-lg'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{m.content}</div>

              {/* Clickable FIR Citation Pills */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-cyan-950/80 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                  <span className="text-slate-400">Cited Intelligence:</span>
                  {m.citations.map((fir) => (
                    <button
                      key={fir}
                      onClick={() => openCaseNexus(fir)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 transition-colors"
                      title="Drill directly into 360° Case Nexus"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span>{fir}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono py-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Kestrel Intelligence is generating streaming analysis…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Contextual Action Chips ────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-white/5 bg-[#060e18] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => handleSend('Draft comprehensive grounds to oppose regular bail for Raju Nayak under Section 480 BNSS.')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0a182d] hover:bg-cyan-950/60 border border-cyan-900/60 text-[10px] font-mono text-cyan-300 whitespace-nowrap transition-colors"
        >
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>⚡ Oppose Bail (BNSS 480)</span>
        </button>

        <button
          onClick={() => handleSend('Spot inconsistencies between complainant statements and CCTV timestamp.')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0a182d] hover:bg-amber-950/60 border border-amber-900/60 text-[10px] font-mono text-amber-300 whitespace-nowrap transition-colors"
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>🔎 Spot Witness Inconsistencies</span>
        </button>

        <button
          onClick={() => {
            setLanguage('kn');
            handleSend('ಪ್ರಕರಣದ ಪ್ರಮುಖ ಸಾರಾಂಶ ಮತ್ತು ಕ್ರಮಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ನೀಡಿ.');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0a182d] hover:bg-purple-950/60 border border-purple-900/60 text-[10px] font-mono text-purple-300 whitespace-nowrap transition-colors"
        >
          <Languages className="w-3 h-3 text-purple-400" />
          <span>🗣️ ಕನ್ನಡ ಸಾರಾಂಶ</span>
        </button>
      </div>

      {/* ── Chat Input Bar ─────────────────────────────────────────────── */}
      <div className="p-3 border-t border-white/10 bg-[#071325] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Query tactical database, BNSS statutes, or suspects…'
                : 'ಆರೋಪಿಗಳು ಅಥವಾ BNSS ಕಾನೂನುಗಳ ಬಗ್ಗೆ ಕೇಳಿ…'
            }
            className="flex-1 bg-[#050b14] border border-cyan-900/60 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStream}
              className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              title="Stop Streaming"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white transition-colors shadow-md"
              title="Send Command"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* ── Active Caseboard Tray ──────────────────────────────────────── */}
      <ActiveCaseboard
        cases={cases}
        suspects={suspects}
        evidence={evidence}
      />
    </div>
  );
};
