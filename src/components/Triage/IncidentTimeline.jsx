import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Check } from 'lucide-react';

const TIMELINE_STEPS = [
  { key: 'received', label: 'Received' },
  { key: 'matched', label: 'Matched' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

/**
 * IncidentTimeline — Visualizes the complaint lifecycle:
 * Received → Matched → Assigned → In Progress → Resolved.
 * 
 * Animates each state transition using GSAP when `currentStep` changes.
 * 
 * @param {string} currentStep - The current lifecycle step key.
 */
export default function IncidentTimeline({ currentStep = 'received' }) {
  const containerRef = useRef(null);
  const dotsRef = useRef([]);
  const connectorsRef = useRef([]);
  const prevStepRef = useRef(-1);

  const stepKey = (currentStep || '').toLowerCase();
  const normalizedKey = (stepKey === 'pending' || stepKey === 'open') ? 'received' :
                        (stepKey === 'in_progress') ? 'in-progress' : stepKey;

  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.key === normalizedKey);

  useEffect(() => {
    if (currentIndex < 0) return;

    const prevIndex = prevStepRef.current;
    prevStepRef.current = currentIndex;

    // Animate from prevIndex to currentIndex
    const start = Math.max(prevIndex, 0);
    for (let i = start; i <= currentIndex; i++) {
      const dot = dotsRef.current[i];
      const connector = connectorsRef.current[i - 1]; // connector before this dot

      if (dot) {
        const delay = (i - start) * 0.2;

        if (i < currentIndex) {
          // Completed step
          gsap.to(dot, {
            backgroundColor: 'var(--accent-primary)',
            borderColor: 'var(--accent-primary)',
            scale: 1,
            boxShadow: 'none',
            duration: 0.3,
            delay,
            ease: 'power2.out',
          });
        } else if (i === currentIndex) {
          // Active step — pulse
          gsap.to(dot, {
            borderColor: 'var(--accent-primary)',
            boxShadow: '0 0 0 4px var(--accent-light)',
            scale: 1.1,
            duration: 0.4,
            delay,
            ease: 'back.out(1.7)',
          });
        }
      }

      if (connector && i <= currentIndex) {
        const fill = connector.querySelector('.timeline-connector-fill');
        if (fill) {
          gsap.to(fill, {
            width: '100%',
            duration: 0.35,
            delay: (i - start) * 0.2,
            ease: 'power2.inOut',
          });
        }
      }
    }
  }, [currentIndex]);

  return (
    <div className="incident-timeline" ref={containerRef}>
      {TIMELINE_STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step.key} style={{ display: 'contents' }}>
            {i > 0 && (
              <div
                className={`timeline-connector ${isCompleted ? 'completed' : ''}`}
                ref={(el) => (connectorsRef.current[i - 1] = el)}
              >
                <div className="timeline-connector-fill" />
              </div>
            )}
            <div className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
              <div
                className="timeline-step-dot"
                ref={(el) => (dotsRef.current[i] = el)}
              >
                {isCompleted && <Check size={14} strokeWidth={3} color="white" />}
              </div>
              <span className="timeline-step-label">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
