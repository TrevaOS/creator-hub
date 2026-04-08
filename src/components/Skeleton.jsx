import styles from './Skeleton.module.css';

export default function Skeleton({ width, height, borderRadius, className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`${styles.skeletonCard} ${className}`}>
      <Skeleton height={160} width="100%" />
      <div style={{ padding: '12px' }}>
        <Skeleton height={16} width="60%" style={{ marginBottom: 8 }} />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className={styles.skeletonProfile}>
      <Skeleton width={72} height={72} borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton height={20} width="50%" style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="70%" />
      </div>
    </div>
  );
}
