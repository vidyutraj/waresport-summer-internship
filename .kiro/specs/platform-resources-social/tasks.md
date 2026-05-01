# Implementation Plan: platform-resources-social

## Overview

Implement inline resource viewing and Waresport social media links in the sidebar. The work splits into three tracks: (1) the pure `getEmbedStrategy` utility, (2) the new shared React components (`ResourceCard`, `InlineResourceViewer`, `ResourcesGrid`, `SocialLinksBar`), and (3) wiring those components into the existing pages and sidebar. No database changes are required.

## Tasks

- [x] 1. Create the `getEmbedStrategy` utility
  - Create `src/lib/embedStrategy.ts` with the `EmbedStrategy` discriminated union type and the `getEmbedStrategy(url: string): EmbedStrategy` pure function.
  - Implement YouTube detection: match `youtube.com/watch?v=` and `youtu.be/` patterns, extract the video ID, and return `{ type: "youtube", embedUrl: "https://www.youtube.com/embed/{videoId}" }`.
  - Implement Google Docs/Drive detection: match hostnames `docs.google.com` and `drive.google.com`, append `/preview` (Docs/Slides) or `/preview` (Drive files) to produce the embed URL, and return `{ type: "google-docs", embedUrl }`.
  - For all other valid URLs return `{ type: "iframe", url }`.
  - Wrap `new URL(url)` in a try/catch and return `{ type: "fallback" }` for malformed URLs.
  - _Requirements: 5.1, 5.2, 5.4, 1.4_

  - [ ]* 1.1 Write property tests for `getEmbedStrategy` — YouTube URLs
    - Install `fast-check` as a dev dependency (`npm install --save-dev fast-check`).
    - Set up the test file at `src/lib/__tests__/embedStrategy.test.ts`.
    - **Property 4: YouTube URL embed strategy**
    - Generate arbitrary valid YouTube video IDs (alphanumeric + `-_`, 11 chars) and construct both `youtube.com/watch?v={id}` and `youtu.be/{id}` URLs. Assert `getEmbedStrategy` returns `{ type: "youtube" }` and that `embedUrl` contains `"youtube.com/embed/"` followed by the video ID.
    - **Validates: Requirements 5.1**

  - [ ]* 1.2 Write property tests for `getEmbedStrategy` — Google Docs/Drive URLs
    - **Property 5: Google Docs/Drive URL embed strategy**
    - Generate arbitrary path strings and query parameters, construct URLs with hostnames `docs.google.com` and `drive.google.com`. Assert `getEmbedStrategy` returns `{ type: "google-docs" }` and that `embedUrl` is a valid URL derived from the input.
    - **Validates: Requirements 5.2**

  - [ ]* 1.3 Write unit tests for `getEmbedStrategy` edge cases
    - Test malformed URL returns `{ type: "fallback" }`.
    - Test a plain `https://example.com` URL returns `{ type: "iframe" }`.
    - Test a `youtu.be/` short URL extracts the correct video ID.
    - Test a Google Slides URL (`docs.google.com/presentation/...`) returns `{ type: "google-docs" }`.
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Checkpoint — Ensure all `embedStrategy` tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement `InlineResourceViewer` component
  - Create `src/components/shared/InlineResourceViewer.tsx` as a `"use client"` component.
  - Accept props `{ url: string; title: string; description: string | null }`.
  - Call `getEmbedStrategy(url)` to determine render mode.
  - Maintain `isLoading: boolean` state (default `true`) and `hasError: boolean` state (default `false`).
  - For `type: "youtube"` and `type: "google-docs"`: render an `<iframe>` with `src={embedUrl}`, `title={title}`, `onLoad={() => setIsLoading(false)}`, `onError={() => setHasError(true)}`, minimum height `400px`, and `width="100%"`.
  - For `type: "iframe"`: render the same `<iframe>` but add `sandbox="allow-scripts allow-same-origin"`.
  - For `type: "fallback"` or when `hasError` is `true`: render a styled fallback card showing the resource title, description (if non-null), and an `<a href={url} target="_blank" rel="noopener noreferrer">` "Open in new tab" button.
  - While `isLoading` is `true` (and not in fallback), render a centered spinner overlay above the iframe.
  - Include a visible heading/label showing the resource title above the iframe.
  - _Requirements: 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.1 Write property tests for `InlineResourceViewer` — title rendering
    - Set up test file at `src/components/shared/__tests__/InlineResourceViewer.test.tsx` using React Testing Library.
    - **Property 3: Inline viewer displays resource title**
    - Generate arbitrary non-empty title strings. Render `InlineResourceViewer` with a non-YouTube, non-Google URL (so it uses the iframe path) and assert the title text appears in the rendered output and the `<iframe>` has a `title` attribute equal to the generated title.
    - **Validates: Requirements 2.3, 2.5**

  - [ ]* 3.2 Write property tests for `InlineResourceViewer` — generic iframe sandbox
    - **Property 6: Generic iframe sandbox attribute**
    - Generate arbitrary URLs that are not YouTube or Google Docs/Drive. Render `InlineResourceViewer` and assert the rendered `<iframe>` has `sandbox="allow-scripts allow-same-origin"`.
    - **Validates: Requirements 5.4**

  - [ ]* 3.3 Write property tests for `InlineResourceViewer` — fallback card completeness
    - **Property 7: Fallback card completeness**
    - Generate arbitrary resource objects (title string, nullable description string, URL string). Render `InlineResourceViewer` in the error/fallback state (trigger `hasError` by rendering with `type: "fallback"` URL or by simulating `onError`). Assert the rendered output contains the title, the description (when non-null), and an anchor with `href` equal to the resource URL and `target="_blank"`.
    - **Validates: Requirements 5.3, 1.4**

  - [ ]* 3.4 Write unit tests for `InlineResourceViewer`
    - Test that a loading spinner is shown before `onLoad` fires.
    - Test that the fallback card is shown when `hasError` is `true`.
    - Test that the iframe `title` attribute matches the resource title prop.
    - _Requirements: 2.2, 2.3, 2.5_

