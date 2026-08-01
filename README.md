# 🔒 ncrypt

**ncrypt** is a high-performance, secure and open-source Node.js library designed for binary file encryption, compression, and serialization. By combining the speed of **MessagePack** serialization, flexible compression algorithms, and authenticated **AES-256-GCM** encryption, `ncrypt` provides a robust, tamper-proof solution for handling custom `.ncrypt` file structures.

---

## ✨ Key Features

- 🔐 **Authenticated Encryption** – Built-in support for industry-standard authenticated encryption schemes (`AES-256-GCM`, `AES-128-GCM`, and `ChaCha20-Poly1305`) ensuring data integrity and detecting tampering or corruption.
- ⚡ **Ultra-Fast Serialization** – Powered by **MessagePack** for compact, high-speed binary serialization, eliminating the overhead of traditional JSON.
- 📉 **Integrated Compression** – Configurable compression levels ranging from `1` (Fastest) to `15` (Maximum Compression).
- 🛡️ **Strong Key Derivation** – Uses native Node.js `scrypt` with unique salts to resist dictionary and rainbow table attacks.
- 📦 **Developer Friendly** – Fully typed, Promise-based API for both TypeScript and JavaScript.
- 🟢 **Node.js Native** – Built on top of Node's native `crypto` module with no heavy cryptographic dependencies.

---

## 📦 Installation

Install **ncrypt** via npm:

```bash
npm install @nroot_project/ncrypt
```

### 🔹 Companion Package

For handling with better performance, we'd used **NArchive** for archiving and directory and files.

```url
https://github.com/Nima389/NArchive
```

You can install the **NArchive** via **npm**:

```bash
npm install @nroot_project/narchive
```

---

## 🚀 Quick Start

```ts
import {runInteractivePack, runInteractiveUnpack} from "@nroot_project/ncrypt";

const FilePath = `public`; // IMPORTANT: This Version Only Accept DIR

await runInteractivePack(FilePath, {
  compression: "brotli",
  algo: "aes-128-gcm",
  level: 6,
  password: "YOUR_STRONG_PASSWORD",
});

await runInteractiveUnpack("public.ncrypt", {
  password: "YOUR_STRONG_PASSWORD",
});
```

**Output**

```text
hello, world!
```

---

## ⚙️ Supported Algorithms

| Type                     | Options                                                     |
| ------------------------ | ----------------------------------------------------------- |
| **Encryption**           | `aes-256-gcm` (Default), `aes-128-gcm`, `chacha20-poly1305` |
| **Key Derivation (KDF)** | `scrypt` (Native Node.js implementation)                    |
| **Serialization**        | `MessagePack`                                               |
| **Compression Level**    | `1` (Fastest) → `15` (Best Compression)                     |

---

## 👥 About the Project

**ncrypt** is actively developed and maintained by the **nroot_project** organization. Our goal is to build ultra-fast, developer-first tools for secure data handling in Node.js.

### Ecosystem

For high-performance directory bundling and archiving, check out **NArchive**, which integrates seamlessly with `ncrypt`.

```bash
npm install @nroot_project/narchive
```

### Contributing

Issues, feature requests, and Pull Requests are always welcome!

---

## 📄 License

MIT © **nroot_project**
