import { useState } from 'react';

interface Section {
  title: string;
  text: string;
}

interface LangContent {
  lang: string;
  title: string;
  subtitle: string;
  updated: string;
  sections: Section[];
}

const content: Record<string, LangContent> = {
  nl: {
    lang: 'NL',
    title: 'Privacybeleid',
    subtitle: 'Hoe Intellifrost omgaat met uw gegevens',
    updated: 'Laatst bijgewerkt: maart 2026',
    sections: [
      {
        title: '1. Verwerkingsverantwoordelijke',
        text: `Intellifrost (eenmanszaak)
Lennert Cools
Nijlen, België
E-mail: info@intellifrost.be
Website: https://intellifrost.be

Intellifrost is verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in dit privacybeleid.`,
      },
      {
        title: '2. Welke gegevens verzamelen wij?',
        text: `Wij verzamelen de volgende categorieën van persoonsgegevens:

**Identiteits- en contactgegevens**
Naam, e-mailadres en bedrijfsnaam die u verstrekt bij registratie of contact.

**Betaalgegevens**
Betalingen worden verwerkt via Mollie B.V. Wij slaan zelf geen volledige betaalgegevens op. Mollie verwerkt uw betaalinformatie conform hun eigen privacybeleid (mollie.com/privacy).

**Temperatuur- en apparaatdata**
Data afkomstig van uw Intellifrost-apparaten: temperatuurmetingen, alarmgebeurtenissen en apparaatstatus. Deze gegevens worden opgeslagen om HACCP-compliance aan te tonen en zijn eigendom van uw onderneming.

**Websiteanalysegegevens**
Met uw toestemming gebruiken wij Google Analytics 4 om anoniem bezoekersgedrag op onze website te meten. Google LLC verwerkt deze data in de Verenigde Staten. IP-adressen worden geanonimiseerd.`,
      },
      {
        title: '3. Waarom verwerken wij uw gegevens?',
        text: `Wij verwerken uw gegevens op basis van de volgende rechtsgrondslagen:

• **Uitvoering van een overeenkomst** — om u toegang te geven tot het Intellifrost platform, apparaten te beheren en u te factureren.
• **Wettelijke verplichting** — om te voldoen aan HACCP-regelgeving en boekhoudkundige verplichtingen.
• **Gerechtvaardigd belang** — om de veiligheid en werking van ons platform te waarborgen.
• **Toestemming** — voor het plaatsen van analytische cookies via Google Analytics (u kunt dit weigeren of intrekken via onze cookiebanner).`,
      },
      {
        title: '4. Hoe lang bewaren wij uw gegevens?',
        text: `• **Accountgegevens:** zolang uw account actief is, en maximaal 2 jaar na beëindiging.
• **Temperatuurdata:** minimaal 2 jaar conform HACCP-richtlijnen, of langer indien uw sector dit vereist.
• **Factuurgegevens:** 7 jaar conform Belgische boekhoudwetgeving.
• **Analysedata (GA4):** maximaal 14 maanden.`,
      },
      {
        title: '5. Delen wij uw gegevens met derden?',
        text: `Wij delen uw gegevens uitsluitend met vertrouwde verwerkers die noodzakelijk zijn voor onze dienstverlening:

• **Supabase Inc.** — databaseopslag (VS, met EU-datacenters)
• **Railway Corp.** — serverhosting (VS)
• **Mollie B.V.** — betalingsverwerking (NL)
• **Twilio Inc.** — SMS- en telefoonalerts (VS)
• **Resend Inc.** — transactionele e-mails (VS)
• **Google LLC** — websiteanalyse via Google Analytics 4 (VS)

Met alle verwerkers zijn verwerkersovereenkomsten afgesloten conform de AVG. Voor doorgifte buiten de EER worden passende waarborgen toegepast (Standard Contractual Clauses).`,
      },
      {
        title: '6. Uw rechten',
        text: `Als betrokkene heeft u de volgende rechten:

• **Inzage** — u kunt opvragen welke gegevens wij over u bewaren.
• **Correctie** — u kunt onjuiste gegevens laten corrigeren.
• **Verwijdering** — u kunt verzoeken om verwijdering van uw gegevens, voor zover geen wettelijke bewaarplicht geldt.
• **Beperking** — u kunt verzoeken om beperkte verwerking.
• **Overdraagbaarheid** — u kunt uw gegevens in een leesbaar formaat opvragen.
• **Bezwaar** — u kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang.
• **Intrekking toestemming** — u kunt uw toestemming voor cookies op elk moment intrekken via de cookiebanner.

Verzoeken kunt u richten aan: info@intellifrost.be. Wij reageren binnen 30 dagen.

U heeft ook het recht een klacht in te dienen bij de Gegevensbeschermingsautoriteit (GBA): www.gegevensbeschermingsautoriteit.be`,
      },
      {
        title: '7. Beveiliging',
        text: `Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beveiligen, waaronder:

• Versleutelde verbindingen (HTTPS/TLS)
• Row Level Security op databaseniveau (Supabase RLS)
• Toegangscontrole per gebruikersaccount
• Regelmatige back-ups`,
      },
      {
        title: '8. Cookies',
        text: `Wij gebruiken enkel analytische cookies via Google Analytics 4, en uitsluitend na uw toestemming. U kunt uw keuze op elk moment wijzigen via de cookiebanner onderaan onze website.

Meer informatie over hoe Google Analytics gegevens verwerkt: policies.google.com/privacy`,
      },
      {
        title: '9. Wijzigingen',
        text: `Wij kunnen dit privacybeleid periodiek bijwerken. De meest recente versie is steeds beschikbaar op intellifrost.be/privacy. Bij ingrijpende wijzigingen informeren wij u per e-mail.`,
      },
    ],
  },
  en: {
    lang: 'EN',
    title: 'Privacy Policy',
    subtitle: 'How Intellifrost handles your data',
    updated: 'Last updated: March 2026',
    sections: [
      {
        title: '1. Data Controller',
        text: `Intellifrost (sole proprietorship)
Lennert Cools
Nijlen, Belgium
Email: info@intellifrost.be
Website: https://intellifrost.be

Intellifrost is responsible for the processing of personal data as described in this privacy policy.`,
      },
      {
        title: '2. What data do we collect?',
        text: `We collect the following categories of personal data:

**Identity and contact details**
Name, email address and company name provided during registration or contact.

**Payment data**
Payments are processed via Mollie B.V. We do not store full payment details ourselves. Mollie processes your payment information in accordance with their own privacy policy (mollie.com/privacy).

**Temperature and device data**
Data originating from your Intellifrost devices: temperature readings, alarm events and device status. This data is stored to demonstrate HACCP compliance and remains the property of your business.

**Website analytics data**
With your consent, we use Google Analytics 4 to anonymously measure visitor behavior on our website. Google LLC processes this data in the United States. IP addresses are anonymized.`,
      },
      {
        title: '3. Why do we process your data?',
        text: `We process your data on the following legal bases:

• **Performance of a contract** — to provide you access to the Intellifrost platform, manage devices and issue invoices.
• **Legal obligation** — to comply with HACCP regulations and accounting obligations.
• **Legitimate interest** — to ensure the security and operation of our platform.
• **Consent** — for placing analytical cookies via Google Analytics (you may refuse or withdraw this via our cookie banner).`,
      },
      {
        title: '4. How long do we retain your data?',
        text: `• **Account data:** for as long as your account is active, and up to 2 years after termination.
• **Temperature data:** minimum 2 years in accordance with HACCP guidelines, or longer if required by your sector.
• **Invoice data:** 7 years in accordance with Belgian accounting law.
• **Analytics data (GA4):** maximum 14 months.`,
      },
      {
        title: '5. Do we share your data with third parties?',
        text: `We only share your data with trusted processors necessary for our services:

• **Supabase Inc.** — database storage (US, with EU data centers)
• **Railway Corp.** — server hosting (US)
• **Mollie B.V.** — payment processing (NL)
• **Twilio Inc.** — SMS and phone alerts (US)
• **Resend Inc.** — transactional emails (US)
• **Google LLC** — website analytics via Google Analytics 4 (US)

Data processing agreements have been concluded with all processors in accordance with GDPR. For transfers outside the EEA, appropriate safeguards are applied (Standard Contractual Clauses).`,
      },
      {
        title: '6. Your rights',
        text: `As a data subject, you have the following rights:

• **Access** — you may request what data we hold about you.
• **Rectification** — you may have inaccurate data corrected.
• **Erasure** — you may request deletion of your data, insofar as no legal retention obligation applies.
• **Restriction** — you may request restricted processing.
• **Portability** — you may request your data in a readable format.
• **Objection** — you may object to processing based on legitimate interest.
• **Withdrawal of consent** — you may withdraw your consent for cookies at any time via the cookie banner.

Requests can be sent to: info@intellifrost.be. We will respond within 30 days.

You also have the right to lodge a complaint with the Data Protection Authority (GBA): www.gegevensbeschermingsautoriteit.be`,
      },
      {
        title: '7. Security',
        text: `We take appropriate technical and organizational measures to secure your data, including:

• Encrypted connections (HTTPS/TLS)
• Row Level Security at database level (Supabase RLS)
• Access control per user account
• Regular backups`,
      },
      {
        title: '8. Cookies',
        text: `We only use analytical cookies via Google Analytics 4, and only with your consent. You can change your preference at any time via the cookie banner at the bottom of our website.

More information on how Google Analytics processes data: policies.google.com/privacy`,
      },
      {
        title: '9. Changes',
        text: `We may update this privacy policy periodically. The most recent version is always available at intellifrost.be/privacy. In case of significant changes, we will notify you by email.`,
      },
    ],
  },
};

