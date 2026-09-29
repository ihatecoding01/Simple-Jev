---
name: Conversational Jev
description: A no-code decision engine interface built on neon brutalist grid precision
colors:
  reactor-lime: "#C8FF00"
  reactor-lime-dim: "#A3CC00"
  reactor-lime-glow: "rgba(200, 255, 0, 0.15)"
  reactor-lime-subtle: "rgba(200, 255, 0, 0.06)"
  digital-violet: "#8B5CF6"
  digital-violet-dim: "#7C3AED"
  digital-violet-glow: "rgba(139, 92, 246, 0.15)"
  digital-violet-subtle: "rgba(139, 92, 246, 0.06)"
  canvas-black: "#0A0A0A"
  canvas-elevated: "#111113"
  canvas-surface: "#161618"
  canvas-raised: "#1C1C1F"
  canvas-overlay: "#222225"
  text-primary: "#FFFFFF"
  text-secondary: "#A1A1AA"
  text-muted: "#71717A"
  text-dim: "#52525B"
  border-hard: "#2E2E32"
  border-subtle: "#1F1F23"
  signal-emerald: "#10B981"
  signal-amber: "#F59E0B"
  signal-rose: "#F43F5E"
typography:
  display:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "clamp(1.25rem, 3vw, 1.75rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Space Grotesk', sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Space Grotesk', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  none: "0px"
  micro: "2px"
  sm: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.reactor-lime}"
    textColor: "{colors.canvas-black}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.reactor-lime-dim}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  chip-option:
    backgroundColor: "{colors.canvas-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.micro}"
    padding: "6px 14px"
  chip-option-hover:
    backgroundColor: "{colors.canvas-overlay}"
  card-surface:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "24px"
  input-field:
    backgroundColor: "{colors.canvas-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
---

# Design System: Conversational Jev

## Overview

**Creative North Star: "The Grid Terminal"**

Conversational Jev is a computational instrument rendered as a brutalist dark grid. The interface borrows its visual grammar from the reference design's pixel-block composition: geometric precision, neon-on-obsidian contrast, and monospaced authority. Every decision flows through a visible machine — blocks assemble, validators fire, and verdicts land with electric certainty.

