// Detects actual mobile/tablet devices (Android phones, iPhones, iPads, etc.) by
// user agent, not by screen/window size — several desktop monitors on premises
// are as small as 12", so a width-based check would wrongly block those.
const MOBILE_UA_PATTERN =
  /Android|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini|Mobile|webOS/i;

export function isMobileDevice() {
  const ua = navigator.userAgent || navigator.vendor || "";

  if (MOBILE_UA_PATTERN.test(ua)) return true;

  // iPadOS 13+ reports itself as "Macintosh" but exposes multi-touch, unlike a real Mac.
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;

  return false;
}
