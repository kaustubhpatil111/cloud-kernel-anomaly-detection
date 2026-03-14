# ☁️ Cloud Kernel Anomaly Detection using Dong Ting LSTM

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg?style=flat-square&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=flat-square&logo=react&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.0+-FF6F00.svg?style=flat-square&logo=tensorflow&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

**Real-time system call anomaly detection for cloud kernels using Dong Ting's LSTM model**

[✨ Features](#features) • [🚀 Quick Start](#quick-start) • [🏗️ Architecture](#architecture) • [📊 Dashboard](#dashboard) • [📝 License](#license)

</div>

---

## 🎯 Overview

This project provides real-time anomaly detection for Linux system calls using deep learning. It attaches to any running process via `strace`, streams system calls, and computes anomaly scores using Dong Ting's LSTM architecture. A modern React dashboard visualizes the results with WebSocket updates.

```python
# Simple as this
monitor = AnomalyDetector(pid=1234)
monitor.start()  # That's it!
```

---

## ✨ Features

<table>
<tr>
<td width="33%">
<h3 align="center">🔍 Real-time Monitoring</h3>
<p align="center">Attach to any running process by PID and monitor system calls in real-time</p>
</td>
<td width="33%">
<h3 align="center">🧠 LSTM Detection</h3>
<p align="center">Dong Ting LSTM model for intelligent sequence anomaly scoring</p>
</td>
<td width="33%">
<h3 align="center">📊 Live Dashboard</h3>
<p align="center">Beautiful React dashboard with real-time WebSocket updates</p>
</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

```bash
# What you need
Python 3.8+
Node.js 18+
Linux environment (for strace)
```

### Installation in 3 Steps

**1. Clone & setup backend**
```bash
git clone https://github.com/kaustubhpatil111/cloud-kernel-anomaly-detection.git
cd cloud-kernel-anomaly-detection

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**2. Setup frontend**
```bash
cd dashboard
npm install
cd ..
```

**3. Enable tracing**
```bash
echo 0 | sudo tee /proc/sys/kernel/yama/ptrace_scope
```

### Run the Application

| Terminal | Command | Description |
|----------|---------|-------------|
| **Terminal 1** | `python app.py <PID>` | Start Flask backend |
| **Terminal 2** | `cd dashboard && npm run dev` | Start React dashboard |

Open **http://localhost:5173** in your browser 🎉

---

## 🏗️ Architecture

```
┌─────────┐    ┌────────┐    ┌─────────┐    ┌─────────┐
│ Process │───▶│ strace │───▶│  LSTM   │───▶│ React   │
│  (PID)  │    │        │    │  Model  │    │Dashboard│
└─────────┘    └────────┘    └─────────┘    └─────────┘
                    │              │              │
                    └──────────────┴──────────────┘
                         WebSocket (Socket.IO)
                              Real-time
```

### How It Works

1. **Capture** → System calls captured using strace
2. **Queue** → Syscalls normalized in thread-safe queue
3. **Process** → LSTM analyzes sequences every 2 seconds
4. **Score** → Anomaly scores calculated
5. **Stream** → Results broadcast via WebSocket
6. **Display** → React dashboard updates instantly

---

## 📊 Dashboard

<div align="center">

| Component | What it does |
|-----------|--------------|
| **Status Bar** | Shows connection, PID, queue size |
| **Metrics Cards** | Current, average, max anomaly scores |
| **Syscall Viewer** | Last 20 system calls with counts |
| **History Chart** | Trend visualization of scores |

### Color Coding

🟢 **Normal** (loss ≤ 0.5)  
🟡 **Suspicious** (0.5 < loss ≤ 1.0)  
🔴 **Anomaly** (loss > 1.0)

</div>

---

## 📡 API Reference

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `update` | Server → Client | Real-time anomaly scores & syscall data |
| `connect` | Server → Client | Client connected |
| `disconnect` | Server → Client | Client disconnected |

### REST Endpoints

| Endpoint | Method | Response |
|----------|--------|----------|
| `/` | GET | HTML dashboard |
| `/status` | GET | `{queue_size, scores_count, last_score, pid}` |

### Update Event Example

```json
{
  "syscalls": [257, 79, 87, 1, 3],
  "syscall_names": ["openat", "getcwd", "unlink", "write", "close"],
  "loss": 6.187911,
  "history": [6.18, 6.19, 6.17, 6.22, 6.15],
  "queue_size": 13570,
  "status": "Monitoring"
}
```

---

## 📁 Project Structure

```
cloud-kernel-anomaly-detection/
├── app.py                      # Main Flask app
├── requirements.txt            # Python dependencies
├── README.md                   
├── models/                     # Pre-trained models
│   └── lstm/
│       └── DT-abnormal-lstm/
│           └── model_0_00.ckpt # Dong Ting LSTM
├── data/                       # Syscall mappings
│   └── syscall_64.tbl          # Number → name mapping
└── dashboard/                  # React frontend
    ├── src/
    │   ├── App.jsx             # Main component
    │   ├── App.css             # Styles
    │   └── main.jsx            # Entry point
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Configuration

Edit `app.py` to modify:

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | `models/lstm/DT-abnormal-lstm/model_0_00.ckpt` | Path to LSTM model |
| `WINDOW_SIZE` | `200` | Number of syscalls to analyze |
| `UPDATE_INTERVAL` | `2` | Seconds between analyses |
| `MAX_LEN` | `200` | Model input sequence length |

---

## 🔧 Troubleshooting

### Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| **No syscalls captured** | Check ptrace scope: `cat /proc/sys/kernel/yama/ptrace_scope` (should be 0) |
| **Dashboard shows "Disconnected"** | Verify Flask runs on port 5000, check browser console |
| **Model loading errors** | Verify model path in `app.py`, check TensorFlow version |

---

## 🧪 Quick Test

```bash
# 1. Start a simple process
sleep 1000 &

# 2. Note its PID (e.g., 1234)
# 3. Run the detector
python app.py 1234

# 4. In another terminal, generate some activity
ls
cat /etc/passwd
find / -name "*.conf" 2>/dev/null

# 5. Watch the dashboard at http://localhost:5173
```

---

## 🤝 Contributing

Contributions are welcome! Keep it simple:

1. Fork it
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add something amazing'`)
4. Push (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT © [Kaustubh Patil](https://github.com/kaustubhpatil111)

---

<div align="center">
  
**Made with ❤️ for cloud kernel security**

[⬆ Back to top](#-cloud-kernel-anomaly-detection-using-dong-ting-lstm)

</div>