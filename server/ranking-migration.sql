ALTER TABLE dungeon_rankings DROP CONSTRAINT IF EXISTS dungeon_rankings_stars_check;
ALTER TABLE dungeon_rankings ADD CONSTRAINT dungeon_rankings_stars_check CHECK(stars BETWEEN 0 AND 36);
ALTER TABLE dungeon_rankings ALTER COLUMN completed_at DROP NOT NULL;
ALTER TABLE dungeon_rankings ALTER COLUMN completed_at DROP DEFAULT;
ALTER TABLE dungeon_rankings ADD COLUMN IF NOT EXISTS floors_cleared int NOT NULL DEFAULT 12 CHECK(floors_cleared BETWEEN 0 AND 12);
ALTER TABLE dungeon_rankings ADD COLUMN IF NOT EXISTS duration_ms bigint CHECK(duration_ms>=0);
ALTER TABLE dungeon_rankings ADD COLUMN IF NOT EXISTS run_id text;
ALTER TABLE dungeon_rankings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- migrate-step
CREATE TABLE IF NOT EXISTS dungeon_runs (
 user_id text NOT NULL REFERENCES dungeon_players(user_id), campaign int NOT NULL, run_id text NOT NULL,
 class_id text NOT NULL, elapsed_ms bigint NOT NULL DEFAULT 0 CHECK(elapsed_ms>=0),
 timed boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,campaign,run_id)
);
CREATE TABLE IF NOT EXISTS dungeon_run_clears (
 user_id text NOT NULL, campaign int NOT NULL, run_id text NOT NULL,
 floor int NOT NULL CHECK(floor BETWEEN 0 AND 11), stars int NOT NULL CHECK(stars BETWEEN 1 AND 3),
 class_id text NOT NULL, elapsed_ms bigint, event_id text NOT NULL,
 completed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,campaign,run_id,floor),
 FOREIGN KEY(user_id,campaign,run_id) REFERENCES dungeon_runs(user_id,campaign,run_id)
);
ALTER TABLE dungeon_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dungeon_run_clears ENABLE ROW LEVEL SECURITY;
-- migrate-step
-- Old authenticated clears retain their grade; a missing historical clock is NULL.
INSERT INTO dungeon_runs(user_id,campaign,run_id,class_id)
 SELECT p.user_id,2,COALESCE(p.save->>'runId','legacy'),COALESCE(p.save->>'classId','adventurer')
 FROM dungeon_players p WHERE p.save->>'classId' IN ('adventurer','knight','wizard')
 ON CONFLICT DO NOTHING;
INSERT INTO dungeon_runs(user_id,campaign,run_id,class_id)
 SELECT c.user_id,2,COALESCE(p.save->>'runId','legacy'),max(c.class_id)
 FROM dungeon_clears c JOIN dungeon_players p USING(user_id) WHERE c.campaign=2 GROUP BY c.user_id,p.save
 ON CONFLICT DO NOTHING;
INSERT INTO dungeon_run_clears(user_id,campaign,run_id,floor,stars,class_id,event_id,completed_at)
 SELECT c.user_id,c.campaign,COALESCE(p.save->>'runId','legacy'),c.floor,c.stars,c.class_id,c.event_id,c.completed_at
 FROM dungeon_clears c JOIN dungeon_players p USING(user_id) WHERE c.campaign=2
 AND NOT EXISTS(SELECT 1 FROM dungeon_run_clears r WHERE r.user_id=c.user_id AND r.campaign=c.campaign AND r.floor=c.floor)
 ON CONFLICT DO NOTHING;
