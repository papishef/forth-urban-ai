/**
 * Shared Shadcn/Tailwind component library, consumed by apps/client.
 * Phase 1: theme tokens (consumed via Tailwind config in apps/client),
 * base primitives (Button, Input, Label, Card).
 */
export { cn } from "./lib/cn.js";
export { Button, type ButtonProps } from "./components/button.js";
export { Input } from "./components/input.js";
export { Textarea } from "./components/textarea.js";
export { Label } from "./components/label.js";
export { Badge, type BadgeProps } from "./components/badge.js";
export { Card, MotionCard, CardHeader, CardTitle, CardDescription, CardContent } from "./components/card.js";
export { Progress, type ProgressProps } from "./components/progress.js";
export { PageTransition } from "./components/page-transition.js";
export { SkeletonGlass } from "./components/skeleton-glass.js";
export { BuildingLoader, type BuildingLoaderProps } from "./components/building-loader.js";
export { Logo } from "./components/logo.js";

