# UI/UX Redesign Plan: Forth Urban

This document acts as the single source of truth for the premium, futuristic, and animated AI real estate experience for the Forth Urban platform. The goal is to overhaul the front-end aesthetics to ooze premium quality utilizing glassmorphism, responsive animated components, and advanced loading sequences, without affecting the existing business logic.

## 1. Design System & Theme Foundation

### 1.1 Color Palette
- **Background**: `#FFECE4` (Core)
- **Primary Accent**: `#5C4033` (Brown)
- **Premium Tertiary**: Introduction of soft bronze/gold (e.g., `#D4AF37`) for premium accents like badges, borders or hover states.
- **Glassmorphism Layers**: Pure white (`#FFFFFF`) with varying opacities for frosty effects (`bg-white/10`, `bg-white/20`).

### 1.2 Typography & Spacing
- Headings: **Manrope**
- Body: **Inter**
- Spacing: Generous whitespace around components to emphasize the premium feel.

### 1.3 Tech Stack additions
- Animations: **Framer Motion** (`framer-motion`)

## 2. Implementation Phases

### Phase 1: Core Components (`packages/ui`)
Refactor shared components:
- **Button (`button.tsx`)**: Add ripple effects, smooth hover scaling (`motion.button`), and built-in transition loaders.
- **Card (`card.tsx`)**: Implement glassmorphic containers. Soft borders (`border-white/20`), backdrop blur (`backdrop-blur-md`), and premium drop shadows (`shadow-xl shadow-brown/5`).
- **Inputs & Labels (`input.tsx`, `label.tsx`)**: Add floating labels and focus ring animations to make forms feel interactive and alive.

### Phase 2: Global Layouts & Route Transitions
- **App Routing Animations**: Wrap routes in `apps/client/src/App.tsx` with `<AnimatePresence mode="wait">` for page-to-page fade and slide transitions (disable in test environments).
- **Loaders & Skeletons**: Create reusable animated loading sequences (pulse, shimmers) in `packages/ui` for data fetches (e.g., `<SkeletonGlass />`).

### Phase 3: Landing & Auth Overhaul
- **Landing Page (`features/landing`)**: Implement a hero section with floating AI-themed elements, smooth parallax scroll, and premium imagery with soft radii.
- **Auth Pages (`features/auth`)**: Redesign Login/Register into split-screen layouts. The left side will feature high-end property carousels with cross-fade animations; the right side will house the glassmorphic auth form.

### Phase 4: The AI Quiz & Dashboard
- **Quiz Flow (`features/quiz`)**: Transition the multi-step quiz into a smooth carousel experience using Framer Motion. Add animated progress bars for better UX.
- **Dashboard (`features/dashboard`)**: Apply the newly established glassmorphic card scheme to user metrics, recent activities, and recommendations.

### Phase 5: Properties, Calculators, & Finalization
- **Properties List (`features/properties`)**: Upgrade property cards to feature smooth image scaling on hover, badge animations, and staggered list entry animations.
- **Calculators (`features/calculators` & `roi`)**: Add animated number counters for budget outputs and interactive smooth transitions for charts or sliders.

## 3. Principles
1. **Never Break Logic**: All logic, state management (TanStack query), and validation (Zod) must remain entirely untouched.
2. **Animation Physics**: Standardize Framer Motion spring and tween configurations.
3. **Responsiveness**: Ensure glass layouts and animations work fluently on mobile, falling back gracefully where necessary.

---
*Initiate Phase 1 to begin implementation.*
