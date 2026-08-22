import { join, normalize } from 'node:path';

export function startStaticServer(root: string): Bun.Server<undefined> {
  return Bun.serve({
    port: 0,
    async fetch(request) {
      const { pathname } = new URL(request.url);
      const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
      const filePath = normalize(join(root, relativePath));
      if (!filePath.startsWith(`${normalize(root)}/`)) {
        return new Response('Not found', { status: 404 });
      }
      const file = Bun.file(filePath);
      return (await file.exists())
        ? new Response(file)
        : new Response('Not found', { status: 404 });
    },
  });
}
