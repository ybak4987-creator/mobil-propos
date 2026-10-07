import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Settings, Smartphone, Store } from 'lucide-react';
import MobilePage from '@/pages/MobilePage';
import { useStaff } from '@/lib/hooks';
import { hasMasterPassword, setMasterPassword, verifyMasterPassword } from '@/lib/security';
import type { Staff } from '@/lib/supabase';

const STAFF_SESSION_KEY = 'propos-current-staff-v2';

function roleLabel(role: Staff['role']) {
  return role === 'admin' ? 'Yönetici / Admin' : role === 'manager' ? 'Müdür' : 'Kasiyer';
}

function readSession(): Staff | null {
  try {
    const raw = sessionStorage.getItem(STAFF_SESSION_KEY);
    return raw ? JSON.parse(raw) as Staff : null;
  } catch { return null; }
}

function writeSession(staff: Staff | null) {
  try {
    if (staff) sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(staff));
    else sessionStorage.removeItem(STAFF_SESSION_KEY);
  } catch {}
}

function MasterPasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const firstRun = !hasMasterPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (firstRun && password !== confirm) { setError('Şifreler aynı değil.'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    setBusy(true);
    try {
      if (firstRun) await setMasterPassword(password);
      else if (!await verifyMasterPassword(password)) { setError('Şifre hatalı.'); return; }
      sessionStorage.setItem('propos-master-unlocked', '1');
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre işlemi başarısız.');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-white">
          <Settings size={28}/>
        </div>
        <h1 className="text-center text-xl font-bold text-slate-800">
          {firstRun ? 'Pro POS İlk Kurulum' : 'Pro POS Sistem Şifresi'}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {firstRun ? 'Mobil sisteme erişim için bir ana şifre belirleyin.' : 'Devam etmek için sistem şifresini girin.'}
        </p>
        <div className="mt-6 space-y-3">
          <input autoFocus className="input" type="password" placeholder="Sistem şifresi"
            value={password} onChange={e=>setPassword(e.target.value)} />
          {firstRun && <input className="input" type="password" placeholder="Şifreyi tekrar girin"
            value={confirm} onChange={e=>setConfirm(e.target.value)} />}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button disabled={busy} className="btn-primary w-full py-3">
            {busy ? 'Kontrol ediliyor...' : firstRun ? 'Şifreyi Belirle ve Devam Et' : 'Giriş Yap'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StaffLogin({ staff, onLogin }: { staff: Staff[]; onLogin: (s: Staff) => void }) {
  const [selected, setSelected] = useState(staff.find(s => s.active)?.id || '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const active = staff.filter(s => s.active);
  const current = active.find(s => s.id === selected) || active[0];

  useEffect(() => {
    if (!selected && current) setSelected(current.id);
  }, [selected, current]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const s = active.find(x => x.id === selected);
    if (!s) { setError('Aktif personel bulunamadı.'); return; }

    if (s.pin_hash) {
      try {
        const { data, error: verifyError } = await import('@/lib/supabase').then(({ supabase }) =>
          supabase.rpc('verify_staff_pin', { p_staff_id: s.id, p_pin: pin.trim() })
        );
        if (verifyError) { setError('PIN doğrulanamadı. Supabase personel migrationını kontrol edin.'); return; }
        if (data !== true) { setError('PIN hatalı.'); return; }
      } catch { setError('PIN doğrulama işlemi başarısız.'); return; }
    } else if (s.pin && s.pin !== pin.trim()) {
      setError('PIN hatalı.');
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: remote } = await supabase.from('staff').select('*')
        .eq('active', true).ilike('name', s.name).limit(1).maybeSingle();
      onLogin((remote || s) as Staff);
    } catch { onLogin(s); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white">
          <Store size={28}/>
        </div>
        <h1 className="text-center text-xl font-bold text-slate-800">Pro POS Mobil</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Personelinizi seçin ve PIN ile giriş yapın.</p>
        <div className="mt-6 space-y-3">
          <select className="input" value={selected} onChange={e=>setSelected(e.target.value)}>
            {active.map(s=><option key={s.id} value={s.id}>{s.name} — {roleLabel(s.role)}</option>)}
          </select>
          {(current?.pin_hash || current?.pin) && (
            <input className="input font-mono" autoFocus type="password" inputMode="numeric"
              placeholder="PIN" value={pin} onChange={e=>setPin(e.target.value)} maxLength={8}/>
          )}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button className="btn-primary w-full py-3" type="submit">Giriş Yap</button>
        </div>
      </form>
    </div>
  );
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const handler = (event: ErrorEvent) => setError(event.error instanceof Error ? event.error : new Error(event.message));
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);
  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-lg font-bold text-red-700">Mobil uygulama yüklenemedi</h1>
        <p className="mb-4 text-sm text-slate-600">{error.message}</p>
        <button onClick={() => window.location.reload()} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Yenile</button>
      </div>
    </div>
  );
  return <>{children}</>;
}

function App() {
  const { staff } = useStaff();
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(() => readSession());
  const [online, setOnline] = useState(navigator.onLine);
  const [masterUnlocked, setMasterUnlocked] = useState(() => sessionStorage.getItem('propos-master-unlocked') === '1');

  const activeStaff = useMemo(() => staff.filter(s => s.active), [staff]);

  useEffect(() => {
    if (!activeStaff.length) { setCurrentStaff(null); writeSession(null); return; }
    const saved = currentStaff && activeStaff.find(s => s.id === currentStaff.id);
    if (saved) { setCurrentStaff(saved); writeSession(saved); }
    else { setCurrentStaff(null); writeSession(null); }
  }, [activeStaff]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  if (!masterUnlocked) return <MasterPasswordGate onUnlock={() => setMasterUnlocked(true)} />;
  if (activeStaff.length && !currentStaff) {
    return <StaffLogin staff={activeStaff} onLogin={(s) => { writeSession(s); setCurrentStaff(s); }} />;
  }

  return (
    <MobilePage
      currentStaff={currentStaff}
      currentStaffId={currentStaff?.id}
      online={online}
      onLogout={() => { writeSession(null); setCurrentStaff(null); }}
    />
  );
}

export default function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}
