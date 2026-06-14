import styles from './SyscallChip.module.css';

export default function SyscallChip({ name, number, index, frequency }) {
  return (
    <div
      className={styles.chip}
      style={{ animationDelay: `${index * 0.05}s` }}
      title={`Syscall #${number} | Frequency: ${frequency}`}
    >
      <span className={styles.name}>{name}</span>
      <span className={styles.num}>{number}</span>
    </div>
  );
}