// 어드민 지표 화면에 공개하는 집계 결과이며 개별 방문자·고객 정보는 포함하지 않습니다.
export interface MetricsDTO {
  visits: { device: string; visits: number }[];
  sections: {
    device: string;
    section: string;
    views: number;
    exits: number;
    clicks: number;
    durationMs: number;
  }[];
  orders: { stage: string; visits: number }[];
  postOrder: {
    completed: number;
    signup: number;
    login: number;
    authenticated: number;
    surveyStarted: number;
    surveySubmitted: number;
  };
  confirmedPayments: number;
}
