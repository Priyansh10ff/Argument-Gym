// ─── API helpers for Convex ────────────────────────────────────────────────
// These are thin wrappers around Convex client calls.
// Components should prefer using useQuery/useMutation/useAction directly,
// but these helpers exist for backward compatibility with useGym.js

// Convex site URL for HTTP actions (streaming)
export function getConvexSiteUrl() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL || '';
  return convexUrl.replace('.cloud', '.site');
}

// Streaming argue — returns a ReadableStream reader
export async function streamArgue(body) {
  const siteUrl = getConvexSiteUrl();
  const response = await fetch(`${siteUrl}/api/stream/argue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Stream failed: ${response.status}`);
  }

  return response.body.getReader();
}

// Parse SSE stream events
export async function* parseSSEStream(reader) {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6));
        } catch (_) {}
      }
    }
  }

  // Process remaining buffer
  if (buffer.startsWith('data: ')) {
    try {
      yield JSON.parse(buffer.slice(6));
    } catch (_) {}
  }
}
