# Feature Requirements: Menu Design Builder

## Overview
**One-line summary:** Visual menu design system that lets restaurant owners fully customize their public menu page appearance.
**Business value:** Differentiation from competitors - each restaurant gets a unique branded menu, increasing perceived value and reducing churn.
**Target release:** v1.1.0

## User Stories

### US-001: Template Selection
**As a** restaurant owner
**I want to** choose from pre-built menu templates
**So that** I can quickly get a professional-looking menu without design skills

### US-002: Color Customization
**As a** restaurant owner
**I want to** customize my menu's color palette (primary, secondary, background, text, accent)
**So that** my menu matches my restaurant's brand identity

### US-003: Typography Control
**As a** restaurant owner
**I want to** choose heading and body fonts from a curated Google Fonts library
**So that** my menu has the right personality (elegant, modern, casual, etc.)

### US-004: Layout Selection
**As a** restaurant owner
**I want to** switch between layout styles (classic list, modern grid, magazine, minimal, elegant, bold)
**So that** my menu presentation matches my restaurant's style

### US-005: Live Preview
**As a** restaurant owner
**I want to** see real-time preview of my design changes with my actual menu data
**So that** I can make informed design decisions before publishing

### US-006: Component Controls
**As a** restaurant owner
**I want to** toggle visibility of prices, nutrition info, images, category navigation
**So that** I show only what's relevant to my customers

### US-007: Card & Spacing Control
**As a** restaurant owner
**I want to** adjust card styles (flat, elevated, bordered, glass), border radius, and spacing
**So that** the menu has the right visual density and feel

## Acceptance Criteria
- [ ] Given a new menu, when owner opens theme editor, then default theme is applied
- [ ] Given theme editor is open, when owner changes a color, then preview updates in real-time
- [ ] Given owner selects a template, when applied, then all theme tokens update at once
- [ ] Given owner saves theme, when customer visits menu, then custom theme is rendered
- [ ] Given no theme exists for a menu, when customer visits, then default theme is used
- [ ] Given owner changes layout style, then dishes re-render in the selected layout

## Functional Requirements

| ID | Requirement | Priority | Story Points |
|----|-------------|----------|-------------|
| FR-001 | 6 pre-built templates with distinct aesthetics | Must Have | 5 |
| FR-002 | Color picker for 6 color tokens | Must Have | 3 |
| FR-003 | Font selector with 20+ Google Font options | Must Have | 3 |
| FR-004 | 6 layout modes (classic/modern/grid/magazine/minimal/elegant) | Must Have | 8 |
| FR-005 | Live preview panel with actual menu data | Must Have | 5 |
| FR-006 | Card style, border radius, spacing controls | Should Have | 3 |
| FR-007 | Toggle visibility controls (images/prices/nutrition/nav) | Should Have | 2 |
| FR-008 | Header style options (banner/minimal/centered/overlay) | Should Have | 3 |
| FR-009 | Image display options (rounded/square/circle) | Nice to Have | 2 |
| FR-010 | Custom CSS input for advanced users | Nice to Have | 2 |

## Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Theme application | < 100ms (CSS variables) |
| Performance | Live preview update | < 50ms |
| Performance | Font loading | Lazy, cached by browser |
| Security | Custom CSS | Sanitized, no JS execution |
| Accessibility | Color contrast | WCAG AA minimum |
| Mobile | Responsive editor | Works on tablet+ |

## API Design (tRPC Router)

### Endpoints

| Procedure | Type | Auth | Input | Output |
|-----------|------|------|-------|--------|
| `theme.getTheme` | query | private | `{ menuId: uuid }` | `MenuTheme \| null` |
| `theme.getPublicTheme` | query | public | `{ menuSlug: string }` | `MenuTheme \| defaults` |
| `theme.saveTheme` | mutation | private | `MenuThemeInput` | `MenuTheme` |
| `theme.resetTheme` | mutation | private | `{ menuId: uuid }` | `MenuTheme` |
| `theme.getTemplates` | query | public | none | `Template[]` |

## Database Changes
- New table: `menu_themes` (1:1 with menus)
- 22 customizable design token columns
- Migration: `20231112000000_add-menu-themes.sql`

## Architecture
- CSS Custom Properties for real-time theme application
- Google Fonts API for dynamic font loading
- Theme stored per-menu in database
- Default theme applied when no custom theme exists
- Server-side theme injection for SSR/SEO

## Out of Scope
- Drag-and-drop reordering of menu sections
- Custom HTML templates
- Theme marketplace / sharing between users
- Mobile app theme editor