The aesthetic is deliberately technical without being cold. Reactor Lime (#C8FF00) pulses as the primary signal — it marks what the system is doing, what succeeded, and where attention should go. Digital Violet (#8B5CF6) is the secondary voice: interactive surfaces, schema metadata, and the pipeline's internal workings. Between them, the jet-black canvas (#0A0A0A) creates an infinite grid plane where content blocks feel placed with purpose, like components on a circuit board.

This is not a decorative UI. It is an operating surface for deterministic decisions. The brutalist geometry says: *this tool does exactly what it shows you.* The neon accents say: *and it's alive right now.*

**Key Characteristics:**
- **Dark-first canvas.** Jet black (#0A0A0A) is the ground truth. All depth is tonal.
- **Neon binary.** Reactor Lime for primary actions and system signals. Digital Violet for schema/pipeline/interactive metadata.
- **Monospaced authority.** JetBrains Mono headlines and labels telegraph precision. Space Grotesk body text stays readable at density.
- **Sharp geometry.** Cards, containers, and layout blocks use 0-4px radius max. The grid is rigid; only interactive pill elements soften.
- **Glow-driven depth.** No box-shadows. Hover and focus states emit neon glow (lime or violet). Static hierarchy is pure tonal layering.
- **Grid-block composition.** Inspired by the reference's pixel-block patterns — content is organized in visible grid cells with explicit borders.
- **Visible infrastructure.** Pipeline stages, cache status, credit meters, and system states are first-class UI citizens, not hidden debug info.

## Colors

A high-voltage palette built on obsidian black with two neon signal colors. Every color earns its presence.

### Primary
- **Reactor Lime** (#C8FF00): The system's voice. Primary CTA backgrounds, active states, success signals, pipeline completion markers, progress indicators. Used sparingly — its rarity on the dark canvas is what makes it impossible to miss.
- **Reactor Lime Dim** (#A3CC00): Hover state for lime elements. Slightly desaturated to create tactile press feedback.
- **Reactor Lime Glow** (rgba(200, 255, 0, 0.15)): Neon emission layer for hover/focus states on lime-accented elements. Applied as `box-shadow: 0 0 20px {color}`.
- **Reactor Lime Subtle** (rgba(200, 255, 0, 0.06)): Background wash for lime-tagged containers (e.g., decision result cards).

### Secondary
- **Digital Violet** (#8B5CF6): Schema metadata, pipeline stages, interactive chip borders on hover, confirmation card accent, validator indicators. The "system internals" color.
- **Digital Violet Dim** (#7C3AED): Hover/active state for violet elements.
- **Digital Violet Glow** (rgba(139, 92, 246, 0.15)): Neon emission for violet-accented interactive states.
- **Digital Violet Subtle** (rgba(139, 92, 246, 0.06)): Background tint for schema/metadata containers.

### Neutral
- **Canvas Black** (#0A0A0A): The ground plane. `body` background and the infinite grid.
- **Canvas Elevated** (#111113): First tonal layer — card backgrounds, primary content containers.
- **Canvas Surface** (#161618): Second layer — input fields, nested containers within cards.
- **Canvas Raised** (#1C1C1F): Third layer — chips, interactive pill backgrounds at rest.
- **Canvas Overlay** (#222225): Fourth layer — dropdown menus, tooltips, chip hover states.
- **Text Primary** (#FFFFFF): Headlines, decision verdicts, primary content. Pure white on black.
- **Text Secondary** (#A1A1AA): Body text, descriptions, supporting content. Zinc-400.
- **Text Muted** (#71717A): Labels, metadata, timestamps, tertiary info. Zinc-500.
- **Text Dim** (#52525B): Decorative text, disabled states, watermarks. Zinc-600.
- **Border Hard** (#2E2E32): Visible structural borders on cards and grid cells. The "wires" of the circuit board.
- **Border Subtle** (#1F1F23): Softer borders for internal dividers and nested boundaries.

### Signal Colors (Semantic)
- **Signal Emerald** (#10B981): Decision success, Jev execution complete, active system status.
- **Signal Amber** (#F59E0B): Delta divergence warnings, schema variations, caution states.
- **Signal Rose** (#F43F5E): Errors, failed validations, destructive actions.

### Named Rules
**The Neon Budget Rule.** Reactor Lime and Digital Violet together occupy ≤15% of any viewport. Their impact comes from scarcity against the dark canvas. If a screen feels "too neon," reduce — never add a third accent color.

**The Black Canvas Rule.** #0A0A0A is the only page-level background. There is no light mode, no cream fallback, no gray alternative. The dark canvas is not a "theme" — it is the product identity.

## Typography

**Display Font:** JetBrains Mono (with `monospace` fallback)
**Body Font:** Space Grotesk (with `system-ui, sans-serif` fallback)

**Character:** JetBrains Mono brings machine-grade authority to headlines and system labels — every character occupies the same width, reinforcing the grid metaphor. Space Grotesk is its geometric companion for body text: precise, contemporary, highly legible at small sizes in dense technical layouts.

### Hierarchy
- **Display** (700, clamp(2rem, 5vw, 3.5rem), line-height 1.08, -0.03em): Hero section headlines. "The Developer Bottleneck." and section titles. Always JetBrains Mono. Always white on black.
- **Headline** (600, clamp(1.25rem, 3vw, 1.75rem), line-height 1.2, -0.02em): Section subheadings, card group titles. JetBrains Mono.
- **Title** (600, 1rem, line-height 1.35, -0.01em): Card headlines, feature names, interactive element labels. Space Grotesk.
- **Body** (400, 0.875rem, line-height 1.6, normal): Paragraph text, descriptions, explanations. Space Grotesk. Max width 65ch for comfortable reading.
- **Label** (500, 0.6875rem, line-height 1.4, 0.06em, uppercase): System tags, pipeline stage markers, metadata badges, sheet labels. Always JetBrains Mono. Always uppercase with wide tracking.

### Named Rules
**The Mono-as-Authority Rule.** JetBrains Mono is reserved for elements that represent system state, technical identity, or structural labels. It is never used for body paragraphs or conversational copy.

**The 65ch Rule.** Body text never exceeds 65 characters per line. On wide screens, content is constrained by max-width containers, not allowed to sprawl.

## Layout

The interface is a full-bleed dark canvas with content organized in a vertically stacked grid of "sheets" — each sheet is a distinct section with explicit top/bottom borders, visible padding, and grid-block composition inside.

**Grid Model:**
- Maximum content width: 1120px, centered with auto margins.
- Section (sheet) padding: 48px vertical, 24px horizontal on mobile scaling to 48px on desktop.
- Grid gaps: 16px between grid cells within a section.
- The layout references the reference image's pixel-block pattern: content is placed in visible rectangular cells with `border: 1px solid {border-hard}` creating an explicit grid structure.

**Responsive Behavior:**
- **>=1024px (Desktop):** Full grid layouts (3-5 column grids for pipeline, 3-column for feature cards).
- **768px-1023px (Tablet):** 2-column grids collapse; pipeline remains horizontal but tighter.
- **<768px (Mobile):** Single-column stack. Section padding reduces to 24px vertical, 16px horizontal. Display font scales down via `clamp()`.

**Density:** Medium-high. The dark canvas and high contrast allow tighter spacing than light UIs without feeling cramped. Cards have 24px internal padding. Chips have 6px 14px padding. The grid breathes through border lines, not whitespace alone.

## Elevation & Depth

**No shadows. No drop-shadows. No box-shadow for elevation at rest.** The Grid Terminal conveys depth through two mechanisms:

1. **Tonal Layering:** Four discrete background tones (black to elevated to surface to raised to overlay) stack to create a visual hierarchy. A card (#111113) floats above the canvas (#0A0A0A) purely by tone contrast.

2. **Neon Glow on Interaction:** When elements receive hover or focus, they emit a glow matching their accent color:
   - Lime-accent elements: `box-shadow: 0 0 20px rgba(200, 255, 0, 0.15), 0 0 4px rgba(200, 255, 0, 0.1)`
   - Violet-accent elements: `box-shadow: 0 0 20px rgba(139, 92, 246, 0.15), 0 0 4px rgba(139, 92, 246, 0.1)`
   - Neutral elements: `box-shadow: 0 0 12px rgba(255, 255, 255, 0.04)`

This glow is the only box-shadow in the entire system. It signals "this element is alive and interactive" without implying physical elevation.

### Named Rules
**The No-Shadow Rule.** `box-shadow` with `y-offset > 0` is banned. The only permitted shadow is a centered glow (equal spread in all directions) on `:hover` and `:focus-visible` states. If an element needs to look "elevated" at rest, increase its background tone.

## Shapes

**Form Language:** Rectilinear brutalist. The reference image's pixel-block aesthetic dictates hard edges and geometric precision. Interactive elements earn a micro-radius (2-4px) as a concession to touch ergonomics, but containers and layout blocks remain sharp.

- **Cards and containers:** 4px border-radius. Structural borders: `1px solid #2E2E32`. Never rounded beyond 4px.
- **Buttons:** 4px border-radius. Sharp enough to read as grid blocks, soft enough to invite clicks.
- **Chips (option pills):** 2px border-radius. Tight and blocky, like circuit board traces.
- **Inputs:** 4px border-radius. Inset appearance with darker background (#161618) against card (#111113).
- **Badges/tags:** 2px border-radius. Pill shapes are banned — all tags are rectangular blocks with micro-radius.
- **The pipeline visualization:** 0px border-radius. Pure rectangles for stage blocks — these are machine components, not UI widgets.

### Named Rules
**The No-Pill Rule.** `border-radius: 9999px` is banned from the system. No element should be fully rounded — not buttons, not badges, not chips. The Grid Terminal's identity is built on visible edges, not smooth capsules.

**The Grid Wire Rule.** Every card and container has a visible `1px solid #2E2E32` border. Borders are structural — they define the grid. Borderless floating cards are not permitted.

## Components

### Buttons
- **Shape:** Precise rectangles with micro-softness (4px radius).
- **Primary:** Reactor Lime (#C8FF00) background, jet black (#0A0A0A) text, `font-family: 'JetBrains Mono'`, `font-size: 0.75rem`, `font-weight: 600`, `letter-spacing: 0.04em`, `text-transform: uppercase`, padding `10px 24px`.
- **Hover:** Background shifts to Reactor Lime Dim (#A3CC00), neon glow appears: `box-shadow: 0 0 20px rgba(200, 255, 0, 0.15)`. Subtle `translateY(-1px)`.
- **Focus:** `outline: 2px solid #C8FF00; outline-offset: 2px`.
- **Secondary:** Transparent background, `1px solid #2E2E32` border, white text. Hover: border shifts to reactor lime, text shifts to reactor lime.
- **Ghost:** Transparent background, no border. Text Secondary (#A1A1AA) text. Hover: text shifts to white, background shifts to Canvas Raised.

### Chips (Interactive Option Pills)
- **Style:** Canvas Raised (#1C1C1F) background, `1px solid #2E2E32` border, white text, `font-size: 0.75rem`, `font-weight: 500`, padding `6px 14px`, 2px border-radius.
- **Hover:** Border color shifts to Digital Violet (#8B5CF6). Background stays.
- **Active/Selected:** Digital Violet background, white text, violet glow.
- **Removable:** X button appears inside chip as Text Muted (#71717A), shifts to Signal Rose (#F43F5E) on hover.
- **Add Option:** Dashed border (`1px dashed #2E2E32`), Text Muted text, `+ Add Option` label. Hover: dashed border shifts to reactor lime.

### Cards / Containers
- **Corner Style:** 4px border-radius.
- **Background:** Canvas Elevated (#111113) for primary cards, Canvas Surface (#161618) for nested/secondary cards.
- **Border:** Always present. `1px solid #2E2E32` (hard) for outer edges, `1px solid #1F1F23` (subtle) for internal dividers.
- **No shadows at rest.** Glow on hover only for interactive cards.
- **Internal Padding:** 24px on desktop, 16px on mobile.
- **Accent stripe:** Status cards use a 3px left border with semantic color: Violet for confirmations, Emerald for decisions, Amber for deltas, Rose for errors.

### Inputs / Fields
- **Style:** Canvas Surface (#161618) background, `1px solid #2E2E32` border, white text, 4px radius.
- **Focus:** Border shifts to Reactor Lime, subtle lime glow: `box-shadow: 0 0 12px rgba(200, 255, 0, 0.1)`. No outline — the glow IS the focus indicator (with `outline: 2px solid transparent` for screen readers).
- **Placeholder:** Text Dim (#52525B).
- **Disabled:** Opacity 0.4, cursor not-allowed.

### Navigation (Header)
- **Background:** Canvas Black (#0A0A0A) with `backdrop-filter: blur(12px)` and 90% opacity for sticky scroll.
- **Brand mark:** Reactor Lime square (28x28px, 2px radius) with black "J1" monospace text.
- **Nav links:** Label style (JetBrains Mono, 11px, uppercase). Text Muted at rest, Text Primary on hover. Active link: Reactor Lime text.
- **Mode toggle:** Two rectangular buttons in a Canvas Elevated container. Active mode gets Reactor Lime (for Restricted) or Digital Violet (for Unrestricted) background with black text.
- **System status pill:** Canvas Elevated background, hard border, monospace text. Green dot pulses for active systems.

### Pipeline Visualization (Signature Component)
The pipeline stages are rendered as a horizontal sequence of hard-edged rectangular blocks (0px radius) on a black ground with hard borders. Each stage block has:
- Canvas Surface (#161618) background at rest.
- Label style text (JetBrains Mono, uppercase).
- Active stage: Digital Violet background (#8B5CF6) with white text.
- Completed stage: Reactor Lime (#C8FF00) text on default background.
- Connecting lines between blocks use `border-top: 1px solid #2E2E32` (dashed while in-progress).

### Sidebar (Pinned Rules Drawer)
- **Backdrop:** `rgba(0, 0, 0, 0.8)` with `backdrop-filter: blur(8px)`.
- **Panel:** Canvas Elevated (#111113) background, right border `1px solid #2E2E32`, full height.
- **Pinned schema cards:** Canvas Surface (#161618) background, hard borders, hover emits violet glow.
- **Quick Run button:** Reactor Lime background, black text (matches primary button).

## Do's and Don'ts

### Do:
- **Do** use Reactor Lime (#C8FF00) exclusively for primary CTAs, success states, and active indicators. Its power comes from being the single "action" color.
- **Do** apply `border: 1px solid #2E2E32` to every card, container, and layout block. The visible grid is the identity.
- **Do** use JetBrains Mono for all system labels, pipeline stages, metadata badges, and section markers. Reserve Space Grotesk for body text and descriptions.
- **Do** use tonal layering (#0A0A0A to #111113 to #161618 to #1C1C1F to #222225) to create depth hierarchy. Each step is deliberate.
- **Do** apply neon glow on interactive hover/focus states. The glow is the system's way of saying "this responds to you."
- **Do** keep decorative grid-block patterns (inspired by the reference's pixel blocks) as ambient texture in hero sections, but never over functional content.

### Don't:
- **Don't** use `border-radius` greater than 4px on any element. The Grid Terminal has no pills, no circles, no soft capsules.
- **Don't** use `box-shadow` with a y-offset. The only shadows are centered neon glows on interaction.
- **Don't** introduce a third accent color. The system is a binary: Lime + Violet. Semantic colors (emerald, amber, rose) are reserved strictly for status signaling.
- **Don't** use opacity/alpha on primary text. White (#FFFFFF) on black (#0A0A0A) is the baseline. Hierarchy is expressed through the muted text scale, not by making white transparent.
- **Don't** create light-mode alternatives. The dark canvas is the product, not a preference. There is no `prefers-color-scheme: light` branch.
- **Don't** nest more than 3 tonal layers deep. If you need a fourth background tone, reconsider the component hierarchy.
