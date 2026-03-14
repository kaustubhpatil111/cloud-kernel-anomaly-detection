import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js';
import io from 'socket.io-client';
import 'chartjs-adapter-date-fns';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

const socket = io('http://localhost:5000');

function App() {
  const [syscalls, setSyscalls] = useState([]);
  const [syscallNames, setSyscallNames] = useState([]);
  const [currentLoss, setCurrentLoss] = useState(0);
  const [lossHistory, setLossHistory] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [queueSize, setQueueSize] = useState(0);
  const [status, setStatus] = useState('Connecting...');
  const [connected, setConnected] = useState(false);
  const [totalCaptured, setTotalCaptured] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');
  const [anomalyThreshold, setAnomalyThreshold] = useState(6.5);
  const [showDebug, setShowDebug] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  const [stats, setStats] = useState({
    mean: 0,
    std: 0,
    min: 0,
    max: 0
  });

  const chartRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to Flask backend');
      setConnected(true);
      setStatus('Connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Flask backend');
      setConnected(false);
      setStatus('Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setStatus('Connection Error');
    });

    socket.on('update', (data) => {
      const now = new Date();

      if (data.syscalls) setSyscalls(data.syscalls);
      if (data.syscall_names) setSyscallNames(data.syscall_names);

      if (data.loss !== undefined) {
        setCurrentLoss(data.loss);
        setLossHistory(prev => [...prev.slice(-99), data.loss]);
        setTimestamps(prev => [...prev.slice(-99), now]);

        // Check for anomaly
        if (data.loss > anomalyThreshold) {
          setAlertHistory(prev => [
            { time: now, value: data.loss },
            ...prev.slice(0, 4)
          ]);

          // Trigger browser notification
          if (Notification.permission === 'granted') {
            new Notification('🚨 Anomaly Detected', {
              body: `Loss: ${data.loss.toFixed(6)} (Threshold: ${anomalyThreshold})`,
              icon: '/alert-icon.png'
            });
          }
        }
      }

      if (data.history) {
        const newStats = {
          mean: (data.history.reduce((a, b) => a + b, 0) / data.history.length).toFixed(4),
          std: calculateStd(data.history).toFixed(4),
          min: Math.min(...data.history).toFixed(4),
          max: Math.max(...data.history).toFixed(4)
        };
        setStats(newStats);
      }

      if (data.queue_size !== undefined) setQueueSize(data.queue_size);
      if (data.status) setStatus(data.status);

      setTotalCaptured(prev => prev + 10);
      setLastUpdate(now.toLocaleTimeString());
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      fetch('http://localhost:5000/status')
        .then(res => res.json())
        .then(data => setQueueSize(data.queue_size))
        .catch(err => console.error('Status fetch error:', err));
    }, 2000);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('update');
      clearInterval(interval);
    };
  }, [anomalyThreshold]);


  const calculateStd = (arr) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const getLossColor = (loss) => {
    if (loss > anomalyThreshold) return '#ef4444';
    if (loss > anomalyThreshold * 0.8) return '#f97316';
    return '#10b981';
  };

  const chartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Anomaly Score',
        data: lossHistory,
        borderColor: getLossColor(currentLoss),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, `${getLossColor(currentLoss)}80`);
          gradient.addColorStop(1, `${getLossColor(currentLoss)}10`);
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: (ctx) => {
          const value = ctx.raw;
          return value > anomalyThreshold ? 6 : 3;
        },
        pointBackgroundColor: (ctx) => {
          const value = ctx.raw;
          return value > anomalyThreshold ? '#ef4444' : '#3b82f6';
        },
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
      {
        label: 'Threshold',
        data: Array(lossHistory.length).fill(anomalyThreshold),
        borderColor: '#f97319',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#334155' },
        title: {
          display: true,
          text: 'Anomaly Score',
          color: '#94a3b8',
          font: { weight: 'bold' }
        },
        ticks: { color: '#94a3b8' }
      },
      x: {
        type: 'time',
        time: {
          unit: 'second',
          displayFormats: { second: 'HH:mm:ss' }
        },
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#3b82f6',
        borderWidth: 2,
        callbacks: {
          label: (ctx) => {
            const label = ctx.dataset.label || '';
            const value = ctx.parsed.y.toFixed(6);
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  const displaySyscalls = syscallNames.length > 0 ? syscallNames :
    syscalls.map(num => `sys_${num}`);

  const uniqueSyscalls = new Set(syscalls).size;
  const anomalyPercentage = lossHistory.length > 0
    ? ((lossHistory.filter(l => l > anomalyThreshold).length / lossHistory.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="app">
      {/* Animated Background */}
      <div className="galaxy-bg">

        <div className="gradient-1"></div>
        <div className="gradient-2"></div>
        <div className="gradient-3"></div>
      </div>

      <div className="content">
        {/* Header with Glassmorphism */}
        <header className="header glass">
          <div className="header-top">
            <h1 className="title">
              <span className="title-icon">🔍</span>
              LSTM Anomaly Detector
              <span className={`status-badge ${connected ? 'online' : 'offline'}`}>
                {connected ? '● LIVE' : '○ OFFLINE'}
              </span>
            </h1>
            <div className="header-actions">
              <button
                className="action-btn"
                onClick={() => setShowDebug(!showDebug)}
              >
                {showDebug ? '📊 Hide Debug' : '🔧 Show Debug'}
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  setLossHistory([]);
                  setTimestamps([]);
                  setAlertHistory([]);
                }}
              >
                🧹 Reset
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="metric-cards">
            <div className="metric-card glass">
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <div className="metric-label">Current Loss</div>
                <div className="metric-value-wrapper">
                  <span className={`metric-value ${currentLoss > anomalyThreshold ? 'anomaly' : 'normal'}`}>
                    {currentLoss.toFixed(6)}
                  </span>
                  <span className="metric-trend">
                    {currentLoss > stats.mean ? '↑' : '↓'}
                  </span>
                </div>
                <div className="metric-sub">vs baseline {stats.mean}</div>
              </div>
            </div>

            <div className="metric-card glass">
              <div className="metric-icon">⚠️</div>
              <div className="metric-content">
                <div className="metric-label">Anomaly Status</div>
                <div className={`status-chip ${currentLoss > anomalyThreshold ? 'anomaly' : 'normal'}`}>
                  {currentLoss > anomalyThreshold ? 'ANOMALY DETECTED' : 'NORMAL'}
                </div>
                <div className="metric-sub">Threshold: {anomalyThreshold}</div>
              </div>
            </div>

            <div className="metric-card glass">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <div className="metric-label">Queue Stats</div>
                <div className="metric-value-wrapper">
                  <span className="metric-value">{queueSize}</span>
                  <span className="metric-unit">syscalls</span>
                </div>
                <div className="metric-sub">Total captured: {totalCaptured}</div>
              </div>
            </div>

            <div className="metric-card glass">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <div className="metric-label">Detection Rate</div>
                <div className="metric-value-wrapper">
                  <span className="metric-value">{anomalyPercentage}%</span>
                </div>
                <div className="metric-sub">{lossHistory.length} samples</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main">
          {/* Chart Section */}
          <div className="chart-section glass">
            <div className="section-header">
              <h2>📈 Real-time Anomaly Score</h2>
              <div className="chart-controls">
                <label className="threshold-slider">
                  <span>Threshold: {anomalyThreshold}</span>
                  <input
                    type="range"
                    min="5"
                    max="8"
                    step="0.1"
                    value={anomalyThreshold}
                    onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
                  />
                </label>
              </div>
            </div>
            <div className="chart-container">
              {lossHistory.length > 0 ? (
                <Line ref={chartRef} data={chartData} options={chartOptions} />
              ) : (
                <div className="empty-chart">
                  <div className="spinner"></div>
                  <p>Waiting for data stream...</p>
                </div>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="two-column">
            {/* System Calls */}
            <div className="syscalls-section glass">
              <div className="section-header">
                <h2>📋 Recent System Calls</h2>
                <span className="badge">Last 20</span>
              </div>

              <div className="syscalls-container">
                {displaySyscalls.map((name, index) => {
                  const frequency = syscalls.filter(s => s === syscalls[index]).length;
                  return (
                    <div
                      key={index}
                      className="syscall-chip"
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        opacity: 0.9 - (index * 0.02)
                      }}
                      title={`Syscall #${syscalls[index]} | Frequency: ${frequency}`}
                    >
                      <span className="syscall-name">{name}</span>
                      <span className="syscall-num">{syscalls[index]}</span>
                    </div>
                  );
                })}
                {displaySyscalls.length === 0 && (
                  <div className="empty-state">
                    <div className="pulse-circle"></div>
                    <p>Capturing system calls...</p>
                  </div>
                )}
              </div>

              {displaySyscalls.length > 0 && (
                <div className="syscall-stats">
                  <div className="stat-item">
                    <span className="stat-label">Unique</span>
                    <span className="stat-value">{uniqueSyscalls}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">{syscalls.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Diversity</span>
                    <span className="stat-value">
                      {((uniqueSyscalls / syscalls.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Alerts & Stats */}
            <div className="alerts-section glass">
              <div className="section-header">
                <h2>🚨 Recent Alerts</h2>
                <span className="badge">{alertHistory.length} active</span>
              </div>

              <div className="alerts-container">
                {alertHistory.length > 0 ? (
                  alertHistory.map((alert, i) => (
                    <div key={i} className="alert-item" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="alert-icon">⚠️</div>
                      <div className="alert-content">
                        <div className="alert-title">Anomaly Detected</div>
                        <div className="alert-value">Loss: {alert.value.toFixed(6)}</div>
                        <div className="alert-time">{alert.time.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-alerts">
                    <div className="checkmark">✓</div>
                    <p>No anomalies detected</p>
                    <small>System is operating normally</small>
                  </div>
                )}
              </div>

              {/* Statistics Panel */}
              <div className="stats-panel">
                <h3>📊 Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Mean</div>
                    <div className="stat-number">{stats.mean}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Std Dev</div>
                    <div className="stat-number">{stats.std}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Min</div>
                    <div className="stat-number">{stats.min}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Max</div>
                    <div className="stat-number">{stats.max}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Panel (Collapsible) */}
          {showDebug && (
            <div className="debug-panel glass">
              <div className="section-header">
                <h2>🔧 Debug Information</h2>
                <button className="close-btn" onClick={() => setShowDebug(false)}>✕</button>
              </div>
              <pre className="debug-content">
                {JSON.stringify({
                  connection: { connected, status },
                  queue: { size: queueSize, total: totalCaptured },
                  model: {
                    currentLoss: currentLoss.toFixed(6),
                    threshold: anomalyThreshold,
                    historyLength: lossHistory.length,
                    alerts: alertHistory.length
                  },
                  syscalls: {
                    unique: uniqueSyscalls,
                    lastFive: displaySyscalls.slice(0, 5)
                  },
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <span>Dong Ting LSTM Model • v1.0.0</span>
            <span className="separator">•</span>
            <span>Update Interval: 2s</span>
            <span className="separator">•</span>
            <span>Last Sync: {lastUpdate || 'Never'}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;