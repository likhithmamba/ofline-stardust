## 2024-05-20 - Unsafe Protocol Handling in shell.openExternal
**Vulnerability:** Electron apps can use `shell.openExternal` to open URLs in the default browser. However, without URL validation, passing untrusted URLs (like `file://`, `javascript://`, `smb://`) can lead to Remote Code Execution or Local File Disclosure. `sandbox: false` allows renderer to be privileged.
**Learning:** External links must be validated for safe protocols (`http:`, `https:`, `mailto:`) before execution. Sandbox should be enabled by default.
**Prevention:** Use `URL` parser to check `protocol` attribute before allowing `shell.openExternal`.
