import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// ────────────────────────────────────────────────────────────────────
// 1. ICON: Choice Router / Multi-Branching Flow (Customer Email Router)
// Smooth continuous curved paths with rounded arrowheads (Zero jagged edges)
// ────────────────────────────────────────────────────────────────────
export function IconChoiceRouter({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="4.5" cy="12" r="2.2" />
      <path d="M6.8 12h4c2.2 0 3.7-1.5 3.7-4.5V6" />
      <path d="M6.8 12h11" />
      <path d="M6.8 12h4c2.2 0 3.7 1.5 3.7 4.5V18" />
      <path d="M12.5 7.5L14.5 5.5l2 2" />
      <path d="M16 10l2 2-2 2" />
      <path d="M12.5 16.5l2 2 2-2" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 2. ICON: Urgency Score (Incident Urgency Scorer)
// 4 smooth vertical rounded bars of rising heights with trend arrow
// ────────────────────────────────────────────────────────────────────
export function IconUrgencyScore({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" y1="20" x2="20" y2="20" />
      <line x1="7" y1="16" x2="7" y2="20" strokeWidth="2.4" />
      <line x1="11" y1="12" x2="11" y2="20" strokeWidth="2.4" />
      <line x1="15" y1="8" x2="15" y2="20" strokeWidth="2.4" />
      <line x1="19" y1="4" x2="19" y2="20" strokeWidth="2.4" />
      <path d="M14 4h5v5" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 3. ICON: Policy Verifier (SPF & Security Verifier / Noul)
// Smooth curved shield with rounded checkmark
// ────────────────────────────────────────────────────────────────────
export function IconPolicyVerifier({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5.5L12 2 4 5.5V12c0 6 8 10 8 10z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 4. ICON: Lead Qualifier (Sales Opportunity Qualifier)
// Smooth concentric target reticle with rounded crosshairs
// ────────────────────────────────────────────────────────────────────
export function IconLeadQualifier({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 5. ICON: Sentiment Waveform (Review Sentiment Gauge)
// Smooth acoustic waveform with 5 rounded vertical capsules
// ────────────────────────────────────────────────────────────────────
export function IconSentimentGauge({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" y1="10" x2="4" y2="14" />
      <line x1="8" y1="7" x2="8" y2="17" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="16" y1="7" x2="16" y2="17" />
      <line x1="20" y1="10" x2="20" y2="14" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 6. ICON: Vault Compliance (GDPR & Compliance)
// Smooth rounded padlock with keyhole
// ────────────────────────────────────────────────────────────────────
export function IconVaultCompliance({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5" y="11" width="14" height="10" rx="3.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="15.5" r="1.2" fill={color} />
      <line x1="12" y1="16.5" x2="12" y2="18.5" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 7. ICON: Send Decision (Kinetic Action Projectile)
// Clean rounded paper plane arrow
// ────────────────────────────────────────────────────────────────────
export function IconSendDecision({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 8. ICON: Studio Terminal / Chat (Matching Reference Image 2)
// Smooth rounded speech bubble
// ────────────────────────────────────────────────────────────────────
export function IconStudioTerminal({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 9. ICON: Templates Matrix (4-Quadrant Smooth Rounded Grid)
// ────────────────────────────────────────────────────────────────────
export function IconTemplatesMatrix({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="2.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2.5" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 10. ICON: Saved Rules Pin (Clean Bookmark Ribbon)
// ────────────────────────────────────────────────────────────────────
export function IconSavedRulesPin({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 11. ICON: Scanner Reticle (Prompt Input Lens)
// Smooth rounded 4-corner brackets with focal circle
// ────────────────────────────────────────────────────────────────────
export function IconScannerReticle({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 12. ICON: Chevron Right (Next Step Indicator)
// ────────────────────────────────────────────────────────────────────
export function IconCyberChevronRight({ size = 16, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 13. ICON: Chevron Left (Back Step Indicator)
// ────────────────────────────────────────────────────────────────────
export function IconCyberChevronLeft({ size = 16, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 14. ICON: Sidebar Toggle (Split-Pane Container)
// ────────────────────────────────────────────────────────────────────
export function IconSidebarToggle({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <line x1="9" y1="4" x2="9" y2="20" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 15. ICON: Search Terminal (Smooth Magnifying Glass)
// ────────────────────────────────────────────────────────────────────
export function IconSearchTerminal({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// 16. ICON: Close / Clear (Smooth Rounded X)
// ────────────────────────────────────────────────────────────────────
export function IconClose({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
