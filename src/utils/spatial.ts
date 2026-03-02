import type { Note } from '../store/useStore';

// Simple spatial hashing or quadtree implementation can go here.
// For MVP with <500 notes, a simple filter might suffice, but we'll structure for Quadtree.

export class SpatialIndex {
    // Placeholder for Quadtree logic
    // insert(note: Note)
    // query(rect: {x, y, w, h}): Note[]

    static getVisibleNotes(notes: Note[], viewport: { x: number, y: number, zoom: number }, width: number, height: number): Note[] {
        // Simple culling for now
        const viewX = -viewport.x / viewport.zoom;
        const viewY = -viewport.y / viewport.zoom;
        const viewW = width / viewport.zoom;
        const viewH = height / viewport.zoom;

        return notes.filter(note => {
            return (
                note.x + note.w > viewX &&
                note.x < viewX + viewW &&
                note.y + note.h > viewY &&
                note.y < viewY + viewH
            );
        });
    }
}
