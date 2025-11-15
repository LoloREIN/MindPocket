#!/usr/bin/env bash
set -euo pipefail

# Generate Amplify Hosting deployment bundle for Next.js (standalone)
APP_DIR="$(pwd)"
OUT_DIR="$APP_DIR/.amplify-hosting"
COMPUTE_DIR="$OUT_DIR/compute/default"

# Clean and prepare directories
rm -rf "$OUT_DIR"
mkdir -p "$COMPUTE_DIR"

# 1) Copy Next.js standalone server into compute/default
# This includes server.js and the minimal node_modules tree
cp -R .next/standalone/* "$COMPUTE_DIR"/

# 2) Ensure Next can find static assets relative to the server
mkdir -p "$COMPUTE_DIR/.next"
cp -R .next/static "$COMPUTE_DIR/.next/" 2>/dev/null || true

# 3) Create minimal deploy-manifest.json with a catch-all route to compute
cat > "$OUT_DIR/deploy-manifest.json" << 'EOF'
{
  "version": 1,
  "framework": { "name": "nextjs", "version": "16.0.3" },
  "routes": [
    { "path": "/<*>", "target": "compute" }
  ]
}
EOF

echo "✅ .amplify-hosting bundle created at $OUT_DIR"
