import { proxyRequest } from '@manspick/web/proxy';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const handler = (request: Request) => proxyRequest(request, 'admin');
export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
