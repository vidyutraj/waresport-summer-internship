# Design Document

## Feature: platform-resources-social

---

## Overview

This feature adds two enhancements to the Waresport Intern Portal:

1. **Inline Resource Viewing** — Resource cards on the Resources page gain an expand/collapse control that opens an inline viewer panel. The viewer embeds the resource URL in an iframe (with type-specific embed logic for YouTube and Google Docs) and falls back to a styled card with an external link when embedding is blocked.

2. **Social Media Links in Sidebar** — A persistent Social Links Bar is added to the sidebar between the navigation links and the user profile section, displaying brand-colored icons for YouTube, Instagram, and Twitter/X that open in new tabs.

No database schema changes are required. The existing `url` field on the `Resource` model already stores the URL to embed. The main architectural change is introducing a new `ResourceCard` client component to handle the expand/collapse interactivity, since the current resource pages are server components.

---

## Architecture

### Current State

Both `src/app/resources/page.tsx` and `src/app/admin/resources/page.tsx` are Next.js server components that render resource cards inline using JSX. The sidebar (`src/components/layout/sidebar.tsx`) is already a client component (`"use client"`).

### Target State

```
src/
  components/
    shared/
      ResourceCard.tsx          ← NEW: client component, handles expand/collapse + inline viewer
      InlineResourceViewer.tsx  ← NEW: client component, iframe embed + fallback
      SocialLinksBar.tsx        ← NEW: client component (or pure JSX), social icons
    layout/
      sidebar.tsx               ← MODIFIED: add <SocialLinksBar /> between nav and user section
  app/
    resources/
      page.tsx                  ← MODIFIED: replace inline card JSX with <ResourceCard />
    admin/
      resources/
        page.tsx                ← MODIFIED: replace inline card JSX with <ResourceCard isAdmin />
```

### Key Design Decisions

**Single-open-at-a-time via lifted state**: The Resources page needs to track which card (if any) is expanded so that opening one collapses the previous. This state lives in a new `ResourcesGrid` client wrapper component that owns `openResourceId` state and passes `isOpen` / `onToggle` props down to each `ResourceCard`.

**URL type detection is pure**: The logic that maps a URL to an embed strategy (YouTube, Google Docs, generic iframe, fallback) is a pure function `getEmbedStrategy(url: string): EmbedStrategy`. This makes it straightforward to test and keeps the component logic clean.

**No new dependencies for social icons**: `react-icons` is not currently in the project. Rather than adding a dependency, the social icons will be implemented as inline SVG components. This keeps the bundle lean and gives full control over brand colors.

---

## Components and Interfaces

### `ResourceCard` (`src/components/shared/ResourceCard.tsx`)

Client component. Renders a single resource card with expand/collapse behavior.

```typescript
interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    category: string;
    isRequired: boolean;
    createdAt: Date;
    uploader: { name: string };
  };
  isAdmin?: boolean;       // shows Edit/Delete controls when true
  isOpen: boolean;         // controlled by parent ResourcesGrid
  onToggle: () => void;    // called when expand/collapse button is clicked
  // Admin-only action slots (rendered only when isAdmin=true)
  editControl?: React.ReactNode;
  deleteControl?: React.ReactNode;
}
```

**Behavior:**
- Renders the existing card metadata (title, description, date, required badge).
- Renders two action buttons: "View inline" (expand toggle) and "Open" (external link).
- When `isOpen` is true, renders `<InlineResourceViewer>` below the metadata.
- The expand/collapse button is a `<button>` element (keyboard-focusable, responds to Enter/Space natively).

### `InlineResourceViewer` (`src/components/shared/InlineResourceViewer.tsx`)

Client component. Renders the embedded content or fallback.

```typescript
interface InlineResourceViewerProps {
  url: string;
  title: string;
  description: string | null;
}
```

**Internal state:**
- `isLoading: boolean` — true until iframe `onLoad` fires.
- `hasError: boolean` — set to true if the iframe fires `onError`.

**Behavior:**
- Calls `getEmbedStrategy(url)` to determine render mode.
- Shows a spinner while `isLoading` is true.
- Renders the appropriate embed or fallback based on strategy.

### `getEmbedStrategy(url: string): EmbedStrategy`

Pure utility function in `src/lib/embedStrategy.ts`.

```typescript
type EmbedStrategy =
  | { type: "youtube"; embedUrl: string }
  | { type: "google-docs"; embedUrl: string }
  | { type: "iframe"; url: string }
  | { type: "fallback" };

function getEmbedStrategy(url: string): EmbedStrategy
```

**Detection rules:**

| URL pattern | Strategy |
|---|---|
| `youtube.com/watch?v=`, `youtu.be/` | `youtube` — converts to `https://www.youtube.com/embed/{videoId}` |
| `docs.google.com/`, `drive.google.com/` | `google-docs` — appends `/preview` or `/embed` as appropriate |
| Anything else | `iframe` — rendered with `sandbox="allow-scripts allow-same-origin"` |

