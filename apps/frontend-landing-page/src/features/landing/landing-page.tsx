// 운영 원본의 전체 흐름을 서버 컴포넌트로 조합하고 효과를 별도 경계에 연결합니다.
import { SourceExperience } from './source-experience';
import { SourceNavigation, SourceOverlays, SourceFooter } from './source-chrome';
import { SourceHero } from './source-hero';
import { SourceProof, SourceImpact, SourceNotifications } from './source-proof';
import { SourceHow, SourceTeamModal } from './source-how';
import { SourceReviews } from './source-reviews';
import { SourceOffer } from './source-offer';

export function LandingPage() {
  return (
    <SourceExperience>
      <SourceNavigation />
      <main id="main-content">
        <SourceHero />
        <SourceImpact />
        <SourceProof />
        <SourceNotifications />
        <SourceHow />
        <SourceReviews />
        <SourceOffer />
      </main>
      <SourceTeamModal />
      <SourceOverlays />
      <SourceFooter />
    </SourceExperience>
  );
}
