-- Fix session_players: replace the three wide-open policies with party-based ones
DROP POLICY IF EXISTS "Allow select on session_players" ON session_players;
DROP POLICY IF EXISTS "Allow insert on session_players" ON session_players;
DROP POLICY IF EXISTS "Allow updates on session_players" ON session_players;

CREATE POLICY "session_players select" ON session_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_sessions g
      WHERE g.id = session_players.session_id
        AND (g.user_id = auth.uid() OR in_same_party(g.user_id))
    )
  );

CREATE POLICY "session_players insert" ON session_players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions g
      WHERE g.id = session_players.session_id
        AND (g.user_id = auth.uid() OR in_same_party(g.user_id))
    )
  );

CREATE POLICY "session_players update" ON session_players
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM game_sessions g
      WHERE g.id = session_players.session_id
        AND (g.user_id = auth.uid() OR in_same_party(g.user_id))
    )
  );

-- Fix messages: replace open SELECT with party-based one
DROP POLICY IF EXISTS "messages_select" ON messages;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_sessions g
      WHERE g.id = messages.session_id
        AND (g.user_id = auth.uid() OR in_same_party(g.user_id))
    )
  );

-- Fix players: remove the wildcard "allow all" policy that overrides the party-based ones
DROP POLICY IF EXISTS "allow all" ON players;
