# ☁️ Cloud Kernel Anomaly Detection using Dong Ting LSTM

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.0+-FF6F00.svg)
![eBPF](https://img.shields.io/badge/eBPF-ready-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**Real-time system call anomaly detection for cloud kernels using Dong Ting's LSTM model and eBPF**

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [API](#api) • [Contributing](#contributing)

</div>

## 🎯 Overview

This project provides real-time anomaly detection for Linux system calls using deep learning. It attaches to any running process via `strace`, streams system calls, and computes anomaly scores using Dong Ting's LSTM architecture. A modern React dashboard visualizes the results with WebSocket updates. The system is designed for cloud kernel monitoring and can be extended to use eBPF for more efficient tracing.

## ✨ Features

- 🔍 **Real-time monitoring** - Attach to any running process by PID
- 🧠 **LSTM-powered detection** - Dong Ting model for sequence anomaly scoring
- 📊 **Interactive dashboard** - React + Chart.js with live WebSocket updates
- 🔌 **eBPF ready** - Architecture supports eBPF for efficient kernel tracing
- 🚀 **Cloud-native** - Designed for cloud kernel monitoring and container environments
- 📈 **Live visualization** - Real-time charts and syscall tracking

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Linux environment (for strace)
- TensorFlow 2.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kaustubhpatil111/cloud-kernel-anomaly-detection.git
   cd cloud-kernel-anomaly-detection
Set up Python environment

bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
Set up React dashboard

bash
cd dashboard
npm install
cd ..
Ensure ptrace is enabled (for strace)

bash
echo 0 | sudo tee /proc/sys/kernel/yama/ptrace_scope
Running the Application
Terminal 1: Start Flask Backend

bash
source venv/bin/activate
python app.py <PID>  # Replace <PID> with target process ID
Terminal 2: Start React Dashboard

bash
cd dashboard
npm run dev
Open your browser at http://localhost:5173

🏗️ Architecture
text
┌─────────────┐    ┌──────────┐    ┌─────────────┐    ┌─────────────┐
│   Process   │───▶│  strace  │───▶│ LSTM Model  │───▶│   React     │
│   (PID)     │    │   /eBPF  │    │  Scorer     │    │  Dashboard  │
└─────────────┘    └──────────┘    └─────────────┘    └─────────────┘
                       │                 │                  │
                       └─────────────────┴──────────────────┘
                              WebSocket (Socket.IO)
                                    Updates
Data Flow
Capture: System calls are captured using strace (eBPF ready)

Queue: Syscalls are normalized and stored in a thread-safe queue

Process: LSTM model analyzes sequences every 2 seconds

Score: Anomaly scores are calculated using sparse categorical crossentropy

Stream: Results broadcast to all connected clients via Socket.IO

Display: React dashboard updates in real-time

📡 API Reference
WebSocket Events
Event	Direction	Description
update	Server → Client	Real-time anomaly scores and syscall data
connect	Server → Client	Client connected
disconnect	Server → Client	Client disconnected
REST Endpoints
Endpoint	Method	Response
/	GET	HTML dashboard
/status	GET	{queue_size, scores_count, last_score, pid}
Update Event Payload
json
{
  "syscalls": [257, 79, 87, 1, ...],
  "syscall_names": ["openat", "getcwd", "unlink", "write", ...],
  "loss": 6.187911,
  "history": [6.18, 6.19, 6.17, ...],
  "queue_size": 13570,
  "status": "Monitoring"
}
📁 Project Structure
text
cloud-kernel-anomaly-detection/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── .gitignore                  # Git ignore rules
├── LICENSE                     # MIT License
├── models/                     # Pre-trained models
│   ├── lstm/
│   │   └── DT-abnormal-lstm/
│   │       └── model_0_00.ckpt/  # Dong Ting LSTM model
│   ├── cnn/                    # CNN models (optional)
│   └── wavenet/                # WaveNet models (optional)
├── data/                       # Syscall mappings
│   └── syscall_64.tbl          # Syscall number to name mapping
└── dashboard/                  # React frontend
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx             # Main React component
        ├── App.css             # Styles
        └── main.jsx            # Entry point
⚙️ Configuration
Edit app.py to modify:

Variable	Default	Description
MODEL_PATH	models/lstm/DT-abnormal-lstm/model_0_00.ckpt	Path to LSTM model
WINDOW_SIZE	200	Number of syscalls to analyze
UPDATE_INTERVAL	2	Seconds between analyses
MAX_LEN	200	Model input sequence length
📊 Dashboard Components
Component	Description
Status Bar	Connection status, PID, queue size, last update
Metrics Cards	Current, average, and max anomaly scores
Syscall Viewer	Last 20 system calls with unique count
Anomaly Score	Color-coded display (green/yellow/red)
History Chart	Trend visualization of anomaly scores
Color Coding
🟢 Normal (loss ≤ 0.5): Expected behavior

🟡 Suspicious (0.5 < loss ≤ 1.0): Potential anomaly

🔴 Anomaly (loss > 1.0): Abnormal behavior detected

🧪 Testing
Manual Testing
Monitor a simple process: sleep 1000

Generate normal behavior: ls, cat in another terminal

Observe baseline anomaly scores

Generate anomalies: Run intensive I/O operations

Watch the scores increase

🔧 Troubleshooting
Common Issues
"No syscalls being captured"

Check ptrace scope: cat /proc/sys/kernel/yama/ptrace_scope (should be 0)

Run with sudo if needed

Dashboard shows "Disconnected"

Verify Flask backend is running on port 5000

Check browser console for WebSocket errors

Ensure proxy in vite.config.js is correct

Model loading errors

Verify model path in app.py

Check TensorFlow version compatibility

🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

Development Guidelines
Follow PEP 8 for Python code

Use ESLint and Prettier for JavaScript/React

Add comments for complex logic

Update documentation as needed

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Dong Ting Research - Original LSTM model architecture and dataset

strace - System call tracing utility

Flask-SocketIO - Real-time WebSocket server

React & Chart.js - Beautiful dashboard components

TensorFlow - Deep learning framework

eBPF Community - For future kernel tracing capabilities

📧 Contact
Kaustubh Patil - @kaustubhpatil111

Project Link: https://github.com/kaustubhpatil111/cloud-kernel-anomaly-detection

<div align="center"> <sub>Built with ❤️ for cloud kernel security research</sub> <br> <sub>© 2024 Kaustubh Patil</sub> </div> ```