import type { Note } from '../store/useStore';
import { generateContent } from './ai';

export interface SemanticLink {
    from: string;
    to: string;
    reason: string;
}

export const suggestConnections = async (notes: Note[]): Promise<SemanticLink[]> => {
    if (notes.length < 2) return [];

    // Filter notes with content or title
    const validNotes = notes.filter(n => n.title || n.content);
    if (validNotes.length < 2) return [];

    // Create a compact representation of the canvas to send to the AI
    const corpus = validNotes.map(n => {
        // Very basic extraction of text to keep context window small
        let snippet = n.content || '';
        try {
            const state = JSON.parse(n.content || '{}');
            if (state.root && state.root.children) {
                snippet = state.root.children[0]?.children?.[0]?.text || '';
            }
        } catch (e) { /* ignore */ }

        return `ID: ${n.id} | Title: ${n.title || 'Untitled'} | Content: ${snippet.substring(0, 100)}...`;
    }).join('\n');

    const prompt = `
Analyze the following notes and suggest deep semantic connections between them.
Look for thematic overlaps, related concepts, or hidden insights.

Notes:
${corpus}

Return ONLY a valid JSON array of objects with the exact keys: "from" (ID of source), "to" (ID of target), and "reason" (short 1-sentence explanation of why they relate). Do not include markdown formatting or extra text.

Example:
[
  { "from": "id1", "to": "id2", "reason": "Both discuss the concept of gravitational waves." }
]
`;

    try {
        const responseText = await generateContent(prompt);
        // Strip out potential markdown code block wrappers
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const links: SemanticLink[] = JSON.parse(jsonStr);

        // Filter out invalid links (IDs must exist, cannot link to self)
        return links.filter(link =>
            link.from !== link.to &&
            notes.find(n => n.id === link.from) &&
            notes.find(n => n.id === link.to)
        );
    } catch (e) {
        console.error("Failed to parse semantic links:", e);
        return [];
    }
};
