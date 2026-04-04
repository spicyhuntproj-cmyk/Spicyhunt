const { Pool } = require('pg');

const passwordsToTest = ['postgres', 'password', 'admin', 'root', '1234', '123456', 'admin123'];

async function testPasswords() {
    for (const pass of passwordsToTest) {
        console.log(`Testing password: ${pass}...`);
        const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            password: pass,
            port: 5432,
            database: 'postgres' // test against default db
        });

        try {
            await pool.query('SELECT 1;');
            console.log(`SUCCESS! Password is: ${pass}`);
            
            // Now ensure 'hoteldb' exists
            try {
                await pool.query('CREATE DATABASE hoteldb;');
                console.log('Created database hoteldb.');
            } catch(e) {
                if (e.code === '42P04') {
                    console.log('Database hoteldb already exists.');
                } else {
                    console.error('Failed to create hoteldb:', e.message);
                }
            }

            process.exit(0);
        } catch (e) {
            console.log(`Failed: ${e.message}`);
        } finally {
            await pool.end();
        }
    }
    console.log('All guesses failed.');
    process.exit(1);
}

testPasswords();
