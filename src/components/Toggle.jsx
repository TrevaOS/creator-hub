import styles from './Toggle.module.css';

export default function Toggle({ checked, onChange, label, id, disabled = false }) {
  const trackClass = `${styles.track} ${checked ? styles.trackChecked : ''}`;

  return (
    <label className={`${styles.toggle} ${disabled ? styles.disabled : ''}`} htmlFor={id}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={trackClass}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
          className={styles.input}
        />
        <span className={`${styles.thumb} ${checked ? styles.checked : ''}`} />
      </div>
    </label>
  );
}
