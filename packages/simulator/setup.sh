#!/bin/bash
# Setup script for Livestock IoT Simulator

echo "Setting up Livestock IoT Simulator..."
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "Python version:"
python3 --version
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created"
else
    echo "Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ".env file created - please edit it with your configuration"
else
    echo ".env file already exists"
fi
echo ""

echo "Setup complete!"
echo ""
echo "To run the simulator:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Edit .env with your configuration"
echo "  3. Run: python main.py"
echo ""
echo "Or run individual simulators:"
echo "  - Gas sensors: python gas_sensor_simulator.py"
echo "  - RFID readers: python rfid_reader_simulator.py"
