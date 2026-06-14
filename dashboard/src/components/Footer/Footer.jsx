import styles from './Footer.module.css';

export default function Footer({ lastUpdate }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <span>Dong Ting LSTM Model • v1.0.0</span>
        <span className={styles.separator}>•</span>
        <span>Update Interval: 2s</span>
        <span className={styles.separator}>•</span>
        <span>Last Sync: {lastUpdate || 'Never'}</span>
      </div>
    </footer>
  );
}