// ════════════════════════════════════════════════════════════════
//  auth.js  —  Prabath Ariyasinghe | Art of Accounting
//  Supabase Auth Module  (ES Module — type="module" use karanna)
// ════════════════════════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ── 1. Supabase Client ──────────────────────────────────────────
const SUPABASE_URL  = 'https://jxshsceifvgqejpktpwk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c2hzY2VpZnZncWVqcGt0cHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NDMyMDMsImV4cCI6MjA5ODExOTIwM30.lKUFcwKMWVMhSf1z2Q5LPsboUbndV6LvGFmSsht-ORM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── 2. index.html Login Handler ─────────────────────────────────
export async function handleLogin(email, password) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) errorEl.textContent = '';

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    email.trim(),
    password: password,
  });

  if (error) {
    console.error('Login error:', error.message);
    if (errorEl) errorEl.textContent = '❌ Email හෝ Password වැරදියි. නැවත try කරන්න.';
    return;
  }

  await _saveLoginHistory(data.user);

  const role = data.user?.user_metadata?.role || 'online';
  if (role === 'physical') {
    window.location.href = './physical.html';
  } else {
    window.location.href = './online.html';
  }
}

// ── 3. Page Auth Init (online.html & physical.html use this) ────
/**
 * initPageAuth({ loginEl, mainEl, userBadgeEl, onSuccess })
 *   loginEl   — login overlay/page element id string
 *   mainEl    — main content element id string
 *   userBadgeEl — element id to show user email (optional)
 *   onSuccess  — callback(user) called once session is confirmed
 */
export async function initPageAuth({ loginEl, mainEl, userBadgeEl = null, onSuccess = null } = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // User is logged in — show content
    const loginNode = document.getElementById(loginEl);
    const mainNode  = document.getElementById(mainEl);
    if (loginNode) loginNode.style.display = 'none';
    if (mainNode)  mainNode.style.display  = 'block';

    if (userBadgeEl) {
      const badge = document.getElementById(userBadgeEl);
      if (badge) badge.textContent = session.user.email;
    }

    if (typeof onSuccess === 'function') onSuccess(session.user);
  } else {
    // Not logged in — show login overlay
    const loginNode = document.getElementById(loginEl);
    const mainNode  = document.getElementById(mainEl);
    if (loginNode) loginNode.style.display = 'flex';
    if (mainNode)  mainNode.style.display  = 'none';
  }
}

// ── 4. Supabase Login (for overlay login forms) ─────────────────
/**
 * supabaseLogin(email, password, { loginEl, mainEl, userBadgeEl, onSuccess, errorEl })
 * Call this from the login form submit handler.
 */
export async function supabaseLogin(email, password, {
  loginEl     = null,
  mainEl      = null,
  userBadgeEl = null,
  onSuccess   = null,
  errorEl     = null,
  btnEl       = null,
} = {}) {

  const errNode = errorEl ? document.getElementById(errorEl) : null;
  const btnNode = btnEl   ? document.getElementById(btnEl)   : null;

  if (errNode) { errNode.style.display = 'none'; errNode.textContent = ''; }
  if (btnNode) { btnNode.disabled = true; btnNode.textContent = 'Logging in...'; }

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    email.trim(),
    password: password,
  });

  if (btnNode) { btnNode.disabled = false; btnNode.textContent = 'Log In'; }

  if (error) {
    console.error('Login error:', error.message);
    if (errNode) {
      errNode.textContent = '❌ Email හෝ Password වැරදියි. නැවත try කරන්න.';
      errNode.style.display = 'block';
    } else {
      alert('❌ Email හෝ Password වැරදියි. නැවත try කරන්න.');
    }
    return null;
  }

  // Save login history
  await _saveLoginHistory(data.user);

  // Show main content
  const loginNode = loginEl ? document.getElementById(loginEl) : null;
  const mainNode  = mainEl  ? document.getElementById(mainEl)  : null;
  if (loginNode) loginNode.style.display = 'none';
  if (mainNode)  mainNode.style.display  = 'block';

  if (userBadgeEl) {
    const badge = document.getElementById(userBadgeEl);
    if (badge) badge.textContent = data.user.email;
  }

  if (typeof onSuccess === 'function') onSuccess(data.user);
  return data.user;
}

// ── 5. Logout Handler ───────────────────────────────────────────
/**
 * handleLogout()
 * Signs out from Supabase. Pages can call this directly.
 * Optionally pass { loginEl, mainEl } to show login overlay instead of redirect.
 */
