import React, { useState, useEffect } from 'react';
import { installationsApi, ticketsApi, techniciansApi, authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/api';
import { format } from 'date-fns';

const BADGE_COLORS: Record<string, string> = {
  IN_ORDE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  BINNENKORT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  VERVALLEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_COLUMNS = ['NIEUW', 'IN_BEHANDELING', 'INGEPLAND', 'AFGEROND', 'GESLOTEN'];

const INSTALLATION_TYPES = ['KOELINSTALLATIE', 'AIRCO', 'WARMTEPOMP', 'VRIESINSTALLATIE'];

const OnderhoudTickets: React.FC = () => {
  const { user } = useAuth();
  const [installations, setInstallations] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showAddInstallation, setShowAddInstallation] = useState(false);
  const [addForm, setAddForm] = useState({
    customerId: '',
    name: '',
    type: 'KOELINSTALLATIE',
    refrigerantType: 'R410A',
    refrigerantKg: 5,
    nominalCoolingKw: 0,
    hasLeakDetection: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'onderhoud' | 'tickets'>('onderhoud');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inst, tix] = await Promise.all([
        installationsApi.getAll(),
        ticketsApi.getAll(),
      ]);
      setInstallations(inst || []);
      setTickets(tix || []);

      if (user?.role === 'TECHNICIAN') {
        const profile = (user as any).profile;
        const techId = profile?.id ?? (await authApi.getCurrentUser()).profile?.id;
        if (techId) {
          const cust = await techniciansApi.getCustomers(techId);
          setCustomers(cust || []);
        }
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Data laden mislukt'));
    } finally {
      setLoading(false);
    }
  };

  const ticketsByStatus = STATUS_COLUMNS.reduce((acc, s) => {
    acc[s] = tickets.filter((t) => t.status === s);
    return acc;
  }, {} as Record<string, any[]>);

  const handleTicketStatus = async (ticketId: string, status: string, extra?: { scheduledAt?: string; confirmedSlotIndex?: number }) => {
    setUpdating(true);
    try {
      await ticketsApi.updateStatus(ticketId, { status, ...extra });
      setSelectedTicket(null);
      await fetchData();
    } catch (e) {
      setError(getErrorMessage(e, 'Status bijwerken mislukt'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-frost-100">Onderhoud & Tickets</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-frost-600">
        <button
          onClick={() => setActiveTab('onderhoud')}
          className={`px-4 py-2 font-medium ${activeTab === 'onderhoud' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Onderhoudsplanning
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 font-medium ${activeTab === 'tickets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Tickets ({tickets.length})
        </button>
      </div>

      {activeTab === 'onderhoud' && (
        <div className="bg-white dark:bg-frost-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-frost-100">Installaties (op volgorde onderhoud)</h2>
              {(user?.role === 'TECHNICIAN' || user?.role === 'ADMIN') && customers.length > 0 && (
                <button
                  onClick={() => setShowAddInstallation(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  + Installatie toevoegen
                </button>
              )}
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Laden...</div>
            ) : installations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Geen installaties. Voeg installaties toe via klantbeheer.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-frost-600">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Klant / Installatie</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Volgend onderhoud</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-frost-600">
                    {installations.map((i) => (
                      <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-frost-700/50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{i.name}</div>
                          <div className="text-sm text-gray-500">{i.customer?.companyName}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{i.type}</td>
                        <td className="px-4 py-3 text-sm">
                          {i.nextMaintenanceDate
                            ? format(new Date(i.nextMaintenanceDate), 'dd/MM/yyyy')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${BADGE_COLORS[i.badge] ?? 'bg-gray-100'}`}>
                            {i.badge === 'IN_ORDE' && '🟢 In orde'}
                            {i.badge === 'BINNENKORT' && '🟡 Binnenkort'}
                            {i.badge === 'VERVALLEN' && '🔴 Vervallen'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
            {STATUS_COLUMNS.map((status) => (
              <div key={status} className="bg-gray-100 dark:bg-frost-800 rounded-lg p-4 min-w-[200px]">
                <h3 className="font-medium text-sm text-gray-700 dark:text-frost-300 mb-3">{status.replace('_', ' ')}</h3>
                <div className="space-y-2">
                  {(ticketsByStatus[status] || []).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="bg-white dark:bg-frost-700 rounded p-3 cursor-pointer hover:ring-2 ring-blue-500"
                    >
                      <div className="font-medium text-sm truncate">{t.customer?.companyName}</div>
                      <div className="text-xs text-gray-500">{t.type}</div>
                      <div className="text-xs mt-1 line-clamp-2">{t.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedTicket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white dark:bg-frost-800 rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
                <h3 className="text-lg font-medium mb-4">Ticket: {selectedTicket.customer?.companyName}</h3>
                <p className="text-sm text-gray-600 dark:text-frost-400 mb-4">{selectedTicket.description}</p>
                <div className="text-sm space-y-2 mb-4">
                  <p><strong>Type:</strong> {selectedTicket.type}</p>
                  <p><strong>Ernst:</strong> {selectedTicket.urgency}</p>
                  <p><strong>Voorgestelde tijden:</strong></p>
                  <ul className="list-disc pl-4">
                    {selectedTicket.proposedSlots?.map((s: any) => (
                      <li key={s.id}>
                        {format(new Date(s.date), 'dd/MM/yyyy')} – {s.preference}
                        <button
                          onClick={() => handleTicketStatus(selectedTicket.id, 'INGEPLAND', { confirmedSlotIndex: s.slotIndex })}
                          disabled={updating}
                          className="ml-2 text-blue-600 hover:underline text-xs"
                        >
                          Bevestig
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedTicket.status === 'NIEUW' && (
                    <button
                      onClick={() => handleTicketStatus(selectedTicket.id, 'IN_BEHANDELING')}
                      disabled={updating}
                      className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded text-sm"
                    >
                      In behandeling
                    </button>
                  )}
                  {['NIEUW', 'IN_BEHANDELING'].includes(selectedTicket.status) && (
                    <button
                      onClick={() => handleTicketStatus(selectedTicket.id, 'GESLOTEN')}
                      disabled={updating}
                      className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded text-sm"
                    >
                      Sluiten
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddInstallation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-frost-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Installatie toevoegen</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!addForm.customerId || !addForm.name) return;
                try {
                  await installationsApi.create(addForm);
                  setShowAddInstallation(false);
                  setAddForm({ customerId: '', name: '', type: 'KOELINSTALLATIE', refrigerantType: 'R410A', refrigerantKg: 5, nominalCoolingKw: 0, hasLeakDetection: false });
                  fetchData();
                } catch (err) {
                  setError(getErrorMessage(err, 'Installatie toevoegen mislukt'));
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Klant</label>
                <select
                  value={addForm.customerId}
                  onChange={(e) => setAddForm({ ...addForm, customerId: e.target.value })}
                  required
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                >
                  <option value="">— Selecteer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Naam</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                  placeholder="bv. Koelcel 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                >
                  {INSTALLATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Koelmiddel (type)</label>
                <input
                  value={addForm.refrigerantType}
                  onChange={(e) => setAddForm({ ...addForm, refrigerantType: e.target.value })}
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                  placeholder="R410A, R32, CO2..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Koelmiddel (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={addForm.refrigerantKg}
                  onChange={(e) => setAddForm({ ...addForm, refrigerantKg: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Koelvermogen (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  value={addForm.nominalCoolingKw}
                  onChange={(e) => setAddForm({ ...addForm, nominalCoolingKw: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addForm.hasLeakDetection}
                  onChange={(e) => setAddForm({ ...addForm, hasLeakDetection: e.target.checked })}
                />
                Lekdetectiesysteem aanwezig
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Toevoegen</button>
                <button type="button" onClick={() => setShowAddInstallation(false)} className="px-4 py-2 border rounded-lg">Annuleren</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnderhoudTickets;