function renderText(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <p key={i} className="section-subtitle">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    }
    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="body-line">
          {parts.map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
        </p>
      );
    }
    if (line.startsWith('•')) {
      return (
        <p key={i} className="bullet-line">
          {line}
        </p>
      );
    }
    if (line.trim() === '') return <br key={i} />;
    return (
      <p key={i} className="body-line">
        {line}
      </p>
    );
  });
}

export default function Privacy() {
  const [lang, setLang] = useState<'nl' | 'en'>('nl');
  const c = content[lang];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pp-root {
          min-height: 100vh;
          background: #f8f8f6;
          font-family: 'DM Sans', sans-serif;
          color: #0A1628;
        }

        .pp-header {
          background: #0A1628;
          padding: 48px 0 40px;
          position: relative;
          overflow: hidden;
        }

        .pp-header::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%);
        }

        .pp-header-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 32px;
          position: relative;
        }

        .pp-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 15px;
          color: #00D4FF;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 28px;
          opacity: 0.9;
        }

        .pp-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(32px, 5vw, 52px);
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 12px;
        }

        .pp-subtitle {
          font-size: 16px;
          color: rgba(255,255,255,0.55);
          font-weight: 300;
          margin-bottom: 28px;
        }

        .pp-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .pp-updated {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .lang-toggle {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 3px;
        }

        .lang-btn {
          padding: 5px 14px;
          border: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .lang-btn.active {
          background: #00D4FF;
          color: #0A1628;
        }

        .lang-btn:not(.active) {
          background: transparent;
          color: rgba(255,255,255,0.4);
        }

        .lang-btn:not(.active):hover {
          color: rgba(255,255,255,0.8);
        }

        .pp-body {
          max-width: 760px;
          margin: 0 auto;
          padding: 56px 32px 96px;
        }

        .pp-section {
          margin-bottom: 44px;
          padding-bottom: 44px;
          border-bottom: 1px solid rgba(10,22,40,0.08);
        }

        .pp-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .pp-section-title {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: #0A1628;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pp-section-title::before {
          content: '';
          display: block;
          width: 3px;
          height: 20px;
          background: #00D4FF;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .body-line {
          font-size: 15px;
          line-height: 1.75;
          color: #3a4a5c;
          font-weight: 300;
          margin-bottom: 4px;
        }

        .section-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #0A1628;
          margin-top: 16px;
          margin-bottom: 4px;
          letter-spacing: 0.2px;
        }

        .bullet-line {
          font-size: 15px;
          line-height: 1.75;
          color: #3a4a5c;
          font-weight: 300;
          padding-left: 8px;
          margin-bottom: 2px;
        }

        .pp-footer {
          background: #0A1628;
          padding: 28px 32px;
          text-align: center;
        }

        .pp-footer p {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          font-weight: 300;
        }

        .pp-footer a {
          color: #00D4FF;
          text-decoration: none;
        }

        @media (max-width: 600px) {
          .pp-header-inner, .pp-body { padding-left: 20px; padding-right: 20px; }
        }
      `}</style>

      <div className="pp-root">
        <header className="pp-header">
          <div className="pp-header-inner">
            <div className="pp-logo">Intellifrost</div>
            <h1 className="pp-title">{c.title}</h1>
            <p className="pp-subtitle">{c.subtitle}</p>
            <div className="pp-meta">
              <div className="lang-toggle">
                <button
                  className={`lang-btn ${lang === 'nl' ? 'active' : ''}`}
                  onClick={() => setLang('nl')}
                >
                  NL
                </button>
                <button
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
              </div>
              <span className="pp-updated">{c.updated}</span>
            </div>
          </div>
        </header>

        <main className="pp-body">
          {c.sections.map((section, i) => (
            <div key={i} className="pp-section">
              <h2 className="pp-section-title">{section.title}</h2>
              <div>{renderText(section.text)}</div>
            </div>
          ))}
        </main>

        <footer className="pp-footer">
          <p>
            © {new Date().getFullYear()} Intellifrost —{' '}
            <a href="mailto:info@intellifrost.be">info@intellifrost.be</a>
          </p>
        </footer>
      </div>
    </>
  );
}
