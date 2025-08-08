#!/bin/bash

# Omnior Browser Quick Start Script
# Run this script to set up the development environment quickly

echo "🚀 Setting up Omnior Browser Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Clone repository if not already in project directory
if [ ! -f "package.json" ]; then
    echo "📦 Cloning repository..."
    git clone https://github.com/ancourn/omnior-browser.git
    cd omnior-browser
    echo "✅ Repository cloned"
else
    echo "📁 Already in project directory"
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"

# Set up database
echo "🗄️ Setting up database..."
npm run db:push
echo "✅ Database setup complete"

# Start development server
echo "🎯 Starting development server..."
echo "🌐 Application will be available at: http://localhost:3000"
echo "📋 Press Ctrl+C to stop the server"
echo ""

npm run dev