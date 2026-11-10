// Storybook 관리 화면에 맨즈픽 이름과 어두운 테마를 적용합니다.
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({ base: 'dark', brandTitle: '맨즈픽 디자인 시스템' }),
});
