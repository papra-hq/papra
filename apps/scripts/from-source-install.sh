#!/usr/bin/env bash

set -e

# ===================
# Configuration
# ===================
NODE_MIN_VERSION=24
PNPM_MIN_VERSION=10
DEFAULT_INSTALL_DIR="$HOME/papra"
DEFAULT_BASE_URL="http://localhost:1221"
REPO_NAME="@papra/root"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# ===================
# Functions
# ===================

# Run command with sudo if not root
run_privileged() {
    if [ "$EUID" -eq 0 ]; then
        "$@"
    else
        sudo "$@"
    fi
}

check_node() {
    command -v node &> /dev/null || return 1
    local version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    [ "$version" -ge "$NODE_MIN_VERSION" ]
}

check_pnpm() {
    command -v pnpm &> /dev/null || return 1
    local version=$(pnpm --version | cut -d'.' -f1)
    [ "$version" -ge "$PNPM_MIN_VERSION" ]
}

install_node() {
    if [ ! -f /etc/os-release ]; then
        echo -e "${RED}❌ Cannot detect distribution. Please install Node.js ${NODE_MIN_VERSION}+ manually.${NC}"
        exit 1
    fi

    . /etc/os-release

    echo "Installing Node.js for $ID..."

    case "$ID" in
        debian|ubuntu|pop|mint)
            if command -v curl &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_${NODE_MIN_VERSION}.x | run_privileged bash -E -
            else
                wget -qO- https://deb.nodesource.com/setup_${NODE_MIN_VERSION}.x | run_privileged bash -E -
            fi
            DEBIAN_FRONTEND=noninteractive run_privileged apt install -y nodejs
            ;;
        fedora|rhel|centos|rocky|alma)
            if command -v curl &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_${NODE_MIN_VERSION}.x | run_privileged bash -
            else
                wget -qO- https://rpm.nodesource.com/setup_${NODE_MIN_VERSION}.x | run_privileged bash -
            fi
            run_privileged dnf install -y nodejs
            ;;
        arch|manjaro)
            run_privileged pacman -S --noconfirm nodejs npm
            ;;
        alpine)
            run_privileged apk add nodejs npm
            ;;
        *)
            echo -e "${RED}❌ Unsupported distribution: $ID. Please install Node.js ${NODE_MIN_VERSION}+ manually.${NC}"
            exit 1
            ;;
    esac

    echo -e "${GREEN}✓ Node.js installed successfully${NC}"
}

install_git() {
    if [ ! -f /etc/os-release ]; then
        echo -e "${RED}❌ Cannot detect distribution. Please install Git manually.${NC}"
        exit 1
    fi

    . /etc/os-release

    echo "Installing Git for $ID..."

    case "$ID" in
        debian|ubuntu|pop|mint)
            run_privileged apt update
            DEBIAN_FRONTEND=noninteractive run_privileged apt install -y git
            ;;
        fedora|rhel|centos|rocky|alma)
            run_privileged dnf install -y git
            ;;
        arch|manjaro)
            run_privileged pacman -S --noconfirm git
            ;;
        alpine)
            run_privileged apk add git
            ;;
        *)
            echo -e "${RED}❌ Unsupported distribution: $ID. Please install Git manually.${NC}"
            exit 1
            ;;
    esac

    echo -e "${GREEN}✓ Git installed successfully${NC}"
}

# ===================
# Main script
# ===================

echo ""
echo "  ____                       "
echo " |  _ \ __ _ _ __  _ __ __ _ "
echo " | |_) / _\` | '_ \| '__/ _\` |"
echo " |  __/ (_| | |_) | | | (_| |"
echo " |_|   \__,_| .__/|_|  \__,_|"
echo "            |_|              "
echo ""
echo "  From source installation script"
echo ""

# 1. Check prerequisites
echo "==========================================="
echo " Step 1: Checking prerequisites"
echo "==========================================="
echo ""

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed.${NC}"
    read -p "Do you want to install Git? (y/n): " install_git_choice < /dev/tty
    if [[ $install_git_choice == "y" ]]; then
        install_git
        if ! command -v git &> /dev/null; then
            echo -e "${RED}❌ Git installation failed.${NC}"
            exit 1
        fi
    else
        echo "Please install Git manually."
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} Git found"
echo ""

# Check Node.js
if ! check_node; then
    echo -e "${RED}❌ Node.js ${NODE_MIN_VERSION}+ is required but not found or outdated.${NC}"
    read -p "Do you want to install Node.js ${NODE_MIN_VERSION}? (y/n): " install_node_choice < /dev/tty
    if [[ $install_node_choice == "y" ]]; then
        install_node
        if ! check_node; then
            echo -e "${RED}❌ Node.js installation failed.${NC}"
            exit 1
        fi
    else
        echo "Please install Node.js ${NODE_MIN_VERSION} or higher manually."
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} Node.js $(node --version)"
echo ""

