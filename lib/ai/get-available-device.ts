/**
 * Probes whether WebGPU is actually usable (not just the API existing).
 *
 * `navigator.gpu` exists in Chrome on Linux even when no GPU adapter
 * is available, so `doesBrowserSupportTransformersJS()` returns `true`
 * even though `requestAdapter()` will fail. This function actually
 * attempts to acquire an adapter.
 */
export async function getAvailableDevice(): Promise<
  "webgpu" | "wasm"
> {
  // Don't even bother if the API isn't present
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    return "wasm"
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpu = (navigator as any).gpu as {
      requestAdapter(): Promise<{ lose?: () => void } | null>
    }
    const adapter = await gpu.requestAdapter()
    if (adapter) {
      return "webgpu"
    }
  } catch {
    // requestAdapter threw or failed — no WebGPU
  }

  return "wasm"
}
