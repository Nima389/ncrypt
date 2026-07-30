# 🔒 ncrypt

**ncrypt** is a high-performance, secure, and lightweight Node.js library for binary file encryption and serialization. It combines the speed of **MessagePack** serialization with the authenticated security of **AES-256-GCM** encryption to create `.ncrypt` files.

---

## ✨ Features

- **🔐 Robust Security:** Uses `AES-256-GCM` for authenticated encryption (detects tampering/corruption).
- **⚡ High Performance:** Utilizes `MessagePack` for extremely fast binary serialization instead of bulky JSON.
- **🛡️ Secure Key Derivation:** Employs `scrypt` for key derivation with custom salts.
- **📦 Zero-Config:** Clean, simple, and easy-to-use Async/Await TypeScript API.
- **🟢 Node.js Native:** Built strictly for Node.js leveraging native `node:crypto`.

---

## 📦 Installation

```bash
npm install ncrypt
# or
yarn add ncrypt
# or
pnpm add ncrypt
