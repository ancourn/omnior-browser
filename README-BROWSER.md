# 🌐 Omnior Browser

The world's most advanced, cross-platform web browser—faster, more secure, more intelligent, and more personalized than Chrome, Firefox, Safari, Brave, or Edge.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/ancourn/omnior-browser.git
cd omnior-browser

# Install dependencies
npm install

# Start development
npm run electron-dev
```

### Building

```bash
# Build for production
npm run build

# Create distributable packages
npm run dist
```

## 🏗️ Architecture

Omnior Browser is built with a modern, secure architecture:

### Core Components

- **Main Process** (Electron): Window management, native OS integration
- **Renderer Process** (React): User interface, tab management
- **Storage Layer** (JSON/SQLite): Settings, bookmarks, history
- **Security Layer**: Sandbox isolation, content security policies

### Technology Stack

- **Frontend**: React 18, Next.js 14, TypeScript
- **State Management**: Zustand, React Query
- **Styling**: Tailwind CSS, shadcn/ui
- **Desktop**: Electron with security-hardened configuration
- **Build Tools**: TypeScript, ESLint, Prettier

## 📋 Features

### Phase 1 (MVP) ✅
- [x] Tabbed browsing
- [x] Bookmark manager
- [x] History tracking
- [x] Basic settings
- [x] Incognito mode
- [x] Fast startup

### Phase 2 (Privacy & Performance) 🚧
- [ ] Native tracker/ad blocker
- [ ] Local DNS caching
- [ ] Split DNS resolver
- [ ] AI-based resource prioritization

### Phase 3 (Unique Features) 📋
- [ ] AI Summarizer for Pages
- [ ] Dual-panel productivity view
- [ ] Universal Side Search
- [ ] Action Recorder & Scripter
- [ ] Voice-command navigation
- [ ] Mood-based theming

### Phase 4 (Developer Power) 📋
- [ ] Chrome extension support
- [ ] Advanced dev console
- [ ] Memory/DOM visualizers
- [ ] Plugin architecture

### Phase 5 (Community) 📋
- [ ] In-browser GitHub viewer
- [ ] Omnior Web Store
- [ ] Custom New Tab Feed

### Phase 6 (Security) 📋
- [ ] Sandbox isolation
- [ ] Per-tab encrypted memory
- [ ] Password manager with passkeys
- [ ] Custom VPN/Tor routing

### Phase 7 (AI + Cloud) 📋
- [ ] Encrypted sync
- [ ] AI browsing assistant
- [ ] Automatic summarization
- [ ] AI tab management

## 🔧 Development

### Project Structure

```
src/
├── browser/                 # Browser source code
│   ├── main/              # Main process (Electron)
│   │   ├── index.ts       # Main entry point
│   │   ├── windows/       # Window management
│   │   ├── menu/          # Application menu
│   │   └── ipc/           # IPC communication
│   ├── renderer/         # Renderer process (React)
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # State management
│   │   └── utils/         # Utility functions
│   ├── shared/           # Shared utilities
│   └── types/            # TypeScript definitions
└── app/                  # Website (Next.js)
    ├── page.tsx          # Landing page
    ├── features/         # Features page
    ├── roadmap/          # Roadmap page
    ├── branding/         # Branding guide
    ├── contribute/       # Contribution page
    └── developers/      # Developer brief
```

### Key Files

- `src/browser/main/index.ts` - Main process entry point
- `src/browser/renderer/App.tsx` - Main React application
- `src/browser/types/index.ts` - TypeScript type definitions
- `src/browser/renderer/store/browserStore.ts` - Global state management

### Development Workflow

1. **Main Process Development**
   - Window management and lifecycle
   - Native OS integration
   - File system operations
   - Security and sandboxing

2. **Renderer Process Development**
   - User interface components
   - Tab management
   - Settings and preferences
   - Extension integration

3. **Shared Development**
   - Type definitions
   - Utility functions
   - Storage management
   - IPC communication

### Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run development server
npm run dev

# Run Electron in development
npm run electron-dev
```

## 🔒 Security

Omnior Browser is built with security as a top priority:

### Security Features

- **Sandboxing**: Renderer processes run in restricted sandboxes
- **Context Isolation**: Prevents renderer access to Node.js APIs
- **Content Security Policy**: Strict CSP headers prevent XSS attacks
- **Same Origin Policy**: Enforced for all web content
- **Secure Defaults**: All features disabled by default, opt-in only

### Security Best Practices

- No remote code execution
- No eval() or Function() constructor
- No inline JavaScript
- No unsafe-eval in CSP
- Regular dependency audits
- Security-focused code reviews

## 📦 Distribution

### Supported Platforms

- **Windows**: Windows 10+ (x64)
- **macOS**: macOS 10.15+ (x64, arm64)
- **Linux**: Ubuntu 18.04+, Fedora 29+, Debian 10+ (x64)

### Build Commands

```bash
# Build for current platform
npm run build

# Create distributable packages
npm run dist

# Create platform-specific packages
npm run pack  # Creates installer in dist/ directory
```

### Output Formats

- **Windows**: NSIS installer (.exe)
- **macOS**: DMG disk image (.dmg)
- **Linux**: AppImage (.AppImage)

## 🤝 Contributing

We welcome contributions! Please see our [contribution guide](https://omnior.browser/contribute) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Include tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) - Cross-platform desktop applications
- [React](https://reactjs.org/) - User interface library
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library

## 📞 Support

- **Website**: [https://omnior.browser](https://omnior.browser)
- **Documentation**: [https://docs.omnior.browser](https://docs.omnior.browser)
- **GitHub**: [https://github.com/ancourn/omnior-browser](https://github.com/ancourn/omnior-browser)
- **Issues**: [https://github.com/ancourn/omnior-browser/issues](https://github.com/ancourn/omnior-browser/issues)

---

Built with ❤️ by the Omnior Team