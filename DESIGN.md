---
name: Intelligent Productivity System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#584237'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#006e2f'
  on-secondary: '#ffffff'
  secondary-container: '#6bff8f'
  on-secondary-container: '#007432'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cea700'
  on-tertiary-container: '#4e3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffe083'
  tertiary-fixed-dim: '#eec200'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#574500'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The design system is built on the principles of **Functional Minimalism** and **Cognitive Clarity**. It serves a dual purpose: providing a distraction-free environment for deep thought while signaling the presence of "intelligent" automation through purposeful accents.

The aesthetic draws from modern productivity tools, emphasizing a "living document" feel. It balances the raw utility of a text editor with the sophisticated polish of a modern SaaS application. High-density layouts are balanced by generous white space and a clear typographic hierarchy, ensuring that AI-generated insights feel like integrated parts of the user's workflow rather than intrusive additions.

The emotional response should be one of **calm control and augmented capability**.

## Colors

This design system utilizes a high-utility palette where color is reserved for intent. 

- **Primary (Orange):** Used for primary calls-to-action, active AI processing states, and high-priority highlights. It represents energy and the "spark" of intelligence.
- **Secondary (Green):** Specifically designated for task completion, success states, and positive growth metrics.
- **Tertiary (Yellow):** Applied sparingly for reminders, warnings, and time-sensitive metadata.
- **Neutrals:** A range of Slate grays provides the structural scaffolding. White is the primary canvas, while Light Gray surfaces define sidebars, panels, and secondary containment areas to create subtle depth without relying on heavy borders.

## Typography

Typography is the core of the note-taking experience. The system uses a pair of modern sans-serifs to distinguish between structural UI and content.

- **Geist** is used for headlines and UI labels. Its technical, precise nature reinforces the "AI" and "Automation" aspects of the product.
- **Inter** is the workhorse for body text and long-form notes, chosen for its exceptional readability and neutral tone.
- **JetBrains Mono** is utilized for metadata, timestamps, and AI-generated code snippets or structured data blocks.

Content should maintain a comfortable line height (1.5x - 1.6x for body text) to ensure focus during long reading or writing sessions.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Navigation and sidebars are fixed-width to maintain a consistent control surface, while the central writing canvas is fluid with a maximum readable width of 800px to prevent excessive line lengths.

A 4px baseline grid ensures vertical rhythm. Elements are spaced using increments of 8px (2 units) for significant structural gaps.

**Breakpoints:**
- **Mobile (<768px):** Single column, hidden sidebars (accessible via hamburger), 16px horizontal margins.
- **Tablet (768px - 1024px):** Persistent thin sidebar, 24px margins.
- **Desktop (>1024px):** Full-featured layout with expanded sidebar and optional right-hand "AI Insights" panel.

## Elevation & Depth

The system uses **Tonal Layers** combined with **Ambient Shadows** to create a sense of organized hierarchy.

- **Level 0 (Base):** White (#FFFFFF) for the primary writing canvas. No shadow.
- **Level 1 (Surface):** Light Gray (#F8FAFC) for background panels, sidebars, and inactive input fields.
- **Level 2 (Elevated):** White surfaces with a soft, diffused shadow (Blur: 12px, Y: 4px, Opacity: 4% Black). Used for cards, task items, and floating toolbars.
- **Level 3 (Overlay):** White surfaces with a prominent shadow (Blur: 24px, Y: 8px, Opacity: 8% Black). Reserved for modals, dropdown menus, and AI command palettes.

Edges are defined by 1px borders in a soft gray (#E2E8F0) to maintain structural integrity even when shadows are subtle.

## Shapes

The shape language is "Rounded" to evoke a friendly and approachable feel. 

- **Standard Elements:** Buttons, inputs, and small cards use a **12px (0.75rem)** radius.
- **Large Containers:** Modals and main content sections use a **24px (1.5rem)** radius.
- **Interactive Indicators:** Selection indicators in the sidebar and active tab states use a **6px (0.375rem)** radius for a sharper, more precise look.

Icons should always use rounded caps and joins to match the corner radius of the UI containers.

## Components

### Buttons
- **Primary:** Solid Orange (#F97316) with White text. High-contrast, 12px radius.
- **Secondary:** Light Gray (#F1F5F9) background with Dark Gray text. For low-emphasis actions.
- **Ghost:** No background, Orange or Gray text. Used for toolbar actions to maintain whitespace.

### Inputs
- **Text Fields:** White background with a 1px border (#E2E8F0). On focus, the border changes to Orange with a 2px soft outer glow.
- **AI Command Bar:** A unique input styling with a slightly thicker 2px border and a subtle Orange-to-Yellow gradient underline to signify "AI Active" state.

### Cards & Chips
- **Note Preview:** Level 2 elevation, 16px padding, headline-sm title.
- **Tag Chips:** Small 12px radius, light tinted backgrounds (e.g., 10% opacity of the category color) with dark text.

### Lists & Tasks
- **Checkboxes:** Rounded squares (4px radius). When checked, they transition to Green (#22C55E) with a white checkmark.
- **List Items:** 8px vertical spacing between items. Hover states should use a subtle Light Gray (#F8FAFC) background highlight.

### AI Feedback 
- **Pulse Indicator:** A soft, breathing Orange glow used near text that is currently being processed or "thought about" by the AI.