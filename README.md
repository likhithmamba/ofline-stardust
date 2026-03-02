# 🌌 Stardust — Offline AI Canvas

> Space-themed infinite canvas for notes, powered by **local AI via Ollama**.  
> No internet required. No API keys. No data leaves your machine.

---

## ✨ What Changed vs. Original

| | Original | Offline Version |
|---|---|---|
| AI Provider | Google Gemini (cloud) | **Ollama (local)** |
| API Key | Required | **None needed** |
| Internet | Required | **Not required** |
| App Format | Web browser | **Windows .exe** |
| AI Chat Panel | No | **Yes — sidebar** |
| Model Selector | No | **Yes — any Ollama model** |
| Auto-start Ollama | N/A | **Yes** |

---

## 🚀 Setup

### 1. Install Ollama
Download from https://ollama.com/download and install it on Windows.

### 2. Pull a model
```bash
ollama pull llama3.2        # Recommended: fast + small (~2GB)
ollama pull llama3.1        # Better quality (~5GB)
ollama pull mistral         # Great for writing (~4GB)
```

### 3. Run in development
```bash
npm install
npm run dev
```

### 4. Build Windows installer
```bash
npm run build
# Output: dist-electron/Stardust Setup 2.0.0.exe
```

---

## 🤖 AI Features

- **✨ Spark** — On any note editor, click Spark to let AI expand that concept
- **💬 AI Chat** — Click sparkles in toolbar to open a chat sidebar
- **⚙️ Settings** — Manage Ollama, switch models, pull new models

---

## 📦 Recommended Models

| Model | Size | Best For |
|---|---|---|
| `llama3.2` | ~2GB | General use, fast |
| `llama3.2:1b` | ~800MB | Fastest, minimal RAM |
| `mistral` | ~4GB | Creative writing |
| `gemma2:2b` | ~1.6GB | Balanced |

---

## 🔧 Troubleshooting

- **"AI: Offline"** → Ollama not running → open Settings → Start / Install
- **Model not found** → Open Settings → Download a model first
- **Build fails** → Ensure Node.js 18+ and run `npm install`

---

## 🖼️ App Icon
Replace `build/icon.png` with a 512×512 PNG. Add `build/icon.ico` for Windows installer.
