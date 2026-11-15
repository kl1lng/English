// Caching rules for the service worker. A classic script: sw.js loads it with importScripts and the
// unit test loads it with new Function, so it only touches the global `self`.
(function (scope) {
  scope.swRules = {
    // Returns "never" | "cache-first" | "network-first" for a request.
    shouldCache: function (url, method, origin) {
      if (method !== "GET") return "never";
      var parsed;
      try {
        parsed = new URL(url);
      } catch (e) {
        return "never";
      }
      if (parsed.origin !== origin) return "never";
      var path = parsed.pathname;
      if (path.indexOf("/api/") === 0) return "never";
      if (path.indexOf("/audio/") === 0 || path.indexOf("/photos/") === 0 || path.indexOf("/icons/") === 0)
        return "cache-first";
      if (path === "/" || path === "/index.html" || path === "/manifest.webmanifest" || path.indexOf("/assets/") === 0)
        return "network-first";
      return "never";
    },
  };
})(self);
