// 서비스 소개와 사례·팀·가격·FAQ를 원본의 흐름에 맞춰 구성합니다.
import Link from 'next/link';
import { Accordion, PriceCard } from '@manspick/design-system/components';
import { SectionHeader } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { money } from '@manspick/web/format';
import { ContactActions, localBooking, packageFacts } from '../site';
import type { PublicCatalog } from '../site/catalog';
import { BrandMedia } from './brand-media';
import { KnowHows } from './know-hows';
import styles from './landing.module.css';

const questions = [
  [
    '사진을 찍는 게 처음이어도 괜찮을까요?',
    '처음이어도 괜찮습니다. 설문으로 취향과 고민을 먼저 살펴보고, 촬영 중에는 담당 디렉터가 표정과 포즈를 안내합니다.',
  ],
  [
    '어디에서, 어떤 카메라로 촬영하나요?',
    '야외와 카페 등 자연스러운 공간에서 iPhone으로 촬영합니다. 구체적인 동네와 미팅 장소는 촬영 준비 과정에서 안내합니다.',
  ],
  [
    '입을 옷이나 헤어도 도움받을 수 있나요?',
    '의상 대여, 코디 제작, 동행 쇼핑, 제휴 헤어 서비스를 추가할 수 있습니다. 옵션별 비용과 담당 디렉터의 제공 가능 여부를 예약 과정에서 확인해 주세요.',
  ],
  [
    '보정본과 원본은 언제 받을 수 있나요?',
    '보정본은 평균 1~3일을 기준으로 안내하며 실제 일정은 촬영별로 확인합니다. 보정 수정은 최대 3회이며, 전체 원본은 후기 확인 후 공개됩니다.',
  ],
  [
    '일정 변경이나 취소는 어떻게 하나요?',
    localBooking
      ? '변경·취소는 직원이 확인하는 방식입니다. 이 로컬 미리보기에는 실제 상담 채널이 연결되어 있지 않습니다.'
      : '변경·취소가 필요하면 예약 접수 후 받은 안내를 통해 운영팀에 연락해주세요.',
  ],
] as const;

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <SectionHeader
      heading="h2"
      eyebrow={eyebrow}
      title={title}
      description={description}
      className={styles.sectionHeading}
    />
  );
}

function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroPortraits} aria-hidden="true">
        {(['hero-after-1', 'hero-after-2', 'hero-after-3', 'hero-after-4'] as const).map(
          (name, index) => (
            <BrandMedia
              key={name}
              name={name}
              label="맨즈픽 촬영 사례"
              className={`${styles.portrait} ${styles[`portrait${index + 1}`]}`}
              decorative
            />
          ),
        )}
      </div>
      <div className={styles.heroContent}>
        <p className={styles.heroEyebrow}>매력수치 ZERO, 무색무취 프로필 사진에서</p>
        <h1 id="hero-title">
          호감형 프로필로
          <br />
          바꾸고 <span>연애까지.</span>
        </h1>
        <p className={styles.heroDescription}>
          나에게 어울리는 스타일, 자연스러운 나의 매력.
          <br />
          맨즈픽과 함께 새로운 첫인상을 만나보세요.
        </p>
        <div className={styles.heroActions}>
          <a href="#contact" className={styles.primaryLink}>
            무료 상담 신청하기 <Icon name="arrow" size={18} />
          </a>
          <a href="#packages" className={styles.secondaryLink}>
            패키지 먼저 보기 <Icon name="arrow" size={18} />
          </a>
        </div>
        <a className={styles.heroCaseLink} href="#before-after">
          변신 사례 먼저 구경하기 <Icon name="solar/arrow-down-linear" size={15} />
        </a>
      </div>
      <span className={styles.heroBottom}>YOUR NEXT CHAPTER STARTS HERE</span>
    </section>
  );
}

