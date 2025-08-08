# Omnior Browser Development Setup Instructions

## Quick Start Commands

### 1. Clone the Repository
```bash
git clone https://github.com/ancourn/omnior-browser.git
cd omnior-browser
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Database
```bash
npm run db:push
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Check Code Quality
```bash
npm run lint
```

## Detailed Setup Process

### Prerequisites
- Node.js 18+ installed
- Git installed
- GitHub access (if you need to push changes)

### Step 1: Clone the Repository
```bash
# Clone the repository
git clone https://github.com/ancourn/omnior-browser.git

# Navigate to the project directory
cd omnior-browser
```

### Step 2: Install Dependencies
```bash
# Install all npm dependencies
npm install

# This will install:
# - Next.js 15 with App Router
# - TypeScript 5
# - Tailwind CSS 4
# - shadcn/ui components
# - Prisma ORM
# - All other required packages
```

### Step 3: Database Setup
```bash
# Push the Prisma schema to the database
npm run db:push

# This will:
# - Create the SQLite database
# - Apply all schema migrations
# - Generate the Prisma client
```

### Step 4: Start Development
```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:3000
```

### Step 5: Code Quality Check
```bash
# Run ESLint to check code quality
npm run lint
```

## Development Workflow

### Daily Development Commands
```bash
# Start development server
npm run dev

# Check code quality
npm run lint

# View development logs
tail -f dev.log

# Check git status
git status

# Pull latest changes
git pull origin main
```

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# View database (if you have SQLite browser)
sqlite3 prisma/dev.db

# Reset database (if needed)
rm prisma/dev.db && npm run db:push
```

### Git Workflow
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

## Project Structure Overview

```
omnior-browser/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── search/            # Search-related components
│   │   ├── privacy/           # Privacy tools
│   │   ├── productivity/      # Productivity tools
│   │   └── ai/                # AI-related components
│   ├── lib/                   # Utility libraries
│   │   ├── ai/                # AI services and utilities
│   │   ├── db/                # Database utilities
│   │   └── utils/             # General utilities
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
├── components.json            # shadcn/ui configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies and scripts
```

## Key Development Areas

### 1. AI Actions System (Phase 5-6)
- Location: `src/lib/ai/ai-actions-service.ts`
- Components: `src/components/search/`
- Features: AI-powered workflow automation, contextual actions

### 2. Privacy & Productivity Tools (Phase 3)
- Location: `src/components/privacy/` and `src/components/productivity/`
- Features: Quick Notes, Tab Groups, Quick Translate, Content Blocker

### 3. AI-Assisted Features (Phase 4)
- Location: `src/components/ai/`
- Features: AI Summarizer, Advanced Search, Smart Search Assistant

### 4. Workspace & Contextual Automation (Phase 6)
- Location: `src/lib/ai/` and `src/components/ai/`
- Features: AIActionManager, OmniAI, WorkspaceMemory

## Development Tips

### 1. Component Development
- Use existing shadcn/ui components when possible
- Follow the established naming conventions
- Implement proper TypeScript types
- Add proper loading states and error handling

### 2. AI Features Development
- Use the `z-ai-web-dev-sdk` package for AI functionality
- Keep AI logic in the backend (server-side)
- Use the AIAction registry pattern for consistency
- Implement proper progress tracking

### 3. Database Development
- Modify `prisma/schema.prisma` for schema changes
- Run `npm run db:push` to apply changes
- Use `import { db } from '@/lib/db'` for database access

### 4. Testing Your Changes
- Use `npm run lint` to check code quality
- Test features in the browser at `http://localhost:3000`
- Check `dev.log` for development server logs

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Reset database
   rm prisma/dev.db && npm run db:push
   ```

2. **Dependency Issues**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

4. **TypeScript Errors**
   ```bash
   # Clear TypeScript cache
   rm -rf .next
   npm run dev
   ```

## Getting Help

### Check Development Logs
```bash
tail -f dev.log
```

### Check Git Status
```bash
git status
git log --oneline -10
```

### Check Package Scripts
```bash
npm run
```

## Next Development Steps

Based on our current progress, the next development focus should be:

1. **Phase 6 Implementation**: AI-Assisted Workspace & Contextual Automation Layer
2. **Lock Interface Contracts**: AIActionManager + OmniAI interfaces
3. **Tool Development**: Build proprietary tools using the established patterns
4. **Testing**: Comprehensive testing of all AI actions and workflows

## Important Notes

- This is a proprietary project - all code must be 100% original
- Use open source as inspiration only, not for code reuse
- Follow the established architectural patterns
- Maintain code quality with regular lint checks
- Keep AI functionality server-side for security