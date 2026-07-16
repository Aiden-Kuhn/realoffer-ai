// Test-only stub for the "server-only" package. Under Node's default
// package export condition, the real "server-only" module unconditionally
// throws (it's designed to only resolve cleanly under Next.js's
// "react-server" bundler condition). Vitest runs under plain Node, so we
// alias it to this no-op in vitest.config.ts instead of disabling the
// safety check in application code.
export {};
