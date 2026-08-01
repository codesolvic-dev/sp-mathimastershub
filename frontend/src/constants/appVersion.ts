/**
 * App release version — keep in sync with package.json and doc/CHANGELOG_*.md
 */
export const APP_VERSION = "1.0.3";
export const APP_VERSION_LABEL = `v${APP_VERSION}`;
export const APP_RELEASE_DATE = "2026-07-20";

export type ChangelogSection = {
  title: string;
  items: string[];
};

export type ChangelogRelease = {
  version: string;
  date: string;
  title: string;
  sections: ChangelogSection[];
};

/** Shown in Developer → Control Panel */
export const CURRENT_CHANGELOG: ChangelogRelease = {
  version: APP_VERSION,
  date: APP_RELEASE_DATE,
  title: "Control Panel, Maintenance Mode & Order Acceptance",
  sections: [
    {
      title: "Added",
      items: [
        "Developer Control Panel for site-wide controls",
        "Website Maintenance Mode with full customize (bg, text, countdown, socials, SEO)",
        "Live preview (Desktop / Tablet / Mobile) and sticky save actions",
        "Company → Order acceptance on/off with custom pause message",
        "Backend blocks new orders when acceptance is off",
        "Version + changelog summary in Control Panel",
      ],
    },
    {
      title: "Changed",
      items: [
        "Control Panel is the first Developer sidebar tab",
        "Cart / checkout respect temporary order pause",
        "Welcome popup hidden during maintenance mode",
      ],
    },
    {
      title: "Fixed",
      items: [
        "Control Panel footer no longer overlaps the developer sidebar",
      ],
    },
  ],
};
