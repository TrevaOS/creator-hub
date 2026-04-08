import styles from './Avatar.module.css';

export default function Avatar({ src, name, size = 64, className = '' }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div
      className={`${styles.avatar} ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'avatar'}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span className={styles.initials} style={{ fontSize: size * 0.36 }}>
          {initials}
        </span>
      )}
    </div>
  );
}
