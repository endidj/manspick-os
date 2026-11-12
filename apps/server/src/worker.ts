// Cloudflare Worker의 요청을 NestJS Node HTTP 서버로 전달합니다.
import { handleRequest } from './runtime/worker-handler.ts';

const worker = { fetch: handleRequest };
export default worker;
