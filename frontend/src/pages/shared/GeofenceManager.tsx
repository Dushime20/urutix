/**
 * Geofence Zone Manager
 * Roles: TENANT_ADMIN → /tenant-admin/geofences
 *        ADMIN       → /admin-operational/geofences
 * Layout: DashboardLayout
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Trash2, Edit2, Shield, Bell, BellOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { geofencingApi } from '../../services/featuresApi';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';

const ZONE_TYPES = ['DELIVERY_ZONE', 'RESTRICTED', 'CUSTOMER_SITE', 'DEPOT', 'CHECKPOINT'];

const ZONE_COLORS: Record<string, string> = {
  DELIVERY_ZONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  RESTRICTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  CUSTOMER_SITE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  DEPOT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  CHECKPOINT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const emptyForm = { name: '', type: 'DELIVERY_ZONE', alertOnEnter: true, alertOnExit: true, polygon: '' };

const GeofenceManager: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['geofences'],
    queryFn: geofencingApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      let polygon: any[];
      try {
        polygon = JSON.parse(form.polygon);
        if (!Array.isArray(polygon) || polygon.length < 3) throw new Error();
      } catch {
        throw new Error('Polygon must be a JSON array of at least 3 {lat, lng} points');
      }
      return geofencingApi.create({ name: form.name, type: form.type as any, polygon, alertOnEnter: form.alertOnEnter, alertOnExit: form.alertOnExit });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geofences'] }); setShowForm(false); setForm(emptyForm); toast.success('Geofence zone created'); },
    onError: (e: any) => toast.error(e.message || 'Failed to create zone'),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editId) throw new Error();
      const updates: any = { name: form.name, type: form.type, alertOnEnter: form.alertOnEnter, alertOnExit: form.alertOnExit };
      if (form.polygon) {
        try { updates.polygon = JSON.parse(form.polygon); } catch { throw new Error('Invalid polygon JSON'); }
      }
      return geofencingApi.update(editId, updates);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geofences'] }); setShowForm(false); setEditId(null); setForm(emptyForm); toast.success('Zone updated'); },
    onError: (e: any) => toast.error(e.message || 'Failed to update zone'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => geofencingApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geofences'] }); toast.success('Zone removed'); },
  });

  const openEdit = (zone: any) => {
    setEditId(zone.id);
    setForm({ name: zone.name, type: zone.type, alertOnEnter: zone.alertOnEnter, alertOnExit: zone.alertOnExit, polygon: JSON.stringify(zone.polygon, null, 2) });
    setShowForm(true);
  };

  if (isLoading) return <ModernLoader isLoading text="Loading_Geofences" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            <TranslatedText text="Geofence Zones" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <TranslatedText text="Define geographic zones. Get alerts when trucks enter or exit during active trips." />
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-sm transition-all"
        >
          <Plus size={16} /> <TranslatedText text="New Zone" />
        </button>
      </div>

      {/* Zone List */}
      {(zones as any[]).length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <MapPin size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            <TranslatedText text="No geofence zones defined yet." />
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            <TranslatedText text="Create zones to monitor truck movements and get breach alerts." />
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(zones as any[]).map((zone: any) => (
            <div key={zone.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 group hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <MapPin size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">{zone.name}</h3>
                    <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${ZONE_COLORS[zone.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {zone.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(zone)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(zone.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${zone.alertOnEnter ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                  {zone.alertOnEnter ? <Bell size={10} /> : <BellOff size={10} />} Enter
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${zone.alertOnExit ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                  {zone.alertOnExit ? <Bell size={10} /> : <BellOff size={10} />} Exit
                </span>
                <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  {zone.polygon?.length ?? 0} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-5 uppercase tracking-tight">
              {editId ? <TranslatedText text="Edit Zone" /> : <TranslatedText text="Create Geofence Zone" />}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Zone Name" /> *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Nairobi Depot"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Zone Type" />
                </label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  {ZONE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Polygon Coordinates (JSON)" /> *
                </label>
                <textarea
                  value={form.polygon}
                  onChange={e => setForm(f => ({ ...f, polygon: e.target.value }))}
                  rows={5}
                  placeholder={`[\n  {"lat": -1.2921, "lng": 36.8219},\n  {"lat": -1.2950, "lng": 36.8250},\n  {"lat": -1.2900, "lng": 36.8280}\n]`}
                  className="w-full px-4 py-2.5 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  <TranslatedText text="Array of {lat, lng} objects. Minimum 3 points." />
                </p>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.alertOnEnter} onChange={e => setForm(f => ({ ...f, alertOnEnter: e.target.checked }))} className="rounded accent-primary-600" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300"><TranslatedText text="Alert on Enter" /></span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.alertOnExit} onChange={e => setForm(f => ({ ...f, alertOnExit: e.target.checked }))} className="rounded accent-primary-600" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300"><TranslatedText text="Alert on Exit" /></span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <TranslatedText text="Cancel" />
              </button>
              <button
                onClick={() => editId ? updateMutation.mutate() : createMutation.mutate()}
                disabled={!form.name || (!editId && !form.polygon) || createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? '...' : editId ? <TranslatedText text="Update Zone" /> : <TranslatedText text="Create Zone" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofenceManager;
