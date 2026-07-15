// ============================================================================
//  auth.js — Art of Accounting Class Management System
//  ----------------------------------------------------------------------
//  Me file eke thiyenne Supabase client eka + site eke okkoma pages walata
//  ona wena functions okkoma. Me function okkoma wada karanne LOGIN wela
//  inna (authenticated) Supabase user kenekta vithurai — eka enforce wenne
//  Supabase database eke RLS (Row Level Security) policy walin (schema.sql
//  file eke thiyenawa). Login wela nathi kenekta oyage anon key eken query
//  ekak yawwath, database eken empty / error ekak vitharai enne.
// ============================================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ── 1. ME EKAI OYA VENAS KARANNA ONA EKAMA JAYAGAI — Supabase Project Settings > API ──
const SUPABASE_URL = 'https://yerrcliwakpignbxlweh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcnJjbGl3YWtwaWduYnhsd2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDY1NjksImV4cCI6MjA5OTY4MjU2OX0.XkIVOWNBxqnBnZ9URmJNNefhR02lKVG-tLssZuq0BiI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// ============================================================================
//  AUTH HELPERS
// ============================================================================

function showEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Remove any inline override first, so the element's normal CSS display value
  // (e.g. flex for an overlay) is respected.
  el.style.removeProperty('display');
  // Some pages have a stylesheet rule like `#mainContent { display: none; }`
  // meant purely as the "before login" state. If that rule is still hiding
  // the element after removing the inline style, force it visible.
  if (window.getComputedStyle(el).display === 'none') {
    el.style.display = 'block';
  }
}
function hideEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Page load — check if a Supabase session already exists (auto-login).
export async function initPageAuth({ loginEl, mainEl, onSuccess }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      if (mainEl) showEl(mainEl);
      hideEl(loginEl);
      if (onSuccess) await onSuccess(session.user);
      return session.user;
    }
  } catch (e) {
    console.error('initPageAuth error:', e);
  }
  // No valid session → show the login screen
  if (mainEl) hideEl(mainEl);
  showEl(loginEl);
  return null;
}

// Login form submit handler
export async function supabaseLogin(email, password, { loginEl, mainEl, errorEl, btnEl, onSuccess }) {
  const errBox = errorEl ? document.getElementById(errorEl) : null;
  const btn = btnEl ? document.getElementById(btnEl) : null;
  if (errBox) { errBox.textContent = ''; errBox.style.display = 'none'; }
  if (btn) { btn.disabled = true; btn.dataset._label = btn.dataset._label || btn.innerHTML; btn.innerHTML = 'Login වෙමින්...'; }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;

    // Log this login into login_history (best-effort — page still works if this fails)
    try {
      await supabase.from('login_history').insert({ user_id: user.id, email: user.email });
    } catch (e) {
      console.warn('login_history insert failed:', e);
    }

    if (mainEl) showEl(mainEl);
    hideEl(loginEl);
    if (onSuccess) await onSuccess(user);
    return user;
  } catch (e) {
    console.error('supabaseLogin error:', e);
    if (errBox) {
      errBox.textContent = 'වැරදි Email එකක් හෝ Password එකක්. නැවත try කරන්න.';
      errBox.style.display = 'block';
    } else {
      alert('Login අසාර්ථකයි: ' + (e.message || e));
    }
    return null;
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset._label || 'Login'; }
  }
}

// Logout
export async function handleLogout({ loginEl, mainEl } = {}) {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error('logout error:', e);
  }
  if (mainEl) hideEl(mainEl);
  if (loginEl) showEl(loginEl);
  // Safest option — full reload clears all in-memory app state
  window.location.reload();
}

// Small internal guard used by every DB function below — makes sure there IS
// a logged-in Supabase user before even attempting the request.
async function requireSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) {
    console.warn('Blocked: no authenticated Supabase user session.');
    return null;
  }
  return session;
}

// ============================================================================
//  ONLINE STUDENTS
// ============================================================================

export async function getOnlineStudents() {
  if (!(await requireSession())) return [];
  const { data, error } = await supabase.from('online_students').select('*').order('created_at', { ascending: true });
  if (error) { console.error('getOnlineStudents:', error); return []; }
  return data || [];
}

export async function addOnlineStudent(payload) {
  if (!(await requireSession())) return null;
  const { data, error } = await supabase.from('online_students').insert(payload).select().single();
  if (error) { console.error('addOnlineStudent:', error); return null; }
  return data;
}

export async function updateOnlineStudent(id, payload) {
  if (!(await requireSession())) return null;
  const { data, error } = await supabase.from('online_students').update(payload).eq('id', id).select().single();
  if (error) { console.error('updateOnlineStudent:', error); return null; }
  return data;
}

