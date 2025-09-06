// Supabase configuration
const SUPABASE_URL = 'https://ljyktdokxufpnnzsrava.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeWt0ZG9reHVmcG5uenNyYXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzI3MzYsImV4cCI6MjA3MjY0ODczNn0.qmzWTrljFxk84vzZ8UDB-PMEOKybFSBUaQAGQPkB4dc';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;
