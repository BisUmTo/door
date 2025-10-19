const normalizePath = (path: string) => {
  return path.startsWith("/") ? path.slice(1) : path;
};

const joinBase = (base: string, normalizedPath: string) => {
  if (!base.endsWith("/")) {
    base = `${base}/`;
  }
  return `${base}${normalizedPath}`;
};

export const assetUrl = (path: string): string => {
  const normalizedPath = normalizePath(path);

  if (import.meta.env.DEV) {
    return joinBase(import.meta.env.BASE_URL ?? "/", normalizedPath);
  }

  if (typeof window === "undefined") {
    return `./${normalizedPath}`;
  }

  return new URL(normalizedPath, window.location.href).toString();
};
