import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithAI, getSelectedModel } from '../utils/ai';
import { useStore } from '../store/useStore';
import { X, Send, Sparkles, Loader } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your Stardust AI — running locally via Ollama. Ask me to help brainstorm ideas, expand notes, find connections between concepts, or anything else.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notes = useStore(s => s.notes);
  const selectedId = useStore(s => s.selectedId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from selected note or all notes
      let systemCtx = 'You are an AI assistant inside Stardust, a space-themed infinite canvas note-taking app. Be concise and helpful.';

      if (selectedId) {
        const note = notes.find(n => n.id === selectedId);
        if (note) {
          systemCtx += `\n\nCurrent selected note — Title: "${note.title || 'Untitled'}", Type: ${note.type}.`;
        }
      }

      if (notes.length > 0) {
        const noteTitles = notes.slice(0, 10).map(n => `"${n.title || 'Untitled'}"`).join(', ');
        systemCtx += `\n\nCanvas has ${notes.length} notes: ${noteTitles}${notes.length > 10 ? '...' : ''}.`;
      }

      const apiMessages = [
        { role: 'system' as const, content: systemCtx },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMsg.content }
      ];

      if (window.electronAPI) {
        // Add a placeholder message for the assistant
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        window.electronAPI.ollama.stream(
          { model: getSelectedModel(), messages: apiMessages },
          (chunk: string) => {
            setMessages(prev => {
              const newMsgs = [...prev];
              const lastMsg = newMsgs[newMsgs.length - 1];
              if (lastMsg.role === 'assistant') {
                lastMsg.content += chunk;
              }
              return newMsgs;
            });
          },
          () => {
            setIsLoading(false);
          },
          (error: string) => {
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${error}` }]);
            setIsLoading(false);
          }
        );
      } else {
        // P1 FIX: Streaming fallback for non-Electron (browser dev mode)
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        try {
          const res = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: getSelectedModel(),
              messages: apiMessages,
              stream: true,
            }),
          });
          const reader = res.body?.getReader();
          if (!reader) throw new Error('No response stream');
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                const text = json.message?.content || '';
                if (text) {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === 'assistant') lastMsg.content += text;
                    return newMsgs;
                  });
                }
              } catch { /* skip partial JSON */ }
            }
          }
        } catch {
          // Fallback to non-streaming if streaming fails
          const response = await chatWithAI(apiMessages);
          setMessages(prev => {
            const newMsgs = [...prev];
            const lastMsg = newMsgs[newMsgs.length - 1];
            if (lastMsg.role === 'assistant') lastMsg.content = response;
            return newMsgs;
          });
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'AI error'}. Make sure Ollama is running (check Settings).`
      }]);
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 320 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 320 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 flex flex-col z-40 shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-white font-medium text-sm">Stardust AI</span>
              <span className="text-slate-500 text-xs bg-slate-800 px-1.5 py-0.5 rounded">{getSelectedModel()}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Sparkles size={12} className="text-purple-400" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-sm'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-sm shadow-sm'
                  }`}>
                  {msg.content || (isLoading && i === messages.length - 1 ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Loader size={12} className="animate-spin" /> Thinking...
                    </span>
                  ) : null)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
            {['Expand this idea', 'Find connections', 'Summarize canvas'].map(p => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything... (Enter to send)"
                rows={2}
                className="flex-1 bg-slate-800 border border-slate-600 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-purple-500 placeholder-slate-500 resize-none"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl self-end"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
