-- ── New tables ──────────────────────────────────────────────────────────────

CREATE TABLE invite_codes (
  user_id      uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  code         text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE friends (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id   uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  addressee_id   uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  requester_name text NOT NULL DEFAULT '',
  addressee_name text NOT NULL DEFAULT '',
  created_at     timestamptz DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

-- ── is_friend helper (replaces in_same_party) ───────────────────────────────

CREATE OR REPLACE FUNCTION is_friend(other_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE (requester_id = auth.uid() AND addressee_id = other_user_id)
       OR (requester_id = other_user_id AND addressee_id = auth.uid())
  )
$$;

-- ── RLS for new tables ───────────────────────────────────────────────────────

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite_codes select" ON invite_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "invite_codes insert" ON invite_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "invite_codes update" ON invite_codes FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friends select" ON friends FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friends insert" ON friends FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friends delete" ON friends FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ── games ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "party games select" ON games;
DROP POLICY IF EXISTS "party games insert" ON games;
DROP POLICY IF EXISTS "party games update" ON games;
DROP POLICY IF EXISTS "party games delete" ON games;

CREATE POLICY "games select" ON games FOR SELECT USING (auth.uid() = user_id OR is_friend(user_id));
CREATE POLICY "games insert" ON games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "games update" ON games FOR UPDATE USING (auth.uid() = user_id OR is_friend(user_id));
CREATE POLICY "games delete" ON games FOR DELETE USING (auth.uid() = user_id);

-- ── game_sessions ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "party sessions select" ON game_sessions;
DROP POLICY IF EXISTS "party sessions insert" ON game_sessions;
DROP POLICY IF EXISTS "party sessions update" ON game_sessions;
DROP POLICY IF EXISTS "party sessions delete" ON game_sessions;

CREATE POLICY "sessions select" ON game_sessions FOR SELECT USING (auth.uid() = user_id OR is_friend(user_id));
CREATE POLICY "sessions insert" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions update" ON game_sessions FOR UPDATE USING (auth.uid() = user_id OR is_friend(user_id));
CREATE POLICY "sessions delete" ON game_sessions FOR DELETE USING (auth.uid() = user_id);

-- ── scores ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "party scores" ON scores;

CREATE POLICY "scores" ON scores FOR ALL
  USING (EXISTS (
    SELECT 1 FROM game_sessions g
    WHERE g.id = scores.session_id AND (g.user_id = auth.uid() OR is_friend(g.user_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM game_sessions g
    WHERE g.id = scores.session_id AND (g.user_id = auth.uid() OR is_friend(g.user_id))
  ));

-- ── session_players ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "session_players select" ON session_players;
DROP POLICY IF EXISTS "session_players insert" ON session_players;
DROP POLICY IF EXISTS "session_players update" ON session_players;
DROP POLICY IF EXISTS "party session players" ON session_players;

CREATE POLICY "session_players select" ON session_players FOR SELECT USING (
  EXISTS (SELECT 1 FROM game_sessions g WHERE g.id = session_players.session_id AND (g.user_id = auth.uid() OR is_friend(g.user_id)))
);
CREATE POLICY "session_players insert" ON session_players FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM game_sessions g WHERE g.id = session_players.session_id AND (g.user_id = auth.uid() OR is_friend(g.user_id)))
);
CREATE POLICY "session_players update" ON session_players FOR UPDATE USING (
  EXISTS (SELECT 1 FROM game_sessions g WHERE g.id = session_players.session_id AND (g.user_id = auth.uid() OR is_friend(g.user_id)))
);

-- ── messages ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages select"  ON messages;
DROP POLICY IF EXISTS "messages_insert"  ON messages;

CREATE POLICY "messages select" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM game_sessions g WHERE g.id = messages.session_id AND (g.user_id = auth.uid() OR is_friend(g.user_id)))
);
CREATE POLICY "messages insert" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── players ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "party players select" ON players;
DROP POLICY IF EXISTS "party players insert" ON players;
DROP POLICY IF EXISTS "party players update" ON players;
DROP POLICY IF EXISTS "party players delete" ON players;

CREATE POLICY "players select" ON players FOR SELECT USING (auth.uid() = user_id OR is_friend(user_id));
CREATE POLICY "players insert" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "players update" ON players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "players delete" ON players FOR DELETE USING (auth.uid() = user_id);

-- ── Drop party tables and old functions ──────────────────────────────────────

DROP TABLE IF EXISTS party_members CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP FUNCTION IF EXISTS in_same_party(uuid);
DROP FUNCTION IF EXISTS user_in_party(uuid);
