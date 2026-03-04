import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { ticketsApi, installationsApi } from '../services/api';
import { getErrorMessage } from '../services/api';
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  PaperAirplaneIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const TICKET_TYPES = [
  { id: 'ONDERHOUDSAANVRAAG', label: 'Onderhoudsaanvraag', icon: WrenchScrewdriverIcon },
  { id: 'STORINGSMELDING', label: 'Storingsmelding', icon: ExclamationTriangleIcon },
  { id: 'VRAAG_OPMERKING', label: 'Vraag / Opmerking', icon: QuestionMarkCircleIcon },
];

const URGENCY_OPTIONS = [
  { id: 'LAAG', label: 'Laag' },
  { id: 'NORMAAL', label: 'Normaal' },
  { id: 'DRINGEND', label: 'Dringend' },
];

const STATUS_LABELS: Record<string, string> = {
  NIEUW: 'Ingediend',
  IN_BEHANDELING: 'In behandeling',
  INGEPLAND: 'Ingepland',
  AFGEROND: 'Afgerond',
  GESLOTEN: 'Gesloten',
};

const MijnTickets: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [cancellingTicket, setCancellingTicket] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'ONDERHOUDSAANVRAAG',
    urgency: 'NORMAAL',
    description: '',
    installationId: '',
    slots: [
      { slotIndex: 1, date: '', preference: 'OCHTEND' },
      { slotIndex: 2, date: '', preference: 'OCHTEND' },
    ],
  });

  useEffect(() => {
    fetchTickets();
    fetchInstallations();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await ticketsApi.getAll();
      setTickets(data || []);
    } catch (e) {
      setError(getErrorMessage(e, 'Tickets laden mislukt'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInstallations = async () => {
    try {
      const data = await installationsApi.getAll();
      setInstallations(data || []);
    } catch {
      setInstallations([]);
    }
  };

  const resetForm = () => ({
    type: 'ONDERHOUDSAANVRAAG',
    urgency: 'NORMAAL',
    description: '',
    installationId: '',
    slots: [
      { slotIndex: 1, date: '', preference: 'OCHTEND' },
      { slotIndex: 2, date: '', preference: 'OCHTEND' },
    ],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const slots = form.slots.filter((s) => s.date);
      if (slots.length === 0) {
        setError('Geef minstens één gewenst tijdstip op.');
        return;
      }
      if (editingTicket) {
        await ticketsApi.update(editingTicket.id, {
          type: form.type,
          urgency: form.urgency,
          description: form.description,
          installationId: form.installationId || undefined,
          proposedSlots: slots.map((s) => ({
            slotIndex: s.slotIndex,
            date: s.date,
            preference: s.preference,
          })),
        });
        setEditingTicket(null);
      } else {
        await ticketsApi.create({
          type: form.type,
          urgency: form.urgency,
          description: form.description,
          installationId: form.installationId || undefined,
          proposedSlots: slots.map((s) => ({
            slotIndex: s.slotIndex,
            date: s.date,
            preference: s.preference,
          })),
        });
        setShowForm(false);
      }
      setForm(resetForm());
      await fetchTickets();
    } catch (e) {
      setError(getErrorMessage(e, editingTicket ? 'Ticket aanpassen mislukt' : 'Ticket indienen mislukt'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTicket = async (ticket: any) => {
    setError('');
    setSubmitting(true);
    try {
      await ticketsApi.cancel(ticket.id);
      setCancellingTicket(null);
      await fetchTickets();
    } catch (e) {
      setError(getErrorMessage(e, 'Ticket annuleren mislukt'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditForm = (ticket: any) => {
    const slots = ticket.proposedSlots?.length
      ? ticket.proposedSlots
          .sort((a: any, b: any) => a.slotIndex - b.slotIndex)
          .map((s: any) => ({
            slotIndex: s.slotIndex,
            date: format(new Date(s.date), 'yyyy-MM-dd'),
            preference: s.preference,
          }))
      : [
          { slotIndex: 1, date: '', preference: 'OCHTEND' },
          { slotIndex: 2, date: '', preference: 'OCHTEND' },
        ];
    while (slots.length < 2) slots.push({ slotIndex: slots.length + 1, date: '', preference: 'OCHTEND' });
    setForm({
      type: ticket.type,
      urgency: ticket.urgency,
      description: ticket.description,
      installationId: ticket.installationId || '',
      slots,
    });
    setEditingTicket(ticket);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-frost-100">Mijn tickets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nieuw ticket
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {showForm && !editingTicket && (
        <div className="bg-white dark:bg-frost-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Ticket indienen</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">Type</label>
              <div className="flex flex-wrap gap-4">
                {TICKET_TYPES.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="radio"
                      name="type"
                      value={t.id}
                      checked={form.type === t.id}
                      onChange={() => setForm({ ...form, type: t.id })}
                    />
                    <t.icon className="h-5 w-5" />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">Ernst</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100"
              >
                {URGENCY_OPTIONS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
            {installations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">Installatie</label>
                <select
                  value={form.installationId}
                  onChange={(e) => setForm({ ...form, installationId: e.target.value })}
                  className="block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100"
                >
                  <option value="">— Geen specifieke installatie —</option>
                  {installations.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">Beschrijving</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                required
                className="block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100"
                placeholder="Beschrijf het probleem of uw aanvraag..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-2">Gewenste tijdstippen</label>
              {form.slots.map((s, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={s.date}
                    onChange={(e) => {
                      const slots = [...form.slots];
                      slots[idx] = { ...slots[idx], date: e.target.value };
                      setForm({ ...form, slots });
                    }}
                    className="rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                  />
                  <select
                    value={s.preference}
                    onChange={(e) => {
                      const slots = [...form.slots];
                      slots[idx] = { ...slots[idx], preference: e.target.value };
                      setForm({ ...form, slots });
                    }}
                    className="rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                  >
                    <option value="OCHTEND">Ochtend</option>
                    <option value="NAMIDDAG">Namiddag</option>
                    <option value="AVOND">Avond</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
                <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                {submitting ? 'Bezig...' : 'Ticket indienen'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(resetForm()); }}
                className="px-4 py-2 border border-gray-300 dark:border-frost-600 rounded-lg"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto" onClick={() => setEditingTicket(null)}>
          <div className="bg-white dark:bg-frost-800 rounded-lg p-6 max-w-xl w-full shadow-xl my-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-medium mb-4">Ticket aanpassen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">Type</label>
                <div className="flex flex-wrap gap-4">
                  {TICKET_TYPES.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="type"
                        value={t.id}
                        checked={form.type === t.id}
                        onChange={() => setForm({ ...form, type: t.id })}
                      />
                      <t.icon className="h-5 w-5" />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">Ernst</label>
                <select
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                  className="block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100"
                >
                  {URGENCY_OPTIONS.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>
              {installations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">Installatie</label>
                  <select
                    value={form.installationId}
                    onChange={(e) => setForm({ ...form, installationId: e.target.value })}
                    className="block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100"
                  >
                    <option value="">— Geen specifieke installatie —</option>
                    {installations.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">Beschrijving</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  required
                  className="block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100"
                  placeholder="Beschrijf het probleem of uw aanvraag..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-2">Gewenste tijdstippen</label>
                {form.slots.map((s, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={s.date}
                      onChange={(e) => {
                        const slots = [...form.slots];
                        slots[idx] = { ...slots[idx], date: e.target.value };
                        setForm({ ...form, slots });
                      }}
                      className="rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                    />
                    <select
                      value={s.preference}
                      onChange={(e) => {
                        const slots = [...form.slots];
                        slots[idx] = { ...slots[idx], preference: e.target.value };
                        setForm({ ...form, slots });
                      }}
                      className="rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                    >
                      <option value="OCHTEND">Ochtend</option>
                      <option value="NAMIDDAG">Namiddag</option>
                      <option value="AVOND">Avond</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  {submitting ? 'Bezig...' : 'Wijzigingen opslaan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingTicket(null); setForm(resetForm()); }}
                  className="px-4 py-2 border border-gray-300 dark:border-frost-600 rounded-lg"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-frost-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-frost-100 mb-4">Ticketoverzicht</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Laden...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nog geen tickets. Dien een nieuw ticket in.</div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className={`border border-gray-200 dark:border-frost-600 rounded-lg p-4 gap-4 ${
                    Capacitor.isNativePlatform()
                      ? 'flex flex-col'
                      : 'flex flex-wrap justify-between items-start'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{TICKET_TYPES.find((x) => x.id === t.type)?.label ?? t.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${
                        t.urgency === 'DRINGEND' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        t.urgency === 'NORMAAL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-gray-100 text-gray-800 dark:bg-frost-700 dark:text-frost-300'
                      }`}>
                        {t.urgency}
                      </span>
                      <span className="text-sm text-gray-500">{STATUS_LABELS[t.status] ?? t.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-frost-400 mt-1 line-clamp-2">{t.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Ingediend {format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm')}
                      {t.scheduledAt && ` • Gepland: ${format(new Date(t.scheduledAt), 'dd/MM/yyyy')}`}
                    </p>
                  </div>
                  {!['AFGEROND', 'GESLOTEN'].includes(t.status) && (
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {['NIEUW', 'IN_BEHANDELING', 'INGEPLAND'].includes(t.status) && (
                        <button
                          onClick={() => openEditForm(t)}
                          disabled={submitting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-frost-600 rounded-lg hover:bg-gray-50 dark:hover:bg-frost-700"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Aanpassen
                        </button>
                      )}
                      <button
                        onClick={() => setCancellingTicket(t)}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Annuleren
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {cancellingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-frost-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-frost-100 mb-2">Ticket annuleren</h3>
            <p className="text-gray-600 dark:text-frost-400 mb-4">
              Weet u zeker dat u dit ticket wilt annuleren? Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCancellingTicket(null)}
                className="px-4 py-2 border border-gray-300 dark:border-frost-600 rounded-lg"
              >
                Terug
              </button>
              <button
                onClick={() => handleCancelTicket(cancellingTicket)}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Bezig...' : 'Ja, annuleren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MijnTickets;