-- migrate-step
CREATE OR REPLACE FUNCTION dungeon_refresh_ranking(p_uid text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE candidate record; player_name text;
BEGIN
 SELECT nickname INTO player_name FROM dungeon_players WHERE user_id=p_uid;
 IF player_name IS NULL THEN RETURN; END IF;
 SELECT r.run_id,r.class_id,COALESCE(sum(c.stars),0)::int AS stars,count(c.floor)::int AS floors,
  CASE WHEN count(c.floor)=12 AND r.timed AND count(c.elapsed_ms)=12 THEN (max(c.elapsed_ms)/1000)*1000 END AS duration,
  CASE WHEN count(c.floor)=12 THEN max(c.completed_at) END AS finished
 INTO candidate FROM dungeon_runs r LEFT JOIN dungeon_run_clears c USING(user_id,campaign,run_id)
 WHERE r.user_id=p_uid AND r.campaign=2 GROUP BY r.run_id,r.class_id,r.timed
 ORDER BY stars DESC,(count(c.floor)=12) DESC,duration ASC NULLS LAST,floors DESC,r.run_id ASC LIMIT 1;
 IF NOT FOUND THEN RETURN; END IF;
 INSERT INTO dungeon_rankings(user_id,campaign,nickname,class_id,stars,floors_cleared,duration_ms,completed_at,run_id)
 VALUES(p_uid,2,player_name,candidate.class_id,candidate.stars,candidate.floors,candidate.duration,candidate.finished,candidate.run_id)
 ON CONFLICT(user_id,campaign) DO UPDATE SET nickname=EXCLUDED.nickname,
 stars=EXCLUDED.stars,class_id=EXCLUDED.class_id,floors_cleared=EXCLUDED.floors_cleared,
 duration_ms=EXCLUDED.duration_ms,completed_at=EXCLUDED.completed_at,run_id=EXCLUDED.run_id,updated_at=now()
 WHERE EXCLUDED.stars>dungeon_rankings.stars OR (EXCLUDED.stars=dungeon_rankings.stars AND (
  EXCLUDED.floors_cleared>dungeon_rankings.floors_cleared OR
  (EXCLUDED.floors_cleared=12 AND dungeon_rankings.floors_cleared=12 AND EXCLUDED.duration_ms IS NOT NULL
   AND (dungeon_rankings.duration_ms IS NULL OR EXCLUDED.duration_ms<dungeon_rankings.duration_ms))));
 UPDATE dungeon_rankings SET nickname=player_name WHERE user_id=p_uid AND campaign=2 AND nickname IS DISTINCT FROM player_name;
END $$;
-- migrate-step
CREATE OR REPLACE FUNCTION dungeon_save_player(p_uid text,p_revision bigint,p_save jsonb,p_clears jsonb,p_mutation text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE p dungeon_players%ROWTYPE; event jsonb; run text; event_run text; is_timed boolean; elapsed bigint; n int;
BEGIN
 SELECT * INTO p FROM dungeon_players WHERE user_id=p_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'profile_missing'; END IF;
 IF p.last_mutation=p_mutation THEN RETURN jsonb_build_object('revision',p.revision,'duplicate',true); END IF;
 IF p.revision<>p_revision THEN RETURN jsonb_build_object('conflict',true,'revision',p.revision); END IF;
 run=COALESCE(p_save->>'runId',p.save->>'runId','legacy');
 IF p_save->>'classId' IN ('adventurer','knight','wizard') THEN
  INSERT INTO dungeon_runs(user_id,campaign,run_id,class_id,elapsed_ms,timed)
  VALUES(p_uid,2,run,p_save->>'classId',COALESCE((p_save->>'playTimeMs')::bigint,0),COALESCE((p_save->>'timingVersion')::int=1,false))
  ON CONFLICT(user_id,campaign,run_id) DO UPDATE SET elapsed_ms=GREATEST(dungeon_runs.elapsed_ms,EXCLUDED.elapsed_ms),
   timed=dungeon_runs.timed AND EXCLUDED.timed,class_id=EXCLUDED.class_id,updated_at=now();
  SELECT elapsed_ms,timed INTO elapsed,is_timed FROM dungeon_runs WHERE user_id=p_uid AND campaign=2 AND run_id=run;
  p_save=p_save||jsonb_build_object('playTimeMs',elapsed,'timingVersion',CASE WHEN is_timed THEN 1 ELSE 0 END);
 END IF;
 UPDATE dungeon_players SET save=p_save,revision=revision+1,last_mutation=p_mutation,updated_at=now() WHERE user_id=p_uid;
 FOR event IN SELECT * FROM jsonb_array_elements(p_clears) LOOP
  event_run=COALESCE(event->>'runId',p.save->>'runId',run);
  INSERT INTO dungeon_runs(user_id,campaign,run_id,class_id,timed,elapsed_ms)
  VALUES(p_uid,2,event_run,event->>'classId',COALESCE((event->>'timed')::boolean,false),COALESCE((event->>'elapsedMs')::bigint,0))
  ON CONFLICT(user_id,campaign,run_id) DO UPDATE SET elapsed_ms=GREATEST(dungeon_runs.elapsed_ms,EXCLUDED.elapsed_ms),timed=dungeon_runs.timed AND EXCLUDED.timed;
  INSERT INTO dungeon_run_clears(user_id,campaign,run_id,floor,stars,class_id,elapsed_ms,event_id)
  VALUES(p_uid,2,event_run,(event->>'floor')::int,(event->>'stars')::int,event->>'classId',
   CASE WHEN (event->>'timed')::boolean THEN (event->>'elapsedMs')::bigint END,event->>'id')
  ON CONFLICT(user_id,campaign,run_id,floor) DO UPDATE SET stars=EXCLUDED.stars,class_id=EXCLUDED.class_id,
   elapsed_ms=EXCLUDED.elapsed_ms,event_id=EXCLUDED.event_id,completed_at=now() WHERE EXCLUDED.stars>dungeon_run_clears.stars;
  INSERT INTO dungeon_clears(user_id,campaign,floor,stars,class_id,event_id)
  VALUES(p_uid,2,(event->>'floor')::int,(event->>'stars')::int,event->>'classId',event->>'id')
  ON CONFLICT(user_id,campaign,floor) DO UPDATE SET stars=EXCLUDED.stars,class_id=EXCLUDED.class_id,event_id=EXCLUDED.event_id
  WHERE EXCLUDED.stars>dungeon_clears.stars;
 END LOOP;
 PERFORM dungeon_refresh_ranking(p_uid);
 SELECT count(*) INTO n FROM dungeon_clears WHERE user_id=p_uid AND campaign=2;
 RETURN jsonb_build_object('revision',p.revision+1,'rankedCount',n);
END $$;
-- migrate-step
CREATE INDEX IF NOT EXISTS dungeon_rankings_live_order ON dungeon_rankings(campaign,stars DESC,(floors_cleared=12) DESC,duration_ms ASC NULLS LAST,floors_cleared DESC,user_id);
SELECT dungeon_refresh_ranking(user_id) FROM dungeon_players WHERE nickname IS NOT NULL;
