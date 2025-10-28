@echo off
REM Install Python dependencies for audio capture
echo Installing Python dependencies for audio capture...
python -m pip install --upgrade pip
python -m pip install -r server\services\requirements.txt

echo.
echo Python audio capture dependencies installed successfully!
echo.
echo Note: Make sure you have enabled "Stereo Mix" or similar audio loopback device
echo in Windows Sound Settings for audio capture to work.
echo.
pause