# Check pnpm
if ! check_pnpm; then
    echo -e "${RED}❌ pnpm ${PNPM_MIN_VERSION}+ is required but not found or outdated.${NC}"
    read -p "Do you want to install pnpm? (y/n): " install_pnpm < /dev/tty
    if [[ $install_pnpm == "y" ]]; then
        echo "Installing pnpm..."
        npm install -g pnpm
        if ! check_pnpm; then
            echo -e "${RED}❌ pnpm installation failed.${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ pnpm installed successfully${NC}"
    else
        echo "Please install pnpm ${PNPM_MIN_VERSION} or higher manually."
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} pnpm $(pnpm --version)"
echo ""

echo ""
echo -e "${GREEN}All prerequisites met!${NC}"
echo ""

# 2. Clone the repository (skip if already in papra repo)
echo "==========================================="
echo " Step 2: Cloning repository"
echo "==========================================="
echo ""

if [ -f "package.json" ] && grep -q "\"name\": \"$REPO_NAME\"" package.json 2>/dev/null; then
    echo "Already in Papra repository, skipping clone..."
    INSTALL_DIR=$(pwd)
else
    read -p "Installation directory [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR < /dev/tty
    INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}

    if [ -d "$INSTALL_DIR" ]; then
        echo -e "${RED}❌ Directory $INSTALL_DIR already exists.${NC}"
        read -p "Do you want to remove it and continue? (y/n): " remove_dir < /dev/tty
        if [[ $remove_dir == "y" ]]; then
            rm -rf "$INSTALL_DIR"
        else
            echo "Installation cancelled."
            exit 1
        fi
    fi

    git clone --depth 1 https://github.com/papra-hq/papra.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo ""
echo -e "${GREEN}✓${NC} Repository ready at $INSTALL_DIR"
echo ""
echo -e "${GREEN}Repository ready!${NC}"
echo ""

# 3. Install dependencies
echo "==========================================="
echo " Step 3: Installing dependencies"
echo "==========================================="
echo ""

pnpm install

echo ""
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""
echo -e "${GREEN}Dependencies ready!${NC}"
echo ""

# 4. Build all packages
echo "==========================================="
echo " Step 4: Building all packages"
echo "==========================================="
echo ""

pnpm -r build

echo ""
echo -e "${GREEN}✓${NC} Build completed"
echo ""
echo -e "${GREEN}Build ready!${NC}"
echo ""

# 5. Copy client files to server
echo "==========================================="
echo " Step 5: Copying client files to server"
echo "==========================================="
echo ""

mkdir -p apps/papra-server/public
cp -r apps/papra-client/dist/* apps/papra-server/public/

echo ""
echo -e "${GREEN}✓${NC} Client files copied"
echo ""
echo -e "${GREEN}Client files ready!${NC}"
echo ""

# 6. Create configuration file
echo "==========================================="
echo " Step 6: Creating configuration"
echo "==========================================="
echo ""

cd apps/papra-server

# Generate secret key
SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Ask for base URL
echo "The base URL is the address where Papra will be accessible."
echo "Example: https://papra.example.com"
echo ""
read -p "Base URL [$DEFAULT_BASE_URL]: " BASE_URL < /dev/tty
BASE_URL=${BASE_URL:-$DEFAULT_BASE_URL}

# Create config file
cat > papra.config.yaml << EOF
server:
  servePublicDir: true
  baseUrl: $BASE_URL

auth:
  secret: $SECRET_KEY
EOF

echo ""
echo -e "${GREEN}✓${NC} Configuration file created"
echo -e "${GREEN}✓${NC} Secret key generated"
echo ""
echo "Note: A secret key has been automatically generated."
echo "To generate a new key, run:"
echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo "Then update the 'auth.secret' value in:"
echo "  $INSTALL_DIR/apps/papra-server/papra.config.yaml"
echo ""
echo -e "${GREEN}Configuration ready!${NC}"
echo ""

# 7. Start the server
echo "==========================================="
echo " Step 7: Ready to launch!"
echo "==========================================="
echo ""
echo -e "${GREEN}✓ Papra has been installed successfully!${NC}"
echo ""
echo "To start Papra, run:"
echo "  cd $INSTALL_DIR/apps/papra-server"
echo "  pnpm start:with-migrations"
echo ""
echo "To stop Papra: Ctrl+C"
echo ""
echo "Papra will be available at: $BASE_URL"
echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""

read -p "Do you want to start Papra now? (y/n): " start_server < /dev/tty

if [[ $start_server == "y" ]]; then
    echo ""
    echo "Starting Papra..."
    echo ""
    pnpm start:with-migrations
fi