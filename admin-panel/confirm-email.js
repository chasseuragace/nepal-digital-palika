#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmEmail(email) {
  try {
    console.log(`Confirming email: ${email}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('email', email);

    if (error) {
      console.error('Error confirming email:', error);
      return;
    }

    console.log('✅ Email confirmed successfully!');
    console.log('You can now login with:', email);
  } catch (err) {
    console.error('Error:', err);
  }
}

confirmEmail('chasseuragace@gmail.com');
