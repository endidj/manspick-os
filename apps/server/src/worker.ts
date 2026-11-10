// Cloudflare Worker의 요청을 API 라우터로 전달합니다.
import { handleRequest } from './http/app.ts';

const worker = { fetch: handleRequest };
export default worker;
