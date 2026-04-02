#!/bin/bash
# XETHRYON Install Script
# Usage: curl -fsSL https://raw.githubusercontent.com/EstarinAzx/XETHRYON/master/install.sh | bash

set -euo pipefail

REPO="EstarinAzx/XETHRYON"
BINARY_NAME="xethryon"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  linux)   PLATFORM="linux" ;;
  darwin)  PLATFORM="darwin" ;;
  *)       echo "❌ Unsupported OS: $OS"; exit 1 ;;
esac

case "$ARCH" in
  x86_64|amd64)   ARCH="x64" ;;
  aarch64|arm64)   ARCH="arm64" ;;
  *)               echo "❌ Unsupported architecture: $ARCH"; exit 1 ;;
esac

TARGET="opencode-${PLATFORM}-${ARCH}"

# Determine install directory
if [ -n "${XETHRYON_INSTALL_DIR:-}" ]; then
  INSTALL_DIR="$XETHRYON_INSTALL_DIR"
elif [ -n "${XDG_BIN_DIR:-}" ]; then
  INSTALL_DIR="$XDG_BIN_DIR"
elif [ -d "$HOME/bin" ] || mkdir -p "$HOME/bin" 2>/dev/null; then
  INSTALL_DIR="$HOME/bin"
else
  INSTALL_DIR="$HOME/.xethryon/bin"
fi

mkdir -p "$INSTALL_DIR"

echo ""
echo "  ██╗  ██╗███████╗████████╗██╗  ██╗██████╗ ██╗   ██╗ ██████╗ ███╗   ██╗"
echo "  ╚██╗██╔╝██╔════╝╚══██╔══╝██║  ██║██╔══██╗╚██╗ ██╔╝██╔═══██╗████╗  ██║"
echo "   ╚███╔╝ █████╗     ██║   ███████║███████║ ╚████╔╝ ██║   ██║██╔██╗ ██║"
echo "   ██╔██╗ ██╔══╝     ██║   ██╔══██║██╔══██║  ╚██╔╝  ██║   ██║██║╚██╗██║"
echo "  ██╔╝ ██╗███████╗   ██║   ██║  ██║██║  ██║   ██║   ╚██████╔╝██║ ╚████║"
echo "  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝"
echo ""
echo "  Installing XETHRYON Neural Interface..."
echo "  Platform: ${PLATFORM}-${ARCH}"
echo "  Target:   ${INSTALL_DIR}/${BINARY_NAME}"
echo ""

# Get latest release URL
RELEASE_URL=$(curl -sSL "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep "browser_download_url.*${TARGET}" \
  | head -1 \
  | cut -d '"' -f 4)

if [ -z "$RELEASE_URL" ]; then
  echo "❌ No release found for ${TARGET}"
  echo ""
  echo "Available method: build from source"
  echo "  git clone https://github.com/${REPO}.git"
  echo "  cd XETHRYON && bun install && cd packages/opencode && bun run dev"
  exit 1
fi

echo "  ⬇ Downloading from release..."
curl -fsSL "$RELEASE_URL" -o "/tmp/${BINARY_NAME}.tar.gz"

echo "  📦 Extracting..."
tar -xzf "/tmp/${BINARY_NAME}.tar.gz" -C "/tmp/"
mv "/tmp/${TARGET}/bin/opencode" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

# Cleanup
rm -rf "/tmp/${BINARY_NAME}.tar.gz" "/tmp/${TARGET}"

echo ""
echo "  ✅ XETHRYON installed to: ${INSTALL_DIR}/${BINARY_NAME}"
echo ""

# Check if install dir is in PATH
if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
  echo "  ⚠  ${INSTALL_DIR} is not in your PATH."
  echo "  Add it to your shell profile:"
  echo ""
  echo "    export PATH=\"${INSTALL_DIR}:\$PATH\""
  echo ""
fi

echo "  Run 'xethryon' to start the neural interface."
echo ""
