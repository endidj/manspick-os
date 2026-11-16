// 검색로봇이 모든 응답의 noindex를 읽게 허용하며 사이트맵은 알리지 않습니다.
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' } };
}
