import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    q: 'Wat is IntelliFrost?',
    a: 'IntelliFrost is een cloudplatform voor het monitoren van koel- en vriescellen. Via IoT-sensoren meet u temperatuur en deurstatus in realtime, met automatische escalatie bij alarmen.',
  },
  {
    q: 'Hoe werkt de escalatie?',
    a: 'Bij een alarm start Laag 1 (e-mail + push). Als u niet reageert, volgt Laag 2 (SMS, backup contact, technicus). Bij verdere non-respons: Laag 3 (AI-telefoon, backup gebeld, technicus gedispatcht).',
  },
  {
    q: 'Welke hardware is nodig?',
    a: 'U heeft IoT-loggers nodig die temperatuur en deurstatus meten en data naar het platform sturen. Neem contact op voor advies over compatibele hardware.',
  },
  {
    q: 'Kan ik meerdere locaties beheren?',
    a: 'Ja. U kunt meerdere locaties en koelcellen toevoegen. Elke cel heeft eigen drempelwaarden en alarminstellingen.',
  },
  {
    q: 'Hoe koppel ik een technicus?',
    a: 'Een technicus kan u uitnodigen via het platform. U ontvangt een e-mail en kunt de uitnodiging accepteren of weigeren. Na acceptatie heeft de technicus toegang tot uw alarmen.',
  },
  {
    q: 'Is er een mobiele app?',
    a: 'Het platform is responsive en werkt op smartphone en tablet. Er is ook ondersteuning voor push-notificaties.',
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-6">
      <h1 className="font-['Exo_2'] text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
        Veelgestelde vragen
      </h1>
      <p className="text-lg text-gray-600 dark:text-slate-400 mb-12">
        Antwoorden op de meest gestelde vragen over IntelliFrost.
      </p>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-6 text-left font-medium text-gray-900 dark:text-frost-100 hover:bg-gray-100/50 dark:hover:bg-frost-850/50 transition-colors"
            >
              {faq.q}
              {openIndex === i ? (
                <ChevronUpIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {openIndex === i && (
              <div className="px-6 pb-6 text-gray-600 dark:text-slate-400">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
