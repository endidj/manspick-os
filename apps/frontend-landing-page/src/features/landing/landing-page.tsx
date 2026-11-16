// 운영 원본의 전체 흐름을 서버 컴포넌트로 조합하고 효과를 별도 경계에 연결합니다.
import { SourceExperience } from './source-experience';
import { SourceBackdrop, SourceNavigation, SourceOverlays, SourceFooter } from './source-chrome';
import { SourceHero } from './source-hero';
import { SourceProof } from './source-proof';
import { SourceHow } from './source-how';
import { SourceReviews } from './source-reviews';
import { SourceOffer } from './source-offer';

export function LandingPage() {
  return (
    <SourceExperience>
      <SourceBackdrop />
      <SourceNavigation />
      <main id="main-content">
        <SourceHero />
        <SourceProof />
        <SourceHow />
        <SourceReviews />
        <SourceOffer />
      </main>
      <SourceOverlays />
      <SourceFooter />
    </SourceExperience>
  );
}
