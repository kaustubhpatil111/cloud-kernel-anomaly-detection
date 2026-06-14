import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function calculateStd(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

export default function useSocket() {
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
  const [alertHistory, setAlertHistory] = useState([]);
  const [stats, setStats] = useState({
    mean: 0,
    std: 0,
    min: 0,
    max: 0
  });

  // Anomaly threshold – stored in ref to avoid re‑subscribing socket on change
  const thresholdRef = useRef(6.5);
  const [anomalyThreshold, setAnomalyThresholdState] = useState(6.5);
  const setAnomalyThreshold = (val) => {
    thresholdRef.current = val;
    setAnomalyThresholdState(val);
  };

  const resetData = useCallback(() => {
    setLossHistory([]);
    setTimestamps([]);
    setAlertHistory([]);
  }, []);

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
        const currentLossValue = data.loss;
        setCurrentLoss(currentLossValue);
        setLossHistory(prev => [...prev.slice(-99), currentLossValue]);
        setTimestamps(prev => [...prev.slice(-99), now]);

        // Check for anomaly
        if (currentLossValue > thresholdRef.current) {
          setAlertHistory(prev => [
            { time: now, value: currentLossValue },
            ...prev.slice(0, 4)
          ]);

          if (Notification.permission === 'granted') {
            new Notification('🚨 Anomaly Detected', {
              body: `Loss: ${currentLossValue.toFixed(6)} (Threshold: ${thresholdRef.current})`,
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

    // Periodic status check (fallback)
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
  }, []); // empty dependency – threshold changes only update the ref

  return {
    connected,
    status,
    syscalls,
    syscallNames,
    currentLoss,
    lossHistory,
    timestamps,
    queueSize,
    totalCaptured,
    lastUpdate,
    alertHistory,
    stats,
    anomalyThreshold,
    setAnomalyThreshold,
    resetData,
  };
}