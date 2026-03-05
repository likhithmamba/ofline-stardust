// ─── AI Actions Hook ─────────────────────────────────────────────────────────
// Provides streaming AI actions for notes (continue, summarize, rewrite, expand, tags).
// Uses Ollama via Electron IPC or direct HTTP fallback.
// Tokens stream into the Lexical editor via INSERT_TEXT_COMMAND for proper undo history.

import { useCallback, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { getSelectedModel } from '../utils/ai';

declare global {
    interface Window {
        electronAPI?: {
            ollama: {
                status: () => Promise<{ running: boolean }>;
                models: () => Promise<{ models: any[] }>;
                start: () => Promise<{ started: boolean }>;
                generate: (params: any) => Promise<{ text: string; error?: string }>;
                chat: (params: any) => Promise<{ text: string; error?: string }>;
                stream: (params: any, onChunk: (chunk: string) => void, onDone: (result: any) => void, onError?: (error: string) => void) => void;
                pull: (params: any) => Promise<{ success: boolean }>;
            };
            app: {
                openOllamaDownload: () => void;
                showDialog: (options: any) => Promise<any>;
            };
            isElectron: boolean;
        };
    }
}

export type AIActionType = 'continue' | 'summarize' | 'rewrite' | 'expand' | 'tags';

function buildPrompt(action: AIActionType, noteContent: string, connectedContext: string): string {
    const base = `You are a creative AI assistant inside Stardust, a space-themed notes app.`;

    const contextBlock = connectedContext
        ? `\n\nConnected notes context:\n${connectedContext}`
        : '';

    switch (action) {
        case 'continue':
            return `${base}\n\nContinue writing the following note naturally. Match the tone and style.${contextBlock}\n\nNote content:\n${noteContent}\n\nContinuation:`;
        case 'summarize':
            return `${base}\n\nSummarize the following note concisely (2-3 sentences max).${contextBlock}\n\nNote content:\n${noteContent}\n\nSummary:`;
        case 'rewrite':
            return `${base}\n\nRewrite the following note to improve clarity, flow, and readability. Keep the same meaning.${contextBlock}\n\nNote content:\n${noteContent}\n\nRewritten:`;
        case 'expand':
            return `${base}\n\nExpand on the ideas in the following note with additional details, examples, or related concepts.${contextBlock}\n\nNote content:\n${noteContent}\n\nExpanded:`;
        case 'tags':
            return `${base}\n\nSuggest 3-5 short tags for the following note. Return only the tags separated by commas, no explanations.${contextBlock}\n\nNote content:\n${noteContent}\n\nTags:`;
    }
}

function getConnectedContext(noteId: string): string {
    const store = useStore.getState();
    const connections = store.connections.filter(
        (c) => c.from === noteId || c.to === noteId
    );

    if (connections.length === 0) return '';

    const contextParts: string[] = [];
    for (const conn of connections) {
        const otherId = conn.from === noteId ? conn.to : conn.from;
        const otherNote = store.notes.find((n) => n.id === otherId);
        if (otherNote) {
            const title = otherNote.title || 'Untitled';
            const contentPreview = (otherNote.content || '').slice(0, 100);
            contextParts.push(`- "${title}": ${contentPreview}`);
        }
    }

    return contextParts.join('\n');
}

export function useAIActions(noteId: string) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef(false);

    const runAction = useCallback(
        async (
            action: AIActionType,
            onToken: (token: string) => void,
            onDone?: () => void
        ) => {
            setIsStreaming(true);
            setError(null);
            abortRef.current = false;

            const store = useStore.getState();
            const note = store.notes.find((n) => n.id === noteId);
            if (!note) {
                setError('Note not found');
                setIsStreaming(false);
                return;
            }

            const noteContent = note.title || note.content || '';
            const connectedContext = getConnectedContext(noteId);
            const prompt = buildPrompt(action, noteContent, connectedContext);
            const model = getSelectedModel();

            try {
                if (window.electronAPI) {
                    // Stream via Electron IPC
                    await new Promise<void>((resolve, reject) => {
                        window.electronAPI!.ollama.stream(
                            { model, prompt },
                            (chunk: string) => {
                                if (!abortRef.current) {
                                    onToken(chunk);
                                }
                            },
                            () => {
                                setIsStreaming(false);
                                onDone?.();
                                resolve();
                            },
                            (err: string) => {
                                setError(err);
                                setIsStreaming(false);
                                reject(new Error(err));
                            }
                        );
                    });
                } else {
                    // Browser fallback: direct HTTP fetch with streaming
                    const response = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model,
                            prompt,
                            stream: true,
                            options: { temperature: 0.7, num_predict: 600 },
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Ollama error: ${response.statusText}`);
                    }

                    const reader = response.body?.getReader();
                    if (!reader) throw new Error('No response body');

                    const decoder = new TextDecoder();
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done || abortRef.current) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (!line.trim()) continue;
                            try {
                                const json = JSON.parse(line);
                                if (json.response) {
                                    onToken(json.response);
                                }
                            } catch {
                                // Ignore partial JSON
                            }
                        }
                    }

                    setIsStreaming(false);
                    onDone?.();
                }
            } catch (e: any) {
                const message =
                    e.message?.includes('fetch') || e.message?.includes('connection')
                        ? 'AI unavailable — make sure Ollama is running.'
                        : e.message || 'AI generation failed';
                setError(message);
                setIsStreaming(false);
            }
        },
        [noteId]
    );

    const abort = useCallback(() => {
        abortRef.current = true;
        setIsStreaming(false);
    }, []);

    return { runAction, abort, isStreaming, error };
}
