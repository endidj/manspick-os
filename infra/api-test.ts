// 관리자 테스트 앱의 Service Binding 요청을 전용 Nest API와 D1·R2에 연결합니다.
import { adminTestWorker } from '../apps/server/src/runtime/admin-test.ts';
import { handleRequest } from '../apps/server/src/runtime/worker-handler.ts';

export default adminTestWorker(handleRequest);
