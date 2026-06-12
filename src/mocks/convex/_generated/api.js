function createApiProxy(path = []) {
  return new Proxy(
    function apiPath() {
      return path.join(".");
    },
    {
      get(_target, property) {
        if (property === "__path") return path.join(".");
        if (property === "toString") return () => path.join(".");
        if (property === Symbol.toPrimitive) return () => path.join(".");
        return createApiProxy([...path, String(property)]);
      },
      apply() {
        return path.join(".");
      },
    },
  );
}

export const api = createApiProxy();
