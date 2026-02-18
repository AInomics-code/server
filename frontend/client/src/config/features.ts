/**
 * Feature flags for experimental features
 */

/**
 * Check if experimental report layout is enabled
 * Checks localStorage first, then environment variable
 * Default: false
 */
export const USE_EXPERIMENTAL_REPORT_LAYOUT = ((): boolean => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('experimental_report_layout');
    if (stored === 'true') {
      return true;
    }
    if (stored === 'false') {
      return false;
    }
  }
  
  // Check environment variable
  if (import.meta.env.VITE_EXPERIMENTAL_REPORT_LAYOUT === 'true') {
    return true;
  }

  // Dev default: ON (can be overridden by localStorage)
  if (import.meta.env.DEV) {
    return true;
  }
  
  return false;
})();

/**
 * Set the experimental report layout feature flag
 * @param enabled - Whether to enable the experimental layout
 * @returns The new value
 */
export function setExperimentalReportLayout(enabled: boolean): boolean {
  if (typeof window !== 'undefined') {
    localStorage.setItem('experimental_report_layout', enabled.toString());
  }
  return enabled;
}
