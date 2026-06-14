import MetricCard from '../MetricCard/MetricCard';
import styles from './Header.module.css';

export default function Header({
  connected,
  currentLoss,
  anomalyThreshold,
  queueSize,
  totalCaptured,
  anomalyPercentage,
  stats,
  lossHistory,
  onReset,
  onToggleDebug,
  showDebug,
  themeToggle
}) {
  return (
    <header className={`${styles.header} glass`}>
      <div className={styles.top}>
        <h1 className={styles.title}>
          <span className={styles.icon}>🔍</span>
          LSTM Anomaly Detector
          <span className={`${styles.badge} ${connected ? styles.online : styles.offline}`}>
            {connected ? '● LIVE' : '○ OFFLINE'}
          </span>
        </h1>
        <div className={styles.actions}>
          {themeToggle}
          <button className={styles.btn} onClick={onToggleDebug}>
            {showDebug ? '📊 Hide' : '🔧 Debug'}
          </button>
          <button className={styles.btn} onClick={onReset}>
            🧹 Reset
          </button>
        </div>
      </div>

      <div className={styles.metrics}>
        <MetricCard icon="📈" label="Current Loss" value={currentLoss.toFixed(6)}
          status={currentLoss > anomalyThreshold ? 'anomaly' : 'normal'}
          sub={`vs baseline ${stats.mean}`} />
        <MetricCard icon="⚠️" label="Status"
          value={<span className={`${styles.chip} ${currentLoss > anomalyThreshold ? styles.danger : styles.safe}`}>
            {currentLoss > anomalyThreshold ? 'ANOMALY' : 'NORMAL'}
          </span>}
          sub={`Threshold: ${anomalyThreshold}`} />
        <MetricCard icon="📊" label="Queue" value={queueSize}
          unit="syscalls" sub={`Captured: ${totalCaptured}`} />
        <MetricCard icon="🎯" label="Detection" value={`${anomalyPercentage}%`}
          sub={`${lossHistory?.length || 0} samples`} />
      </div>
    </header>
  );
}