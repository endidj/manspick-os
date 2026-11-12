// 기존 Fetch 응답의 쿠키와 파일 스트림을 Nest의 표준 Express HTTP 응답으로 전달합니다.
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import type { ServerResponse } from 'node:http';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

export async function writeResponse(outgoing: ServerResponse, response: Response) {
  outgoing.statusCode = response.status;
  response.headers.forEach((value, name) => {
    if (name !== 'set-cookie') outgoing.setHeader(name, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) outgoing.setHeader('set-cookie', cookies);
  if (!response.body || outgoing.req.method === 'HEAD') {
    await response.body?.cancel();
    outgoing.end();
    return;
  }
  try {
    await pipeline(Readable.fromWeb(response.body as NodeReadableStream<Uint8Array>), outgoing);
  } catch {
    // 연결 종료 뒤에는 JSON 오류를 다시 쓰거나 처리되지 않은 Promise를 만들지 않습니다.
    outgoing.destroy();
  }
}

export class ApiExpressAdapter extends ExpressAdapter {
  constructor() {
    const instance = express();
    // ExpressAdapter 생성자가 첫 middleware를 등록하기 전에 Router 설정을 확정합니다.
    instance.disable('x-powered-by');
    instance.enable('case sensitive routing');
    instance.enable('strict routing');
    super(instance);
  }

  override reply(response: ServerResponse, body: unknown, statusCode?: number) {
    if (body instanceof Response) return writeResponse(response, body);
    return super.reply(response, body, statusCode);
  }
}
