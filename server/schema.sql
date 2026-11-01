CREATE TABLE IF NOT EXISTS dungeon_players (
 user_id text PRIMARY KEY, nickname text, save jsonb,
 revision bigint NOT NULL DEFAULT 0, last_mutation text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- migrate-step
CREATE TABLE IF NOT EXISTS dungeon_clears (
 user_id text NOT NULL REFERENCES dungeon_players(user_id), campaign int NOT NULL,
 floor int NOT NULL CHECK(floor BETWEEN 0 AND 11), stars int NOT NULL CHECK(stars BETWEEN 1 AND 3),
 class_id text NOT NULL CHECK(class_id IN ('adventurer','knight','wizard')),
 event_id text NOT NULL, completed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,campaign,floor)
);
-- migrate-step
CREATE TABLE IF NOT EXISTS dungeon_rankings (
 user_id text NOT NULL REFERENCES dungeon_players(user_id), campaign int NOT NULL,
 nickname text NOT NULL, class_id text NOT NULL, stars int NOT NULL CHECK(stars BETWEEN 12 AND 36),
 completed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,campaign)
);
-- migrate-step
CREATE INDEX IF NOT EXISTS dungeon_rankings_order ON dungeon_rankings(campaign,stars DESC,completed_at ASC,user_id);
-- migrate-step
ALTER TABLE dungeon_players ENABLE ROW LEVEL SECURITY;
-- migrate-step
ALTER TABLE dungeon_clears ENABLE ROW LEVEL SECURITY;
-- migrate-step
ALTER TABLE dungeon_rankings ENABLE ROW LEVEL SECURITY;
-- migrate-step
CREATE OR REPLACE FUNCTION dungeon_save_player(p_uid text,p_revision bigint,p_save jsonb,p_clears jsonb,p_mutation text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE p dungeon_players%ROWTYPE; event jsonb; n int; total int; role text;
BEGIN
 SELECT * INTO p FROM dungeon_players WHERE user_id=p_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'profile_missing'; END IF;
 IF p.last_mutation=p_mutation THEN RETURN jsonb_build_object('revision',p.revision,'duplicate',true); END IF;
 IF p.revision<>p_revision THEN RETURN jsonb_build_object('conflict',true,'revision',p.revision); END IF;
 UPDATE dungeon_players SET save=p_save,revision=revision+1,last_mutation=p_mutation,updated_at=now() WHERE user_id=p_uid;
 FOR event IN SELECT * FROM jsonb_array_elements(p_clears) LOOP
  INSERT INTO dungeon_clears(user_id,campaign,floor,stars,class_id,event_id)
  VALUES(p_uid,2,(event->>'floor')::int,(event->>'stars')::int,event->>'classId',event->>'id')
  ON CONFLICT(user_id,campaign,floor) DO UPDATE SET stars=EXCLUDED.stars,class_id=EXCLUDED.class_id,event_id=EXCLUDED.event_id
  WHERE EXCLUDED.stars>dungeon_clears.stars;
 END LOOP;
 SELECT count(*),sum(stars) INTO n,total FROM dungeon_clears WHERE user_id=p_uid AND campaign=2;
 IF n=12 AND p.nickname IS NOT NULL THEN
  SELECT class_id INTO role FROM dungeon_clears WHERE user_id=p_uid AND campaign=2 ORDER BY completed_at DESC,floor DESC LIMIT 1;
  INSERT INTO dungeon_rankings(user_id,campaign,nickname,class_id,stars)
  VALUES(p_uid,2,p.nickname,role,total)
  ON CONFLICT(user_id,campaign) DO UPDATE SET stars=EXCLUDED.stars,nickname=EXCLUDED.nickname,class_id=EXCLUDED.class_id
  WHERE EXCLUDED.stars>dungeon_rankings.stars;
 END IF;
 RETURN jsonb_build_object('revision',p.revision+1,'rankedCount',n);
END $$;
