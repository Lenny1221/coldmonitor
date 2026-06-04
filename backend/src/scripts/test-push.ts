/**
 * Eenmalig testscript voor push-notificaties.
 *
 * Gebruik:
 *   tsx src/scripts/test-push.ts            -> lijst alleen de users met een pushToken (geen verzending)
 *   tsx src/scripts/test-push.ts --send     -> stuur een testmelding naar ALLE users met een token
 *   tsx src/scripts/test-push.ts email@x.be -> stuur enkel naar dat e-mailadres
 */
import { prisma } from '../config/database';
import { config } from '../config/env';
import { isLikelyApnsDeviceToken, sendApnsPush } from '../services/apnsService';
import { sendPushNotification } from '../services/pushService';

async function main() {
  const arg = process.argv[2];
  const doSend = arg === '--send' || (!!arg && arg.includes('@'));
  const targetEmail = arg && arg.includes('@') ? arg : null;

  console.log('--- APNs config check ---');
  console.log('APNS_KEY_ID:', config.apnsKeyId ? 'gezet' : 'ONTBREEKT');
  console.log('APNS_TEAM_ID:', config.apnsTeamId ? 'gezet' : 'ONTBREEKT');
  console.log('APNS_PRIVATE_KEY:', config.apnsPrivateKey ? `gezet (${config.apnsPrivateKey.length} chars)` : 'ONTBREEKT');
  console.log('APNS_BUNDLE_ID:', config.apnsBundleId);
  console.log('APNS_USE_SANDBOX:', config.apnsUseSandbox, '(TestFlight verwacht: false)');
  console.log('APNs host:', config.apnsUseSandbox ? 'api.sandbox.push.apple.com' : 'api.push.apple.com');
  console.log('');

  if (arg === '--alarm') {
    // Stuur een laag-1-stijl temperatuuralarm naar alle users met een token.
    const users = await prisma.user.findMany({
      where: { pushToken: { not: null } },
      select: { id: true, email: true, customer: { select: { id: true } } },
    });
    for (const u of users) {
      let cellName = 'Koelcel 1';
      let temp = 8.5;
      if (u.customer?.id) {
        const cell = await prisma.coldCell.findFirst({
          where: { location: { customerId: u.customer.id } },
          select: { name: true, temperatureMaxThreshold: true },
        });
        if (cell) {
          cellName = cell.name;
          temp = Math.round((cell.temperatureMaxThreshold + 4) * 10) / 10;
        }
      }
      const user = await prisma.user.findUnique({ where: { id: u.id }, select: { pushToken: true } });
      if (!user?.pushToken) continue;
      const ok = await sendPushNotification(
        user.pushToken,
        'IntelliFrost – Temperatuuralarm',
        `${cellName}: te hoog (${temp}°C). Bevestig in de app.`,
        { type: 'ALARM_LAYER1', alertId: 'test-sim' }
      );
      console.log(`Alarm-push naar ${u.email} (${cellName}, ${temp}°C): ${ok ? 'OK ✅' : 'MISLUKT ❌'}`);
    }
    return;
  }

  if (arg === '--auth-check') {
    // Stuur naar een nep (maar geldig-gevormd) hex-token. Apple antwoordt dan:
    //  - 400 BadDeviceToken  => sleutel/team/bundle OK (alleen token nep) ✅
    //  - 403 InvalidProviderToken / Missing/ExpiredProviderToken => sleutel fout ❌
    const dummy = 'a'.repeat(64);
    console.log('--- APNs auth-check (dummy token) ---');
    const ok = await sendApnsPush(dummy, 'auth-check', 'auth-check');
    console.log('Resultaat send:', ok, '(let op de APNs-status/reason in de log hierboven)');
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      pushToken: { not: null },
      ...(targetEmail ? { email: targetEmail } : {}),
    },
    select: { id: true, email: true, role: true, pushToken: true },
  });

  console.log(`--- ${users.length} user(s) met een pushToken ---`);
  for (const u of users) {
    const t = u.pushToken ?? '';
    const branch = isLikelyApnsDeviceToken(t) ? 'APNs (iOS)' : 'FCM/anders';
    console.log(`- ${u.email} (${u.role}) | tokenLen=${t.length} | type=${branch}`);
  }
  console.log('');

  if (!doSend) {
    console.log('Geen verzending (voeg --send of een e-mailadres toe om te testen).');
    return;
  }

  for (const u of users) {
    if (!u.pushToken) continue;
    const ok = await sendPushNotification(
      u.pushToken,
      'IntelliFrost test',
      'Dit is een testmelding van de backend. Als je dit ziet, werkt push.',
      { type: 'TEST' }
    );
    console.log(`Verzonden naar ${u.email}: ${ok ? 'OK ✅' : 'MISLUKT ❌ (zie logs hierboven)'}`);
  }
}

main()
  .catch((e) => {
    console.error('Testscript fout:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
