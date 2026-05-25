#!/bin/bash
set -e

echo "======================================"
echo " Building BIZETO Agent Release"
echo "======================================"

mkdir -p dist

echo "-> Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o dist/bizeto-agent-linux-amd64 ./cmd/agent

echo "-> Building for macOS (arm64/Apple Silicon)..."
GOOS=darwin GOARCH=arm64 go build -o dist/bizeto-agent-darwin-arm64 ./cmd/agent

echo "-> Building for macOS (amd64/Intel)..."
GOOS=darwin GOARCH=amd64 go build -o dist/bizeto-agent-darwin-amd64 ./cmd/agent

echo "-> Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o dist/bizeto-agent-windows-amd64.exe ./cmd/agent

echo "======================================"
echo " Build Complete! Binaries are in ./dist"
echo "======================================"

# Sync to dashboard public folder for downloads
echo "📂 Syncing to dashboard/public/bin..."
mkdir -p dashboard/public/bin
cp dist/bizeto-agent-* dashboard/public/bin/

ls -lh dist
