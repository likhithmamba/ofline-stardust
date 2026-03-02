import JSZip from 'jszip';
import { saveAs } from 'file-saver'; // You might need to install file-saver or use a utility
import type { Note } from '../store/useStore';

export const exportCanvasToJSON = (notes: Note[]) => {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stardust-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportToZip = async (notes: Note[], _blobs: Record<string, Blob>) => {
    const zip = new JSZip();
    zip.file("notes.json", JSON.stringify(notes, null, 2));

    // Add blobs
    // Object.entries(blobs).forEach(([id, blob]) => zip.file(`assets/${id}`, blob));

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "stardust-backup.zip");
};
