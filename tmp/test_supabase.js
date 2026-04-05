const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/kiitc/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log("URL:", supabaseUrl);
console.log("Key Prefix:", supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('menu_items').select('*');
        if (error) {
            console.error("Connection Error:", error.message);
        } else {
            console.log("Connection Successful!");
            console.log("Menu Items Count:", data.length);
        }
    } catch (err) {
        console.error("Critical Failure:", err.message);
    }
}

test();
