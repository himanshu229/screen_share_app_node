#!/usr/bin/env python3
"""
Hidden Audio Capture Service
Captures system audio and sends directly to browser clients via WebSocket
No console windows, no user interaction required
Works without admin access - automatically finds audio source
"""

import sys
import os
import warnings
import base64
import time
import socketio
import json

# Suppress ALL warnings including soundcard warnings
warnings.filterwarnings('ignore')
warnings.filterwarnings('ignore', category=RuntimeWarning)
warnings.filterwarnings('ignore', message='data discontinuity')
os.environ['PYTHONWARNINGS'] = 'ignore'

# Hide console window on Windows
if sys.platform == 'win32':
    try:
        import ctypes
        ctypes.windll.user32.ShowWindow(ctypes.windll.kernel32.GetConsoleWindow(), 0)
    except:
        pass

# Try to import audio libraries (suppress their warnings too)
try:
    import soundcard as sc
    import numpy as np
    HAS_SOUNDCARD = True
    # Suppress soundcard-specific warnings
    from soundcard.mediafoundation import SoundcardRuntimeWarning
    warnings.filterwarnings('ignore', category=SoundcardRuntimeWarning)
except ImportError:
    HAS_SOUNDCARD = False

try:
    import pyaudio
    import numpy as np
    HAS_PYAUDIO = True
except ImportError:
    HAS_PYAUDIO = False

