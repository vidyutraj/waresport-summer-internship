# Requirements Document

## Introduction

This feature enhances the Waresport Intern Portal with two improvements:

1. **Inline Resource Viewing** — Instead of every resource card only offering an external link that opens a new tab, users can expand a resource card to preview its content inline within the platform. This keeps interns in context while reading reference materials.

2. **Waresport Social Media Links** — Persistent, visible social media icons (YouTube, Instagram, Twitter) are added to the sidebar so all users (admins and interns alike) can easily follow Waresport's official accounts.

## Glossary

- **Resource_Card**: A UI card component on the Resources page that displays a single resource's title, description, category, and actions.
- **Inline_Viewer**: An expandable panel within a Resource_Card that renders resource content (embedded iframe or rich text) without navigating away from the platform.
- **Resource_URL**: The external URL stored on a Resource record, pointing to the content to be previewed.
- **Embed_Preview**: An iframe-based rendering of a Resource_URL inside the Inline_Viewer.
- **Social_Links_Bar**: A persistent UI section in the Sidebar displaying Waresport's social media icons and links.
- **Sidebar**: The fixed left-hand navigation component (`sidebar.tsx`) visible on all authenticated pages.
- **Portal**: The Waresport Intern Portal Next.js application.
- **Admin**: A user with the ADMIN role in the Portal.
- **Intern**: A user with the INTERN role in the Portal.

---

## Requirements

### Requirement 1: Expand Resource Card to View Content Inline

**User Story:** As an intern, I want to expand a resource card to view its content inline, so that I can read reference materials without leaving the platform.

#### Acceptance Criteria

1. WHEN a user clicks the "View" or expand button on a Resource_Card, THE Resource_Card SHALL expand to reveal the Inline_Viewer panel below the card metadata.
2. WHEN the Inline_Viewer is open and the user clicks the collapse/close control, THE Resource_Card SHALL return to its default collapsed state.
3. WHILE the Inline_Viewer is open, THE Inline_Viewer SHALL display an Embed_Preview of the Resource_URL using an iframe.
4. WHEN a Resource_URL points to a domain that blocks iframe embedding (e.g., returns `X-Frame-Options: DENY`), THE Inline_Viewer SHALL display a fallback message with a direct external link to the Resource_URL.
5. THE Resource_Card SHALL display both the expand/view button and the existing external-link button simultaneously, so users can choose between inline viewing and opening in a new tab.
6. WHEN multiple Resource_Cards are present on the page, THE Resources_Page SHALL allow only one Inline_Viewer to be open at a time, collapsing any previously open viewer when a new one is expanded.

---

### Requirement 2: Inline Viewer Accessibility and Usability

**User Story:** As an intern, I want the inline viewer to be usable and accessible, so that I can comfortably read content without friction.

#### Acceptance Criteria

1. THE Inline_Viewer SHALL render at a minimum height of 400px and expand to fill available width within the card layout.
2. WHEN the Inline_Viewer is loading the Embed_Preview, THE Inline_Viewer SHALL display a loading indicator until the iframe content is ready.
3. THE Inline_Viewer SHALL include a visible label or title indicating which resource is being previewed.
4. THE expand/collapse control on the Resource_Card SHALL be keyboard-focusable and operable via the Enter and Space keys.
5. THE Inline_Viewer iframe SHALL include a descriptive `title` attribute matching the resource title for screen reader compatibility.

---

### Requirement 3: Admin Resource Management Unaffected

**User Story:** As an admin, I want the resource management page to retain its existing edit and delete controls, so that my workflow is not disrupted by the inline viewing feature.

#### Acceptance Criteria

1. THE Admin Resources Page SHALL display the expand/view inline button on each Resource_Card alongside the existing Edit and Delete controls.
2. WHEN an admin expands a Resource_Card on the Admin Resources Page, THE Inline_Viewer SHALL behave identically to the intern-facing Resources Page.
3. THE Admin Resources Page SHALL retain all existing create, edit, and delete functionality without modification.

---

### Requirement 4: Waresport Social Media Links in Sidebar

**User Story:** As a portal user (admin or intern), I want to see Waresport's social media links in the sidebar, so that I can easily follow the official accounts.

#### Acceptance Criteria

1. THE Social_Links_Bar SHALL be rendered in the Sidebar below the navigation links and above the user profile section.
2. THE Social_Links_Bar SHALL display three icon links: YouTube (`https://www.youtube.com/@OfficialWaresport`), Instagram (`https://www.instagram.com/mywaresport/`), and Twitter/X (`https://x.com/waresport_`).
3. WHEN a user clicks a social media icon, THE Portal SHALL open the corresponding social media URL in a new browser tab.
4. THE Social_Links_Bar SHALL be visible to all authenticated users regardless of role (Admin or Intern).
5. THE Social_Links_Bar icon links SHALL each include an accessible `aria-label` describing the platform and brand (e.g., "Waresport on YouTube").
6. WHEN the Sidebar is rendered on any authenticated page, THE Social_Links_Bar SHALL always be present and visible without requiring scrolling within the sidebar.
7. THE Social_Links_Bar SHALL render each icon in its official brand color: YouTube in YouTube red (`#FF0000`), Instagram using the Instagram gradient (purple-to-orange), and Twitter/X in black (`#000000`).

---

### Requirement 5: Resource Content Type Handling

**User Story:** As an intern, I want the inline viewer to handle different resource types gracefully, so that I always get a useful experience regardless of the resource format.

#### Acceptance Criteria

1. WHEN a Resource_URL is a YouTube video URL, THE Inline_Viewer SHALL render an embedded YouTube player using the standard YouTube embed format.
2. WHEN a Resource_URL is a Google Docs, Google Slides, or Google Drive URL, THE Inline_Viewer SHALL render the document using the Google Docs embed format.
3. WHEN a Resource_URL does not match a known embeddable type and the domain blocks iframe embedding, THE Inline_Viewer SHALL display a styled fallback card with the resource title, description, and a prominent "Open in new tab" button.
4. WHEN a Resource_URL is a standard web page that permits iframe embedding, THE Inline_Viewer SHALL render it in a sandboxed iframe with `sandbox="allow-scripts allow-same-origin"`.