The `fallback` strategy is used when the iframe fires `onError` (detected at runtime, not at URL-parse time).

### `ResourcesGrid` (`src/components/shared/ResourcesGrid.tsx`)

Client component. Thin wrapper that owns the `openResourceId` state and renders a grid of `ResourceCard` components.

```typescript
interface ResourcesGridProps {
  resources: ResourceCardProps["resource"][];
  isAdmin?: boolean;
  // Admin action renderers keyed by resource id
  adminControls?: Record<string, { edit: React.ReactNode; delete: React.ReactNode }>;
}
```

**Behavior:**
- Maintains `openResourceId: string | null` state.
- `onToggle(id)`: if `openResourceId === id`, sets to `null`; otherwise sets to `id`.
- Passes `isOpen={openResourceId === resource.id}` and `onToggle={() => onToggle(resource.id)}` to each `ResourceCard`.

### `SocialLinksBar` (`src/components/shared/SocialLinksBar.tsx`)

Pure JSX (no state needed). Renders three icon links.

```typescript
// No props — URLs and colors are hardcoded constants
export function SocialLinksBar(): JSX.Element
```

**Social link data (hardcoded):**

```typescript
const SOCIAL_LINKS = [
  {
    label: "Waresport on YouTube",
    href: "https://www.youtube.com/@OfficialWaresport",
    icon: YouTubeIcon,   // inline SVG
    color: "#FF0000",
  },
  {
    label: "Waresport on Instagram",
    href: "https://www.instagram.com/mywaresport/",
    icon: InstagramIcon, // inline SVG with gradient
    color: "instagram-gradient",
  },
  {
    label: "Waresport on Twitter / X",
    href: "https://x.com/waresport_",
    icon: XIcon,         // inline SVG
    color: "#000000",
  },
];
```

Each link renders as `<a target="_blank" rel="noopener noreferrer" aria-label={label}>`.

### Sidebar Modification

`sidebar.tsx` gains a `<SocialLinksBar />` inserted between the `<nav>` block and the user section `<div>`:

```tsx
{/* Social links */}
<div className="px-4 pb-2">
  <SocialLinksBar />
</div>

{/* User section */}
<div className="border-t border-gray-100 p-4">
  ...
</div>
```

---

## Data Models

No schema changes. The existing `Resource` model is sufficient:

```prisma
model Resource {
  id          String   @id @default(cuid())
  title       String
  description String?
  url         String   // ← used as the embed source
  category    String
  isRequired  Boolean  @default(false)
  uploadedBy  String
  uploader    User     @relation("CreatedResources", fields: [uploadedBy], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

The `url` field stores the resource URL that `getEmbedStrategy` will parse to determine the embed type.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Both resource card actions are always present

*For any* resource object rendered as a `ResourceCard`, the rendered output SHALL contain both an expand/inline-view button and an external-link anchor, regardless of the resource's title, URL, category, or `isRequired` status.

**Validates: Requirements 1.5**

---

### Property 2: At most one inline viewer open at a time

*For any* list of two or more resources rendered in a `ResourcesGrid`, after toggling any single resource card open, the total count of open `InlineResourceViewer` panels SHALL be exactly one. Toggling the same card again SHALL result in zero open panels.

**Validates: Requirements 1.6**

---

### Property 3: Inline viewer displays resource title

*For any* resource title string, when `InlineResourceViewer` is rendered with that title, the rendered output SHALL contain the title text AND the iframe element (when not in fallback state) SHALL have a `title` attribute equal to the resource title.

**Validates: Requirements 2.3, 2.5**

---

### Property 4: YouTube URL embed strategy

*For any* YouTube URL (matching `youtube.com/watch?v=` or `youtu.be/` patterns, with any valid video ID), `getEmbedStrategy(url)` SHALL return `{ type: "youtube", embedUrl }` where `embedUrl` contains `"youtube.com/embed/"` followed by the video ID.

**Validates: Requirements 5.1**

---

### Property 5: Google Docs/Drive URL embed strategy

*For any* URL whose hostname is `docs.google.com` or `drive.google.com`, `getEmbedStrategy(url)` SHALL return `{ type: "google-docs", embedUrl }` where `embedUrl` is a valid Google embed/preview URL derived from the input.

**Validates: Requirements 5.2**

---

### Property 6: Generic iframe sandbox attribute

*For any* URL that `getEmbedStrategy` classifies as `{ type: "iframe" }`, the `InlineResourceViewer` SHALL render an `<iframe>` element with `sandbox="allow-scripts allow-same-origin"`.

**Validates: Requirements 5.4**

---

### Property 7: Fallback card completeness

*For any* resource (with any title, description, and URL), when `InlineResourceViewer` is rendered in the fallback/error state, the rendered output SHALL contain the resource title, the resource description (if non-null), and an anchor element with `href` equal to the resource URL and `target="_blank"`.

**Validates: Requirements 5.3, 1.4**

---

### Property 8: Social link rendering correctness

*For every* anchor element rendered by `SocialLinksBar`, the element SHALL have: a non-empty `aria-label` attribute, `target="_blank"`, `rel="noopener noreferrer"`, and an `href` matching one of the three official Waresport social URLs. Additionally, the YouTube icon SHALL have fill `#FF0000`, the Twitter/X icon SHALL have fill `#000000`, and the Instagram icon SHALL use a gradient fill.

