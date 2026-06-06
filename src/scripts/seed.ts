import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../src/utils/embeddings';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Force load the Next.js environment variables for this raw Node script
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);