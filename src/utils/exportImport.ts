import type { Note, Connection } from '../store/useStore';

export const exportJSON = (notes: Note[], connections: Connection[]) => {
    if (notes.length === 0) return false;
    const data = JSON.stringify({ notes, connections }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stardust-universe-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
};

export const exportMarkdown = (notes: Note[]) => {
    if (notes.length === 0) return false;

    let md = '# Stardust Universe Export\n\n';
    md += `*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    notes.forEach(note => {
        md += `## ${note.title || 'Untitled Planet'}\n`;
        md += `**Type**: ${note.type}\n\n`;

        if (note.content) {
            try {
                // VERY basic Lexical state to text converter
                const state = JSON.parse(note.content);
                const extractText = (node: any): string => {
                    if (node.type === 'text') return node.text;
                    if (node.children) return node.children.map(extractText).join('');
                    return '';
                };

                if (state.root && state.root.children) {
                    const textContent = state.root.children.map((block: any) => {
                        return extractText(block);
                    }).filter(Boolean).join('\n\n');

                    md += `${textContent}\n\n`;
                }
            } catch (e) {
                md += `*[Raw Content Data]*\n\n`;
            }
        }

        md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stardust-export-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
};
