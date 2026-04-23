const SUPABASE_URL = 'https://wgsxpzlpcvwazumrmrgw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnc3hwemxwY3Z3YXp1bXJtcmd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTgxNDksImV4cCI6MjA5MTQ5NDE0OX0.cw9mWUHWZRaVACFN9tCx-gCdkNbBHg-aH5O9qmjghKY';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function sbStorage() {
  return sb.storage.from('uploads');
}
