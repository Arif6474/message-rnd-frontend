#!/bin/bash

# Migration Script for New Messaging System
# This script backs up old files and activates new ones

echo "🚀 Starting migration to new messaging system..."

# Define the base directory
BASE_DIR="components"

# Step 1: Backup old components
echo "📦 Backing up old components..."
mv "${BASE_DIR}/chat-section.tsx" "${BASE_DIR}/chat-section.old.tsx" 2>/dev/null || echo "  - chat-section.tsx not found (skipping)"
mv "${BASE_DIR}/dashboard.tsx" "${BASE_DIR}/dashboard.old.tsx" 2>/dev/null || echo "  - dashboard.tsx not found (skipping)"

# Step 2: Rename new components to active names
echo "✨ Activating new components..."
mv "${BASE_DIR}/chat-section-new.tsx" "${BASE_DIR}/chat-section.tsx"
mv "${BASE_DIR}/dashboard-new.tsx" "${BASE_DIR}/dashboard.tsx"

echo "✅ Component migration complete!"
echo ""
echo "📋 Summary:"
echo "  - Old chat-section backed up as: chat-section.old.tsx"
echo "  - Old dashboard backed up as: dashboard.old.tsx"
echo "  - New components activated!"
echo ""
echo "🔧 Next steps:"
echo "  1. Update app/page.tsx to import Dashboard from '@/components/dashboard'"
echo "  2. Install missing dependencies: pnpm install date-fns lucide-react"
echo "  3. Ensure Socket.IO Client is installed: pnpm install socket.io-client"
echo "  4. Test the application"
echo ""
echo "🎉 Migration complete! Happy coding!"