export async function deleteOnlineStudent(id) {
  if (!(await requireSession())) return false;
  const { error } = await supabase.from('online_students').delete().eq('id', id);
  if (error) { console.error('deleteOnlineStudent:', error); return false; }
  return true;
}

// ============================================================================
//  PHYSICAL STUDENTS
// ============================================================================

export async function getPhysicalStudents() {
  if (!(await requireSession())) return [];
  const { data, error } = await supabase.from('physical_students').select('*').order('created_at', { ascending: true });
  if (error) { console.error('getPhysicalStudents:', error); return []; }
  return data || [];
}

export async function addPhysicalStudent(payload) {
  if (!(await requireSession())) return null;
  const { data, error } = await supabase.from('physical_students').insert(payload).select().single();
  if (error) { console.error('addPhysicalStudent:', error); return null; }
  return data;
}

export async function updatePhysicalStudent(id, payload) {
  if (!(await requireSession())) return null;
  const { data, error } = await supabase.from('physical_students').update(payload).eq('id', id).select().single();
  if (error) { console.error('updatePhysicalStudent:', error); return null; }
  return data;
}

export async function deletePhysicalStudent(id) {
  if (!(await requireSession())) return false;
  const { error } = await supabase.from('physical_students').delete().eq('id', id);
  if (error) { console.error('deletePhysicalStudent:', error); return false; }
  return true;
}

// ============================================================================
//  BATCHES (type: 'online' | 'physical' | 'center')
// ============================================================================

export async function getBatches(type) {
  if (!(await requireSession())) return [];
  const { data, error } = await supabase.from('batches').select('*').eq('type', type).order('created_at', { ascending: true });
  if (error) { console.error('getBatches:', error); return []; }
  return data || [];
}

export async function addBatch(name, type) {
  if (!(await requireSession())) return null;
  const { data, error } = await supabase.from('batches').insert({ name, type }).select().single();
  if (error) { console.error('addBatch:', error); return null; }
  return data;
}

export async function renameBatch(id, newName) {
  if (!(await requireSession())) return null;
  const { data, error } = await supabase.from('batches').update({ name: newName }).eq('id', id).select().single();
  if (error) { console.error('renameBatch:', error); return null; }
  return data;
}

export async function deleteBatch(id) {
  if (!(await requireSession())) return false;
  const { error } = await supabase.from('batches').delete().eq('id', id);
  if (error) { console.error('deleteBatch:', error); return false; }
  return true;
}

// ============================================================================
//  TUTES (type: 'online' | 'physical')
// ============================================================================

export async function getTutes(type) {
  if (!(await requireSession())) return [];
  const { data, error } = await supabase.from('tutes').select('*').eq('type', type).order('created_at', { ascending: true });
  if (error) { console.error('getTutes:', error); return []; }
  return data || [];
}

export async function addTute(name, batch, month, type) {
  if (!(await requireSession())) return null;
  const { data, error } = await supabase.from('tutes').insert({ name, batch, month, type }).select().single();
  if (error) { console.error('addTute:', error); return null; }
  return data;
}

export async function deleteTute(id) {
  if (!(await requireSession())) return false;
  const { error } = await supabase.from('tutes').delete().eq('id', id);
  if (error) { console.error('deleteTute:', error); return false; }
  return true;
}

export async function updateTutesBatch(oldName, newName, type) {
  if (!(await requireSession())) return false;
  const { error } = await supabase.from('tutes').update({ batch: newName }).eq('batch', oldName).eq('type', type);
  if (error) { console.error('updateTutesBatch:', error); return false; }
  return true;
}

export async function deleteTutesByBatch(batchName, type) {
  if (!(await requireSession())) return false;
  const { error } = await supabase.from('tutes').delete().eq('batch', batchName).eq('type', type);
  if (error) { console.error('deleteTutesByBatch:', error); return false; }
  return true;
}

// ============================================================================
//  PAYMENTS  (type: 'online' | 'physical', month: 'YYYY-MM')
// ============================================================================

export async function getPayments(studentId, type) {
  if (!(await requireSession())) return [];
  const { data, error } = await supabase.from('payments').select('*').eq('student_id', studentId).eq('type', type);
  if (error) { console.error('getPayments:', error); return []; }
  return data || [];
}

export async function updatePayment(studentId, type, month, status) {
  if (!(await requireSession())) return null;
  const { data, error } = await supabase
    .from('payments')
    .upsert({ student_id: studentId, type, month, status, updated_at: new Date().toISOString() }, { onConflict: 'student_id,type,month' })
    .select()
    .single();
  if (error) { console.error('updatePayment:', error); return null; }
  return data;
}