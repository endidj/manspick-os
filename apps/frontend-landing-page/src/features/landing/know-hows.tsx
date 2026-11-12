// 원본의 다섯 노하우를 설명과 실제 사진이 교차하는 긴 소개 구역으로 구성합니다.
import { SectionHeader } from '@manspick/design-system/patterns';
import type { BrandImageName } from '@manspick/design-system/assets';
import { BrandMedia } from './brand-media';
import styles from './landing.module.css';

const stylingNames: readonly BrandImageName[] = [
  'styling-1',
  'styling-2',
  'styling-3',
  'styling-4',
  'styling-5',
  'styling-6',
  'styling-7',
  'styling-8',
  'styling-9',
  'styling-10',
  'styling-11',
  'styling-12',
];

export function KnowHows() {
  return (
    <section id="hows" className={`${styles.section} ${styles.surfaceSection}`}>
      <div className={styles.container}>
        <SectionHeader
          heading="h2"
          eyebrow="5 HOWs"
          title={'이성이 먼저 연락하게 되는 사진,\n맨즈픽의 5가지 노하우'}
          className={`${styles.sectionHeading} ${styles.howHeading}`}
        />
        <div className={styles.howRows}>
          <article className={styles.howRow}>
            <div className={styles.howCopy}>
              <span>01 / STYLING</span>
              <h3>
                나에게 어울리는
                <br />
                스타일을 찾습니다.
              </h3>
              <p>
                취향과 원하는 인상을 살피고, 의상과 분위기를 함께 준비합니다. 평소와 다른 스타일도
                나답게 소화할 수 있도록.
              </p>
            </div>
            <div className={styles.stylingGallery}>
              {stylingNames.slice(0, 3).map((name) => (
                <BrandMedia key={name} name={name} label="맨즈픽 스타일링 촬영 사례" />
              ))}
            </div>
          </article>
          <article className={styles.howRow}>
            <div className={styles.howCopy}>
              <span>02 / VARIETY</span>
              <h3>
                한 가지 모습에
                <br />
                머물지 않도록.
              </h3>
              <p>
                의상과 공간, 표정에 따라 달라지는 분위기. 다양한 스타일 속에서 내가 좋아하는 장면을
                발견합니다.
              </p>
            </div>
            <div className={styles.varietyGallery}>
              {stylingNames.map((name) => (
                <BrandMedia key={name} name={name} label="맨즈픽 다양한 사진 스타일링 사례" />
              ))}
            </div>
          </article>
          <article className={styles.howRow}>
            <div className={styles.howCopy}>
              <span>03 / RETOUCHING</span>
              <h3>
                매력은 살리고,
                <br />
                나다움은 남기고.
              </h3>
              <p>
                마음에 드는 사진을 고르고 원하는 보정 방향을 전합니다. 보정본은 평균 1~3일, 수정은
                최대 3회 기준으로 안내합니다.
              </p>
            </div>
            <div className={styles.retouchGallery}>
              {(['before', 'after'] as const).flatMap((phase) =>
                ([1, 2, 3] as const).map((number) => (
                  <BrandMedia
                    key={`${phase}-${number}`}
                    name={`retouch-${phase}-${number}`}
                    label={`보정 사례 ${number} ${phase === 'before' ? '보정 전' : '보정 후'}`}
                    caption={phase.toUpperCase()}
                  />
                )),
              )}
            </div>
          </article>
          <article className={styles.howRow}>
            <div className={styles.howCopy}>
              <span>04 / STYLE CHECK</span>
              <h3>
                다른 시선에서도,
                <br />
                자연스러운 나의 모습.
              </h3>
              <p>
                나에게 어울리는 의상과 분위기를 함께 살피고, 촬영 중에는 표정과 포즈를 맞춰갑니다.
                낯선 카메라 앞에서도 편안할 수 있도록.
              </p>
              <a className={styles.textLink} href="#process">
                함께하는 과정 보기
              </a>
            </div>
            <div className={styles.crossCheckGallery}>
              <BrandMedia name="cross-check-1" label="안경을 쓰고 거울로 스타일을 확인하는 남성" />
              <BrandMedia name="cross-check-2" label="붉은 옷을 입은 여성의 스타일 참고 사진" />
            </div>
          </article>
          <article className={styles.howRow}>
            <div className={styles.howCopy}>
              <span>05 / SPACE & PROPS</span>
              <h3>
                자연스러운 공간,
                <br />
                이야기가 있는 장면.
              </h3>
              <p>
                야외와 카페 등 일상의 공간에서 iPhone으로 촬영합니다. 공간과 소품을 활용해 편안한
                표정과 분위기를 담습니다.
              </p>
            </div>
            <div className={styles.spaceGallery}>
              {(
                ['location-1', 'location-2', 'location-3', 'props-1', 'props-2', 'props-3'] as const
              ).map((name) => (
                <BrandMedia key={name} name={name} label="맨즈픽 촬영 공간과 소품" />
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
