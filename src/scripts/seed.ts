import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../src/utils/embeddings';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Force load the Next.js environment variables for this raw Node script
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const mahakumbhData = [
    {
      category: 'EVENTS',
      title: 'Shahi Snan Dates',
      content: 'The main Shahi Snan (Royal Bath) dates for Mahakumbh 2025 are Makar Sankranti (Jan 13), Mauni Amavasya (Jan 29), and Basant Panchami (Feb 3).'
    },
    {
      category: 'NAVIGATION',
      title: 'Triveni Ghat Location',
      content: 'Triveni Ghat is located at Sector 1. It is the primary bathing ghat and is where the holy rivers converge.'
    },
    {
      category: 'SERVICES',
      title: 'Medical Tents',
      content: 'Emergency medical tents and ambulances are stationed permanently at the crossroads of Sector 4 and Sector 8.'
    },
    {
      category: 'ACCOMMODATION',
      title: 'Lost and Found Center',
      content: 'The central Bhule Bhatke Kendra (Lost and Found center) is situated near the main entrance gates of Sector 2.'
    },
    {
      category: 'SERVICES',
      title: 'Free Food (Bhandara)',
      content: 'Free meals, known as Bhandara, are served 24 hours a day at the main Akhaada tents located throughout Sector 6.'
    }
  ];
  async function seedDatabase() {
    console.log("Starting vector generation and database seeding...");
    
    for (const item of mahakumbhData) {
      console.log(`Generating embedding for: ${item.title}`);
      try {
        const vector = await generateEmbedding(item.content);
        
        const { error } = await supabase.from('mahakumbh_knowledge').insert({
          category: item.category,
          title: item.title,
          content: item.content,
          embedding: vector
        });
  
        if (error) {
          console.error(`❌ Error inserting ${item.title}:`, error.message);
        } else {
          console.log(`✅ Successfully inserted ${item.title}`);
        }
      } catch (err) {
        console.error(`💥 Failed to process ${item.title}:`, err);
      }
    }