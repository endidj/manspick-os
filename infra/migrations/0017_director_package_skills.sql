-- 디렉터가 맡을 수 있는 패키지를 등록하고, 기존 디렉터의 배정 범위를 이관합니다.
CREATE TABLE director_package_skills (
 director_id TEXT NOT NULL REFERENCES staff(id),
 package_id TEXT NOT NULL REFERENCES packages(id),
 PRIMARY KEY(director_id,package_id)
);
INSERT INTO director_package_skills(director_id,package_id)
 SELECT s.id,p.id FROM staff s CROSS JOIN packages p WHERE s.role='director';
