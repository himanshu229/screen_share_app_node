#!/bin/bash
# Install Python dependencies for audio capture
echo "Installing Python dependencies for audio capture..."
python3 -m pip install --upgrade pip
python3 -m pip install -r server/services/requirements.txt

echo ""
echo "Python audio capture dependencies installed successfully!"
echo ""
