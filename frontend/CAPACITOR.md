# ColdMonitor – iOS app met Capacitor

De bestaande webapp is verpakt als native iOS-app via Capacitor. Dezelfde codebase draait op iPhone en iPad.

## Vereisten

- **macOS** met Xcode (gratis via App Store)
- **Apple Developer-account** ($99/jaar) voor installatie op echte toestellen en App Store-publicatie
- **Node.js** (al aanwezig voor de webapp)

## Snel starten

```bash
# 1. Webapp bouwen en naar iOS kopiëren
npm run cap:sync

# 2. Xcode openen
npm run cap:ios
```

In Xcode:
- Kies een simulator (bv. iPhone 15) of sluit je eigen toestel aan
- Druk op **Run** (▶)

## API-URL voor mobiel

Op een **echt toestel** werkt `localhost` niet; de app moet naar je backend over het netwerk.

### Ontwikkeling (lokaal)
1. Zorg dat backend draait: `cd backend && npm run dev`
2. Gebruik het IP van je Mac in plaats van localhost:
   ```bash
   # .env in frontend/
   VITE_API_URL=http://192.168.1.X:3001/api
   ```
3. Zoek je Mac-IP via Systeempreferenties → Netwerk of `ifconfig | grep "inet "`

### Productie
Gebruik je live backend-URL (HTTPS):
```bash
VITE_API_URL=https://api.jouwdomein.com/api
```

Daarna opnieuw bouwen: `npm run cap:sync`

## Scripts

| Script | Beschrijving |
|--------|--------------|
| `npm run cap:sync` | Bouwt de webapp en kopieert alles naar `ios/` |
| `npm run cap:ios` | Opent het iOS-project in Xcode |

**Tip:** na elke wijziging aan de webapp eerst `npm run cap:sync` draaien, dan in Xcode opnieuw builden.

## App Store publiceren

1. Apple Developer-account actief maken
2. In Xcode: Product → Archive
3. Distribute App → App Store Connect
4. Volg de wizard (certificaten, provisioning profiles, etc.)
5. Upload naar App Store Connect
6. In App Store Connect de app configureren en indienen voor review

## Mappenstructuur

```
frontend/
├── dist/              # Gebouwde webapp (wordt naar iOS gekopieerd)
├── ios/               # Xcode-project
│   └── App/           # iOS-app
├── capacitor.config.ts
└── CAPACITOR.md       # Deze handleiding
```
