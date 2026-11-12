/**
 * Geração de IDs únicos compatível com contextos inseguros (HTTP em LAN).
 *
 * `crypto.randomUUID()` só existe em secure contexts (HTTPS ou localhost).
 * Como o portal também é usado via `http://192.168.x.x:5173` (ex.: celular na
 * mesma rede), caímos para `crypto.getRandomValues` (disponível em HTTP) e,
 * por último, para `Math.random`. O resultado continua sendo um UUID v4.
 */

function formatUUID(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

export function createId(): string {
  const webCrypto = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined;

  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    try {
      return webCrypto.randomUUID();
    } catch {
      // Secure context exigido — segue para o fallback abaixo
    }
  }

  const bytes = new Uint8Array(16);

  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return formatUUID(bytes);
}
