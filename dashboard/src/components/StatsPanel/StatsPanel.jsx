import styles from './StatsPanel.module.css';

export default function StatsPanel({ stats }) {
  return (
    <div className={styles.panel}>
      <h3>📊 Statistics</h3>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.label}>Mean</div>
          <div className={styles.number}>{stats.mean}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Std Dev</div>
          <div className={styles.number}>{stats.std}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Min</div>
          <div className={styles.number}>{stats.min}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Max</div>
          <div className={styles.number}>{stats.max}</div>
        </div>
      </div>
    </div>
  );
}