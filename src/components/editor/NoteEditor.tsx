// ─── NoteEditor Wrapper ──────────────────────────────────────────────────────
// Wraps the RichTextEditor with note-specific behavior:
// - Edit mode toggling (editable only when editingNoteId matches)
// - OnChange wired to useStore.updateNote for persistence
// - Passes noteId to MentionPlugin for @-mention connections

import React, { useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { useNoteStore } from '../../store/useNoteStore';
import { RichTextEditor } from './RichTextEditor';
import type { EditorState } from 'lexical';

interface NoteEditorProps {
    noteId: string;
    initialContent?: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, initialContent }) => {
    const updateNote = useStore((s) => s.updateNote);
    const editingNoteId = useNoteStore((s) => s.editingNoteId);

    const isEditable = editingNoteId === noteId;

    const handleChange = useCallback(
        (editorState: EditorState) => {
            const jsonString = JSON.stringify(editorState);
            updateNote(noteId, { content: jsonString });
        },
        [noteId, updateNote]
    );

    return (
        <div className="h-full relative">
            <RichTextEditor
                key={noteId}
                initialContent={initialContent}
                onChange={handleChange}
                editable={isEditable}
                noteId={noteId}
            />
            {/* Read-only overlay when not editing */}
            {!isEditable && (
                <div
                    className="absolute inset-0 cursor-pointer"
                    title="Double-click to edit"
                    style={{ background: 'transparent' }}
                />
            )}
        </div>
    );
};
