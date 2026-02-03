#!/bin/bash
# Build script for mobile that excludes API routes and server actions

set -e

BACKUP_DIR="/tmp/daily-pa-build-backup-$$"
mkdir -p "$BACKUP_DIR"

# Move API directory outside project temporarily
if [ -d "src/app/api" ]; then
  mv src/app/api "$BACKUP_DIR/api"
  echo "✓ Moved API directory temporarily"
fi

# Create proper stub for server actions
if [ -f "src/lib/auth/actions.ts" ]; then
  mv src/lib/auth/actions.ts "$BACKUP_DIR/actions.ts"
  cat > src/lib/auth/actions.ts << 'ACTIONS_EOF'
'use client';
// Server actions disabled for mobile build - mobile app uses API routes on Vercel instead

export async function getUser() {
  return null; // Mobile app handles auth differently
}

export async function signIn(formData: FormData) {
  throw new Error('Use API endpoint /api/auth/login in mobile app');
}

export async function signUp(formData: FormData) {
  throw new Error('Use API endpoint /api/auth/register in mobile app');
}

export async function signInWithGoogle() {
  throw new Error('Use API endpoint /api/auth/google in mobile app');
}

export async function signOut() {
  throw new Error('Use API endpoint /api/auth/logout in mobile app');
}

export async function resetPassword(formData: FormData) {
  throw new Error('Use API endpoint /api/auth/reset-password in mobile app');
}

export async function updatePassword(formData: FormData) {
  throw new Error('Use API endpoint /api/auth/update-password in mobile app');
}
ACTIONS_EOF
  echo "✓ Created server actions stub"
fi

# Build
echo "Building Next.js app for mobile..."
NEXT_PUBLIC_CAPACITOR=true npm run build

# Restore files
if [ -d "$BACKUP_DIR/api" ]; then
  mv "$BACKUP_DIR/api" src/app/api
  echo "✓ Restored API directory"
fi

if [ -f "$BACKUP_DIR/actions.ts" ]; then
  mv "$BACKUP_DIR/actions.ts" src/lib/auth/actions.ts
  echo "✓ Restored server actions file"
fi

rm -rf "$BACKUP_DIR"

if [ -d "out" ]; then
  echo "✓ Build complete! Output in 'out' directory"
  echo "✓ Ready to sync to Android with: npx cap sync android"
else
  echo "✗ Build failed - 'out' directory not found"
  exit 1
fi
