import styles from './Card.module.css';

export default function Card({ children, className = '', onClick, elevated = false, outlined = false }) {
  const cls = [
    styles.card,
    elevated ? styles.elevated : '',
    outlined ? styles.outlined : '',
    onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <article className={cls} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {children}
    </article>
  );
}
