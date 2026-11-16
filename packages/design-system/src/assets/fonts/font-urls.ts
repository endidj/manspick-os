// 첫 화면에 쓰이는 영문 글꼴과 기본 문자 조각의 같은 호스트 URL을 제공합니다.
import geist from './GeistVariable.woff2?url';
import pretendardCommon from './pretendard/woff2-dynamic-subset/PretendardVariable.subset.91.woff2?url';
import landingBody from './landing/ManspickLandingSans.woff2?url';
import landingDisplay from './landing/ManspickLandingDisplay.woff2?url';

export const criticalFontUrls = { pretendardCommon, geist } as const;
export const landingFontUrls = { body: landingBody, display: landingDisplay } as const;
