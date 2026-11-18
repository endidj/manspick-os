// 단계 주소에서도 같은 추천 화면을 열어 브라우저 기록의 응답을 복원합니다.
import RecommendPage, { metadata as recommendMetadata } from '../page';

export const metadata = recommendMetadata;
export const dynamic = 'force-dynamic';
export default RecommendPage;