- [x] 4. Implement `ResourceCard` component
  - Create `src/components/shared/ResourceCard.tsx` as a `"use client"` component.
  - Accept props matching the `ResourceCardProps` interface from the design: `resource`, `isAdmin?`, `isOpen`, `onToggle`, `editControl?`, `deleteControl?`.
  - Render the card metadata: title, description, date, category badge, required badge/star.
  - Render two action buttons side by side: an expand/collapse `<button>` ("View" when collapsed, "Close" when expanded) and an `<a>` external-link button. Both must always be present.
  - The expand/collapse `<button>` must be a native `<button>` element so it is keyboard-focusable and responds to Enter/Space natively.
  - When `isAdmin` is `true`, render `editControl` and `deleteControl` slots alongside the action buttons.
  - When `isOpen` is `true`, render `<InlineResourceViewer url={resource.url} title={resource.title} description={resource.description} />` below the card metadata.
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.4, 3.1, 3.2_

  - [ ]* 4.1 Write property tests for `ResourceCard` — both actions always present
    - Set up test file at `src/components/shared/__tests__/ResourceCard.test.tsx`.
    - **Property 1: Both resource card actions are always present**
    - Generate arbitrary resource objects (varying title, URL, category, `isRequired` boolean, description). Render `ResourceCard` with `isOpen={false}` and `onToggle={() => {}}`. Assert the rendered output contains both the expand/inline-view button and the external-link anchor.
    - **Validates: Requirements 1.5**

  - [ ]* 4.2 Write unit tests for `ResourceCard`
    - Test that `isAdmin=true` renders edit and delete control slots.
    - Test that the expand button is a `<button>` element (keyboard accessibility).
    - Test that clicking the expand button calls `onToggle`.
    - Test that `InlineResourceViewer` is rendered when `isOpen=true` and not rendered when `isOpen=false`.
    - _Requirements: 1.1, 1.2, 2.4, 3.1_

