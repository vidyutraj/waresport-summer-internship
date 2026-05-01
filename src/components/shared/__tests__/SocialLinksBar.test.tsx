// Feature: platform-resources-social
import * as fc from "fast-check";
import * as React from "react";

// ---------------------------------------------------------------------------
// We test the SocialLinksBar by inspecting the rendered React element tree
// (React.createElement output) without a DOM environment, since the project
// uses testEnvironment: "node" and has no @testing-library/react installed.
// ---------------------------------------------------------------------------

import { SocialLinksBar } from "../SocialLinksBar";

// ---------------------------------------------------------------------------
// Helpers to walk a React element tree and collect nodes.
// When a node's type is a function component, we call it to get its subtree.
// ---------------------------------------------------------------------------

type ReactNode = React.ReactElement | null | undefined | string | number | boolean;

function collectElements(
  node: ReactNode,
  predicate: (el: React.ReactElement) => boolean,
  results: React.ReactElement[] = []
): React.ReactElement[] {
  if (!node || typeof node !== "object") return results;
  const el = node as React.ReactElement;

  // If this is a function component, render it to get its subtree
  if (typeof el.type === "function") {
    try {
      const rendered = (el.type as (props: unknown) => ReactNode)(el.props);
      collectElements(rendered, predicate, results);
    } catch {
      // ignore render errors
    }
    return results;
  }

  if (predicate(el)) results.push(el);

  const children = el.props?.children;
  if (Array.isArray(children)) {
    children.forEach((child: ReactNode) => collectElements(child, predicate, results));
  } else if (children) {
    collectElements(children as ReactNode, predicate, results);
  }
  return results;
}

function findAllByType(node: ReactNode, type: string): React.ReactElement[] {
  return collectElements(
    node,
    (el) => typeof el.type === "string" && el.type === type
  );
}

// ---------------------------------------------------------------------------
// Property 8: Social link rendering correctness
// Validates: Requirements 4.2, 4.3, 4.5, 4.7
// ---------------------------------------------------------------------------
describe("Property 8: Social link rendering correctness", () => {
  const ALLOWED_HREFS = new Set([
    "https://www.youtube.com/@OfficialWaresport",
    "https://www.instagram.com/mywaresport/",
    "https://x.com/waresport_",
  ]);

  it("every anchor has non-empty aria-label, target=_blank, rel=noopener noreferrer, and an allowed href", () => {
    // Property: for every anchor rendered by SocialLinksBar, the accessibility
    // and security attributes must be correct.
    // We render the component once (it has no props / no randomness) and
    // verify the invariants hold for all anchors.
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");

    expect(anchors.length).toBeGreaterThan(0);

    for (const anchor of anchors) {
      const { "aria-label": ariaLabel, target, rel, href } = anchor.props as {
        "aria-label": string;
        target: string;
        rel: string;
        href: string;
      };

      // aria-label must be non-empty
      expect(typeof ariaLabel).toBe("string");
      expect(ariaLabel.length).toBeGreaterThan(0);

      // Must open in new tab
      expect(target).toBe("_blank");

      // Must include noopener noreferrer
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");

      // href must be one of the three official Waresport social URLs
      expect(ALLOWED_HREFS.has(href)).toBe(true);
    }
  });

  it("YouTube SVG has fill #FF0000", () => {
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");

    // Find the YouTube anchor by aria-label
    const youtubeAnchor = anchors.find(
      (a) => (a.props as { "aria-label": string })["aria-label"] === "Waresport on YouTube"
    );
    expect(youtubeAnchor).toBeDefined();

    // Walk the SVG paths inside the YouTube anchor and find the red fill
    const paths = collectElements(
      youtubeAnchor as ReactNode,
      (el) => typeof el.type === "string" && el.type === "path"
    );
    const redPath = paths.find(
      (p) => (p.props as { fill?: string }).fill === "#FF0000"
    );
    expect(redPath).toBeDefined();
  });

  it("Twitter/X SVG has fill #000000", () => {
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");

    // Find the X anchor by aria-label
    const xAnchor = anchors.find(
      (a) =>
        (a.props as { "aria-label": string })["aria-label"] ===
        "Waresport on Twitter / X"
    );
    expect(xAnchor).toBeDefined();

    const paths = collectElements(
      xAnchor as ReactNode,
      (el) => typeof el.type === "string" && el.type === "path"
    );
    const blackPath = paths.find(
      (p) => (p.props as { fill?: string }).fill === "#000000"
    );
    expect(blackPath).toBeDefined();
  });

  it("Instagram SVG uses a linearGradient fill", () => {
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");

    const igAnchor = anchors.find(
      (a) =>
        (a.props as { "aria-label": string })["aria-label"] ===
        "Waresport on Instagram"
    );
    expect(igAnchor).toBeDefined();

    // There should be a linearGradient element in the SVG defs
    const gradients = collectElements(
      igAnchor as ReactNode,
      (el) => typeof el.type === "string" && el.type === "linearGradient"
    );
    expect(gradients.length).toBeGreaterThan(0);

    // The path fill should reference the gradient via url(#...)
    const paths = collectElements(
      igAnchor as ReactNode,
      (el) => typeof el.type === "string" && el.type === "path"
    );
    const gradientPath = paths.find((p) => {
      const fill = (p.props as { fill?: string }).fill ?? "";
      return fill.startsWith("url(#");
    });
    expect(gradientPath).toBeDefined();
  });

  // Property-based: even though SocialLinksBar takes no props, we use
  // fast-check to assert the invariants hold across multiple renders
  // (verifying the component is pure / deterministic).
  it("renders identically on every call (pure component)", () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const tree1 = SocialLinksBar();
        const tree2 = SocialLinksBar();
        const anchors1 = findAllByType(tree1, "a");
        const anchors2 = findAllByType(tree2, "a");

        expect(anchors1.length).toBe(anchors2.length);

        for (let i = 0; i < anchors1.length; i++) {
          const p1 = anchors1[i].props as { href: string; "aria-label": string };
          const p2 = anchors2[i].props as { href: string; "aria-label": string };
          expect(p1.href).toBe(p2.href);
          expect(p1["aria-label"]).toBe(p2["aria-label"]);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests for SocialLinksBar (Task 7.2)
// Validates: Requirements 4.2, 4.5
// ---------------------------------------------------------------------------
describe("SocialLinksBar — unit tests", () => {
  it("renders exactly three anchor elements", () => {
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");
    expect(anchors).toHaveLength(3);
  });

  it("renders the YouTube anchor with the correct href", () => {
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");
    const hrefs = anchors.map((a) => (a.props as { href: string }).href);
    expect(hrefs).toContain("https://www.youtube.com/@OfficialWaresport");
  });

  it("renders the Instagram anchor with the correct href", () => {
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");
    const hrefs = anchors.map((a) => (a.props as { href: string }).href);
    expect(hrefs).toContain("https://www.instagram.com/mywaresport/");
  });

  it("renders the Twitter/X anchor with the correct href", () => {
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");
    const hrefs = anchors.map((a) => (a.props as { href: string }).href);
    expect(hrefs).toContain("https://x.com/waresport_");
  });

  it("every anchor has a non-empty aria-label", () => {
    const tree = SocialLinksBar();
    const anchors = findAllByType(tree, "a");
    for (const anchor of anchors) {
      const ariaLabel = (anchor.props as { "aria-label": string })["aria-label"];
      expect(typeof ariaLabel).toBe("string");
      expect(ariaLabel.length).toBeGreaterThan(0);
    }
  });
});
