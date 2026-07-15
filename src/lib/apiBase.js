const DEFAULT_API_BASE_URL = 'https://terra-ai-revised.onrender.com';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes("terra-ai-revised-backend")) {
    return envUrl.trim().replace(/\/$/, '');
  }
  return DEFAULT_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

const API_PREFIXES = ['/api/', '/health', '/ready'];

function shouldRewrite(pathname) {
  return API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function toAbsoluteUrl(input) {
  if (input instanceof URL) return input;
  if (typeof input === 'string') return new URL(input, window.location.origin);
  if (input instanceof Request) return new URL(input.url);
  return null;
}

function rewriteUrl(url) {
  if (!url) return url;
  const sameOrigin = url.origin === window.location.origin;
  if (!sameOrigin || !shouldRewrite(url.pathname)) {
    return url;
  }
  return new URL(`${API_BASE_URL}${url.pathname}${url.search}${url.hash}`);
}

function installApiBaseFetchPatch() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }
  if (window.__terraApiBaseInstalled) {
    return;
  }

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    const absoluteUrl = toAbsoluteUrl(input);
    const rewrittenUrl = rewriteUrl(absoluteUrl);

    if (!rewrittenUrl || rewrittenUrl === absoluteUrl) {
      return nativeFetch(input, init);
    }

    if (input instanceof Request) {
      return nativeFetch(new Request(rewrittenUrl.toString(), input), init);
    }

    return nativeFetch(rewrittenUrl.toString(), init);
  };

  window.__terraApiBaseInstalled = true;
}

installApiBaseFetchPatch();

export { API_BASE_URL, installApiBaseFetchPatch };