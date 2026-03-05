// ─── Mention Plugin for Lexical ──────────────────────────────────────────────
// Listens for '@' character typed in the editor, shows a dropdown with note names,
// and inserts a MentionNode when a note is selected. Also auto-creates a
// bidirectional connection between the current note and the mentioned note.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    KEY_ARROW_DOWN_COMMAND,
    KEY_ARROW_UP_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    TextNode,
} from 'lexical';
import { $createMentionNode } from './MentionNode';
import { useStore } from '../../store/useStore';
import { useNoteStore } from '../../store/useNoteStore';

interface MentionPluginProps {
    currentNoteId: string;
}

export const MentionPlugin: React.FC<MentionPluginProps> = ({ currentNoteId }) => {
    const [editor] = useLexicalComposerContext();
    const notes = useStore((s) => s.notes);
    const addBidirectionalConnection = useNoteStore((s) => s.addBidirectionalConnection);

    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerOffsetRef = useRef<number | null>(null);

    // Filter notes: exclude the current note, match on title
    const filteredNotes = useMemo(() => {
        return notes
            .filter((n) => n.id !== currentNoteId)
            .filter((n) => {
                if (!query) return true;
                return (n.title || '').toLowerCase().includes(query.toLowerCase());
            })
            .slice(0, 8); // Max 8 results
    }, [notes, currentNoteId, query]);

    // Listen for text changes to detect '@' trigger
    useEffect(() => {
        const removeListener = editor.registerTextContentListener((_textContent) => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                const anchor = selection.anchor;
                const node = anchor.getNode();

                if (!(node instanceof TextNode)) {
                    if (isOpen) setIsOpen(false);
                    return;
                }

                const text = node.getTextContent();
                const cursorOffset = anchor.offset;

                // Find the @ trigger before cursor
                const textBeforeCursor = text.slice(0, cursorOffset);
                const atIndex = textBeforeCursor.lastIndexOf('@');

                if (atIndex === -1 || atIndex > cursorOffset) {
                    if (isOpen) setIsOpen(false);
                    return;
                }

                // Check that @ is at word boundary (start of text or preceded by space)
                if (atIndex > 0 && textBeforeCursor[atIndex - 1] !== ' ' && textBeforeCursor[atIndex - 1] !== '\n') {
                    if (isOpen) setIsOpen(false);
                    return;
                }

                const searchText = textBeforeCursor.slice(atIndex + 1);

                // If there's a space after @ and we're well past it, close
                if (searchText.length > 30) {
                    if (isOpen) setIsOpen(false);
                    return;
                }

                setQuery(searchText);
                setSelectedIndex(0);
                triggerOffsetRef.current = atIndex;

                // Get anchor position for dropdown
                const domSelection = window.getSelection();
                if (domSelection && domSelection.rangeCount > 0) {
                    const range = domSelection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    setAnchorPosition({
                        top: rect.bottom + 4,
                        left: rect.left,
                    });
                }

                setIsOpen(true);
            });
        });

        return removeListener;
    }, [editor, isOpen]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const removeDown = editor.registerCommand(
            KEY_ARROW_DOWN_COMMAND,
            (e) => {
                e?.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filteredNotes.length - 1));
                return true;
            },
            COMMAND_PRIORITY_LOW
        );

        const removeUp = editor.registerCommand(
            KEY_ARROW_UP_COMMAND,
            (e) => {
                e?.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
                return true;
            },
            COMMAND_PRIORITY_LOW
        );

        const removeEnter = editor.registerCommand(
            KEY_ENTER_COMMAND,
            (e) => {
                if (filteredNotes.length > 0) {
                    e?.preventDefault();
                    insertMention(filteredNotes[selectedIndex]);
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        const removeEscape = editor.registerCommand(
            KEY_ESCAPE_COMMAND,
            () => {
                setIsOpen(false);
                return true;
            },
            COMMAND_PRIORITY_LOW
        );

        return () => {
            removeDown();
            removeUp();
            removeEnter();
            removeEscape();
        };
    }, [isOpen, filteredNotes, selectedIndex, editor]);

    const insertMention = useCallback(
        (note: { id: string; title?: string }) => {
            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                const anchor = selection.anchor;
                const node = anchor.getNode();
                if (!(node instanceof TextNode)) return;

                const text = node.getTextContent();
                const cursorOffset = anchor.offset;
                const atIndex = triggerOffsetRef.current;

                if (atIndex === null || atIndex === undefined) return;

                // Split the text node: before @, mention node, after cursor
                const beforeAt = text.slice(0, atIndex);
                const afterCursor = text.slice(cursorOffset);

                // Replace text with the mention
                const mentionNode = $createMentionNode(note.id, note.title || 'Untitled');
                const textNode = node;

                // Set text before @
                textNode.setTextContent(beforeAt);

                // Insert mention after the text node
                textNode.insertAfter(mentionNode);

                // If there's text after cursor, create a new text node
                if (afterCursor) {
                    const afterNode = new TextNode(afterCursor);
                    mentionNode.insertAfter(afterNode);
                    afterNode.select(0, 0);
                } else {
                    // Add a space after mention so cursor isn't stuck
                    const spaceNode = new TextNode(' ');
                    mentionNode.insertAfter(spaceNode);
                    spaceNode.select(1, 1);
                }
            });

            // Auto-create bidirectional connection
            addBidirectionalConnection(currentNoteId, note.id);

            setIsOpen(false);
            setQuery('');
            triggerOffsetRef.current = null;
        },
        [editor, currentNoteId, addBidirectionalConnection]
    );

    if (!isOpen || !anchorPosition || filteredNotes.length === 0) return null;

    return (
        <div
            ref={dropdownRef}
            className="fixed z-[200] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl py-1 shadow-2xl min-w-[180px] max-w-[260px] overflow-hidden"
            style={{
                top: anchorPosition.top,
                left: anchorPosition.left,
            }}
        >
            <div className="px-3 py-1.5 text-[10px] text-purple-400/60 uppercase tracking-wider font-semibold border-b border-white/5">
                Link a note
            </div>
            {filteredNotes.map((note, i) => (
                <button
                    key={note.id}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${i === selectedIndex
                            ? 'bg-purple-600/30 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                    onMouseDown={(e) => {
                        e.preventDefault(); // Keep editor focus
                        insertMention(note);
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                >
                    <span className="text-purple-400 text-xs">@</span>
                    <span className="truncate">{note.title || 'Untitled'}</span>
                </button>
            ))}
        </div>
    );
};
