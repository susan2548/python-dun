CREATE TABLE IF NOT EXISTS assessment_teachers(user_id text PRIMARY KEY, granted_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS assessment_classes(
 id uuid PRIMARY KEY, owner_id text NOT NULL REFERENCES assessment_teachers(user_id), name text NOT NULL,
 join_code text NOT NULL UNIQUE, media_url text NOT NULL DEFAULT '', pre_open boolean NOT NULL DEFAULT false,
 post_open boolean NOT NULL DEFAULT false, revision int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assessment_enrollments(
 class_id uuid NOT NULL REFERENCES assessment_classes(id), user_id text NOT NULL, student_code text NOT NULL,
 full_name text NOT NULL, post_limit int NOT NULL DEFAULT 1 CHECK(post_limit BETWEEN 1 AND 20), joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(class_id,user_id), UNIQUE(class_id,student_code)
);
CREATE TABLE IF NOT EXISTS assessment_attempts(
 id uuid PRIMARY KEY, class_id uuid NOT NULL, user_id text NOT NULL,
 phase text NOT NULL CHECK(phase IN ('pre','post')), attempt_no int NOT NULL, form_version int NOT NULL DEFAULT 1,
 question_order jsonb NOT NULL, choice_order jsonb NOT NULL DEFAULT '{}', answers jsonb NOT NULL DEFAULT '{}',
 revision int NOT NULL DEFAULT 0, last_mutation text, submission_id text,
 score int, maximum int, unit_scores jsonb, stars_snapshot jsonb,
 started_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz,
 FOREIGN KEY(class_id,user_id) REFERENCES assessment_enrollments(class_id,user_id),
 UNIQUE(class_id,user_id,phase,attempt_no), CHECK(score IS NULL OR score BETWEEN 0 AND maximum)
);
CREATE INDEX IF NOT EXISTS assessment_attempts_report ON assessment_attempts(class_id,user_id,phase,attempt_no);
CREATE INDEX IF NOT EXISTS assessment_enrollments_user ON assessment_enrollments(user_id,class_id);
ALTER TABLE assessment_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION assessment_start(p_uid text,p_class uuid,p_phase text,p_id uuid,p_order jsonb,p_choices jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE e assessment_enrollments%ROWTYPE; c assessment_classes%ROWTYPE; a assessment_attempts%ROWTYPE; n int;
BEGIN
 SELECT * INTO e FROM assessment_enrollments WHERE class_id=p_class AND user_id=p_uid FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('error','not_enrolled'); END IF;
 SELECT * INTO c FROM assessment_classes WHERE id=p_class FOR SHARE;
 SELECT * INTO a FROM assessment_attempts WHERE class_id=p_class AND user_id=p_uid AND phase=p_phase AND submitted_at IS NULL ORDER BY attempt_no DESC LIMIT 1;
 IF FOUND THEN RETURN jsonb_build_object('id',a.id,'resumed',true); END IF;
 IF (p_phase='pre' AND NOT c.pre_open) OR (p_phase='post' AND NOT c.post_open) THEN RETURN jsonb_build_object('error','closed'); END IF;
 IF p_phase='post' AND NOT EXISTS(SELECT 1 FROM assessment_attempts WHERE class_id=p_class AND user_id=p_uid AND phase='pre' AND submitted_at IS NOT NULL) THEN RETURN jsonb_build_object('error','pre_required'); END IF;
 SELECT COALESCE(max(attempt_no),0)+1 INTO n FROM assessment_attempts WHERE class_id=p_class AND user_id=p_uid AND phase=p_phase;
 IF n>(CASE WHEN p_phase='pre' THEN 1 ELSE e.post_limit END) THEN RETURN jsonb_build_object('error','limit'); END IF;
 INSERT INTO assessment_attempts(id,class_id,user_id,phase,attempt_no,question_order,choice_order)
 VALUES(p_id,p_class,p_uid,p_phase,n,p_order,p_choices);
 RETURN jsonb_build_object('id',p_id,'resumed',false);
END; $$;

CREATE OR REPLACE FUNCTION assessment_save(p_uid text,p_id uuid,p_revision int,p_answers jsonb,p_mutation text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a assessment_attempts%ROWTYPE;
BEGIN
 SELECT * INTO a FROM assessment_attempts WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR a.user_id<>p_uid THEN RETURN jsonb_build_object('error','forbidden'); END IF;
 IF a.submitted_at IS NOT NULL THEN RETURN jsonb_build_object('error','submitted'); END IF;
 IF a.last_mutation=p_mutation THEN RETURN jsonb_build_object('revision',a.revision,'duplicate',true); END IF;
 IF a.revision<>p_revision THEN RETURN jsonb_build_object('error','conflict','revision',a.revision); END IF;
 UPDATE assessment_attempts SET answers=p_answers,revision=revision+1,last_mutation=p_mutation WHERE id=p_id;
 RETURN jsonb_build_object('revision',a.revision+1);
END; $$;

CREATE OR REPLACE FUNCTION assessment_submit(p_uid text,p_id uuid,p_revision int,p_submission text,p_grade jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a assessment_attempts%ROWTYPE; c assessment_classes%ROWTYPE; stars jsonb;
BEGIN
 SELECT * INTO a FROM assessment_attempts WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR a.user_id<>p_uid THEN RETURN jsonb_build_object('error','forbidden'); END IF;
 IF a.submitted_at IS NOT NULL THEN RETURN jsonb_build_object('submitted',true,'duplicate',true); END IF;
 IF a.revision<>p_revision THEN RETURN jsonb_build_object('error','conflict','revision',a.revision); END IF;
 SELECT * INTO c FROM assessment_classes WHERE id=a.class_id FOR SHARE;
 IF (a.phase='pre' AND NOT c.pre_open) OR (a.phase='post' AND NOT c.post_open) THEN RETURN jsonb_build_object('error','closed'); END IF;
 SELECT jsonb_agg(COALESCE(d.stars,0) ORDER BY f.n) INTO stars FROM generate_series(0,11) AS f(n)
 LEFT JOIN dungeon_clears d ON d.user_id=p_uid AND d.campaign=2 AND d.floor=f.n;
 UPDATE assessment_attempts SET submitted_at=now(),submission_id=p_submission,score=(p_grade->>'score')::int,
 maximum=(p_grade->>'maximum')::int,unit_scores=p_grade->'byUnit',stars_snapshot=stars WHERE id=p_id;
 RETURN jsonb_build_object('submitted',true,'duplicate',false);
END; $$;


