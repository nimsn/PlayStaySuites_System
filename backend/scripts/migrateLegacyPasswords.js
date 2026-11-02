const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const db = require('../config/db');

const scryptAsync = promisify(scrypt);

const hashPassword = async (password) => {
    const salt = randomBytes(16).toString('hex');
    const key = await scryptAsync(String(password), salt, 64);

    return `${salt}:${key.toString('hex')}`;
};

const isAlreadyHashed = (password) => {
    return /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(password);
};

async function migratePasswords() {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [users] = await conn.query(
            'SELECT user_id, password_hash FROM users FOR UPDATE'
        );

        let migrated = 0;
        let skipped = 0;

        for (const user of users) {
            if (isAlreadyHashed(user.password_hash)) {
                skipped++;
                continue;
            }

            const newHash = await hashPassword(user.password_hash);

            await conn.query(
                'UPDATE users SET password_hash = ? WHERE user_id = ?',
                [newHash, user.user_id]
            );

            migrated++;
            console.log(`Migrated user ID: ${user.user_id}`);
        }

        await conn.commit();

        console.log('\n========== MIGRATION COMPLETE ==========');
        console.log(`Total accounts checked: ${users.length}`);
        console.log(`Passwords migrated: ${migrated}`);
        console.log(`Already hashed (skipped): ${skipped}`);

    } catch (error) {
        await conn.rollback();
        console.error('Migration failed:', error);

    } finally {
        conn.release();
        await db.end();
    }
}

migratePasswords();