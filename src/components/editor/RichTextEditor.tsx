import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TRANSFORMERS } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import type { EditorState } from 'lexical';

import exampleTheme from './EditorTheme';

const editorConfig = {
    namespace: 'StardustEditor',
    theme: exampleTheme,
    onError(error: Error) {
        console.error('Lexical editor error:', error);
    },
    nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        AutoLinkNode,
        LinkNode
    ]
};

interface RichTextEditorProps {
    initialContent?: string;
    onChange: (editorState: EditorState) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange }) => {
    const initialConfig = {
        ...editorConfig,
        editorState: initialContent || undefined
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="editor-container relative h-full flex flex-col">
                <div className="editor-inner flex-1 relative overflow-auto">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input h-full outline-none p-4 text-sm leading-relaxed" />}
                        placeholder={<div className="editor-placeholder">Start typing... Use markdown shortcuts (# for heading, &gt; for quote, * for bold)</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <OnChangePlugin onChange={onChange} />
                </div>
            </div>
        </LexicalComposer>
    );
};
