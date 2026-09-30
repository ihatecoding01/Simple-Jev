'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';

// ────────────────────────────────────────────────────────────────────
// Scroll-Triggered Reveal Wrapper
// Wraps children in an IntersectionObserver-driven container that
// applies entrance animations when scrolled into view.
// ────────────────────────────────────────────────────────────────────

type AnimationVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'scale-up'
  | 'glitch-in'
  | 'stagger-children';

interface ScrollRevealProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number; // ms
  duration?: number; // ms
  threshold?: number; // 0-1
  className?: string;
  once?: boolean; // only animate once
  staggerDelay?: number; // ms between children for 'stagger-children'
}

const VARIANT_STYLES: Record<AnimationVariant, { from: React.CSSProperties; to: React.CSSProperties }> = {
  'fade-up': {
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-down': {
    from: { opacity: 0, transform: 'translateY(-30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-left': {
    from: { opacity: 0, transform: 'translateX(-40px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  'fade-right': {
    from: { opacity: 0, transform: 'translateX(40px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  'scale-up': {
    from: { opacity: 0, transform: 'scale(0.92)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  'glitch-in': {
    from: { opacity: 0, transform: 'translateX(-8px) skewX(-2deg)', filter: 'blur(4px)' },
    to: { opacity: 1, transform: 'translateX(0) skewX(0deg)', filter: 'blur(0px)' },
  },
  'stagger-children': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
};

export default function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.15,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const styles = VARIANT_STYLES[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(isVisible ? styles.to : styles.from),
        transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
}

// Helper: Stagger-animate a list of items with sequential delays
export function StaggerReveal({
  children,
  staggerDelay = 120,
  baseDelay = 0,
  duration = 600,
  threshold = 0.1,
  className = '',
}: {
  children: ReactNode[];
  staggerDelay?: number;
  baseDelay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + i * staggerDelay}ms`,
            willChange: 'transform, opacity',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
