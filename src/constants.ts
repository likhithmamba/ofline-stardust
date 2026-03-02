export const NoteType = {
    Nebula: 'nebula',
    Galaxy: 'galaxy',
    Sun: 'sun',
    Jupiter: 'jupiter',
    Saturn: 'saturn',
    Earth: 'earth',
    Mars: 'mars',
    Asteroid: 'asteroid',
} as const;

export type NoteType = typeof NoteType[keyof typeof NoteType];

export const NOTE_STYLES = {
    [NoteType.Nebula]: {
        width: 1600,
        height: 1600,
        className: 'shape-nebula',
        label: 'Nebula',
        color: '#4c1d95', // Violet
    },
    [NoteType.Galaxy]: {
        width: 1200,
        height: 1200,
        className: 'shadow-[0_0_150px_rgba(79,70,229,0.4)] bg-gradient-to-br from-slate-900 via-indigo-900 to-black',
        label: 'Galaxy',
        color: '#312e81', // Indigo
    },
    [NoteType.Sun]: {
        width: 800,
        height: 800,
        className: 'shadow-[0_0_100px_rgba(245,158,11,0.6)] bg-gradient-to-br from-amber-300 via-orange-500 to-red-600',
        label: 'Sun',
        color: '#f59e0b',
    },
    [NoteType.Jupiter]: {
        width: 700,
        height: 700,
        className: 'shadow-[0_0_60px_rgba(180,83,9,0.4)] bg-gradient-to-b from-orange-200 via-amber-700 to-orange-900',
        label: 'Jupiter',
        color: '#b45309',
    },
    [NoteType.Saturn]: {
        width: 600,
        height: 600,
        className: 'shadow-[0_0_50px_rgba(217,119,6,0.3)] bg-gradient-to-br from-yellow-100 to-amber-600',
        label: 'Saturn',
        color: '#d97706',
        hasRings: true,
    },
    [NoteType.Earth]: {
        width: 400,
        height: 400,
        className: 'shadow-[0_0_40px_rgba(59,130,246,0.4)] bg-gradient-to-br from-blue-400 via-blue-600 to-slate-800',
        label: 'Earth',
        color: '#2563eb',
    },
    [NoteType.Mars]: {
        width: 340,
        height: 340,
        className: 'shadow-[0_0_30px_rgba(220,38,38,0.4)] bg-gradient-to-br from-red-400 to-red-900',
        label: 'Mars',
        color: '#dc2626',
    },
    [NoteType.Asteroid]: {
        width: 180,
        height: 180,
        className: 'shape-asteroid bg-slate-600 shadow-none',
        label: 'Asteroid',
        color: '#475569',
    },
};
