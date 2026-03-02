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

      const response = await chatWithAI(apiMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'AI error'}. Make sure Ollama is running (check Settings).`
      }]);
    } finally {
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
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-600/80 text-white'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader size={14} className="text-purple-400 animate-spin" />
                  <span className="text-slate-400 text-xs">Thinking...</span>
                </div>
              </div>
            )}
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
