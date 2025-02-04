export function isApiRoute({ path }: { path: string }) {
  return path.startsWith('/api/') || path === '/api';
};
