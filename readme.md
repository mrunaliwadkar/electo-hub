# 📘 ElectroHub – A Modern Web Application Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)  
[![GitHub stars](https://img.shields.io/github/stars/vighn/electro-hub?style=social)](https://github.com/vighn/electro-hub/stargazers)  
[![CI Status](https://img.shields.io/github/actions/workflow/status/vighn/electro-hub/ci.yml?branch=main)](https://github.com/vighn/electro-hub/actions)  
[![Live Demo](https://img.shields.io/badge/Live%20Demo-🌐-brightgreen)](https://your-demo-url.com)

---

## ✨ Overview

**ElectroHub** is a sleek, production‑ready web UI framework that blends vibrant design, glass‑morphism, and smooth micro‑animations. It provides a premium look‑and‑feel out of the box, while staying lightweight and easy to extend.

> **Why ElectroHub?**  
> • Modern aesthetic – dark‑mode ready, gradient accents, polished typography.  
> • Component‑driven – reusable UI building blocks.  
> • Plug‑and‑play – quick start with a single `npm install` and `npm run dev`.

---

## 📦 Features

- **Dynamic Design System** – HSL‑based color tokens, fluid spacing, and responsive breakpoints.  
- **Premium UI Components** – Buttons, cards, modals, tabs, and animated hero sections.  
- **Theme Engine** – Switch between light, dark, and custom skins with a single config change.  
- **Accessibility‑First** – ARIA roles, focus management, and keyboard navigation baked in.  
- **Fast Development** – Hot‑module replacement, built‑in linting, and TypeScript support.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (>= 18)  
- **npm** (comes with Node)

### Installation

```bash
# Clone the repository
git clone https://github.com/mrunaliwadkar/electo-hub.git
cd electro-hub

# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build   # Generates an optimized static bundle in ./dist
npm run preview # Serve the production build locally
```

---

## 📖 Usage

Import the design system in any page or component:

```html
<link rel="stylesheet" href="/styles/index.css" />
```

```js
import { Button, Card } from './components';

// Example JSX/HTML
<Button variant="primary" onClick={handleClick}>Get Started</Button>
<Card title="ElectroHub">
  <p>Elegant, responsive UI components for modern web apps.</p>
</Card>
```

All components support:

- **Custom themes** – Pass a `theme` prop or modify `src/theme.ts`.  
- **Animations** – Add `data-animate="fade-in"` to any element for subtle entrance effects.



## 🤝 Contributing

We love contributions! To get started:

1. **Fork** the repo and clone your fork.
2. **Create a new branch** for your feature or bug‑fix.
   ```bash
   git checkout -b feature/awesome‑component
   ```
3. **Write tests** (if applicable) and ensure the linting passes:
   ```bash
   npm run lint
   npm test
   ```
4. **Submit a Pull Request** with a clear description of what you changed.

Please read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♀️ Support

- **Issues** – Open a GitHub issue for bugs or feature requests.
- **Discussions** – Join the community chat in the `Discussions` tab.
- **Contact** – Email `hello@electrohub.dev` for inquiries.

---

## 🎉 Show Your Love

If you find ElectroHub useful, please ⭐ the repository and share it with your network!
