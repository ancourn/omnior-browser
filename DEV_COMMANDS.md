# Development Commands Cheat Sheet

## Essential Commands

### Project Setup
```bash
# Clone repository
git clone https://github.com/ancourn/omnior-browser.git
cd omnior-browser

# Install dependencies
npm install

# Setup database
npm run db:push

# Start development
npm run dev
```

### Daily Development
```bash
# Start development server
npm run dev

# Check code quality
npm run lint

# Check git status
git status

# View development logs
tail -f dev.log
```

### Database Operations
```bash
# Push schema changes
npm run db:push

# Reset database (if needed)
rm prisma/dev.db && npm run db:push

# View database (SQLite browser required)
sqlite3 prisma/dev.db
```

### Git Operations
```bash
# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Check recent commits
git log --oneline -10

# Check git status
git status
```

## Development Workflow

### 1. Morning Setup
```bash
# Pull latest changes
git pull origin main

# Start development server
npm run dev

# Check logs in another terminal
tail -f dev.log
```

### 2. During Development
```bash
# Check code quality
npm run lint

# Commit changes frequently
git add .
git commit -m "Progress: [feature name]"

# Push changes
git push origin main
```

### 3. Database Changes
```bash
# Edit schema in prisma/schema.prisma
# Then push changes
npm run db:push
```

### 4. Testing Changes
```bash
# Check if server is running
curl http://localhost:3000

# Check browser console for errors
# Open http://localhost:3000 in browser
```

## Troubleshooting Commands

### Port Issues
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Dependency Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Database Issues
```bash
# Reset database
rm prisma/dev.db
npm run db:push
```

## File Locations

### Key Files to Edit
- `src/app/page.tsx` - Main page
- `prisma/schema.prisma` - Database schema
- `src/lib/ai/ai-actions-service.ts` - AI actions service
- `components.json` - shadcn/ui config

### Key Directories
- `src/components/` - React components
- `src/lib/` - Utility libraries
- `src/lib/ai/` - AI services
- `src/components/ui/` - shadcn/ui components
- `src/components/search/` - Search components
- `src/components/ai/` - AI components

## Development Tips

### 1. Component Development
```bash
# Check if component exists
ls src/components/[category]/

# Create new component following existing patterns
# Use shadcn/ui components when possible
```

### 2. AI Features
```bash
# AI logic should be in backend (server-side)
# Use z-ai-web-dev-sdk package
# Follow AIAction registry pattern
```

### 3. Database Work
```bash
# Always backup before schema changes
cp prisma/dev.db prisma/dev.db.backup

# Test changes locally first
npm run db:push
```

### 4. Code Quality
```bash
# Run lint before committing
npm run lint

# Fix lint issues automatically (if possible)
npm run lint -- --fix
```

## Quick Reference

### Package Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push database schema
npm run db:studio    # Open Prisma Studio (if installed)
```

### Git Quick Reference
```bash
git status           # Check status
git add .            # Add all changes
git commit -m "msg"  # Commit changes
git push origin main # Push to GitHub
git pull origin main # Pull from GitHub
git log --oneline    # Show commits
```

### Development Server
```bash
# Server runs on http://localhost:3000
# Logs are written to dev.log
# Hot reload is enabled
# TypeScript errors shown in console
```

## Next Steps

### Current Development Focus
1. Phase 6: AI-Assisted Workspace & Contextual Automation Layer
2. Lock AIActionManager + OmniAI interface contracts
3. Build proprietary tools using established patterns
4. Implement comprehensive testing

### Daily Goals
- [ ] Run `npm run lint` before committing
- [ ] Test all changes in browser
- [ ] Check `dev.log` for errors
- [ ] Commit frequently with descriptive messages
- [ ] Push changes to GitHub regularly