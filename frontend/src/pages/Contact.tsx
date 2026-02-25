import React, { useState } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder – kan later gekoppeld worden aan een API of mailto
    window.location.href = `mailto:info@intellifrost.be?subject=Contact via website&body=Naam: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0A%0D%0ABericht:%0D%0A${formData.message}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-6">
      <h1 className="font-['Exo_2'] text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
        Contact
      </h1>
      <p className="text-lg text-gray-600 dark:text-slate-400 mb-12">
        Heeft u vragen of wenst u een offerte? Neem contact met ons op.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-frost-100 mb-4">Contactgegevens</h2>
          <div className="space-y-4 text-gray-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-[#00c8ff]" />
              <a href="mailto:info@intellifrost.be" className="hover:text-[#00c8ff]">
                info@intellifrost.be
              </a>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-[#00c8ff]" />
              <a href="tel:+32123456789" className="hover:text-[#00c8ff]">
                +32 123 45 67 89
              </a>
            </div>
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0 mt-0.5" />
              <span>België</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Naam</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
              placeholder="Uw naam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
              placeholder="uw@email.be"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bericht</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
              placeholder="Uw bericht..."
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            Verstuur
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
