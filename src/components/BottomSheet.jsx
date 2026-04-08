import { useEffect, useRef } from 'react';
import styles from './BottomSheet.module.css';

export default function BottomSheet({ open, onClose, title, children, maxHeight = '90vh' }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={sheetRef}
        className={styles.sheet}
        style={{ maxHeight }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.handle} />
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
          </div>
        )}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
