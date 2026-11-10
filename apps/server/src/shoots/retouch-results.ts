// 보정 작업별 요청 컷과 실제로 연결된 결과 컷을 같은 기준으로 계산합니다.
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';

export async function retouchProgress(env: Env, shootId: string) {
  const cuts = await rows<{
    job_id: string;
    photo_id: string;
    result_id: string | null;
  }>(
    env,
    `WITH pending AS (
      SELECT id,kind,request_id FROM retouch_jobs WHERE shoot_id=?1 AND state!='complete'
    ), required AS (
      SELECT j.id AS job_id, CAST(pick.value AS TEXT) AS photo_id
      FROM pending j JOIN selections s ON s.shoot_id=?1 AND s.round='base'
      JOIN json_each(CASE WHEN json_valid(s.picks_json) THEN s.picks_json ELSE '[]' END) pick
      WHERE j.kind='base'
      UNION
      SELECT j.id,i.photo_id FROM pending j JOIN request_items i ON i.request_id=j.request_id
      WHERE j.kind IN ('extra','revision')
    )
    SELECT r.job_id,r.photo_id,(
      SELECT u.id FROM uploads u JOIN photos p ON p.upload_id=u.id
      JOIN photo_metadata m ON m.photo_id=p.id AND m.parent_photo_id=r.photo_id
      WHERE u.retouch_job_id=r.job_id AND u.shoot_id=?1
        AND u.kind=CASE WHEN j.kind='revision' THEN 'revision' ELSE 'retouched' END
      ORDER BY p.cut_no DESC LIMIT 1
    ) AS result_id
    FROM required r JOIN pending j ON j.id=r.job_id
    JOIN photos source ON source.id=r.photo_id AND source.shoot_id=?1
    ORDER BY source.cut_no`,
    shootId,
  );
  const progress = new Map<string, { photoId: string; resultId: string | null }[]>();
  for (const cut of cuts) {
    const entry = { photoId: cut.photo_id, resultId: cut.result_id };
    const job = progress.get(cut.job_id);
    if (job) job.push(entry);
    else progress.set(cut.job_id, [entry]);
  }
  return progress;
}
