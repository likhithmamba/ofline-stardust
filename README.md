<div align="center">

<br/>

```
███████╗████████╗ █████╗ ██████╗ ██████╗ ██╗   ██╗███████╗████████╗
██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝
███████╗   ██║   ███████║██████╔╝██║  ██║██║   ██║███████╗   ██║   
╚════██║   ██║   ██╔══██║██╔══██╗██║  ██║██║   ██║╚════██║   ██║   
███████║   ██║   ██║  ██║██║  ██║██████╔╝╚██████╔╝███████║   ██║   
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝   ╚═╝   
```

### ✦ Your thoughts. Your canvas. Your machine. No cloud required. ✦

<br/>

[![License](https://img.shields.io/badge/license-MIT-blueviolet?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-28+-47848F?style=flat-square&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Ollama](https://img.shields.io/badge/Ollama-local%20AI-black?style=flat-square)](https://ollama.com)
[![Offline](https://img.shields.io/badge/Works-100%25%20Offline-22c55e?style=flat-square)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff6b6b?style=flat-square)](CONTRIBUTING.md)

<br/>

</div>

---

## ✧ What is Stardust?

**Stardust** is a privacy-first, fully offline **AI-powered infinite canvas** — built for thinkers, builders, and creators who refuse to put their ideas in someone else's cloud.

It combines the freedom of a **visual canvas**, the intelligence of **local LLMs via Ollama**, and the raw speed of a **native desktop app** — all without a single network call leaving your machine.

> *"Think of it as Notion + Miro + ChatGPT — except it lives entirely on your computer."*

<br/>

---

## ✦ Feature Highlights

### 🧠 Local AI — Truly Private
- Powered by **Ollama** — run LLMs like `llama3`, `mistral`, `phi3`, and more
- Zero API keys. Zero subscriptions. Zero data ever leaves your device
- Chat with AI directly on your canvas nodes

### 🎨 Infinite Canvas
- Pan, zoom, and arrange ideas freely across an **unbounded workspace**
- Drag-and-drop card layout with **rich text nodes** (powered by Lexical.js)
- Fluid animations via **Framer Motion** for a polished desktop feel

### ⚡ Built for Speed
- **Vite**-powered Electron app — sub-second cold starts
- **Zustand** state management — zero unnecessary re-renders
- **IndexedDB** local storage — instant persistence, no server needed

### 🛠 Toolbar & Controls
- Contextual **toolbar UI** for formatting, node creation, and canvas control
- Keyboard-first design with intuitive shortcuts
- Collapsible panels that get out of your way

### 🔒 100% Offline
- No telemetry. No analytics. No phoning home
- Works on planes, in basements, and behind air-gapped networks
- Your thoughts belong to you

<br/>

---

## ✦ Tech Stack

| Layer | Technology |
|---|---|
| 🖥 Runtime | [Electron](https://electronjs.org) + [Vite](https://vitejs.dev) |
| ⚛️ UI | [React 18](https://react.dev) + [TypeScript](https://typescriptlang.org) |
| 🎨 Styling | [Tailwind CSS](https://tailwindcss.com) |
| ✍️ Rich Text | [Lexical.js](https://lexical.dev) |
| 🌀 Animation | [Framer Motion](https://framer.com/motion) |
| 🗃 State | [Zustand](https://zustand-demo.pmnd.rs) |
| 💾 Storage | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| 🤖 AI | [Ollama](https://ollama.com) (local inference) |

<br/>

---

## ✦ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) `v18+`
- [Ollama](https://ollama.com/download) installed and running locally

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/stardust.git
cd stardust

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Pull an AI Model (via Ollama)

```bash
# Recommended starting model
ollama pull llama3

# Or go lighter
ollama pull phi3

# Or go harder
ollama pull mixtral
```

### Build for Production

```bash
# Package for your platform
npm run build

# Platform-specific
npm run build:mac
npm run build:win
npm run build:linux
```

<br/>

---

## ✦ Project Structure

```
stardust/
├── src/
│   ├── main/               # Electron main process
│   │   └── index.ts
│   ├── renderer/           # React frontend
│   │   ├── components/
│   │   │   ├── Canvas/
│   │   │   │   ├── CanvasViewport.tsx   # Main canvas surface
│   │   │   │   ├── Toolbar.tsx          # Canvas controls UI
│   │   │   │   └── CanvasNode.tsx       # Individual idea nodes
│   │   │   ├── AI/
│   │   │   │   └── OllamaChat.tsx       # Local AI interface
│   │   │   └── UI/
│   │   ├── store/          # Zustand state slices
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/
├── electron.vite.config.ts
├── tailwind.config.js
└── package.json
```

<br/>

---

## ✦ Roadmap

- [x] Infinite canvas with pan & zoom
- [x] Rich text nodes via Lexical.js
- [x] Local AI chat via Ollama
- [x] IndexedDB persistence
- [x] Toolbar UI component
- [ ] Multi-canvas / workspace support
- [ ] Node linking & graph view
- [ ] PDF / Markdown export
- [ ] Plugin system
- [ ] Mobile companion (read-only)

<br/>

---

## ✦ Contributing

Contributions are what make open source beautiful. Whether it's a bug fix, a new feature, or better docs — all PRs are warmly welcome.

```bash
# Fork → Branch → Build → PR
git checkout -b feat/your-amazing-idea
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

<br/>

---

## ✦ Privacy Philosophy

Stardust was built on a single belief: **your thoughts are not a product**.

Most AI tools harvest your notes, your ideas, your creative work — to train models, improve ads, or just because they can. Stardust takes the opposite stance. Everything runs locally. Nothing is transmitted. The only AI that touches your data is one running on your own hardware.

This isn't just a feature. It's a design principle.

<br/>

---

## ✦ License

MIT © 2026 [LIKHITH](https://github.com/likhithmamba)

*Use it. Fork it. Build on it. Just don't un-star it.* ⭐

<br/>

---

<div align="center">

**Built with obsession. Runs in silence. Thinks locally.**

*— Stardust*

</div>