- [x] 5. Implement `ResourcesGrid` component
  - Create `src/components/shared/ResourcesGrid.tsx` as a `"use client"` component.
  - Accept props: `resources` array, `isAdmin?` boolean, `adminControls?` record keyed by resource id.
  - Maintain `openResourceId: string | null` state (default `null`).
  - Implement `onToggle(id: string)`: if `openResourceId === id` set to `null`, otherwise set to `id`.
  - Render a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`) of `ResourceCard` components, passing `isOpen={openResourceId === resource.id}` and `onToggle={() => onToggle(resource.id)}` to each.
  - When `isAdmin` is `true`, pass the corresponding `editControl` and `deleteControl` from `adminControls` to each `ResourceCard`.
  - _Requirements: 1.1, 1.2, 1.6, 3.1, 3.2_

  - [ ]* 5.1 Write property tests for `ResourcesGrid` — at most one viewer open
    - Set up test file at `src/components/shared/__tests__/ResourcesGrid.test.tsx`.
    - **Property 2: At most one inline viewer open at a time**
    - Generate lists of 2–10 arbitrary resource objects. Render `ResourcesGrid`. Simulate clicking the toggle on any one card. Assert exactly one `InlineResourceViewer` is present in the DOM. Then simulate clicking the same card's toggle again and assert zero `InlineResourceViewer` panels are present.
    - **Validates: Requirements 1.6**

  - [ ]* 5.2 Write unit tests for `ResourcesGrid`
    - Test that opening card A then opening card B closes card A (only one open at a time).
    - Test that toggling an open card closes it.
    - _Requirements: 1.1, 1.2, 1.6_

- [x] 6. Checkpoint — Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement `SocialLinksBar` component
  - Create `src/components/shared/SocialLinksBar.tsx`.
  - Define the `SOCIAL_LINKS` constant array with the three entries: YouTube (`https://www.youtube.com/@OfficialWaresport`, `aria-label="Waresport on YouTube"`, fill `#FF0000`), Instagram (`https://www.instagram.com/mywaresport/`, `aria-label="Waresport on Instagram"`, gradient fill), Twitter/X (`https://x.com/waresport_`, `aria-label="Waresport on Twitter / X"`, fill `#000000`).
  - Implement inline SVG components for each brand icon: `YouTubeIcon`, `InstagramIcon` (using an SVG `<defs><linearGradient>` for the purple-to-orange gradient), and `XIcon`.
  - Render each link as `<a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>` wrapping the icon SVG.
  - Style the bar as a horizontal row of evenly-spaced icon links using Tailwind.
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 7.1 Write property tests for `SocialLinksBar` — anchor correctness
    - Set up test file at `src/components/shared/__tests__/SocialLinksBar.test.tsx`.
    - **Property 8: Social link rendering correctness**
    - Render `SocialLinksBar`. For each `<a>` element in the rendered output, assert: `aria-label` is non-empty, `target="_blank"`, `rel="noopener noreferrer"`, and `href` is one of the three official Waresport social URLs. Additionally assert the YouTube SVG has fill `#FF0000` and the Twitter/X SVG has fill `#000000`.
    - **Validates: Requirements 4.2, 4.3, 4.5, 4.7**

  - [ ]* 7.2 Write unit tests for `SocialLinksBar`
    - Test that exactly three anchor elements are rendered.
    - Test that each anchor has the correct `href`.
    - Test that each anchor has a non-empty `aria-label`.
    - _Requirements: 4.2, 4.5_

- [x] 8. Wire `SocialLinksBar` into the sidebar
  - Modify `src/components/layout/sidebar.tsx` to import `SocialLinksBar`.
  - Insert `<div className="px-4 pb-2"><SocialLinksBar /></div>` between the closing `</nav>` tag and the user section `<div className="border-t border-gray-100 p-4">`.
  - Verify the sidebar flex layout ensures the social bar is always visible without requiring scrolling (it sits outside the `overflow-y-auto` nav container).
  - _Requirements: 4.1, 4.4, 4.6_

- [x] 9. Refactor intern-facing `src/app/resources/page.tsx`
  - Import `ResourcesGrid` from `@/components/shared/ResourcesGrid`.
  - Replace the inline `<div className="grid ...">` card rendering loop with `<ResourcesGrid resources={resources} />`.
  - Keep the category grouping (`categories.map(...)`) and section headings — pass each category's resource subset to a `ResourcesGrid` per category, or pass all resources and let `ResourcesGrid` handle the flat grid (match the existing visual grouping from the design).
  - Keep the empty-state rendering and the page header unchanged.
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

- [x] 10. Refactor admin `src/app/admin/resources/page.tsx`
  - Import `ResourcesGrid` from `@/components/shared/ResourcesGrid`.
  - Build the `adminControls` record: for each resource, set `adminControls[resource.id] = { edit: <EditResourceDialog resource={resource} />, delete: <DeleteResourceButton resourceId={resource.id} title={resource.title} /> }`.
  - Replace the inline card rendering loop with `<ResourcesGrid resources={resources} isAdmin adminControls={adminControls} />`.
  - Keep the page header, the `CreateResourceDialog` button, and the empty-state rendering unchanged.
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 11. Final checkpoint — Ensure all tests pass and pages render correctly
  - Run the full test suite and ensure all tests pass.
  - Verify TypeScript compilation has no errors (`tsc --noEmit`).
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation after each major track.
- Property tests use `fast-check` and validate universal correctness properties across arbitrary inputs.
- Unit tests validate specific examples, edge cases, and integration points.
- Social icons are inline SVGs — no new npm dependencies required beyond `fast-check` (dev-only).
