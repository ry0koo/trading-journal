import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pjodcxmtnbwquqlhcabu.supabase.co";
const supabaseKey = "sb_publishable_dQ7wAWVZlp13uQ_nU3IzfQ_CFvnp0YW";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);