class AudioCapture:
    def __init__(self, server_url='http://localhost:3001'):
        self.server_url = server_url
        self.is_capturing = False
        self.chunk_size = 768  # 16ms chunks at 48kHz - optimal for low latency
        self.sample_rate = 48000
        self.channels = 2
        self.audio = None
        self.stream = None
        self.audio_method = None
        
        # Socket.IO client for direct connection to server
        self.sio = socketio.Client(
            reconnection=True,
            reconnection_attempts=0,
            reconnection_delay=1,
            reconnection_delay_max=5,
            logger=False,
            engineio_logger=False
        )
        
        # Setup event handlers
        self.setup_socketio_events()
        
    def setup_socketio_events(self):
        """Setup Socket.IO event handlers"""
        @self.sio.on('connect')
        def on_connect():
            print('[AUDIO] Connected to server', flush=True)
            self.is_capturing = True
        
        @self.sio.on('disconnect')
        def on_disconnect():
            print('[AUDIO] Disconnected from server', flush=True)
            self.is_capturing = False
        
        @self.sio.on('audio-control')
        def on_audio_control(data):
            """Handle audio control from clients"""
            if data.get('action') == 'stop':
                self.is_capturing = False
                print('[AUDIO] Capture paused', flush=True)
            elif data.get('action') == 'start':
                self.is_capturing = True
                print('[AUDIO] Capture resumed', flush=True)
        
    def initialize_audio_soundcard(self):
        """Initialize soundcard for system audio capture (no admin required)"""
        try:
            # Suppress warnings during soundcard initialization
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                
                # Get the default loopback device (system audio output)
                default_speaker = sc.default_speaker()
                loopback = sc.get_microphone(id=str(default_speaker.name), include_loopback=True)
                self.stream = loopback
                self.audio_method = 'soundcard'
                return True
        except Exception as e:
            return False
    
    def initialize_audio_pyaudio(self):
        """Initialize PyAudio with automatic device detection"""
        try:
            self.audio = pyaudio.PyAudio()
            device_index = None
            
            # Search for loopback/stereo mix devices (try all)
            for i in range(self.audio.get_device_count()):
                try:
                    device_info = self.audio.get_device_info_by_index(i)
                    device_name = str(device_info.get('name', '')).lower()
                    max_input = device_info.get('maxInputChannels', 0)
                    
                    if max_input > 0:
                        # Try loopback devices first (no admin needed)
                        if any(keyword in device_name for keyword in ['loopback', 'stereo mix', 'wave out', 'what u hear', 'what you hear']):
                            device_index = i
                            break
                except:
                    continue
            
            # If no loopback found, use default microphone
            if device_index is None:
                try:
                    default_device = self.audio.get_default_input_device_info()
                    device_index = default_device['index']
                except:
                    return False
            
            # Try to open stereo stream
            try:
                self.stream = self.audio.open(
                    format=pyaudio.paInt16,
                    channels=self.channels,
                    rate=self.sample_rate,
                    input=True,
                    input_device_index=device_index,
                    frames_per_buffer=self.chunk_size
                )
                self.audio_method = 'pyaudio'
                return True
            except:
                # Fallback to mono
                try:
                    self.stream = self.audio.open(
                        format=pyaudio.paInt16,
                        channels=1,
                        rate=self.sample_rate,
                        input=True,
                        input_device_index=device_index,
                        frames_per_buffer=self.chunk_size
                    )
                    self.channels = 1
                    self.audio_method = 'pyaudio-mono'
                    return True
                except:
                    return False
            
        except Exception as e:
            return False
    
    def initialize_audio(self):
        """Initialize audio with automatic method selection"""
        # Try soundcard first (best for Windows, no admin needed)
        if HAS_SOUNDCARD and sys.platform == 'win32':
            if self.initialize_audio_soundcard():
                return True
        
        # Fallback to PyAudio
        if HAS_PYAUDIO:
            if self.initialize_audio_pyaudio():
                return True
        
        return False
    
    def capture_audio_chunk_soundcard(self):
        """Capture audio using soundcard library"""
        try:
            with self.stream.recorder(samplerate=self.sample_rate, channels=self.channels) as mic:
                # Record a chunk of audio
                data = mic.record(numframes=self.chunk_size)
                
                # Convert to int16 format and bytes
                audio_int16 = (data * 32767).astype(np.int16)
                audio_bytes = audio_int16.tobytes()
                
                # Convert to base64 for transmission
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                
                return {
                    'audio': audio_base64,
                    'sampleRate': self.sample_rate,
                    'channels': self.channels,
                    'format': 'int16',
                    'timestamp': int(time.time() * 1000)
                }
        except:
            return None
    
    def capture_audio_chunk_pyaudio(self):
        """Capture audio using PyAudio"""
        try:
            if not self.stream:
                return None
            
            # Read audio data
            audio_data = self.stream.read(self.chunk_size, exception_on_overflow=False)
            
            # Convert to base64 for transmission
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                'audio': audio_base64,
                'sampleRate': self.sample_rate,
                'channels': self.channels,
                'format': 'int16',
                'timestamp': int(time.time() * 1000)
            }
        except:
            return None
    
    def capture_audio_chunk(self):
        """Capture a single audio chunk based on method"""
        if self.audio_method == 'soundcard':
            return self.capture_audio_chunk_soundcard()
        elif self.audio_method in ['pyaudio', 'pyaudio-mono']:
            return self.capture_audio_chunk_pyaudio()
        return None
    
    def send_audio_chunk(self, audio_bytes):
        """Send audio directly to clients via Socket.IO"""
        try:
            if not self.sio.connected:
                return False
            
            # Encode to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Send directly to all connected clients
            self.sio.emit('audio-chunk', {
                'audio': audio_base64,
                'sampleRate': self.sample_rate,
                'channels': self.channels,
                'format': 'int16',
                'timestamp': int(time.time() * 1000)
            })
            return True
        except Exception as e:
            return False
    
    def start_capture(self):
        """Start continuous audio capture and send via WebSocket"""
        # Connect to Socket.IO server
        try:
            print(f'[AUDIO] Connecting to server at {self.server_url}...', flush=True)
            self.sio.connect(self.server_url)
            print('[AUDIO] Connected successfully', flush=True)
        except Exception as e:
            print(f'[AUDIO] Failed to connect: {e}', flush=True)
            return
        
        if not self.initialize_audio():
            print('[AUDIO] Failed to initialize audio', flush=True)
            return
        
        print(f'[AUDIO] Starting audio capture using {self.audio_method}', flush=True)
        
        try:
            # Continuous capture loop for soundcard
            if self.audio_method == 'soundcard':
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    
                    with self.stream.recorder(samplerate=self.sample_rate, channels=self.channels) as mic:
                        while self.sio.connected:
                            try:
                                if not self.is_capturing:
                                    time.sleep(0.1)
                                    continue
                                
                                # Capture chunk
                                data = mic.record(numframes=self.chunk_size)
                                audio_int16 = (data * 32767).astype(np.int16)
                                audio_bytes = audio_int16.tobytes()
                                
                                # Send immediately via WebSocket
                                self.send_audio_chunk(audio_bytes)
                                
                            except Exception as e:
                                time.sleep(0.01)
            
            # Continuous capture loop for PyAudio
            elif self.audio_method in ['pyaudio', 'pyaudio-mono']:
                while self.sio.connected:
                    try:
                        if not self.is_capturing:
                            time.sleep(0.1)
                            continue
                        
                        # Capture chunk
                        audio_data = self.stream.read(self.chunk_size, exception_on_overflow=False)
                        
                        # Send immediately via WebSocket
                        self.send_audio_chunk(audio_data)
                        
                    except Exception as e:
                        time.sleep(0.01)
                
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_capture()
    
    def stop_capture(self):
        """Stop audio capture and cleanup"""
        self.is_capturing = False
        
        try:
            if self.audio_method in ['pyaudio', 'pyaudio-mono'] and self.stream:
                self.stream.stop_stream()
                self.stream.close()
                self.stream = None
            
            if self.audio:
                self.audio.terminate()
                self.audio = None
            
            # Disconnect from Socket.IO
            if self.sio.connected:
                self.sio.disconnect()
        except:
            pass

def main():
    # Get server URL from command line or use default
    server_url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3001'
    
    # Create and start audio capture
    capturer = AudioCapture(server_url)
    
    # Run in background
    capturer.start_capture()

if __name__ == '__main__':
    main()
