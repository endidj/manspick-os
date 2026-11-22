// 원본과 같은 Chart.js 레이더를 필요할 때만 불러오고 고민 선택에 연결합니다.
import { semanticTokens } from '@manspick/design-system/tokens';

type RadarDataset = {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointRadius: number;
};

type RadarConfiguration = {
  type: 'radar';
  data: { labels: string[]; datasets: RadarDataset[] };
  options: Record<string, unknown>;
};

type RadarInstance = {
  data: RadarConfiguration['data'];
  update: () => void;
  destroy: () => void;
};

type ChartConstructor = new (
  canvas: HTMLCanvasElement,
  configuration: RadarConfiguration,
) => RadarInstance;

type ChartWindow = Window & { Chart?: ChartConstructor };

let chartScript: Promise<ChartConstructor> | undefined;

function loadChart(): Promise<ChartConstructor> {
  const loaded = (window as ChartWindow).Chart;
  if (loaded) return Promise.resolve(loaded);
  if (chartScript) return chartScript;
  chartScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/vendor/chartjs/chart.umd.min.js';
    script.async = true;
    script.dataset.manspickRadar = '4.6.1';
    script.onload = () => {
      const chart = (window as ChartWindow).Chart;
      script.onload = null;
      script.onerror = null;
      if (chart) resolve(chart);
      else {
        chartScript = undefined;
        script.remove();
        reject(new Error('Chart.js did not initialize.'));
      }
    };
    script.onerror = () => {
      chartScript = undefined;
      script.onload = null;
      script.onerror = null;
      script.remove();
      reject(new Error('Chart.js could not load.'));
    };
    document.head.appendChild(script);
  });
  return chartScript;
}

const concernData: Record<string, number[]> = {
  default: [62, 58, 68, 60, 52, 48],
  '프로필 사진이 어색해요': [55, 35, 30, 58, 50, 45],
  '소개팅 앞두고 급해요': [60, 55, 62, 32, 48, 28],
  '거울과 사진이 달라요': [28, 52, 60, 55, 30, 42],
};

const solutionCopy: Record<string, string> = {
  default:
    '"6년간 <span class="text-accent-400 font-bold">1,127명</span>을 촬영한 전문가가<br>당신의 <span class="text-accent-400 font-bold">앵글·톤·스타일</span>을 직접 설계합니다."',
  '프로필 사진이 어색해요':
    '"수백 명의 어색한 남성을 코칭한 경험으로<br><span class="text-accent-400 font-bold">표정·포즈·시선</span>을 현장에서 직접 디렉팅합니다."',
  '소개팅 앞두고 급해요':
    '"촬영 전 <span class="text-accent-400 font-bold">의상 피드백부터 코디 제안</span>까지,<br>급해도 괜찮습니다. 최적의 준비를 도와드립니다."',
  '거울과 사진이 달라요':
    '"실물보다 사진이 안 나오는 건 <span class="text-accent-400 font-bold">앵글과 조명</span> 문제입니다.<br>얼굴형·체형에 맞는 최적의 각도를 찾아드립니다."',
};

