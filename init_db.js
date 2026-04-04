const db = require('./db');

async function createTables() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(102) NOT NULL,
      email VARCHAR(102) UNIQUE NOT NULL,
      password_hash VARCHAR(257) NOT NULL,
      role VARCHAR(20) DEFAULT 'user'
    );
  `;
  const roomsTable = `
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      room_type VARCHAR(102) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      description TEXT,
      status VARCHAR(22) DEFAULT 'available',
      image_url VARCHAR(257),
      features JSONB
    );
  `;
  const menusTable = `
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(102) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(52),
      image_url VARCHAR(257)
    );
  `;
  const bookingsTable = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
      check_in_date DATE NOT NULL,
      check_out_date DATE NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      status VARCHAR(22) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // SEED DATA
  const seedRooms = `
    INSERT INTO rooms (room_type, price, description, status, image_url, features)
    VALUES 
    ('Ocean View Suite', 45000.00, 'Experience ultimate luxury with panoramic views. This suite features a king-size bed, a separate living area, and a marble bathroom with a deep soaking tub.', 'available', 'images/room_ocean.png', '["Premium WiFi", "24/7 Room Service", "Private Balcony"]'),
    ('Presidential Villa', 150000.00, 'Our most exclusive accommodation. The Presidential Villa offers ultimate privacy with its own private pool, personal butler, and expansive living quarters.', 'available', 'images/room_presidential.png', '["Private Pool", "Personal Butler Services", "Complimentary Spa Access"]'),
    ('Deluxe Royal Room', 32000.00, 'Elegant and comfortable, featuring heritage Rajputana architecture perfect for a prestigious getaway.', 'available', 'images/room_deluxe.png', '["Smart TV", "Mini Bar", "Luxury Toiletries"]')
  `;

  const seedMenu = `
    INSERT INTO menu_items (name, description, price, category, image_url)
    VALUES 
    -- Starters
    ('Gold-Leaf Galouti Kebab', 'Melt-in-mouth lamb patties infused with 16 royal spices, smoked with cloves, wrapped in silver warq.', 2500.00, 'Starters', 'images/menu_galouti.png'),
    ('Truffle Butter Chicken Samosa', 'Hand-rolled pastry pillows stuffed with slow-cooked shredded butter chicken and Italian black truffle shavings.', 1800.00, 'Starters', 'images/menu_samosa.png'),
    ('Peshawari Paneer Tikka', 'Charcoal-grilled cottage cheese marinated in hung curd, yellow chili, and roasted gram flour.', 1500.00, 'Starters', 'images/menu_paneer_tikka.png'),
    ('Saffron Tandoori Jhinga', 'Jumbo tiger prawns marinated with wild Kashmiri saffron and thick yogurt, cooked in a clay oven.', 3200.00, 'Starters', 'images/menu_jhinga.png'),
    ('Dahi Puri Caviar', 'Crispy semolina shells filled with spiced potatoes, sweet yogurt, and topped with Beluga caviar.', 2800.00, 'Starters', 'images/menu_dahi_puri.png'),
    ('Murg Malai Tikka', 'Tender chicken marinated in fresh cream, mild spices, and cardamom, grilled flawlessly.', 1600.00, 'Starters', 'images/menu_murg_malai.png'),
    ('Avocado Papdi Chaat', 'A modern twist on a classic, featuring mashed avocado, crispy wafers, mint chutney, and tamarind glaze.', 1400.00, 'Starters', 'images/menu_avocado_chaat.png'),
    ('Lobster Shorba', 'A fragrant, slow-simmered seafood broth infused with coastal Indian spices and sweet lobster meat.', 2100.00, 'Starters', 'images/menu_lobster_shorba.png'),
    
    -- Mains Vegetarian
    ('Dal Bukhara', 'Black lentils simmered overnight on a slow charcoal fire, finished with cream and unsalted butter.', 1800.00, 'Mains (Vegetarian)', 'images/menu_dal_bukhara.png'),
    ('Morel Mushroom Pulav', 'Aromatic basmati rice steamed with wild Himalayan morel mushrooms and saffron threads.', 2200.00, 'Mains (Vegetarian)', 'images/menu_morel_pulav.png'),
    ('Paneer Lababdar', 'Cottage cheese cubes tossed in a rich, creamy tomato and cashew gravy with a hint of fenugreek.', 1900.00, 'Mains (Vegetarian)', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=600'),
    ('Malai Kofta', 'Cottage cheese and potato dumplings in a velvety, cashew-enriched white gravy.', 1800.00, 'Mains (Vegetarian)', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600'),
    ('Dum Aloo Kashmiri', 'Baby potatoes slow-cooked in a vibrant, spiced yogurt gravy native to the Kashmir valley.', 1600.00, 'Mains (Vegetarian)', 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600'),
    ('Pindi Chole', 'Robust and spicy chickpeas cooked dry with robust Punjabi spices.', 1500.00, 'Mains (Vegetarian)', 'https://images.unsplash.com/photo-1596797038530-2c39bb05fbc5?w=600'),
    ('Bhindi Amchoor', 'Crispy fried okra dusted with dried mango powder and roasted cumin.', 1400.00, 'Mains (Vegetarian)', 'https://images.unsplash.com/photo-1510627489930-0c1b0ba0fa4a?w=600'),
    ('Baingan Bharta', 'Smoked eggplant mashed with onions, tomatoes, and earthy aromatic spices.', 1500.00, 'Mains (Vegetarian)', 'https://images.unsplash.com/photo-1579631542720-3a87824fff8a?w=600'),

    -- Mains Non-Vegetarian
    ('Saffron Lobster Malai Curry', 'Whole lobster poached in a delicate gravy of coconut milk, mustard, and saffron.', 5500.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600'),
    ('Awadhi Lamb Biryani', 'Premium basmati rice and tender lamb cooked slowly under a pastry seal with aromatic spices.', 3800.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600'),
    ('Nalli Nihari', 'Slow-cooked lamb shanks in a rich, spice-infused marrow stew. A regal delicacy.', 4200.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1544148103-077afdc1cf14?w=600'),
    ('Classic Butter Chicken', 'Tandoori-roasted chicken simmered in a velvet-smooth smoked tomato and fenugreek gravy.', 2800.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600'),
    ('Laal Maas', 'A fiery, vibrant red mutton curry from Rajasthan utilizing Mathania chilies.', 3400.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1588166524941-3bf61a7c21df?w=600'),
    ('Goan Fish Curry', 'Fresh Catch of the day simmered in a tangy coconut, kokum, and roasted red chili gravy.', 3100.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1645177623570-525d886dd943?w=600'),
    ('Murg Tikka Masala', 'Charcoal grilled chicken tikka tossed in an onion-tomato masala base.', 2700.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600'),
    ('Raan-E-Sikandari', 'Whole leg of lamb marinated in a secret blend of spices and roasted for 12 hours.', 6800.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600'),

    -- Breads & Sides
    ('Truffle Cheese Naan', 'Tandoor-baked flatbread stuffed with vintage cheddar and finished with truffle oil.', 800.00, 'Breads & Sides', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=600'),
    ('Garlic Butter Naan', 'Classic flatbread brushed liberally with garlic and organic cow ghee.', 500.00, 'Breads & Sides', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600'),
    ('Mint Paratha', 'Whole wheat, multi-layered flaky bread brushed with dried mint flakes.', 450.00, 'Breads & Sides', 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600'),
    ('Burrani Raita', 'Thick chilled yogurt whisked with roasted garlic and cumin.', 400.00, 'Breads & Sides', 'https://images.unsplash.com/photo-1626200419109-383a54b3c4dc?w=600'),

    -- Desserts
    ('24K Pistachio Rasmalai', 'Soft cheese discs immersed in thickened pistachio milk, adorned with real 24-karat gold leaf.', 1200.00, 'Desserts', 'https://images.unsplash.com/photo-1528750800168-f9f3f7ca2ec4?w=600'),
    ('Rose Petal Gulab Jamun', 'Warm reduced-milk dumplings soaked in a rose-infused sugar syrup.', 950.00, 'Desserts', 'https://images.unsplash.com/photo-1589301760014-d929f3979adc?w=600'),
    ('Shahi Tukda', 'Crisp fried bread soaked in saffron milk and topped with rich clotted cream.', 1100.00, 'Desserts', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600'),
    ('Filter Coffee Ice Cream', 'Artisanal ice cream infused with rich South Indian filter coffee decoction.', 850.00, 'Desserts', 'https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?w=600'),

    -- Beverages
    ('Saffron Cardamom Lassi', 'A thick churned yogurt drink sweetened and infused with premium saffron.', 600.00, 'Beverages', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600'),
    ('Chai Royal', 'A bespoke blend of Assam tea, brewed slowly with spices and milk.', 500.00, 'Beverages', 'https://images.unsplash.com/photo-1544787210-2213d84ad960?w=600'),
    ('Mango Mint Mojito', 'Fresh local Alphonso mango puree muddled with mint and sparkling water.', 700.00, 'Beverages', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600'),
    ('Jal Jeera', 'A refreshing, tangy mocktail flavored with roasted cumin and tamarind.', 500.00, 'Beverages', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600')
  `;

  try {
    console.log('Building schema & resetting for Indian Theme Shift...');
    
    await db.query(`DROP TABLE IF EXISTS bookings CASCADE`);
    await db.query(`DROP TABLE IF EXISTS rooms CASCADE`);
    await db.query(`DROP TABLE IF EXISTS menu_items CASCADE`);
    await db.query(`DROP TABLE IF EXISTS users CASCADE`);

    await db.query(usersTable);
    await db.query(roomsTable);
    await db.query(menusTable);
    await db.query(bookingsTable);
    
    console.log('Seeding initial Indian Data...');
    await db.query(seedRooms);
    await db.query(seedMenu);

    // Seed Root Admin
    const bcryptjs = require('bcryptjs');
    const adminPass = await bcryptjs.hash('royal2024', 10);
    await db.query(`
        INSERT INTO users (name, email, password_hash, role) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = $3
    `, ['The Royal Admin', 'admin@luxeroyal.com', adminPass, 'admin']);
    
    console.log('Database Indian Overhaul completed.');
  } catch (error) {
    console.error('Error modifying tables:', error);
  } finally {
    process.exit();
  }
}

createTables();
