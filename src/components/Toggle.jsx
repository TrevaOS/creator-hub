import styles from './Toggle.module.css';

export default function Toggle({ checked, onChange, label, id }) {
  return (
    <label className={styles.toggle} htmlFor={id}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.track}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className={styles.input}
        />
        <span className={`${styles.thumb} ${checked ? styles.checked : ''}`} />
      </div>
    </label>
  );
}
