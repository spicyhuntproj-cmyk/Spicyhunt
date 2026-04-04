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
  // Preserving menu_items
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
  // NEW: Table Reservations
  const reservationsTable = `
    CREATE TABLE IF NOT EXISTS table_reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      booking_date DATE NOT NULL,
      booking_time TIME NOT NULL,
      guests INTEGER NOT NULL,
      occasion VARCHAR(50),
      status VARCHAR(22) DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  // NEW: Culinary Orders
  const ordersTable = `
    CREATE TABLE IF NOT EXISTS food_orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      total_price DECIMAL(10, 2) NOT NULL,
      status VARCHAR(22) DEFAULT 'preparing',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  // NEW: Culinary Order Items (Cart Link)
  const orderItemsTable = `
    CREATE TABLE IF NOT EXISTS food_order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES food_orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      price_at_time DECIMAL(10, 2) NOT NULL
    );
  `;

  const seedMenu = `
    INSERT INTO menu_items (name, description, price, category, image_url)
    VALUES 
    -- Starters
    ('Gold-Leaf Galouti Kebab', 'Melt-in-mouth lamb patties infused with 16 royal spices, smoked with cloves, wrapped in silver warq.', 2500.00, 'Starters', 'images/menu_galouti.png'),
    ('Truffle Butter Chicken Samosa', 'Hand-rolled pastry pillows stuffed with slow-cooked shredded butter chicken and Italian black truffle shavings.', 1800.00, 'Starters', 'images/menu_samosa.png'),
    ('Peshawari Paneer Tikka', 'Charcoal-grilled cottage cheese marinated in hung curd, yellow chili, and roasted gram flour.', 1500.00, 'Starters', 'images/menu_paneer_tikka.png'),
    ('Saffron Tandoori Jhinga', 'Jumbo tiger prawns marinated with wild Kashmiri saffron and thick yogurt, cooked in a clay oven.', 3200.00, 'Starters', 'images/menu_jhinga.png'),
    
    -- Mains Vegetarian
    ('Dal Bukhara', 'Black lentils simmered overnight on a slow charcoal fire, finished with cream and unsalted butter.', 1800.00, 'Mains (Vegetarian)', 'images/menu_dal_bukhara.png'),
    ('Paneer Lababdar', 'Cottage cheese cubes tossed in a rich, creamy tomato and cashew gravy with a hint of fenugreek.', 1900.00, 'Mains (Vegetarian)', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=600'),

    -- Mains Non-Vegetarian
    ('Awadhi Lamb Biryani', 'Premium basmati rice and tender lamb cooked slowly under a pastry seal with aromatic spices.', 3800.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600'),
    ('Classic Butter Chicken', 'Tandoori-roasted chicken simmered in a velvet-smooth smoked tomato and fenugreek gravy.', 2800.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600'),
    ('Laal Maas', 'A fiery, vibrant red mutton curry from Rajasthan utilizing Mathania chilies.', 3400.00, 'Mains (Non-Vegetarian)', 'https://images.unsplash.com/photo-1588166524941-3bf61a7c21df?w=600'),

    -- Breads & Sides
    ('Truffle Cheese Naan', 'Tandoor-baked flatbread stuffed with vintage cheddar and finished with truffle oil.', 800.00, 'Breads & Sides', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=600'),
    ('Garlic Butter Naan', 'Classic flatbread brushed liberally with garlic and organic cow ghee.', 500.00, 'Breads & Sides', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600'),

    -- Desserts
    ('24K Pistachio Rasmalai', 'Soft cheese discs immersed in thickened pistachio milk, adorned with real 24-karat gold leaf.', 1200.00, 'Desserts', 'https://images.unsplash.com/photo-1528750800168-f9f3f7ca2ec4?w=600'),
    ('Shahi Tukda', 'Crisp fried bread soaked in saffron milk and topped with rich clotted cream.', 1100.00, 'Desserts', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600'),

    -- Beverages
    ('Saffron Cardamom Lassi', 'A thick churned yogurt drink sweetened and infused with premium saffron.', 600.00, 'Beverages', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600'),
    ('Jal Jeera', 'A refreshing, tangy mocktail flavored with roasted cumin and tamarind.', 500.00, 'Beverages', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600')
  `;

  try {
    console.log('Building Spicy Hunt Restaurant Schema...');
    
    await db.query(`DROP TABLE IF EXISTS food_order_items CASCADE`);
    await db.query(`DROP TABLE IF EXISTS food_orders CASCADE`);
    await db.query(`DROP TABLE IF EXISTS table_reservations CASCADE`);
    await db.query(`DROP TABLE IF EXISTS bookings CASCADE`); // Legacy
    await db.query(`DROP TABLE IF EXISTS rooms CASCADE`); // Legacy
    await db.query(`DROP TABLE IF EXISTS menu_items CASCADE`);
    await db.query(`DROP TABLE IF EXISTS users CASCADE`);

    await db.query(usersTable);
    await db.query(menusTable);
    await db.query(reservationsTable);
    await db.query(ordersTable);
    await db.query(orderItemsTable);
    
    console.log('Seeding Royal Menu...');
    await db.query(seedMenu);

    // Seed Root Admin
    const bcryptjs = require('bcryptjs');
    const adminPass = await bcryptjs.hash('royal2024', 10);
    const mockUserPass = await bcryptjs.hash('password123', 10);

    await db.query(`
        INSERT INTO users (name, email, password_hash, role) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = $3
    `, ['The Royal Admin', 'admin@luxeroyal.com', adminPass, 'admin']);

    await db.query(`
        INSERT INTO users (name, email, password_hash, role) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (email) DO UPDATE SET role = 'user', password_hash = $3
    `, ['Guest User', 'guest@spicyhunt.com', mockUserPass, 'user']);
    
    console.log('Database Restaurant Overhaul completed. Ready for Dashboard.');
  } catch (error) {
    console.error('Error modifying tables:', error);
  } finally {
    process.exit();
  }
}

createTables();