function radarConfiguration(
  root: HTMLElement,
  values: number[],
  reduced: boolean,
): RadarConfiguration {
  const tokens = getComputedStyle(root);
  const token = (name: string) => tokens.getPropertyValue(name).trim();
  const white = semanticTokens.color.text.onAccent;
  const accent = semanticTokens.color.action.primary;
  const background = semanticTokens.color.background.base;
  const gray = token('--mp-site-color-rgb-180-180-180');
  const text = token('--mp-site-color-e5e5e5');
  const alpha = (hex: string, opacity: number) =>
    `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${opacity})`;
  return {
    type: 'radar',
    data: {
      labels: ['앵글·구도', '포즈·자세', '표정·시선', '의상·스타일링', '조명·색감', '보정 완성도'],
      datasets: [
        {
          label: '현재 상태',
          data: [...values],
          backgroundColor: alpha(white, 0.06),
          borderColor: `rgb(${gray} / 0.6)`,
          borderWidth: 2,
          pointBackgroundColor: `rgb(${gray} / 0.9)`,
          pointBorderColor: background,
          pointRadius: 3,
        },
        {
          label: '맨즈픽 디렉팅 후',
          data: [94, 90, 95, 92, 97, 90],
          backgroundColor: alpha(accent, 0.22),
          borderColor: accent,
          borderWidth: 3,
          pointBackgroundColor: accent,
          pointBorderColor: white,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      elements: { line: { tension: 0.3 } },
      animation: { duration: reduced ? 0 : 600, easing: 'easeOutQuart' },
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
          angleLines: { color: alpha(white, 0.08) },
          grid: { color: alpha(white, 0.08) },
          pointLabels: {
            color: text,
            font: {
              family: tokens.fontFamily,
              size: parseFloat(token('--mp-site-type-font-size-12px')),
              weight: token('--mp-site-type-font-weight-500'),
            },
          },
          ticks: { display: false, backdropColor: 'transparent' },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: white,
            font: {
              family: tokens.fontFamily,
              size: parseFloat(token('--mp-site-type-font-size-13px')),
            },
            padding: 18,
            boxWidth: 14,
            boxHeight: 14,
          },
        },
        tooltip: {
          backgroundColor: alpha(background, 0.9),
          borderColor: alpha(white, 0.1),
          borderWidth: 1,
          titleColor: white,
          bodyColor: text,
          padding: 12,
        },
      },
    },
  };
}

export function attachSourceRadar(root: HTMLElement, reduced: boolean): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('#analysisChart');
  const solution = root.querySelector<HTMLElement>('#selfcheck-solution');
  const chips = Array.from(root.querySelectorAll<HTMLElement>('.selfcheck-chip'));
  let chart: RadarInstance | undefined;
  let active = true;
  let starting = false;
  let values = concernData.default;
  const cleanups: Array<() => void> = [];
  const start = async () => {
    if (!canvas || starting || !active) return;
    starting = true;
    try {
      const [Chart] = await Promise.all([loadChart(), document.fonts.ready]);
      if (!active) return;
      chart = new Chart(canvas, radarConfiguration(root, values, reduced));
      canvas.dataset.ready = 'true';
    } catch {
      starting = false;
      // The same descriptive copy and concern controls stay available offline.
      canvas?.setAttribute(
        'aria-label',
        '앵글·구도, 포즈·자세, 표정·시선, 의상·스타일링, 조명·색감, 보정 완성도를 비교하는 맨즈픽 촬영 진단',
      );
    }
  };
  if (canvas) {
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '현재 상태와 맨즈픽 디렉팅 후의 여섯 가지 촬영 요소 비교');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void start();
          observer.disconnect();
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(canvas);
    cleanups.push(() => observer.disconnect());
  }
  chips.forEach((chip) => {
    const click = () => {
      const key = chip.dataset.selfcheck || 'default';
      values = concernData[key] || concernData.default;
      chips.forEach((other) => {
        const selected = chip === other;
        ['bg-accent-500/20', 'border-accent-400', 'text-white'].forEach((name) =>
          other.classList.toggle(name, selected),
        );
        other.setAttribute('aria-pressed', String(selected));
      });
      try {
        sessionStorage.setItem('manspick-concern', key);
      } catch {
        // Selecting a concern works even when browser storage is disabled.
      }
      if (chart) {
        chart.data.datasets[0].data = [...values];
        chart.update();
      } else void start();
      if (solution) {
        solution.style.transition = 'none';
        solution.style.opacity = '0';
        // Only fixed source strings are inserted; no form data is interpreted as HTML.
        solution.innerHTML = solutionCopy[key] || solutionCopy.default;
        void solution.offsetHeight;
        solution.style.transition = reduced ? 'none' : 'opacity 0.25s ease';
        solution.style.opacity = '1';
      }
    };
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', click);
    cleanups.push(() => chip.removeEventListener('click', click));
  });
  return () => {
    active = false;
    chart?.destroy();
    cleanups.forEach((cleanup) => cleanup());
  };
}
