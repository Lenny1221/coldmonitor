const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Standaard configuratie
const config = {
  dbHost: 'localhost',
  dbPort: '5432',
  dbName: 'refrigeration_monitoring',
  dbUser: 'postgres',
  dbPassword: '', // Leeg = geen wachtwoord
  jwtSecret: crypto.randomBytes(32).toString('hex'),
  port: '3001',
  frontendUrl: 'http://localhost:5173'
};

// Database URL samenstellen
let databaseUrl;
if (config.dbPassword) {
  databaseUrl = `postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}?schema=public`;
} else {
  databaseUrl = `postgresql://${config.dbUser}@${config.dbHost}:${config.dbPort}/${config.dbName}?schema=public`;
}

const envContent = `DATABASE_URL="${databaseUrl}"
JWT_SECRET=${config.jwtSecret}
JWT_EXPIRES_IN=7d
PORT=${config.port}
NODE_ENV=development
FRONTEND_URL=${config.frontendUrl}
`;

const envPath = path.join(__dirname, '.env');

try {
  // Controleren of .env al bestaat
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env bestand bestaat al. Overschrijven...');
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env bestand succesvol aangemaakt!');
  console.log(`📁 Locatie: ${envPath}`);
  console.log('\n📋 Configuratie:');
  console.log(`   Database: ${config.dbName} op ${config.dbHost}:${config.dbPort}`);
  console.log(`   Gebruiker: ${config.dbUser}`);
  console.log(`   Wachtwoord: ${config.dbPassword || '(geen)'}`);
  console.log(`   JWT Secret: ${config.jwtSecret.substring(0, 20)}...`);
  console.log('\n💡 BELANGRIJK:');
  console.log('   Als je een wachtwoord nodig hebt, pas dan de DATABASE_URL aan in .env');
  console.log('   Bijvoorbeeld: postgresql://postgres:jouwwachtwoord@localhost:5432/refrigeration_monitoring?schema=public');
  console.log('\n💡 Volgende stappen:');
  console.log('   1. Zorg dat PostgreSQL draait');
  console.log(`   2. Zorg dat de database "${config.dbName}" bestaat (CREATE DATABASE ${config.dbName};)`);
  console.log('   3. Run: npm run db:generate');
  console.log('   4. Run: npm run db:migrate');
  console.log('   5. Run: npm run setup:admin');
  
} catch (error) {
  console.error('❌ Fout bij aanmaken .env bestand:', error.message);
  process.exit(1);
}