**Validates: Requirements 4.2, 4.3, 4.5, 4.7**

---

## Error Handling

### Iframe Embedding Failures

The most common error case is a resource URL that blocks iframe embedding via `X-Frame-Options` or `Content-Security-Policy`. Since these headers are only visible at runtime (not at URL-parse time), the `InlineResourceViewer` handles this reactively:

1. The iframe renders normally with `onError` and `onLoad` handlers.
2. If `onError` fires, `hasError` state is set to `true` and the fallback card is shown.
3. The fallback card displays the resource title, description, and a prominent "Open in new tab" link.

Note: Some sites silently block embedding without firing `onError` (they load a blank page or an error page inside the iframe). This is a known limitation of iframe-based embedding and is acceptable — the user can always use the external link button on the card.

### URL Parsing Errors

`getEmbedStrategy` uses `new URL(url)` internally. If the stored URL is malformed, the constructor throws. The function catches this and returns `{ type: "fallback" }` so the viewer degrades gracefully rather than crashing.

### Loading State

The `InlineResourceViewer` shows a spinner from the moment it mounts until the iframe fires `onLoad`. If `onLoad` never fires (e.g., network timeout), the spinner remains visible. This is acceptable for the current scope — a timeout/retry mechanism is out of scope.

---

## Testing Strategy

### Unit Tests (Example-Based)

Focus on specific scenarios and integration points:

- `ResourceCard` renders both expand button and external link (covers Req 1.5 example path)
- `ResourceCard` with `isAdmin=true` renders edit and delete controls alongside expand button (Req 3.1)
- `ResourceCard` expand button is a `<button>` element (keyboard accessibility, Req 2.4)
- `InlineResourceViewer` shows loading spinner before `onLoad` fires (Req 2.2)
- `InlineResourceViewer` shows fallback card when `hasError=true` (Req 1.4)
- `ResourcesGrid` opens a card when its toggle is called (Req 1.1)
- `ResourcesGrid` closes a card when its toggle is called again (Req 1.2)
- `SocialLinksBar` renders three anchors with correct hrefs (Req 4.2)
- `Sidebar` renders `SocialLinksBar` for both ADMIN and INTERN sessions (Req 4.4)
- `SocialLinksBar` is placed outside the scrollable nav container in the sidebar DOM (Req 4.6)

### Property-Based Tests

Property-based testing is appropriate here because `getEmbedStrategy` is a pure function with a large input space (arbitrary URLs), and several rendering properties must hold for all possible resource data. The project uses TypeScript/React, so **fast-check** is the recommended PBT library.

Each property test runs a minimum of **100 iterations**.

**Library**: [`fast-check`](https://github.com/dubzzz/fast-check)

**Tag format**: `// Feature: platform-resources-social, Property {N}: {property_text}`

| Property | Test description |
|---|---|
| Property 1 | Generate arbitrary resource objects → render `ResourceCard` → assert both buttons present |
| Property 2 | Generate list of ≥2 resources → render `ResourcesGrid` → toggle any card → assert exactly 1 open |
| Property 3 | Generate arbitrary title strings → render `InlineResourceViewer` → assert title in output and iframe title attribute matches |
| Property 4 | Generate arbitrary YouTube video IDs → construct YouTube URLs → call `getEmbedStrategy` → assert type="youtube" and embedUrl contains "/embed/{id}" |
| Property 5 | Generate arbitrary paths/query strings → construct Google Docs/Drive URLs → call `getEmbedStrategy` → assert type="google-docs" |
| Property 6 | Generate arbitrary non-YouTube, non-Google URLs → call `getEmbedStrategy` → render `InlineResourceViewer` → assert iframe has correct sandbox attribute |
| Property 7 | Generate arbitrary resource objects (title, description, url) → render `InlineResourceViewer` in fallback state → assert title, description, and href all present |
| Property 8 | Render `SocialLinksBar` → for each anchor → assert aria-label non-empty, target="_blank", rel="noopener noreferrer", href in allowed set |

### Integration / Smoke Tests

- Admin resources page retains create/edit/delete functionality after refactor (Req 3.3) — verified by manual smoke test and existing E2E flows.
- `SocialLinksBar` is visually positioned correctly in the sidebar without scrolling (Req 4.6) — verified by visual inspection.
- Minimum iframe height of 400px is applied (Req 2.1) — verified by visual inspection / snapshot.
