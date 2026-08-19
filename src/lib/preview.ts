/** True inside the Lovable preview / local dev — used to skip the PIN and auth gates. */
export const isPreviewEnv = () => {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.startsWith("id-preview--") || host.startsWith("preview--") || host === "localhost";
};
