import styles from './Steps.module.css';

export default function Step1Welcome({ onNext }) {
  return (
    <div className={styles.step}>
      <div className={styles.hero}>
        <div className={styles.logoMark}>
          <span className={styles.logoText}>CH</span>
        </div>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to<br /><span className={styles.highlight}>Creator Hub</span></h1>
        <p className={styles.body}>
          Your all-in-one platform to manage your creator brand, connect with brands, and grow your influence.
        </p>

        <div className={styles.features}>
          {[
            { emoji: '📊', text: 'Track analytics across all platforms' },
            { emoji: '🤝', text: 'Discover & close brand deals' },
            { emoji: '📄', text: 'Generate your media kit instantly' },
            { emoji: '🔍', text: 'Get discovered by top brands' },
          ].map(({ emoji, text }) => (
            <div key={text} className={styles.featureRow}>
              <span className={styles.featureEmoji}>{emoji}</span>
              <span className={styles.featureText}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <button className={`btn btn-primary btn-full ${styles.cta}`} onClick={onNext}>
          Get Started
        </button>
      </div>
    </div>
  );
}
