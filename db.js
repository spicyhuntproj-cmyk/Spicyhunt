const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_KEY is missing from .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Spicy Hunt Service Bridge Initialized (Supabase Only)');

module.exports = {
  supabase,
  // Mapping logic for backward compatibility
  query: async (text, params) => {
    console.warn("Legacy query called. Attempting SDK mapping:", text);
    
    // User Auth Mappings
    if (text.toLowerCase().includes('select * from users where email')) {
      const { data, error } = await supabase.from('users').select('*').eq('email', params[0]);
      if (error) throw error;
      return { rows: data };
    }
    
    if (text.toLowerCase().includes('insert into users')) {
      const { data, error } = await supabase.from('users').insert({
        name: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3]
      }).select();
      if (error) throw error;
      return { rows: data || [] };
    }

    // Menu Mapping
    if (text.toLowerCase().includes('select * from menu_items')) {
      const { data, error } = await supabase.from('menu_items').select('*').order('category', { ascending: true });
      if (error) throw error;
      return { rows: data };
    }

    // Dashboard Mappings
    if (text.toLowerCase().includes('select id, total_price')) {
      const { data, error } = await supabase.from('food_orders').select('id, total_price as total, status, created_at as date').eq('user_id', params[0]).order('created_at', { ascending: false });
      if (error) throw error;
      return { rows: data };
    }

    if (text.toLowerCase().includes('select id, booking_date')) {
      const { data, error } = await supabase.from('table_reservations').select('id, booking_date as date, booking_time as time, guests, occasion, status').eq('user_id', params[0]).order('booking_date', { ascending: false });
      if (error) throw error;
      return { rows: data };
    }

    if (text.toLowerCase().includes('insert into table_reservations')) {
      const { data, error } = await supabase.from('table_reservations').insert({
        user_id: params[0],
        booking_date: params[1],
        booking_time: params[2],
        guests: params[3],
        occasion: params[4]
      }).select();
      if (error) throw error;
      return { rows: data || [] };
    }

    if (text.toLowerCase().includes('insert into food_orders')) {
      const { data, error } = await supabase.from('food_orders').insert({
        user_id: params[0],
        total_price: params[1],
        status: params[2]
      }).select();
      if (error) throw error;
      return { rows: data || [] };
    }

    if (text.toLowerCase().includes('insert into food_order_items')) {
      const { data, error } = await supabase.from('food_order_items').insert({
        order_id: params[0],
        menu_item_id: params[1],
        quantity: params[2],
        price_at_time: params[3]
      }).select();
      if (error) throw error;
      return { rows: data || [] };
    }

    if (text.toLowerCase().includes('update table_reservations set status')) {
        const { data, error } = await supabase.from('table_reservations').update({ status: params[0] }).eq('id', params[1]).eq('user_id', params[2]);
        if (error) throw error;
        return { rows: data };
    }

    if (text.toLowerCase().includes('update food_orders set status')) {
        const { data, error } = await supabase.from('food_orders').update({ status: params[0] }).eq('id', params[1]).eq('user_id', params[2]);
        if (error) throw error;
        return { rows: data };
    }

    throw new Error(`Query bridge not implemented for: ${text}`);
  }
};