function StorySections() {
  return (
    <>
      <section className={styles.featured} aria-labelledby="featured-title">
        <h2 id="featured-title">FEATURED IN</h2>
        <p>자연스러운 매력을 발견하는 남성 스타일링 · 프로필 촬영</p>
      </section>
      <section id="approach" className={`${styles.container} ${styles.section}`}>
        <SectionTitle
          eyebrow="PROBLEM & SOLUTION"
          title="사진 속 내가, 나답지 않게 느껴졌다면."
          description="낯선 모습으로 바꾸기보다, 이미 가진 매력이 잘 드러나도록."
        />
        <div className={styles.problemGrid}>
          <div className={styles.problem}>
            <span>BEFORE</span>
            <h3>
              무엇을 입고,
              <br />
              어떻게 웃어야 할지.
            </h3>
            <p>스타일과 포즈가 고민이던 순간.</p>
          </div>
          <div className={styles.problemArrow} aria-hidden="true">
            <Icon name="arrow" size={28} />
          </div>
          <div className={styles.solution}>
            <span>WITH MANSPICK</span>
            <h3>
              나를 알아가는 준비,
              <br />
              편안함이 담기는 사진.
            </h3>
            <p>스타일링부터 촬영·보정까지 함께합니다.</p>
          </div>
        </div>
      </section>
      <section id="before-after" className={`${styles.section} ${styles.surfaceSection}`}>
        <div className={styles.container}>
          <SectionTitle
            eyebrow="BEFORE & AFTER"
            title="같은 사람, 달라지는 첫인상."
            description="스타일과 표정, 자연스러운 한 장이 만드는 변화."
          />
          <div className={styles.caseGrid}>
            {([1, 2, 3] as const).map((item) => (
              <div className={styles.casePair} key={item}>
                <BrandMedia
                  name={`hero-before-${item}`}
                  label={`변신 사례 ${item} 촬영 전`}
                  caption="BEFORE"
                />
                <BrandMedia
                  name={`hero-after-${item}`}
                  label={`변신 사례 ${item} 촬영 후`}
                  caption="AFTER"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="impact" className={`${styles.container} ${styles.section}`}>
        <SectionTitle eyebrow="REAL IMPACT" title="좋은 사진을 넘어, 나를 보는 새로운 시선." />
        <div className={styles.impactGrid}>
          {[
            ['STYLE', '나에게 맞는 스타일', '취향과 원하는 인상을 함께 살펴봅니다.'],
            ['PHOTO', '자연스러운 한 장', '일상의 공간에서 편안한 모습을 담습니다.'],
            ['YOURSELF', '다시 발견하는 나', '나다운 장면을 직접 선택하고 완성합니다.'],
          ].map(([label, title, description]) => (
            <article className={styles.impactItem} key={label}>
              <span>{label}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <KnowHows />
      <section id="team" className={`${styles.container} ${styles.section}`}>
        <SectionTitle
          eyebrow="TEAM MANSPICK"
          title="당신의 매력을 함께 찾는 사람들."
          description="준비부터 촬영까지, 담당 디렉터와 함께합니다."
        />
        <div className={styles.teamGrid}>
          <BrandMedia
            name="team-influencer-3"
            label="맨즈픽 팀 소개 섹션의 인물 사진"
            className={styles.teamMedia}
          />
          <div className={styles.teamCopy}>
            <span className={styles.eyebrow}>YOUR DIRECTOR</span>
            <h3>
              편안한 분위기에서
              <br />
              나다운 표정이 나올 수 있도록.
            </h3>
            <p>
              설문을 통해 취향과 고민을 먼저 살피고, 의상과 촬영 분위기를 준비합니다. 촬영 중에는
              표정과 포즈를 함께 맞춰갑니다.
            </p>
            <a href="#process" className={styles.textLink}>
              함께하는 과정 보기 <Icon name="arrow" size={17} />
            </a>
          </div>
        </div>
      </section>
      <section id="reviews" className={`${styles.section} ${styles.surfaceSection}`}>
        <div className={styles.container}>
          <SectionTitle eyebrow="REAL REVIEWS" title="맨즈픽을 경험한 이야기." />
          <div className={styles.reviewEmpty}>
            <Icon name="solar/chat-square-like-bold" size={34} />
            <p>공개 동의와 원문 확인을 마친 후기를 준비하고 있습니다.</p>
          </div>
        </div>
      </section>
      <section className={`${styles.container} ${styles.bridge}`}>
        <span className={styles.eyebrow}>YOUR NEXT CHAPTER</span>
        <h2>
          다음 사진에는,
          <br />
          새로운 나의 모습을.
        </h2>
        <Link href="/recommend" className={styles.primaryLink}>
          나에게 맞는 촬영 찾기 <Icon name="arrow" size={18} />
        </Link>
      </section>
    </>
  );
}

function ServiceSections({ catalog }: { catalog: PublicCatalog | null }) {
  const packages = catalog?.packages ?? [];
  const addons = catalog?.addons ?? [];
  return (
    <>
      <section id="process" className={`${styles.section} ${styles.surfaceSection}`}>
        <div className={styles.container}>
          <SectionTitle
            eyebrow="THE PROCESS"
            title="처음부터 마지막까지, 다음을 알 수 있도록."
            description="개인 안내 페이지에서 예약과 준비, 사진 선택과 결과물까지 이어집니다."
          />
          <ol className={styles.process}>
            {[
              ['상담과 예약', '패키지와 일정을 정하고 촬영을 예약합니다.'],
              ['나에게 맞는 준비', '설문과 의상 사진을 바탕으로 촬영을 준비합니다.'],
              ['자연스러운 촬영', '디렉터와 함께 나다운 표정과 분위기를 찾습니다.'],
              ['선택과 완성', '사진을 고르고 보정본과 후속 안내를 받습니다.'],
            ].map(([title, description], index) => (
              <li key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="packages" className={`${styles.container} ${styles.section}`}>
        <SectionTitle
          eyebrow="PRICING"
          title="나에게 맞는 만큼, 나다운 선택."
          description="원하는 스타일과 촬영 시간에 맞춰 선택하세요."
        />
        {packages.length ? (
          <div className={styles.priceGrid}>
            {packages.map((item) => (
              <PriceCard
                key={item.id}
                title={item.name}
                description={item.description}
                price={money(item.price)}
                recommendation={item.id === 'hybrid' ? '두 가지 무드' : undefined}
                features={[...Object.values(packageFacts(item)), '스타일링·포즈 안내']}
                action={
                  <a
                    href="#contact"
                    className={item.id === 'hybrid' ? styles.primaryLink : styles.secondaryLink}
                  >
                    {item.name} 상담 안내 <Icon name="arrow" size={16} />
                  </a>
                }
              />
            ))}
          </div>
        ) : (
          <p className={styles.sectionNote}>지금은 상품 정보를 표시할 수 없습니다.</p>
        )}
        {addons.length > 0 && (
          <div className={styles.addons}>
            <span>필요한 도움을 더하세요</span>
            <p>{addons.map((addon) => addon.name).join(' · ')}</p>
            <Link href="/legal" className={styles.textLink}>
              서비스 안내 <Icon name="arrow" size={15} />
            </Link>
          </div>
        )}
        {packages.length > 0 && (
          <p className={styles.sectionNote}>
            추가 옵션은 별도입니다. 예약 화면에서 구성과 최종 금액을 확인해주세요.
          </p>
        )}
      </section>
      <section id="faq" className={`${styles.section} ${styles.surfaceSection}`}>
        <div className={styles.faqLayout}>
          <SectionTitle eyebrow="FAQ" title="궁금한 점이 있으신가요?" />
          <div className={styles.faqList}>
            {questions.map(([title, answer]) => (
              <Accordion key={title} title={title}>
                {answer}
              </Accordion>
            ))}
          </div>
        </div>
      </section>
      <section id="contact" className={styles.finalCta}>
        <div className={styles.ctaGlow} aria-hidden="true" />
        <div className={styles.container}>
          <span className={styles.eyebrow}>MAKE YOUR FIRST IMPRESSION</span>
          <h2>
            사진 속 내가,
            <br />
            <span>마음에 들기 시작하는 순간.</span>
          </h2>
          <p>
            어떤 촬영이 맞을지 천천히 살펴보세요.
            <br />
            {localBooking
              ? '지금은 로컬 예약 과정을 체험할 수 있습니다.'
              : '예약 화면에서 촬영 구성과 일정을 확인해보세요.'}
          </p>
          <ContactActions />
        </div>
      </section>
    </>
  );
}

export function LandingPage({ catalog }: { catalog: PublicCatalog | null }) {
  return (
    <main id="main-content">
      <Hero />
      <StorySections />
      <ServiceSections catalog={catalog} />
    </main>
  );
}
