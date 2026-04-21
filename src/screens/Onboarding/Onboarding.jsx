import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import OnboardingStep1 from './Step1Welcome';
import OnboardingStep2 from './Step2Socials';
import OnboardingStep3 from './Step3Profile';
import styles from './Onboarding.module.css';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  const TOTAL = 3;

  const complete = () => {
    navigate('/dashboard', { replace: true });
  };

  const next = () => {
    if (step < TOTAL) setStep(s => s + 1);
    else complete();
  };

  return (
    <main className={styles.container}>
      {/* Progress dots */}
      <div className={styles.dots}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <span key={i} className={`${styles.dot} ${i + 1 <= step ? styles.dotActive : ''}`} />
        ))}
      </div>

      {/* Steps */}
      <div className={styles.stepWrap}>
        {step === 1 && <OnboardingStep1 onNext={next} />}
        {step === 2 && <OnboardingStep2 onNext={next} onBack={() => setStep(1)} />}
        {step === 3 && <OnboardingStep3 onNext={complete} onBack={() => setStep(2)} />}
      </div>
    </main>
  );
}
