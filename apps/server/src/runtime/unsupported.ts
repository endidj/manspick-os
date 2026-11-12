// 설치하지 않은 Nest 선택 기능은 Workers 번들에서 조용히 활성화되지 않도록 실패합니다.
throw new Error('This optional Nest feature is not available in the Workers HTTP runtime');

export {};
