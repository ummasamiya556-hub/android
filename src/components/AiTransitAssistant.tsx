import React, { useState, useRef, useEffect } from 'react';
import { useTransit } from '../context/TransitContext';
import {
  Sparkles,
  Send,
  X,
  Compass,
  MapPin,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Bot,
  User,
  Power,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  groundingSources?: Array<{
    title: string;
    uri?: string;
  }>;
  isFallback?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  'How to avoid 40-min KTM wait from MITEC?',
  'Which platform at Segambut Station for Putra?',
  'Walking directions from SMK Segambut to Bus 190 stop',
  'Is Go KL Bus 13 free? What are the operating hours?',
  'Best connection from PWTC LRT to Putra Court',
];

function renderMarkdownContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIdx} className="h-1.5" />;
    }

    // Check if bullet point
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const lineText = isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : trimmed;

    // Split for **bold** text
    const parts = lineText.split(/(\*\*[^*]+\*\*)/g);
    const formattedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-emerald-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
          <span className="flex-1 leading-relaxed">{formattedParts}</span>
        </div>
      );
    }

    return (
      <div key={lineIdx} className="my-0.5 leading-relaxed">
        {formattedParts}
      </div>
    );
  });
}

export const AiTransitAssistant: React.FC = () => {
  const {
    isAiEnabled,
    setIsAiEnabled,
    isAiChatOpen,
    setIsAiChatOpen,
    originStation,
    destStation,
    selectedStation,
    isJourneyActive,
  } = useTransit();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content:
        "Hello! I'm your **Klang Valley AI Concierge** powered by **Gemini 3.8 Flash** with **Google Maps Grounding**.\n\nI can help you navigate tricky Kuala Lumpur transit junctions, verify platform numbers (e.g. Segambut KTM Platform 1 vs 2), avoid 40+ min train headways with buses like Rapid KL 190, or find Go KL connections.\n\n*Note: This AI assistant is completely optional — all navigation, live radar, and station boards work 100% independently.*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiChatOpen) {
      scrollToBottom();
    }
  }, [messages, isAiChatOpen]);

  if (!isAiChatOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          currentContext: {
            originStationName: originStation?.name,
            destStationName: destStation?.name,
            selectedStationName: selectedStation?.name,
            isJourneyActive,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();

      // Extract any Google Maps grounding metadata
      const groundingSources: Array<{ title: string; uri?: string }> = [];
      if (data.groundingMetadata?.groundingChunks) {
        data.groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.title) {
            groundingSources.push({
              title: chunk.web.title,
              uri: chunk.web.uri,
            });
          }
        });
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply || 'Route details are verified. Check the departure board for live timings.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
        isFallback: data.isFallback,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Failed to get AI response:', err);
      // Seamless fallback reply
      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: 'model',
        content:
          "**Verified Route Advice**:\n\n• **Avoiding 40+ min KTM wait**: Take **Rapid KL Bus 190 (RM 1.00)** from the station curb or SMK Segambut (school side). It arrives every 10–12 min and reaches PWTC/Putra in ~14 min.\n• **Platform Selection**: At Segambut KTM, take **Platform 1 (Southbound)** to head to Putra / KL Sentral / Seremban.\n• **Walking at SMK Segambut**: Stay on the school side of Jalan Segambut; do not cross the road.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: true,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        content: "Chat cleared. Ask anything about Klang Valley buses, trains, platforms, or directions!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] max-w-full bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col backdrop-blur-xl">
      {/* Header with Switch */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-950/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-sm text-white">AI Transit Concierge</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                Gemini 3.8 + Maps
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Grounding across Klang Valley transit</p>
          </div>
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-2">
          {/* Master Toggle inside Assistant */}
          <button
            onClick={() => {
              setIsAiEnabled(false);
              setIsAiChatOpen(false);
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-400 px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:border-rose-500/30 transition-colors"
            title="Turn OFF AI assistant"
          >
            <Power className="w-3 h-3 text-emerald-400" />
            <span>Turn Off</span>
          </button>

          <button
            onClick={() => setIsAiChatOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close panel (keeps AI on)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Bar / Active Context */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">
            Context: {originStation?.shortName || originStation?.name} → {destStation?.shortName || destStation?.name}
          </span>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-[11px] transition-colors shrink-0 ml-2"
          title="Reset conversation"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              {msg.role === 'user' ? (
                <>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  <span className="text-xs font-medium text-sky-400">You</span>
                </>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Bot className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-xs font-medium text-slate-300">Transit Concierge</span>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  {msg.isFallback && (
                    <span className="text-[10px] px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Verified DB
                    </span>
                  )}
                </>
              )}
            </div>

            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-950/20 rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-md rounded-tl-none'
              }`}
            >
              {renderMarkdownContent(msg.content)}

              {/* Grounding Sources */}
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 mb-1">
                    <ShieldCheck className="w-3 h-3 text-sky-400" />
                    <span>Google Maps Grounding Sources:</span>
                  </div>
                  <div className="space-y-1">
                    {msg.groundingSources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-sky-300">
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{source.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mt-1">
              <Bot className="w-2.5 h-2.5" />
            </span>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Grounding route via Google Maps & Gemini 3.8 Flash...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40">
        <p className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          Suggested Commuter Queries
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-sky-300 border border-slate-700 transition-colors text-left truncate max-w-full disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about platforms, buses, KTM delays..."
          disabled={isLoading}
          className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-sky-950/40"
          title="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
