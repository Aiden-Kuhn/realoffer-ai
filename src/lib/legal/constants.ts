/**
 * Fixed on purpose — this is the date these documents were last written,
 * not "today." Computing it from `new Date()` at request time would make
 * the effective date silently drift forward every day the site is loaded,
 * which misrepresents when the policy actually took effect. Update this
 * string (and the document text) together when the documents next change.
 */
export const LEGAL_LAST_UPDATED = "July 26, 2026";
