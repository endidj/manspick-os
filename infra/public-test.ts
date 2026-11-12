// 랜딩·고객 테스트 앱의 Service Binding 요청을 전용 Nest API와 D1·R2에 연결합니다.
import { publicTestWorker } from '../apps/server/src/runtime/public-test.ts';
import { handleRequest } from '../apps/server/src/runtime/worker-handler.ts';

export default publicTestWorker(handleRequest);
