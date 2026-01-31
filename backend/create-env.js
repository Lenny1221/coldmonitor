const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createEnvFile() {
  try {
    console.log('=== .env Bestand Setup ===\n');
    console.log('We gaan nu je database configuratie instellen.\n');

    // Database configuratie vragen
    const dbHost = await question('PostgreSQL host (standaard: localhost): ') || 'localhost';
    const dbPort = await question('PostgreSQL poort (standaard: 5432): ') || '5432';
    const dbName = await question('Database naam (standaard: refrigeration_monitoring): ') || 'refrigeration_monitoring';
    const dbUser = await question('PostgreSQL gebruikersnaam (standaard: postgres): ') || 'postgres';
    const dbPassword = await question('PostgreSQL wachtwoord (optioneel, druk Enter om over te slaan): ');
    
    // JWT Secret vragen
    console.log('\n--- JWT Configuratie ---');
    const jwtSecret = await question('JWT Secret (standaard: wordt automatisch gegenereerd): ') || generateRandomSecret();
    
    // Database URL samenstellen
    let databaseUrl;
    if (dbPassword) {
      databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
    } else {
      databaseUrl = `postgresql://${dbUser}@${dbHost}:${dbPort}/${dbName}?schema=public`;
    }

    const envContent = `DATABASE_URL="${databaseUrl}"
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
`;

    const envPath = path.join(__dirname, '.env');
    
    // Controleren of .env al bestaat
    if (fs.existsSync(envPath)) {
      const overwrite = await question('\n⚠️  .env bestand bestaat al. Overschrijven? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('❌ Geannuleerd. .env bestand niet aangepast.');
        rl.close();
        return;
      }
    }

    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ .env bestand succesvol aangemaakt!');
    console.log(`📁 Locatie: ${envPath}`);
    console.log('\n📋 Configuratie:');
    console.log(`   Database: ${dbName} op ${dbHost}:${dbPort}`);
    console.log(`   Gebruiker: ${dbUser}`);
    console.log(`   JWT Secret: ${jwtSecret.substring(0, 20)}...`);
    console.log('\n💡 Volgende stappen:');
    console.log('   1. Zorg dat PostgreSQL draait');
    console.log(`   2. Zorg dat de database "${dbName}" bestaat`);
    console.log('   3. Run: npm run db:generate');
    console.log('   4. Run: npm run db:migrate');
    console.log('   5. Run: npm run setup:admin');
    
  } catch (error) {
    console.error('\n❌ Fout bij aanmaken .env bestand:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function generateRandomSecret() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

createEnvFile();
