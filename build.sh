#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔨 OpenCode Extension Build Script${NC}\n"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Check if vsce is installed
if ! npm list -g @vscode/vsce &> /dev/null; then
    echo -e "${YELLOW}📦 Installing @vscode/vsce...${NC}"
    npm install -g @vscode/vsce
fi

echo -e "${YELLOW}📥 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Compiling TypeScript...${NC}"
npm run compile

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Packaging extension...${NC}"
vsce package

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Packaging failed${NC}"
    exit 1
fi

# Find the .vsix file
VSIX_FILE=$(ls -t opencode-*.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    echo -e "${RED}❌ .vsix file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo -e "${GREEN}📦 Extension file: ${VSIX_FILE}${NC}"
echo -e "\n${YELLOW}📝 To install in VS Code:${NC}"
echo -e "  1. Open VS Code"
echo -e "  2. Go to Extensions (Ctrl+Shift+X)"
echo -e "  3. Click '...' menu and select 'Install from VSIX...'"
echo -e "  4. Select ${VSIX_FILE}"
echo -e "\n${YELLOW}Or use command line:${NC}"
echo -e "  code --install-extension ${VSIX_FILE}"