export async function handleLogout({ loginEl = null, mainEl = null, redirectTo = './index.html' } = {}) {
  await supabase.auth.signOut();

  if (loginEl && mainEl) {
    const loginNode = document.getElementById(loginEl);
    const mainNode  = document.getElementById(mainEl);
    if (loginNode) loginNode.style.display = 'flex';
    if (mainNode)  mainNode.style.display  = 'none';
  } else {
    window.location.href = redirectTo;
  }
}

// ── 6. Simple session check (redirect if not logged in) ─────────
export async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = './index.html';
    return null;
  }
  const emailBadge = document.getElementById('user-email-badge');
  if (emailBadge) emailBadge.textContent = session.user.email;
  return session.user;
}

// ── 7. Private Helper — Save Login History ──────────────────────
async function _saveLoginHistory(user) {
  if (!user) return;
  const { error } = await supabase
    .from('login_history')
    .insert({
      user_id:    user.id,
      email:      user.email,
      login_time: new Date().toISOString(),
    });
  if (error) console.warn('Login history save failed:', error.message);
}

// ── 8. Online Students CRUD ─────────────────────────────────────
export async function getOnlineStudents(batchName = null) {
  let query = supabase.from('online_students').select('*').order('created_at', { ascending: true });
  if (batchName) query = query.eq('batch', batchName);
  const { data, error } = await query;
  if (error) { console.error('getOnlineStudents:', error.message); return []; }
  return data;
}
export async function addOnlineStudent(student) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('online_students').insert({ ...student, created_by: user.id }).select().single();
  if (error) { console.error('addOnlineStudent:', error.message); return null; }
  return data;
}
export async function updateOnlineStudent(id, updates) {
  const { data, error } = await supabase.from('online_students').update(updates).eq('id', id).select().single();
  if (error) { console.error('updateOnlineStudent:', error.message); return null; }
  return data;
}
export async function deleteOnlineStudent(id) {
  const { error } = await supabase.from('online_students').delete().eq('id', id);
  if (error) { console.error('deleteOnlineStudent:', error.message); return false; }
  return true;
}

// ── 9. Physical Students CRUD ───────────────────────────────────
export async function getPhysicalStudents(batchName = null) {
  let query = supabase.from('physical_students').select('*').order('created_at', { ascending: true });
  if (batchName) query = query.eq('batch', batchName);
  const { data, error } = await query;
  if (error) { console.error('getPhysicalStudents:', error.message); return []; }
  return data;
}
export async function addPhysicalStudent(student) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('physical_students').insert({ ...student, created_by: user.id }).select().single();
  if (error) { console.error('addPhysicalStudent:', error.message); return null; }
  return data;
}
export async function updatePhysicalStudent(id, updates) {
  const { data, error } = await supabase.from('physical_students').update(updates).eq('id', id).select().single();
  if (error) { console.error('updatePhysicalStudent:', error.message); return null; }
  return data;
}
export async function deletePhysicalStudent(id) {
  const { error } = await supabase.from('physical_students').delete().eq('id', id);
  if (error) { console.error('deletePhysicalStudent:', error.message); return false; }
  return true;
}

// ── 10. Batches CRUD ────────────────────────────────────────────
export async function getBatches(type) {
  const { data, error } = await supabase.from('batches').select('*').eq('type', type).order('created_at', { ascending: true });
  if (error) { console.error('getBatches:', error.message); return []; }
  return data;
}
export async function addBatch(name, type) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('batches').insert({ name, type, created_by: user.id }).select().single();
  if (error) { console.error('addBatch:', error.message); return null; }
  return data;
}
export async function renameBatch(id, newName) {
  const { data, error } = await supabase.from('batches').update({ name: newName }).eq('id', id).select().single();
  if (error) { console.error('renameBatch:', error.message); return null; }
  return data;
}
export async function deleteBatch(id) {
  const { error } = await supabase.from('batches').delete().eq('id', id);
  if (error) { console.error('deleteBatch:', error.message); return false; }
  return true;
}

// ── 11. Payment Ledger ──────────────────────────────────────────
export async function updatePayment(studentId, studentType, month, status) {
  const table = studentType === 'online' ? 'online_payments' : 'physical_payments';
  const { data, error } = await supabase.from(table).upsert(
    { student_id: studentId, month, status },
    { onConflict: 'student_id,month' }
  ).select().single();
  if (error) { console.error('updatePayment:', error.message); return null; }
  return data;
}
export async function getPayments(studentId, studentType) {
  const table = studentType === 'online' ? 'online_payments' : 'physical_payments';
  const { data, error } = await supabase.from(table).select('*').eq('student_id', studentId);
  if (error) { console.error('getPayments:', error.message); return []; }
  return data;
}