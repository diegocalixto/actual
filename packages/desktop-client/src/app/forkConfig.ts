/**
 * Upstream behaviour this fork switches off, in one place.
 *
 * Diego Finance is deployed by its owner from this fork's own commits, so the
 * upstream app's prompts about upstream releases and its first-run tour do not
 * apply to it. Each switch is read where the behaviour lives; turning one back
 * on restores the upstream code path unchanged.
 */
export const forkConfig = {
  /**
   * Upstream announces each Actual release ("A new version of Actual is
   * available!") from GitHub's latest tag. A release of upstream is not
   * something a user of this fork can install, so the check is not made and
   * nothing is announced. The service worker's own "reload to update" prompt,
   * which is about this fork's deployed build, is unaffected.
   */
  announceUpstreamReleases: false,

  /**
   * Upstream greets every new file on a wide screen with "Welcome to Actual!"
   * and an offer of its tour. The tour walks the classic budget table, which
   * the V2 Budget does not render, so the offer is not made.
   */
  offerOnboardingTour: false,

  /**
   * The language used when this device has no language chosen in Settings.
   *
   * The language preference is stored per device, and a phone that never had
   * one chosen followed its browser's language list instead — which on the
   * owner's iPhone resolved to English and left every screen in English. The
   * fork is written for a Brazilian user, so a device without a choice starts
   * in Portuguese; English (or any other language) chosen in Settings still
   * wins. Tests (user agent "playwright") keep following the browser's
   * locale, which is how the English and pt-BR suites select their language.
   */
  defaultLanguage: 'pt-BR',
} as const;
