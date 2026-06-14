import AlertItem from '../AlertItem/AlertItem';
import StatsPanel from '../StatsPanel/StatsPanel';
import styles from './AlertsPanel.module.css';

export default function AlertsPanel({ alertHistory, stats }) {
  return (
    <div className={`${styles.panel} glass`}>
      <div className={styles.sectionHeader}>
        <h2>🚨 Recent Alerts</h2>
        <span className={styles.badge}>{alertHistory.length} active</span>
      </div>

      <div className={styles.alertsContainer}>
        {alertHistory.length > 0 ? (
          alertHistory.map((alert, i) => (
            <AlertItem key={i} alert={alert} index={i} />
          ))
        ) : (
          <div className={styles.emptyAlerts}>
            <div className={styles.checkmark}>✓</div>
            <p>No anomalies detected</p>
            <small>System is operating normally</small>
          </div>
        )}
      </div>

      <StatsPanel stats={stats} />
    </div>
  );
}