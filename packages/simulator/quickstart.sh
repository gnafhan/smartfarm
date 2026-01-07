#!/bin/bash
# Quick start script for Livestock IoT Simulator
# This script sets up and runs the simulator with minimal user interaction

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Livestock IoT Monitoring System - Simulator Quickstart    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi
echo "✓ Python 3 found: $(python3 --version)"

# Setup virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Create .env if needed
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Starting simulator in 3 seconds..."
echo "Press Ctrl+C to stop"
echo ""
sleep 3

# Run the simulator
python main.py
