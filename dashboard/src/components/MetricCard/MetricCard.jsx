import styles from './MetricCard.module.css';

export default function MetricCard({ icon, label, value, unit, sub, status }) {
  return (
    <div className={`${styles.card} glass`}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.info}>
        <div className={styles.label}>{label}</div>
        <div className={styles.valueRow}>
          <span className={`${styles.value} ${status ? styles[status] : ''}`}>
            {value}
          </span>
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
        {sub && <div className={styles.sub}>{sub}</div>}
      </div>
    </div>
  );
}