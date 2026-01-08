#!/bin/bash

# Livestock IoT Monitoring System - Production Deployment Script
# Usage: ./deploy.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
ENV_TEMPLATE=".env.production"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

check_requirements() {
    print_info "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker found: $(docker --version)"
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose found: $(docker compose version)"
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root is not recommended"
    fi
}

check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env file not found"
        print_info "Creating from template..."
        cp "$ENV_TEMPLATE" "$ENV_FILE"
        print_warning "Please edit .env file with your configuration"
        print_info "nano .env"
        exit 1
    fi
    print_success ".env file found"
}

create_directories() {
    print_info "Creating required directories..."
    mkdir -p logs/backend logs/nginx backups/mongodb nginx/ssl
    print_success "Directories created"
}

build() {
    print_info "Building Docker images..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
    print_success "Build completed"
}

start() {
    print_info "Starting services..."
    
    # Start infrastructure first
    print_info "Starting MongoDB, Redis, and Mosquitto..."
    docker compose -f "$COMPOSE_FILE" up -d mongodb redis mosquitto
    
    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 30
    
    # Start backend
    print_info "Starting backend..."
    docker compose -f "$COMPOSE_FILE" up -d backend
    
    # Wait for backend
    print_info "Waiting for backend to be ready..."
    sleep 30
    
    # Start frontend
    print_info "Starting frontend..."
    docker compose -f "$COMPOSE_FILE" up -d frontend
    
    # Start nginx (optional)
    if grep -q "nginx:" "$COMPOSE_FILE"; then
        print_info "Starting nginx..."
        docker compose -f "$COMPOSE_FILE" up -d nginx
    fi
    
    print_success "All services started"
}

stop() {
    print_info "Stopping services..."
    docker compose -f "$COMPOSE_FILE" stop
    print_success "Services stopped"
}

restart() {
    print_info "Restarting services..."
    docker compose -f "$COMPOSE_FILE" restart
    print_success "Services restarted"
}

status() {
    print_info "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
}

logs() {
    SERVICE=${1:-}
    if [ -z "$SERVICE" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f
    else
        docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
    fi
}

backup() {
    print_info "Creating backup..."
    
    BACKUP_DIR="./backups"
    DATE=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p "$BACKUP_DIR/mongodb"
    
    # Get MongoDB credentials from .env
    MONGO_USER=$(grep MONGO_ROOT_USERNAME "$ENV_FILE" | cut -d '=' -f2)
    MONGO_PASS=$(grep MONGO_ROOT_PASSWORD "$ENV_FILE" | cut -d '=' -f2)
    
    # Backup MongoDB
    print_info "Backing up MongoDB..."
    docker compose -f "$COMPOSE_FILE" exec -T mongodb \
        mongodump --username "$MONGO_USER" --password "$MONGO_PASS" \
        --authenticationDatabase admin \
        --out "/backups/mongodb_$DATE"
    
    # Compress
    print_info "Compressing backup..."
    cd "$BACKUP_DIR"
    tar -czf "mongodb_$DATE.tar.gz" "mongodb_$DATE"
    rm -rf "mongodb_$DATE"
    cd ..
    
    print_success "Backup created: $BACKUP_DIR/mongodb_$DATE.tar.gz"
}

restore() {
    BACKUP_FILE=${1:-}
    
    if [ -z "$BACKUP_FILE" ]; then
        print_error "Please specify backup file"
        print_info "Usage: ./deploy.sh restore backups/mongodb_20240107_020000.tar.gz"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_warning "This will restore database from backup"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Restore cancelled"
        exit 0
    fi
    
    print_info "Restoring from backup..."
    
    # Extract backup
    BACKUP_DIR=$(dirname "$BACKUP_FILE")
    BACKUP_NAME=$(basename "$BACKUP_FILE" .tar.gz)
    
    tar -xzf "$BACKUP_FILE" -C "$BACKUP_DIR"
    
    # Get MongoDB credentials
    MONGO_USER=$(grep MONGO_ROOT_USERNAME "$ENV_FILE" | cut -d '=' -f2)
    MONGO_PASS=$(grep MONGO_ROOT_PASSWORD "$ENV_FILE" | cut -d '=' -f2)
    
    # Copy to container
    docker cp "$BACKUP_DIR/$BACKUP_NAME" livestock-mongodb-prod:/backups/
    
    # Restore
    docker compose -f "$COMPOSE_FILE" exec mongodb \
        mongorestore --username "$MONGO_USER" --password "$MONGO_PASS" \
        --authenticationDatabase admin \
        "/backups/$BACKUP_NAME"
    
    # Cleanup
    rm -rf "$BACKUP_DIR/$BACKUP_NAME"
    
    print_success "Restore completed"
}

update() {
    print_info "Updating application..."
    
    # Pull latest code
    print_info "Pulling latest code..."
    git pull origin main
    
    # Rebuild images
    print_info "Rebuilding images..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
    
    # Restart services
    print_info "Restarting services..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    print_success "Update completed"
}

clean() {
    print_warning "This will remove all unused Docker resources"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Clean cancelled"
        exit 0
    fi
    
    print_info "Cleaning up..."
    docker system prune -a --volumes -f
    print_success "Cleanup completed"
}

seed() {
    print_info "Seeding database..."
    docker compose -f "$COMPOSE_FILE" exec backend npm run seed
    print_success "Database seeded"
}

shell() {
    SERVICE=${1:-backend}
    print_info "Opening shell in $SERVICE..."
    docker compose -f "$COMPOSE_FILE" exec "$SERVICE" sh
}

help() {
    cat << EOF
Livestock IoT Monitoring System - Deployment Script

Usage: ./deploy.sh [command] [options]

Commands:
    check       Check system requirements
    build       Build Docker images
    start       Start all services
    stop        Stop all services
    restart     Restart all services
    status      Show service status
    logs        Show logs (optional: service name)
    backup      Create database backup
    restore     Restore from backup (requires backup file)
    update      Update application (git pull + rebuild)
    clean       Clean up unused Docker resources
    seed        Seed database with initial data
    shell       Open shell in container (default: backend)
    help        Show this help message

Examples:
    ./deploy.sh check
    ./deploy.sh build
    ./deploy.sh start
    ./deploy.sh logs backend
    ./deploy.sh backup
    ./deploy.sh restore backups/mongodb_20240107_020000.tar.gz
    ./deploy.sh shell backend

EOF
}

# Main script
case "${1:-help}" in
    check)
        check_requirements
        check_env
        create_directories
        ;;
    build)
        check_requirements
        check_env
        build
        ;;
    start)
        check_requirements
        check_env
        create_directories
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "${2:-}"
        ;;
    backup)
        backup
        ;;
    restore)
        restore "${2:-}"
        ;;
    update)
        update
        ;;
    clean)
        clean
        ;;
    seed)
        seed
        ;;
    shell)
        shell "${2:-backend}"
        ;;
    help|*)
        help
        ;;
esac
