import styles from './AlertItem.module.css';

export default function AlertItem({ alert, index }) {
  return (
    <div className={styles.item} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <div className={styles.title}>Anomaly Detected</div>
        <div className={styles.value}>Loss: {alert.value.toFixed(6)}</div>
        <div className={styles.time}>{alert.time.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}