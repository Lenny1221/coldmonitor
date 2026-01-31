import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createClient() {
  try {
    console.log('=== Client Aanmaken ===\n');
    console.log('We gaan een nieuwe client aanmaken met een customer account.\n');

    // Client informatie vragen
    const name = await question('Client naam: ');
    const email = await question('Email adres: ');
    const password = await question('Wachtwoord voor customer account: ');
    const phone = await question('Telefoonnummer (optioneel): ') || undefined;
    const address = await question('Adres (optioneel): ') || undefined;

    if (!name || !email || !password) {
      console.error('❌ Naam, email en wachtwoord zijn verplicht!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error('❌ Een gebruiker met dit email adres bestaat al!');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with CUSTOMER role
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    });

    // Create client linked to the user
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    console.log('\n✅ Client succesvol aangemaakt!');
    console.log('\n📋 Client Details:');
    console.log(`   Client ID: ${client.id}`);
    console.log(`   Naam: ${client.name}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Telefoon: ${client.phone || '(niet opgegeven)'}`);
    console.log(`   Adres: ${client.address || '(niet opgegeven)'}`);
    console.log('\n👤 Gebruiker Account:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Naam: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
    console.log('\n💡 De client kan nu inloggen met:');
    console.log(`   Email: ${email}`);
    console.log(`   Wachtwoord: (het ingevoerde wachtwoord)`);
    
  } catch (error: any) {
    console.error('❌ Fout bij aanmaken client:', error.message);
    if (error.code === 'P2002') {
      console.error('   Een client met deze gegevens bestaat al.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createClient();
