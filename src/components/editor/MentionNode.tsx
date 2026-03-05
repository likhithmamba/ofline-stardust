// ─── Mention Node for Lexical ────────────────────────────────────────────────
// Custom Lexical node that represents an @-mention to another note.
// Renders as a styled inline element with the note title.
// When inserted, it auto-creates a bidirectional connection.

import {
    DecoratorNode,
    type DOMConversionMap,
    type DOMExportOutput,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
} from 'lexical';
import React from 'react';

export type SerializedMentionNode = Spread<
    {
        noteId: string;
        noteTitle: string;
    },
    SerializedLexicalNode
>;

export class MentionNode extends DecoratorNode<React.ReactElement> {
    __noteId: string;
    __noteTitle: string;

    static getType(): string {
        return 'mention';
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__noteId, node.__noteTitle, node.__key);
    }

    constructor(noteId: string, noteTitle: string, key?: NodeKey) {
        super(key);
        this.__noteId = noteId;
        this.__noteTitle = noteTitle;
    }

    createDOM(): HTMLElement {
        const el = document.createElement('span');
        el.className = 'mention-node';
        el.style.cssText =
            'background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 1px 6px; border-radius: 4px; font-weight: 500; cursor: pointer; user-select: none; border: 1px solid rgba(139, 92, 246, 0.3);';
        el.setAttribute('data-mention-note-id', this.__noteId);
        return el;
    }

    updateDOM(): boolean {
        return false;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('span');
        element.setAttribute('data-mention-note-id', this.__noteId);
        element.textContent = `@${this.__noteTitle}`;
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return null;
    }

    static importJSON(serializedNode: SerializedMentionNode): MentionNode {
        return new MentionNode(
            serializedNode.noteId,
            serializedNode.noteTitle
        );
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            type: 'mention',
            noteId: this.__noteId,
            noteTitle: this.__noteTitle,
            version: 1,
        };
    }

    decorate(): React.ReactElement {
        return React.createElement(
            'span',
            {
                className: 'mention-node-rendered',
                title: `Connected note: ${this.__noteTitle}`,
                style: {
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#a78bfa',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    userSelect: 'none' as const,
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    fontSize: '0.9em',
                },
            },
            `@${this.__noteTitle}`
        );
    }

    isInline(): boolean {
        return true;
    }

    getTextContent(): string {
        return `@${this.__noteTitle}`;
    }
}

export function $createMentionNode(noteId: string, noteTitle: string): MentionNode {
    return new MentionNode(noteId, noteTitle);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
    return node instanceof MentionNode;
}
