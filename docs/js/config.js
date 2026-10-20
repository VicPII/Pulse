// Flip to true only for local testing against the Java server. The static site must work with false.
export const USE_BACKEND = false;
export const API_BASE = 'http://localhost:8080/api';

const params = new URLSearchParams(location.search);

export const HOUR = 3600e3;
export const NUDGE_COOLDOWN_MS = 3 * HOUR; // per sender and recipient
export const STALE_AFTER_MS = 48 * HOUR; // after this, a member reads as "quiet lately"

// Hidden query flags: ?debug=1 (tap/time log), ?sim=0 (no simulated teammates), ?clean=1 (hide demo bar)
export const DEBUG = params.get('debug') === '1';
export const CLEAN = params.get('clean') === '1';

export const SIM = {
  enabled: params.get('sim') !== '0',
  nudgeReplyMs: 8000, // long enough to switch to the nudged teammate and see the receive state
  helpOfferMs: [4000, 10000], // when teammates answer an SOS
};

export const DEFAULT_USER_ID = 'm-alex';

export const FLAG_PRESETS = [
  { label: 'Need clarification', icon: '❓' },
  { label: 'Blocked', icon: '🚧' },
  { label: 'Need a review', icon: '👀' },
  { label: 'Need more time', icon: '⏳' },
];
