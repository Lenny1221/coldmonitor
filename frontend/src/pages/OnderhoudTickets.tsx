import React, { useState, useEffect, useMemo } from 'react';
import { installationsApi, ticketsApi, techniciansApi, authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/api';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ListBulletIcon } from '@heroicons/react/24/outline';

const BADGE_COLORS: Record<string, string> = {
  IN_ORDE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  BINNENKORT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  VERVALLEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_COLUMNS = ['NIEUW', 'IN_BEHANDELING', 'INGEPLAND', 'AFGEROND', 'GESLOTEN'];
const AGENDA_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const INSTALLATION_TYPES = ['KOELINSTALLATIE', 'AIRCO', 'WARMTEPOMP', 'VRIESINSTALLATIE'];

const INSTALLATION_TYPE_LABELS: Record<string, string> = {
  KOELINSTALLATIE: 'Koelinstallatie',
  AIRCO: 'Airco',
  WARMTEPOMP: 'Warmtepomp',
  VRIESINSTALLATIE: 'Vriesinstallatie',
};

const STATUS_LABELS: Record<string, string> = {
  NIEUW: 'Nieuw',
  IN_BEHANDELING: 'In behandeling',
  INGEPLAND: 'Ingepland',
  AFGEROND: 'Afgerond',
  GESLOTEN: 'Gesloten',
};

const TICKET_TYPE_LABELS: Record<string, string> = {
  ONDERHOUDSAANVRAAG: 'Onderhoudsaanvraag',
  STORINGSMELDING: 'Storingsmelding',
  VRAAG_OPMERKING: 'Vraag / Opmerking',
};

/** Volledige lijst koelgassen voor installaties */
const REFRIGERANTS = [
  'R22', 'R123', 'R124', 'R125', 'R134a', 'R143a', 'R152a', 'R227ea', 'R236fa', 'R245fa',
  'R32', 'R410A', 'R407C', 'R407A', 'R404A', 'R507', 'R422D', 'R422A', 'R428A', 'R434A',
  'R437A', 'R438A', 'R417A', 'R423A', 'R449A', 'R452A', 'R453A', 'R513A', 'R516A',
  'R1234yf', 'R1234ze(E)', 'R1234ze(Z)', 'R1233zd(E)',
  'R290', 'R600a', 'R744', 'R717',
];

/** Agenda-item: onderhoud (volgende datum) of ticket (gepland) */
interface AgendaItem {
  id: string;
  type: 'onderhoud' | 'ticket';
  date: Date;
  hour?: number; // undefined = hele dag
  title: string;
  subtitle: string;
  badge?: string;
  color: string;
  raw: any;
}

const OnderhoudTickets: React.FC = () => {
  const { user } = useAuth();
  const [installations, setInstallations] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());
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
  const [onderhoudView, setOnderhoudView] = useState<'agenda' | 'lijst'>('agenda');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<AgendaItem | null>(null);
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

  /** Agenda-items voor kalender: onderhoudsdata + ingeplande tickets */
  const agendaItems: AgendaItem[] = useMemo(() => {
    const items: AgendaItem[] = [];
    installations.forEach((i) => {
      if (i.nextMaintenanceDate) {
        const d = new Date(i.nextMaintenanceDate);
        items.push({
          id: `inst-${i.id}`,
          type: 'onderhoud',
          date: d,
          title: i.name,
          subtitle: i.customer?.companyName ?? '',
          badge: i.badge,
          color: i.badge === 'VERVALLEN' ? 'bg-red-500' : i.badge === 'BINNENKORT' ? 'bg-amber-500' : 'bg-emerald-500',
          raw: i,
        });
      }
    });
    tickets
      .filter((t) => t.status === 'INGEPLAND' && t.scheduledAt)
      .forEach((t) => {
        const d = new Date(t.scheduledAt);
        items.push({
          id: `ticket-${t.id}`,
          type: 'ticket',
          date: d,
          hour: d.getHours(),
          title: t.customer?.companyName ?? 'Ticket',
          subtitle: t.type,
          color: 'bg-blue-500',
          raw: t,
        });
      });
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [installations, tickets]);

  const { weekStart, weekEnd, days } = useMemo(() => {
    if (calendarView === 'week') {
      const start = startOfWeek(calendarDate, { weekStartsOn: 1 });
      const end = endOfWeek(calendarDate, { weekStartsOn: 1 });
      const dayList = eachDayOfInterval({ start, end });
      return { weekStart: start, weekEnd: end, days: dayList };
    }
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const dayList = eachDayOfInterval({ start, end });
    return { weekStart: start, weekEnd: end, days: dayList };
  }, [calendarDate, calendarView]);

  const itemsByDay = useMemo(() => {
    const map: Record<string, AgendaItem[]> = {};
    days.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      map[key] = agendaItems.filter((item) => isSameDay(item.date, d));
    });
    return map;
  }, [days, agendaItems]);

  /** Voor weekweergave: items per dag per uur (of all-day) */
  const itemsByDayAndHour = useMemo(() => {
    const map: Record<string, Record<number | 'all', AgendaItem[]>> = {};
    days.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const dayItems = agendaItems.filter((item) => isSameDay(item.date, d));
      map[key] = { all: dayItems.filter((i) => i.hour == null), ...AGENDA_HOURS.reduce((acc, h) => ({ ...acc, [h]: dayItems.filter((i) => i.hour === h) }), {} as Record<number, AgendaItem[]>) };
    });
    return map;
  }, [days, agendaItems]);

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
          onClick={() => { setActiveTab('onderhoud'); setOnderhoudView('agenda'); }}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === 'onderhoud' && onderhoudView === 'agenda' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <CalendarDaysIcon className="h-5 w-5" />
          Agenda
        </button>
        <button
          onClick={() => { setActiveTab('onderhoud'); setOnderhoudView('lijst'); }}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === 'onderhoud' && onderhoudView === 'lijst' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <ListBulletIcon className="h-5 w-5" />
          Lijst
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 font-medium ${activeTab === 'tickets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Tickets ({tickets.length})
        </button>
      </div>

      {activeTab === 'onderhoud' && onderhoudView === 'agenda' && (
        <div className="bg-white dark:bg-frost-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-frost-600">
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarDate(calendarView === 'week' ? subWeeks(calendarDate, 1) : subMonths(calendarDate, 1))}
                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-frost-700 transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="font-bold text-gray-900 dark:text-frost-100 min-w-[200px] text-center text-lg">
                  {calendarView === 'week'
                    ? `Week ${format(weekStart, 'd', { locale: nl })} – ${format(weekEnd, 'd MMM yyyy', { locale: nl })}`
                    : format(calendarDate, 'MMMM yyyy', { locale: nl })}
                </span>
                <button
                  onClick={() => setCalendarDate(calendarView === 'week' ? addWeeks(calendarDate, 1) : addMonths(calendarDate, 1))}
                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-frost-700 transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="px-4 py-2 text-sm font-medium border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  Vandaag
                </button>
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-frost-700 rounded-xl">
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${calendarView === 'week' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-frost-300 hover:bg-gray-200 dark:hover:bg-frost-600'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${calendarView === 'month' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-frost-300 hover:bg-gray-200 dark:hover:bg-frost-600'}`}
                >
                  Maand
                </button>
              </div>
            </div>

            {calendarView === 'week' ? (
              <div className="overflow-x-auto -mx-2">
                <div className="min-w-[700px] border border-gray-200 dark:border-frost-600 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-8 bg-gray-50 dark:bg-frost-800">
                    <div className="p-2 border-b border-r border-gray-200 dark:border-frost-600" />
                    {days.map((day) => (
                      <div
                        key={format(day, 'yyyy-MM-dd')}
                        className={`p-2 text-center border-b border-r last:border-r-0 border-gray-200 dark:border-frost-600 ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <div className="text-xs font-semibold text-gray-500 dark:text-frost-400 uppercase">
                          {format(day, 'EEE', { locale: nl })}
                        </div>
                        <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-600' : 'text-gray-900 dark:text-frost-100'}`}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-8 border-b border-gray-200 dark:border-frost-600">
                    <div className="p-2 border-r border-gray-200 dark:border-frost-600 bg-gray-50 dark:bg-frost-800 text-xs font-medium text-gray-500">
                      Hele dag
                    </div>
                    {days.map((day) => {
                      const key = format(day, 'yyyy-MM-dd');
                      const allItems = (itemsByDayAndHour[key]?.all ?? []) as AgendaItem[];
                      return (
                        <div
                          key={key}
                          className={`min-h-[44px] p-2 border-r last:border-r-0 border-gray-200 dark:border-frost-600 ${isToday(day) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-frost-800'}`}
                        >
                          <div className="space-y-1.5">
                            {allItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedAgendaItem(item)}
                                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium truncate ${item.color} text-white hover:opacity-90 hover:ring-2 ring-offset-1 ring-white/50 transition-all shadow-sm`}
                                title={`${item.title} – ${item.subtitle}`}
                              >
                                {item.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {AGENDA_HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b last:border-b-0 border-gray-200 dark:border-frost-600">
                      <div className="p-1.5 border-r border-gray-200 dark:border-frost-600 bg-gray-50 dark:bg-frost-800 text-xs font-medium text-gray-500 shrink-0">
                        {hour}:00
                      </div>
                      {days.map((day) => {
                        const key = format(day, 'yyyy-MM-dd');
                        const hourItems = (itemsByDayAndHour[key]?.[hour] ?? []) as AgendaItem[];
                        return (
                          <div
                            key={key}
                            className={`min-h-[48px] p-1.5 border-r last:border-r-0 border-gray-200 dark:border-frost-600 ${isToday(day) ? 'bg-blue-50/30 dark:bg-blue-900/5' : 'bg-white dark:bg-frost-800'}`}
                          >
                            {hourItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedAgendaItem(item)}
                                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium truncate ${item.color} text-white hover:opacity-90 hover:ring-2 ring-offset-1 ring-white/50 transition-all shadow-sm`}
                                title={`${item.title} – ${item.subtitle} (${hour}:00)`}
                              >
                                {item.title}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-frost-600 rounded-xl overflow-hidden">
                {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d) => (
                  <div key={d} className="bg-gray-100 dark:bg-frost-800 p-3 text-center text-sm font-bold text-gray-600 dark:text-frost-400 uppercase">
                    {d}
                  </div>
                ))}
                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayItems = itemsByDay[key] ?? [];
                  const isCurrentMonth = isSameMonth(day, calendarDate);
                  return (
                    <div
                      key={key}
                      className={`min-h-[100px] sm:min-h-[120px] p-3 bg-white dark:bg-frost-800 ${!isCurrentMonth ? 'opacity-40' : ''} ${isToday(day) ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                    >
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-2 ${
                          isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-frost-200'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1.5">
                        {dayItems.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedAgendaItem(item)}
                            className={`block w-full text-left text-xs px-2 py-1.5 rounded-lg truncate font-medium ${item.color} text-white hover:opacity-90 hover:ring-2 ring-offset-1 ring-white/50 transition-all shadow-sm`}
                            title={`${item.title} – ${item.subtitle}`}
                          >
                            {item.title}
                          </button>
                        ))}
                        {dayItems.length > 4 && (
                          <div className="text-xs text-gray-500 font-medium">+{dayItems.length - 4}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-4 h-4 rounded-md bg-emerald-500 shadow" /> Onderhoud in orde
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="w-4 h-4 rounded-md bg-amber-500 shadow" /> Onderhoud binnenkort
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="w-4 h-4 rounded-md bg-red-500 shadow" /> Onderhoud vervallen
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="w-4 h-4 rounded-md bg-blue-500 shadow" /> Ticket ingepland
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedAgendaItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedAgendaItem(null)}>
          <div className="bg-white dark:bg-frost-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-frost-600" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold text-white ${selectedAgendaItem.color}`}>
                {selectedAgendaItem.type === 'onderhoud' ? 'Onderhoud' : 'Ticket'}
              </span>
              <button onClick={() => setSelectedAgendaItem(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-frost-100 mb-1">{selectedAgendaItem.title}</h3>
            <p className="text-gray-600 dark:text-frost-400 mb-4">{selectedAgendaItem.subtitle}</p>
            <div className="space-y-2 text-sm">
              <p><strong>Datum:</strong> {format(selectedAgendaItem.date, 'EEEE d MMMM yyyy', { locale: nl })}</p>
              {selectedAgendaItem.hour != null && <p><strong>Tijd:</strong> {selectedAgendaItem.hour}:00</p>}
              {selectedAgendaItem.type === 'onderhoud' && selectedAgendaItem.badge && (
                <p><strong>Status:</strong> {selectedAgendaItem.badge === 'IN_ORDE' ? 'In orde' : selectedAgendaItem.badge === 'BINNENKORT' ? 'Binnenkort' : 'Vervallen'}</p>
              )}
            </div>
            {selectedAgendaItem.type === 'ticket' && (
              <button
                onClick={() => { setSelectedAgendaItem(null); setSelectedTicket(selectedAgendaItem.raw); setActiveTab('tickets'); }}
                className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Ticket openen
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'onderhoud' && onderhoudView === 'lijst' && (
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequentie</th>
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
                        <td className="px-4 py-3 text-sm">{INSTALLATION_TYPE_LABELS[i.type] ?? i.type}</td>
                        <td className="px-4 py-3 text-sm">
                          {i.nextMaintenanceDate
                            ? format(new Date(i.nextMaintenanceDate), 'dd/MM/yyyy')
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[280px]">
                          {i.maintenanceRules?.[0]?.label ?? '—'}
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
                <h3 className="font-medium text-sm text-gray-700 dark:text-frost-300 mb-3">{STATUS_LABELS[status] ?? status}</h3>
                <div className="space-y-2">
                  {(ticketsByStatus[status] || []).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="bg-white dark:bg-frost-700 rounded p-3 cursor-pointer hover:ring-2 ring-blue-500"
                    >
                      <div className="font-medium text-sm truncate">{t.customer?.companyName}</div>
                      <div className="text-xs text-gray-500">{TICKET_TYPE_LABELS[t.type] ?? t.type}</div>
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
                  <p><strong>Type:</strong> {TICKET_TYPE_LABELS[selectedTicket.type] ?? selectedTicket.type}</p>
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
                    <option key={t} value={t}>{INSTALLATION_TYPE_LABELS[t] ?? t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Koelmiddel (type)</label>
                <select
                  value={addForm.refrigerantType}
                  onChange={(e) => setAddForm({ ...addForm, refrigerantType: e.target.value })}
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                >
                  {REFRIGERANTS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
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
