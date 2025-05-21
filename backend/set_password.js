const bcrypt = require('bcrypt');

// Function to generate hashed password and SQL
async function generateUpdateSQL(email, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Hashed password: ${hashedPassword}`);
    console.log(`SQL: UPDATE users SET password = '${hashedPassword}' WHERE email = '${email}';`);
  } catch (err) {
    console.error('Error hashing password:', err);
  }
}

// Update password for test@example.com
generateUpdateSQL('test@example.com', 'password123');