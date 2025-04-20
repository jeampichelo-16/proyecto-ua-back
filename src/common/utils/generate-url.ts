export function generateFrontendUrl(base: string, path: string, token: string) {
    return `${base}${path}?token=${token}`;
  }
  