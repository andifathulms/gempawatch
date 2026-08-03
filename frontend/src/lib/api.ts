/**
 * API entry point. Every component imports `api` from here and never needs to
 * know which deployment mode it is running in.
 *
 *   NEXT_PUBLIC_DATA_MODE=live    (default) → talks to Django/DRF
 *   NEXT_PUBLIC_DATA_MODE=static           → reads the prebuilt export
 *
 * The mode is read from an inlined build-time constant, so the unused client is
 * eliminated by the bundler rather than shipped to the browser.
 */
import { API_BASE, liveApi, type GempaApi } from "./api.live";
import { staticApi } from "./api.static";

export const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE === "static" ? "static" : "live";

/** True when the deployment has no backend: no alerts, no live polling. */
export const IS_STATIC = DATA_MODE === "static";

export const api: GempaApi = IS_STATIC ? staticApi : liveApi;

export type { GempaApi };
export { API_BASE };
