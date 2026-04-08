import styles from './Chip.module.css';

export default function Chip({ label, active, onClick, icon, variant = 'default', size = 'md' }) {
  const cls = [
    styles.chip,
    styles[variant],
    styles[size],
    active ? styles.active : '',
    onClick ? styles.clickable : '',
  ].filter(Boolean).join(' ');

  return (
    <span className={cls} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {label}
    </span>
  );
}
