import SyscallChip from '../SyscallChip/SyscallChip';
import styles from './SyscallsPanel.module.css';

export default function SyscallsPanel({ displaySyscalls, syscalls, uniqueSyscalls }) {
  return (
    <div className={`${styles.panel} glass`}>
      <div className={styles.sectionHeader}>
        <h2>📋 Recent System Calls</h2>
        <span className={styles.badge}>Last 20</span>
      </div>

      <div className={styles.listContainer}>
        {displaySyscalls.map((name, index) => {
          const frequency = syscalls.filter(s => s === syscalls[index]).length;
          return (
            <SyscallChip
              key={index}
              name={name}
              number={syscalls[index]}
              index={index}
              frequency={frequency}
            />
          );
        })}
        {displaySyscalls.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.pulseCircle}></div>
            <p>Capturing system calls...</p>
          </div>
        )}
      </div>

      {displaySyscalls.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Unique</span>
            <span className={styles.statValue}>{uniqueSyscalls}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total</span>
            <span className={styles.statValue}>{syscalls.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Diversity</span>
            <span className={styles.statValue}>
              {((uniqueSyscalls / syscalls.length) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}