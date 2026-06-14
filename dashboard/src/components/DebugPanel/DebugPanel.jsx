import styles from './DebugPanel.module.css';

export default function DebugPanel({
  connected, status, queueSize, totalCaptured,
  currentLoss, anomalyThreshold, lossHistoryLength,
  alertHistoryLength, uniqueSyscalls, displaySyscalls,
  onClose
}) {
  const debugData = {
    connection: { connected, status },
    queue: { size: queueSize, total: totalCaptured },
    model: {
      currentLoss: currentLoss.toFixed(6),
      threshold: anomalyThreshold,
      historyLength: lossHistoryLength,
      alerts: alertHistoryLength
    },
    syscalls: {
      unique: uniqueSyscalls,
      lastFive: displaySyscalls.slice(0, 5)
    },
    timestamp: new Date().toISOString()
  };

  return (
    <div className={`${styles.panel} glass`}>
      <div className={styles.header}>
        <h2>🔧 Debug Information</h2>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
      <pre className={styles.content}>
        {JSON.stringify(debugData, null, 2)}
      </pre>
    </div>
  );
}