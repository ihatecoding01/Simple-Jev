import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// ────────────────────────────────────────────────────────────────────
// THE 8 CANONICAL REFERENCE ICONS WITH DUOTONE TRANSLUCENT FILL
// Outer stroke: 100% opaque (strokeWidth=2.3)
// Interior fill: ~20% opacity (matching user reference image)
// ────────────────────────────────────────────────────────────────────

// 1. Cloud Upload / Up Arrow (White, Row 1 Col 1)
export function IconCloudUpload({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Translucent cloud interior fill */}
      <path
        d="M6.5 17H5a3.5 3.5 0 0 1-.5-6.97A5 5 0 0 1 14 7.2a4.5 4.5 0 0 1 5.5 5.3A3.5 3.5 0 0 1 17.5 17H16z"
        fill={color}
        fillOpacity="0.2"
      />
      {/* Arrow */}
      <line x1="12" y1="12" x2="12" y2="20" stroke={color} />
      <polyline points="9 15 12 12 15 15" stroke={color} />
    </svg>
  );
}

// 2. Chat Bubble (Blue, Row 1 Col 2)
export function IconChatBubble({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M4 6a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6v7.5a2.5 2.5 0 0 1-2.5 2.5H7.5L4 18.5V6z"
        fill={color}
        fillOpacity="0.22"
      />
    </svg>
  );
}

// 3. Flame / Teardrop (Red-Orange, Row 1 Col 3)
export function IconFlame({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M12 2.5c-1.2 2.3-4.5 5.5-4.5 9.5a5.5 5.5 0 0 0 10.8 1.5c.3-.8.2-1.8-.3-2.5C16.5 9 14.5 6.5 13.5 5c-.5-.8-1-1.8-1.5-2.5z"
        fill={color}
        fillOpacity="0.22"
      />
    </svg>
  );
}

// 4. Folder (Amber / Orange, Row 1 Col 4)
export function IconFolder({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M3.5 7.5V6A2 2 0 0 1 5.5 4h3.2a2 2 0 0 1 1.4.6l1.6 1.8h6.8a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9.4z"
        fill={color}
        fillOpacity="0.2"
      />
    </svg>
  );
}

// 5. House / Home (Coral / Orange-Red, Row 2 Col 1)
export function IconHouse({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M12 3.5L3.5 11h2.5v8a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-8h2.5L12 3.5z"
        fill={color}
        fillOpacity="0.2"
      />
    </svg>
  );
}

// 6. User Profile (Mint Green, Row 2 Col 2)
export function IconUserProfile({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="7.5" r="3.8" fill={color} fillOpacity="0.22" />
      <path
        d="M5 20.5c0-3.5 3.1-6.5 7-6.5s7 3 7 6.5H5z"
        fill={color}
        fillOpacity="0.22"
      />
      <line x1="4.5" y1="20.5" x2="19.5" y2="20.5" />
    </svg>
  );
}

// 7. Split Card / Dual Capsule (Purple, Row 2 Col 3)
export function IconSplitCard({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="4.5" width="16" height="6.5" rx="2.5" fill={color} fillOpacity="0.22" />
      <rect x="4" y="13" width="16" height="6.5" rx="2.5" fill={color} fillOpacity="0.22" />
    </svg>
  );
}

// 8. Speedometer Arc with 45° Arrow (Cyan, Row 2 Col 4)
export function IconSpeedometerArc({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Translucent circular interior fill */}
      <circle cx="12" cy="12" r="7.5" fill={color} fillOpacity="0.18" stroke="none" />
      {/* Outer arc */}
      <path d="M12 20a8 8 0 1 1 8-8" stroke={color} />
      {/* Arrow */}
      <line x1="11" y1="13" x2="19" y2="5" stroke={color} />
      <polyline points="14 5 19 5 19 10" stroke={color} />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// SEMANTIC ALIASES
// ────────────────────────────────────────────────────────────────────

export function IconChoiceRouter(props: IconProps) {
  return <IconChatBubble {...props} />;
}

export function IconUrgencyScore(props: IconProps) {
  return <IconFlame {...props} />;
}

export function IconPolicyVerifier(props: IconProps) {
  return <IconCloudUpload {...props} />;
}

export function IconLeadQualifier(props: IconProps) {
  return <IconUserProfile {...props} />;
}

export function IconSentimentGauge(props: IconProps) {
  return <IconSpeedometerArc {...props} />;
}

export function IconVaultCompliance(props: IconProps) {
  return <IconFolder {...props} />;
}

export function IconStudioTerminal(props: IconProps) {
  return <IconChatBubble {...props} />;
}

export function IconTemplatesMatrix(props: IconProps) {
  return <IconSplitCard {...props} />;
}

export function IconSavedRulesPin(props: IconProps) {
  return <IconFolder {...props} />;
}

export function IconSendDecision({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="10 5 19 5 19 14" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// UTILITY ICONS
// ────────────────────────────────────────────────────────────────────

export function IconScannerReticle({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="2.5" fill={color} fillOpacity="0.25" />
    </svg>
  );
}

export function IconCyberChevronRight({ size = 16, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function IconCyberChevronLeft({ size = 16, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IconSidebarToggle({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="16" rx="3" fill={color} fillOpacity="0.18" />
      <line x1="9" y1="4" x2="9" y2="20" stroke={color} />
    </svg>
  );
}

export function IconSearchTerminal({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="7" fill={color} fillOpacity="0.18" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" stroke={color} />
    </svg>
  );
}

export function IconClose({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
