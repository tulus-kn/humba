
"use strict";
/* ============================================================
   HUMBA v1.2 — jejaring sosial nostalgia (Supabase), tampilan ala RedNote
   Daftar hanya pakai username + nama + password (tanpa email).
   Auth memakai email buatan username@humba.local.
   ============================================================ */

/* ---------- Bantuan ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const urlCss = (u) => esc(String(u ?? "").replace(/['"()\\\s<>]/g, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")));
const WARNA_AVATAR = ["#ff5a72","#ff8a4c","#3ec08a","#4a90e2","#8e6ce8","#e2596e","#2bb3a3","#7a8aa0"];
const warnaAvatar = (nama) => { let h = 0; for (const c of String(nama)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return WARNA_AVATAR[h % WARNA_AVATAR.length]; };
async function sha256Hex(teks){ const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(teks)); return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function normKode(k){ return String(k || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function buatKodePemulihan(){ const A = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; let s = ""; const acak = new Uint32Array(8); if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(acak); else for (let i = 0; i < 8; i++) acak[i] = Math.floor(Math.random() * 4294967296); for (let i = 0; i < 8; i++) s += A[acak[i] % A.length]; return "HUMBA-" + s.slice(0, 4) + "-" + s.slice(4); }
const IKON = (d, aktif) => `<svg viewBox="0 0 24 24" fill="${aktif ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ikonSuka = (aktif) => IKON(`<path d="M12 20.3S4.6 15.8 4.6 10.9A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.4 2.7c0 4.9-7.4 9.4-7.4 9.4Z"/>`, aktif);
const ikonKomen = () => IKON(`<path d="M20 11.9c0 3.7-3.6 6.7-8 6.7-1 0-2-.1-2.9-.4L5 19.8l1.2-3.2A6.3 6.3 0 0 1 4 11.9c0-3.7 3.6-6.7 8-6.7s8 3 8 6.7Z"/>`);
const ikonGrup = () => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8.2" r="3"/><path d="M3.6 20c0-3.1 2.4-5.2 5.4-5.2s5.4 2.1 5.4 5.2"/><circle cx="17.2" cy="9.2" r="2.2"/><path d="M15.3 20c.2-2.6 1.8-4.1 3.9-4.1"/></svg>`;
const ikonCatatan = () => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.4" width="14" height="17.2" rx="2.2"/><path d="M8.6 8.4h6.8M8.6 12.5h6.8M8.6 16.6h4"/></svg>`;
const ikonPoke = () => IKON(`<path d="M9 11.2V5.6a1.5 1.5 0 0 1 3 0v4.6"/><path d="M12 10.2V4.6a1.5 1.5 0 0 1 3 0v5.6"/><path d="M15 10.2V6.6a1.5 1.5 0 0 1 3 0v6.4c0 4-2.7 6.6-6 6.6-2 0-3.7-.8-4.8-2.4L4.9 13a1.4 1.4 0 0 1 2.2-1.7L9 13.4"/>`);
const avatarHtml = (p, cls) => (p && p.avatar_url)
  ? `<span class="avatar ${cls||""}"><img src="${esc(p.avatar_url)}" alt=""></span>`
  : `<span class="avatar ${cls||""}" style="background:${p.avatar_color||warnaAvatar(p.display_name||p.username)}">${esc((p.display_name||p.username||"?")[0].toUpperCase())}</span>`;
const tglIndo = (d) => { try { return new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}); } catch(e){ return String(d||""); } };
const tglUltah = (d) => { try { return new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"long"}); } catch(e){ return String(d||""); } };
const waktuRelatif = (iso) => { const s = Math.floor((Date.now()-new Date(iso).getTime())/1000); if (s < 60) return "baru saja"; if (s < 3600) return Math.floor(s/60)+" mnt lalu"; if (s < 86400) return Math.floor(s/3600)+" jam lalu"; const h = Math.floor(s/86400); if (h < 30) return h+" hari lalu"; return tglIndo(iso); };
const jamSingkat = (iso) => { try { return new Date(iso).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}); } catch(e){ return ""; } };
const uidBaru = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2));
const USERNAME_OK = /^[a-z0-9._]{3,20}$/;
const bunyiPoke = () => { try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; const c = new C(); const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.setValueAtTime(.15, c.currentTime); o.start(); o.stop(c.currentTime + .18); setTimeout(()=>{ const o2 = c.createOscillator(); o2.connect(g); o2.frequency.value = 660; o2.start(); o2.stop(c.currentTime + .18); }, 200); } catch(e){} };
const getar = () => { try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch(e){} };

/* ---------- Supabase ---------- */
const SUPABASE_URL = "https://ubuqxmxkseoslxzruugr.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_B1ULvoanz9aKSadMN6-C9w_B6wgclF7"; // kunci anon bawaan (publishable) — proyek sama dengan Pos-El
function getAnonKey(){
  try { const l = localStorage.getItem("ch.anonkey"); if (l && l.trim()) return l.trim(); } catch(e){}
  return (typeof DEFAULT_ANON_KEY === "string" ? DEFAULT_ANON_KEY.trim() : "");
}
let sb = null, mode = "cloud", me = null, sesiLokal = null, pilihanLokal = false;
async function initSupabase(){
  try {
    let createClient = window.supabase && window.supabase.createClient;
    if (!createClient) { const m = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"); createClient = m.createClient; }
    const key = getAnonKey();
    if (!key) return false;
    sb = createClient(SUPABASE_URL, key);
    const { error } = await sb.from("humba_profiles").select("id").limit(1);
    if (error) { console.warn("Supabase belum siap:", error.message); return false; }
    return true;
  } catch(e){ console.warn("Supabase gagal dimuat:", e); return false; }
}
function infoAuth(html){ const el = $("authInfo"); if (el) el.innerHTML = html; }
function simpanKunci(){
  const k = ($("inKunci").value || "").trim();
  if (!k) { infoAuth(`<div class="pesan-info merah">Tempel dulu anon public key-nya.</div>`); return; }
  try { localStorage.setItem("ch.anonkey", k); } catch(e){}
  infoAuth(`<div class="pesan-info hijau">Kunci tersimpan di HP ini. Silakan daftar / masuk.</div>`);
}
async function cobaModeLokal(){
  pilihanLokal = true; mode = "local"; sb = null;
  infoAuth(`<div class="pesan-info kuning">Mode Lokal aktif (demo, hanya di HP ini). Daftar akun lokal di bawah.</div>`);
  tampilAuth();
}

/* ---------- Penyimpanan lokal (Mode Lokal) ---------- */
function muatLokal(){
  try { return JSON.parse(localStorage.getItem("ch_local") || "{}"); }
  catch(e){ return {}; }
}
function simpanLokal(d){ try { localStorage.setItem("ch_local", JSON.stringify(d)); } catch(e){} }
function dbLokal(){
  const d = muatLokal();
  for (const k of ["users","posts","comments","likes","friends","groups","members","gposts","notes","messages","pokes","produk"])
    if (!Array.isArray(d[k])) d[k] = [];
  return d;
}
const sekarang = () => new Date().toISOString();

/* ---------- Auth ---------- */
let modeDaftar = false;
function toggleModeDaftar(e){ if (e) e.preventDefault(); modeDaftar = !modeDaftar; tampilAuth(); }
function tampilAuth(){
  $("layarAuth").style.display = "block"; $("layarApp").style.display = "none";
  document.querySelectorAll("#layarAuth .field, #layarAuth .tombol, #layarAuth details").forEach((el) => { el.style.display = ""; });
  $("fieldNama").style.display = modeDaftar ? "block" : "none";
  $("fieldTgl").style.display = modeDaftar ? "block" : "none";
  $("btnMasuk").style.display = modeDaftar ? "none" : "block";
  $("linkLupa").style.display = modeDaftar ? "none" : "block";
  $("btnDaftar").style.display = modeDaftar ? "block" : "none";
  $("btnToggleDaftar").textContent = modeDaftar ? "Sudah punya akun? Masuk di sini" : "Belum punya akun? Daftar di sini";
  $("authMode").style.display = "block";
  $("authMode").innerHTML = modeDaftar
    ? `<div class="pesan-info kuning">Mode daftar: isi username, nama tampilan, password, dan tanggal lahir (opsional). Setelah daftar, kamu langsung masuk.</div>`
    : `<div class="pesan-info kuning">Mode masuk: isi username dan password akunmu.</div>`;
}
async function daftar(){
  const username = ($("inUser").value || "").trim().toLowerCase();
  const nama = ($("inNama").value || "").trim();
  const pass = $("inPass").value || "";
  const tgl = $("inTgl").value || null;
  if (!USERNAME_OK.test(username) || username.startsWith(".") || username.endsWith(".") || username.includes("..")) { infoAuth(`<div class="pesan-info merah">Username harus 3–20 karakter: huruf kecil, angka, titik, atau _. Tidak boleh diawali/diakhiri titik atau memakai titik berurutan.</div>`); return; }
  if (nama.length < 2 || nama.length > 32) { infoAuth(`<div class="pesan-info merah">Nama tampilan 2–32 karakter.</div>`); return; }
  if (pass.length < 6) { infoAuth(`<div class="pesan-info merah">Password minimal 6 karakter.</div>`); return; }
  const btn = $("btnDaftar"); btn.disabled = true; btn.textContent = "Mendaftar…";
  try {
    if (mode === "local") {
      const d = dbLokal();
      if (d.users.some((u) => u.username === username)) { infoAuth(`<div class="pesan-info merah">Username sudah dipakai. Pilih username lain.</div>`); return; }
      const kodeRc = buatKodePemulihan();
      const u = { id: uidBaru(), username, display_name: nama, bio: "", birthdate: tgl, avatar_color: warnaAvatar(nama), last_seen: sekarang(), created_at: sekarang(), pass, rcHash: await sha256Hex(normKode(kodeRc)) };
      d.users.push(u); simpanLokal(d);
      tampilKodePemulihan(kodeRc, () => { sesiLokal = u.id; try { localStorage.setItem("ch.sesi", u.id); } catch(e){} me = profilLokal(u); masukAplikasi(); });
      return;
    }
    const email = username + "@humba.local";
    const { data, error } = await sb.auth.signUp({ email, password: pass });
    if (error) { infoAuth(`<div class="pesan-info merah">Gagal daftar: ${esc(error.message)}</div>`); return; }
    const uid = data.user && data.user.id;
    if (!uid) { infoAuth(`<div class="pesan-info merah">Gagal daftar: tidak ada sesi. Coba masuk.</div>`); return; }
    const { error: e2 } = await sb.from("humba_profiles").insert({ id: uid, username, display_name: nama, bio: "", birthdate: tgl, avatar_color: warnaAvatar(nama), last_seen: sekarang() });
    if (e2) { infoAuth(`<div class="pesan-info merah">Akun auth dibuat tapi profil gagal: ${esc(e2.message)}. Coba masuk — kalau tetap gagal, beri tahu admin.</div>`); return; }
    await muatProfilCloud(uid);
    const kodeRc = buatKodePemulihan();
    const rcHash = await sha256Hex(normKode(kodeRc));
    const { error: e3 } = await sb.from("humba_profiles").update({ rc_hash: rcHash }).eq("id", uid);
    if (e3) { masukAplikasi(); alert("Kode pemulihan belum tersimpan (migrasi reset password belum dijalankan di Supabase). Setelah migrasi jalan, buat kode di Pengaturan → Keamanan Akun."); return; }
    tampilKodePemulihan(kodeRc, () => masukAplikasi());
  } catch(e){ infoAuth(`<div class="pesan-info merah">Gagal daftar: ${esc(e.message || e)}</div>`); }
  finally { btn.disabled = false; btn.textContent = "Daftar Akun Baru"; }
}
async function masuk(){
  const username = ($("inUser").value || "").trim().toLowerCase();
  const pass = $("inPass").value || "";
  if (!username || !pass) { infoAuth(`<div class="pesan-info merah">Isi username dan password.</div>`); return; }
  const btn = $("btnMasuk"); btn.disabled = true; btn.textContent = "Memeriksa…";
  try {
    if (mode === "local") {
      const d = dbLokal();
      const u = d.users.find((x) => x.username === username);
      if (!u || u.pass !== pass) { infoAuth(`<div class="pesan-info merah">Gagal masuk: username atau password salah. Daftar dulu kalau belum punya akun.</div>`); return; }
      sesiLokal = u.id; try { localStorage.setItem("ch.sesi", u.id); } catch(e){}
      me = profilLokal(u); masukAplikasi();
      return;
    }
    const email = username + "@humba.local";
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) { infoAuth(`<div class="pesan-info merah">Gagal masuk: ${esc(error.message)}</div>`); return; }
    const ok = await muatProfilCloud(data.user.id);
    if (!ok) { infoAuth(`<div class="pesan-info merah">Gagal masuk: Profil tidak ditemukan. Daftar dulu.</div>`); return; }
    masukAplikasi();
  } catch(e){ infoAuth(`<div class="pesan-info merah">Gagal masuk: ${esc(e.message || e)}</div>`); }
  finally { btn.disabled = false; btn.textContent = "Masuk"; }
}
/* ---------- Reset password pakai kode pemulihan (ala Pos-El) ---------- */
let kodeCallback = null;
function tampilKodePemulihan(kode, cb){ kodeCallback = cb || null; $("kodeTeks").textContent = kode; $("overlayKode").style.display = "block"; }
function salinKode(){
  const teks = $("kodeTeks").textContent;
  let ok = false;
  try { navigator.clipboard.writeText(teks); ok = true; } catch(e){}
  if (!ok) { const ta = document.createElement("textarea"); ta.value = teks; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok = true; } catch(e){} document.body.removeChild(ta); }
  alert(ok ? "Kode disalin: " + teks : "Salin manual: " + teks);
}
function tutupKode(){ $("overlayKode").style.display = "none"; const cb = kodeCallback; kodeCallback = null; if (cb) cb(); }
function lupaPass(){ bukaReset(); }
function bukaReset(){ $("overlayReset").style.display = "block"; const p = $("rsPesan"); if (p) { p.style.display = "none"; p.textContent = ""; } }
function tutupReset(){ $("overlayReset").style.display = "none"; }
async function kirimReset(){
  const u = ($("rsUser").value || "").trim().toLowerCase();
  const k = $("rsKode").value || "";
  const p = $("rsPass").value || "";
  const pesan = (t) => { const el = $("rsPesan"); el.style.display = "block"; el.textContent = t; };
  if (!u || !k || !p) return pesan("Isi username, kode, dan password baru.");
  if (p.length < 6) return pesan("Password baru minimal 6 karakter.");
  if (mode === "local") return resetLokal(u, k, p, pesan);
  if (mode !== "cloud") return pesan("Reset butuh koneksi Supabase. Pastikan aplikasi online.");
  try {
    const { data, error } = await sb.rpc("humba_reset_password", { p_username: u, p_kode: k, p_baru: p });
    if (error) throw error;
    if (data === "ok") { tutupReset(); $("inUser").value = u; infoAuth(`<div class="pesan-info">Password berhasil direset. Silakan masuk dengan password baru.</div>`); }
    else if (data === "kode_salah") pesan("Kode pemulihan salah. Periksa huruf/angkanya.");
    else if (data === "tidak_ada") pesan("Username tidak ditemukan.");
    else if (data === "belum_ada_kode") pesan("Akun ini belum punya kode pemulihan (dibuat sebelum fitur ini). Minta admin reset manual, atau masuk lalu buat kode di Pengaturan.");
    else if (data === "terlalu_banyak") pesan("Terlalu banyak percobaan. Coba lagi 15 menit lagi.");
    else if (data === "password_pendek") pesan("Password baru minimal 6 karakter.");
    else pesan("Gagal reset: " + String(data));
  } catch(e){ pesan("Gagal reset: " + (e.message || e) + " — jalankan dulu migrasi reset password di Supabase."); }
}
async function resetLokal(u, k, p, pesan){
  const db = dbLokal();
  if (!db) return pesan("Tidak ada akun lokal di HP ini.");
  const usr = db.users.find((x) => x.username === u);
  if (!usr) return pesan("Username tidak ditemukan di HP ini.");
  const h = await sha256Hex(normKode(k));
  if (!usr.rcHash || usr.rcHash !== h) return pesan("Kode pemulihan salah.");
  usr.pass = p; simpanLokal(db);
  tutupReset(); $("inUser").value = u;
  infoAuth(`<div class="pesan-info">Password berhasil direset. Silakan masuk.</div>`);
}
async function kodeBaruAkun(){
  const kode = buatKodePemulihan();
  const h = await sha256Hex(normKode(kode));
  if (mode === "cloud" && sb) {
    const { data, error } = await sb.rpc("humba_ganti_kode", { p_hash: h });
    if (error || data !== "ok") { alert("Gagal membuat kode baru: " + (error ? error.message : data) + " — jalankan migrasi reset password dulu."); return; }
  } else if (mode === "local") {
    const d = dbLokal();
    if (d) { const u = d.users.find((x) => x.id === me.id); if (u) { u.rcHash = h; simpanLokal(d); } }
  }
  tampilKodePemulihan(kode, null);
}
function profilLokal(u){ return { id: u.id, username: u.username, display_name: u.display_name, bio: u.bio || "", birthdate: u.birthdate || null, avatar_color: u.avatar_color || warnaAvatar(u.display_name), avatar_url: u.avatar_url || null, cover_url: u.cover_url || null, last_seen: u.last_seen || null, created_at: u.created_at || null }; }
async function muatProfilCloud(uid){
  const { data, error } = await sb.from("humba_profiles").select("id, username, display_name, bio, birthdate, avatar_url, cover_url, avatar_color, last_seen, created_at").eq("id", uid).single();
  if (error || !data) return false;
  me = data;
  await sb.from("humba_profiles").update({ last_seen: sekarang() }).eq("id", uid);
  return true;
}
async function keluar(e){
  if (e) e.preventDefault();
  try { if (mode === "cloud" && sb) await sb.auth.signOut(); } catch(e){}
  me = null; sesiLokal = null;
  try { localStorage.removeItem("ch.sesi"); } catch(e){}
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (chRealtime) { try { sb.removeChannel(chRealtime); } catch(e){} chRealtime = null; }
  tampilAuth();
}

/* ---------- Lapisan data (cloud / lokal) ---------- */
async function semuaProfil(){
  if (mode === "local") return dbLokal().users.map(profilLokal);
  const { data, error } = await sb.from("humba_profiles").select("id, username, display_name, bio, birthdate, avatar_url, cover_url, avatar_color, last_seen, created_at").order("display_name");
  if (error) throw error;
  return data || [];
}
async function profilDariId(id){
  if (mode === "local") { const u = dbLokal().users.find((x) => x.id === id); return u ? profilLokal(u) : null; }
  const { data } = await sb.from("humba_profiles").select("id, username, display_name, bio, birthdate, avatar_url, cover_url, avatar_color, last_seen, created_at").eq("id", id).single();
  return data || null;
}
async function cariProfil(username){
  if (mode === "local") { const u = dbLokal().users.find((x) => x.username === username); return u ? profilLokal(u) : null; }
  const { data } = await sb.from("humba_profiles").select("id, username, display_name, bio, birthdate, avatar_url, cover_url, avatar_color, last_seen, created_at").eq("username", username).single();
  return data || null;
}
async function daftarTeman(){
  if (mode === "local") return dbLokal().friends.filter((f) => (f.requester_id === me.id || f.addressee_id === me.id));
  const { data, error } = await sb.from("humba_friends").select("*").or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`);
  if (error) throw error;
  return data || [];
}
function idTemanLain(f){ return f.requester_id === me.id ? f.addressee_id : f.requester_id; }
async function temanDiterima(){
  const semua = await daftarTeman();
  return semua.filter((f) => f.status === "accepted").map(idTemanLain);
}
async function kirimPermintaanTeman(targetId){
  if (targetId === me.id) return "Itu akunmu sendiri.";
  if (mode === "local") {
    const d = dbLokal();
    if (d.friends.some((f) => (f.requester_id === me.id && f.addressee_id === targetId) || (f.requester_id === targetId && f.addressee_id === me.id))) return "Permintaan sudah ada.";
    d.friends.push({ id: uidBaru(), requester_id: me.id, addressee_id: targetId, status: "pending", created_at: sekarang() }); simpanLokal(d); return null;
  }
  const { error } = await sb.from("humba_friends").insert({ requester_id: me.id, addressee_id: targetId, status: "pending" });
  return error ? error.message : null;
}
async function jawabTeman(id, terima){
  if (mode === "local") {
    const d = dbLokal(); const f = d.friends.find((x) => x.id === id); if (!f) return;
    if (terima) f.status = "accepted"; else d.friends = d.friends.filter((x) => x.id !== id);
    simpanLokal(d); return;
  }
  if (terima) await sb.from("humba_friends").update({ status: "accepted" }).eq("id", id);
  else await sb.from("humba_friends").delete().eq("id", id);
}
async function ambilPostingan(wallId){
  if (mode === "local") {
    const d = dbLokal();
    const temanIds = await temanDiterima();
    const bolehLihat = (p) => !p.visibility || p.visibility === "public" || p.user_id === me.id || temanIds.includes(p.user_id);
    let list = d.posts.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).filter(bolehLihat);
    if (wallId) list = list.filter((p) => p.wall_user_id === wallId || (p.user_id === wallId && !p.wall_user_id));
    else list = list.filter((p) => !p.wall_user_id);
    return list.slice(0, 50);
  }
  let q = sb.from("humba_posts").select("*").order("created_at", { ascending: false }).limit(50);
  if (wallId) q = q.or(`wall_user_id.eq.${wallId},and(user_id.eq.${wallId},wall_user_id.is.null)`);
  else q = q.is("wall_user_id", null);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
async function ambilPostinganById(id){
  if (mode === "local") {
    const d = dbLokal();
    const p = d.posts.find((x) => x.id === id);
    if (!p) return null;
    const temanIds = await temanDiterima();
    const boleh = !p.visibility || p.visibility === "public" || p.user_id === me.id || temanIds.includes(p.user_id);
    return boleh ? p : null;
  }
  const { data, error } = await sb.from("humba_posts").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data;
}
async function kirimStatus(teks, wallId, media, visibility){
  const body = (teks || "").trim();
  const m = media || null;
  const vis = visibility === "friends" ? "friends" : "public";
  if (!body && !m) return "Tulis dulu statusnya atau pilih foto/video.";
  if (body.length > 2000) return "Status maksimal 2000 karakter.";
  const image_url = m && m.jenis === "foto" ? m.dataUrl : null;
  const video_url = m && m.jenis === "video" ? m.dataUrl : null;
  if (mode === "local") {
    const d = dbLokal();
    try { d.posts.push({ id: uidBaru(), user_id: me.id, wall_user_id: wallId || null, body, image_url, video_url, visibility: vis, created_at: sekarang() }); simpanLokal(d); } catch(e){ return "Gagal menyimpan status (penyimpanan HP penuh?). Coba video yang lebih kecil atau status teks saja."; }
    return null;
  }
  const { error } = await sb.from("humba_posts").insert({ user_id: me.id, wall_user_id: wallId || null, body, image_url, video_url, visibility: vis });
  if (error) {
    if (String(error.message || "").includes("visibility")) return "Kolom visibility belum ada di Supabase. Jalankan supabase/migrasi-visibility.sql di SQL Editor Supabase.";
    if (String(error.message || "").includes("image_url") || String(error.message || "").includes("video_url")) return "Kolom foto/video belum ada di Supabase. Jalankan supabase/migrasi-foto-video-status.sql di SQL Editor Supabase dulu, lalu coba lagi.";
    return error.message;
  }
  return null;
}
function mediaPostHTML(p){
  if (p.image_url) return `<img src="${esc(p.image_url)}" alt="Foto status" style="width:100%;border-radius:12px;margin-top:8px">`;
  if (p.video_url) return `<video src="${esc(p.video_url)}" controls preload="metadata" playsinline style="width:100%;border-radius:12px;margin-top:8px"></video>`;
  return "";
}
let mediaStatus = null;
async function mediaStatusDipilih(input, jenis){
  const f = input.files && input.files[0];
  input.value = "";
  if (!f) return;
  try {
    if (jenis === "foto") {
      if (!f.type || !f.type.startsWith("image/")) { alert("Pilih file gambar (JPG/PNG)."); return; }
      mediaStatus = { jenis: "foto", dataUrl: await kompresFoto(f, 800, 800) };
    } else {
      if (!f.type || !f.type.startsWith("video/")) { alert("Pilih file video."); return; }
      if (f.size > 8 * 1024 * 1024) { alert("Video maksimal 8 MB. Pilih video yang lebih pendek atau lebih kecil."); return; }
      mediaStatus = { jenis: "video", dataUrl: await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Video tidak bisa dibaca.")); r.readAsDataURL(f); }) };
    }
  } catch(e){ alert("Gagal memproses media: " + (e.message || e)); return; }
  tabBeranda = "jelajah"; tampil("beranda").then(() => { tampilPreviewStatus(); const el = $("inStatus"); if (el) el.focus(); });
}
function tampilPreviewStatus(){
  const w = $("previewStatus"); if (!w) return;
  if (!mediaStatus) { w.innerHTML = ""; return; }
  w.innerHTML = (mediaStatus.jenis === "foto"
    ? `<img src="${esc(mediaStatus.dataUrl)}" style="width:100%;max-height:300px;object-fit:contain;border-radius:12px;margin-top:8px">`
    : `<video src="${esc(mediaStatus.dataUrl)}" controls preload="metadata" playsinline style="width:100%;max-height:300px;border-radius:12px;margin-top:8px"></video>`)
    + `<div style="margin-top:6px"><button class="tombol kecil abu" onclick="hapusMediaStatus()">Hapus ${mediaStatus.jenis === "foto" ? "foto" : "video"}</button></div>`;
}
function hapusMediaStatus(){ mediaStatus = null; tampilPreviewStatus(); }
async function hapusStatus(id){
  if (mode === "local") { const d = dbLokal(); d.posts = d.posts.filter((p) => p.id !== id); d.comments = d.comments.filter((c) => c.post_id !== id); d.likes = d.likes.filter((l) => l.post_id !== id); simpanLokal(d); return; }
  await sb.from("humba_posts").delete().eq("id", id);
}
async function editStatus(id, body, visibility){
  const patch = { body };
  if (visibility === "public" || visibility === "friends") patch.visibility = visibility;
  if (mode === "local") { const d = dbLokal(); const p = d.posts.find((x) => x.id === id); if (p) { Object.assign(p, patch); simpanLokal(d); } return; }
  await sb.from("humba_posts").update(patch).eq("id", id);
}
async function editKomentar(id, body){
  if (mode === "local") { const d = dbLokal(); const k = d.comments.find((x) => x.id === id); if (k) { k.body = body; simpanLokal(d); } return; }
  await sb.from("humba_comments").update({ body }).eq("id", id);
}
async function ambilKomentar(postId){
  if (mode === "local") return dbLokal().comments.filter((c) => c.post_id === postId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const { data } = await sb.from("humba_comments").select("*").eq("post_id", postId).order("created_at");
  return data || [];
}
async function kirimKomentar(postId, teks){
  const body = (teks || "").trim();
  if (!body) return;
  if (mode === "local") { const d = dbLokal(); d.comments.push({ id: uidBaru(), post_id: postId, user_id: me.id, body, created_at: sekarang() }); simpanLokal(d); return; }
  await sb.from("humba_comments").insert({ post_id: postId, user_id: me.id, body });
}
async function toggleSuka(postId){
  if (mode === "local") {
    const d = dbLokal(); const i = d.likes.findIndex((l) => l.post_id === postId && l.user_id === me.id);
    if (i >= 0) d.likes.splice(i, 1); else d.likes.push({ id: uidBaru(), post_id: postId, user_id: me.id, created_at: sekarang() });
    simpanLokal(d); return;
  }
  const { data } = await sb.from("humba_likes").select("id").eq("post_id", postId).eq("user_id", me.id).maybeSingle();
  if (data) await sb.from("humba_likes").delete().eq("id", data.id);
  else await sb.from("humba_likes").insert({ post_id: postId, user_id: me.id });
}
async function hitungSuka(postId){
  if (mode === "local") return dbLokal().likes.filter((l) => l.post_id === postId);
  const { data } = await sb.from("humba_likes").select("user_id").eq("post_id", postId);
  return data || [];
}

/* ---------- Tampilan utama ---------- */
let view = "beranda", profilLihat = null, grupBuka = null, chatDengan = null, catatanBuka = null, hasilCari = [];
let chRealtime = null;
let heartbeatTimer = null;
function mulaiHeartbeat(){
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    try {
      if (!me) return;
      if (mode === "cloud" && sb) await sb.from("humba_profiles").update({ last_seen: sekarang() }).eq("id", me.id);
      else if (mode === "local") { const d = dbLokal(); const u = d.users.find((x) => x.id === me.id); if (u) { u.last_seen = sekarang(); simpanLokal(d); } }
    } catch(e){}
  }, 60000);
}
function masukAplikasi(){
  mulaiHeartbeat();
  $("layarAuth").style.display = "none"; $("layarApp").style.display = "block";
  $("namaTop").textContent = me.display_name;
  profilLihat = me.id; grupBuka = null; chatDengan = null; catatanBuka = null;
  renderPanelProfil();
  langgananRealtime();
  let hal = "beranda";
  try { hal = localStorage.getItem("ch.halaman") || "beranda"; } catch(e){}
  if (!["beranda","teman","profil","grup","catatan","pesan","toko","saya","detail","jual","pesanan","keranjang","dompet","creator","draft","riwayat","pengaturan","bantuan","tentang","panduan","tambah-teman"].includes(hal)) hal = "beranda";
  tampil(hal);
}
function renderPanelProfil(){
  $("panelProfil").innerHTML = `<div class="baris-tengah">${avatarHtml(me, "besar")}<div><div class="nama">${esc(me.display_name)}</div><div class="muted">@${esc(me.username)}</div><div class="kecil" style="margin-top:4px">${me.bio ? esc(me.bio) : "Belum ada bio."}</div>${me.birthdate ? `<div class="kecil">🎂 ${tglIndo(me.birthdate)}</div>` : ""}</div></div><div style="margin-top:8px"><span class="chip">${mode === "cloud" ? "Supabase · tersambung" : "Mode lokal (demo)"}</span></div>`;
}
function setNavAktif(v){
  document.querySelectorAll("[data-v]").forEach((b) => b.classList.toggle("aktif", b.dataset.v === v));
}
async function tampil(v, opt){
  const lama = view;
  const tanpaDorong = opt && opt.tanpaDorong;
  view = v; setNavAktif(v);
  try { tutupDrawer(); } catch(e){}
  const tb = $("tabsAtas"); if (tb && v !== "beranda") tb.style.display = "none";
  try { localStorage.setItem("ch.halaman", v); } catch(e){}
  const t = $("tengah");
  try {
    if (v === "beranda") await renderBeranda(t);
    else if (v === "teman") await renderTeman(t);
    else if (v === "profil") await renderProfil(t, profilLihat || me.id);
    else if (v === "grup") await renderGrup(t);
    else if (v === "catatan") await renderCatatan(t);
    else if (v === "pesan") await renderPesan(t);
    else if (v === "toko") await renderToko(t);
    else if (v === "saya") await renderSaya(t);
    else if (v === "detail") await renderDetail(t);
    else if (v === "jual") renderJual(t);
    else if (v === "pesanan") await renderPesanan(t);
    else if (v === "keranjang") await renderKeranjang(t);
    else if (v === "dompet") renderDompet(t);
    else if (v === "creator") await renderCreator(t);
    else if (v === "draft") renderDraft(t);
    else if (v === "riwayat") await renderRiwayat(t);
    else if (v === "pengaturan") renderPengaturan(t);
    else if (v === "bantuan") renderBantuan(t);
    else if (v === "tentang") renderTentang(t);
    else if (v === "panduan") renderPanduan(t);
    else if (v === "tambah-teman") await renderTambahTeman(t);
  } catch(e){ t.innerHTML = `<div class="kartu"><div class="pesan-info merah">Gagal memuat: ${esc(e.message || e)}</div></div>`; }
  if (!tanpaDorong) {
    if (pertamaTampil) {
      pertamaTampil = false;
      try { history.replaceState({ view: v }, ""); } catch(e){}
    } else if (v !== lama) {
      try { history.pushState({ view: v }, ""); jumlahDorong++; } catch(e){}
    }
  }
  if (v === "beranda") dorongPenjaga();
  window.scrollTo({ top: 0 });
}

/* ---------- Tombol kembali HP: kembali ke menu sebelumnya, tekan 2x untuk keluar ---------- */
let pertamaTampil = true;
let penjagaAda = false;
let jumlahDorong = 0;
let terakhirBack = 0;
function dorongPenjaga(){
  if (penjagaAda) return;
  try { history.pushState({ penjaga: true, view: "beranda" }, ""); penjagaAda = true; } catch(e){}
}
function toastKeluar(){
  let el = $("toastKeluar");
  if (!el) {
    el = document.createElement("div");
    el.id = "toastKeluar";
    el.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#333;color:#fff;padding:10px 18px;border-radius:999px;font-size:14px;z-index:300;box-shadow:0 2px 12px rgba(0,0,0,.4);display:none;white-space:nowrap";
    document.body.appendChild(el);
  }
  el.textContent = "Tekan sekali lagi untuk keluar";
  el.style.display = "block";
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = "none"; }, 2000);
}
function kembaliMenu(){
  if (jumlahDorong > 0) { try { history.back(); return; } catch(e){} }
  tampil("beranda");
}
window.addEventListener("popstate", (e) => {
  const s = (e.state && typeof e.state === "object") ? e.state : {};
  if (s.penjaga) {
    penjagaAda = true;
    if (s.view && s.view !== view) tampil(s.view, { tanpaDorong: true });
    return;
  }
  if (s.view && s.view !== view) {
    penjagaAda = false;
    tampil(s.view, { tanpaDorong: true });
    return;
  }
  const kini = Date.now();
  if (kini - terakhirBack < 2000) return;
  terakhirBack = kini;
  penjagaAda = false;
  toastKeluar();
  setTimeout(() => { if (view === "beranda" && !penjagaAda) dorongPenjaga(); }, 2100);
});
function langgananRealtime(){
  if (mode !== "cloud" || !sb) return;
  try {
    chRealtime = sb.channel("ch-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "humba_posts" }, () => { if (view === "beranda") tampil("beranda"); })
      .on("postgres_changes", { event: "*", schema: "public", table: "humba_messages" }, () => { hitungBelumDibaca(); if (view === "pesan") tampil("pesan"); })
      .on("postgres_changes", { event: "*", schema: "public", table: "humba_pokes" }, () => { renderPanelKanan(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "humba_friends" }, () => { hitungBelumDibaca(); })
      .subscribe();
  } catch(e){}
}
async function hitungBelumDibaca(){
  try {
    let jmlPesan = 0, jmlTeman = 0;
    if (mode === "local") {
      const d = dbLokal();
      jmlPesan = d.messages.filter((m) => m.recipient_id === me.id && !m.read_at).length;
      jmlTeman = d.friends.filter((f) => f.addressee_id === me.id && f.status === "pending").length;
    } else {
      const r1 = await sb.from("humba_messages").select("id", { count: "exact", head: true }).eq("recipient_id", me.id).is("read_at", null);
      jmlPesan = r1.count || 0;
      const r2 = await sb.from("humba_friends").select("id", { count: "exact", head: true }).eq("addressee_id", me.id).eq("status", "pending");
      jmlTeman = r2.count || 0;
    }
    $("jmlPesan").style.display = jmlPesan ? "" : "none"; $("jmlPesan").textContent = jmlPesan;
    $("jmlTeman").style.display = jmlTeman ? "" : "none"; $("jmlTeman").textContent = jmlTeman;
    $("pesanTop").innerHTML = jmlPesan ? `<span class="badge">${jmlPesan} pesan baru</span>` : "";
    const pokes = await ambilPokeMasuk();
    $("pokeTop").innerHTML = pokes.length ? `<span class="badge">👆 ${pokes.length} poke</span>` : "";
  } catch(e){}
}
async function ambilPokeMasuk(){
  if (mode === "local") return dbLokal().pokes.filter((p) => p.to_id === me.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const { data } = await sb.from("humba_pokes").select("*").eq("to_id", me.id).order("created_at", { ascending: false }).limit(5);
  return data || [];
}
async function kirimPoke(targetId, namaTarget){
  if (targetId === me.id) return;
  if (mode === "local") { const d = dbLokal(); d.pokes.push({ id: uidBaru(), from_id: me.id, to_id: targetId, created_at: sekarang() }); simpanLokal(d); }
  else await sb.from("humba_pokes").insert({ from_id: me.id, to_id: targetId });
  alert("Kamu me-poke " + namaTarget + " 👆");
}
async function renderPanelKanan(){
  try {
    const semua = await semuaProfil();
    const online = semua.filter((p) => p.id !== me.id && p.last_seen && (Date.now() - new Date(p.last_seen).getTime() < 120000));
    $("panelOnline").innerHTML = online.length
      ? online.map((p) => `<div class="baris-tengah" style="margin-bottom:8px">${avatarHtml(p, "kecil")}<div style="flex:1;min-width:0"><a href="#" onclick="lihatProfil('${p.id}');return false">${esc(p.display_name)}</a><div class="muted"><span class="dot on"></span> Online</div></div><button class="tombol kecil" onclick="pokeDariPanel('${p.id}')">Poke</button></div>`).join("")
      : `<span class="muted">Tidak ada teman yang online.</span>`;
    const kini = new Date(); const ultah = semua.filter((p) => p.birthdate).map((p) => ({ p, jarak: jarakUltah(p.birthdate, kini) })).filter((x) => x.jarak >= 0 && x.jarak <= 30).sort((a, b) => a.jarak - b.jarak);
    $("panelUltah").innerHTML = ultah.length
      ? ultah.map((x) => `<div style="margin-bottom:6px">🎂 <b>${esc(x.p.display_name)}</b> — ${x.jarak === 0 ? "HARI INI!" : "dalam " + x.jarak + " hari"} (${tglUltah(x.p.birthdate)})</div>`).join("")
      : `<span class="muted">Tidak ada ulang tahun dalam 30 hari ke depan.</span>`;
    const pokes = await ambilPokeMasuk();
    $("panelPoke").innerHTML = pokes.length
      ? (await Promise.all(pokes.map(async (pk) => { const p = await profilDariId(pk.from_id); return p ? `<div style="margin-bottom:6px">👆 <b>${esc(p.display_name)}</b> me-poke kamu (${waktuRelatif(pk.created_at)}) <button class="tombol kecil" onclick="pokeDariPanel('${p.id}')">Poke balik</button></div>` : ""; }))).join("")
      : `<span class="muted">Tidak ada poke.</span>`;
  } catch(e){}
}
function jarakUltah(birthdate, kini){
  const b = new Date(birthdate); const thn = kini.getFullYear();
  let t = new Date(thn, b.getMonth(), b.getDate());
  let jarak = Math.floor((t - kini) / 86400000);
  if (jarak < 0) { t = new Date(thn + 1, b.getMonth(), b.getDate()); jarak = Math.floor((t - kini) / 86400000); }
  return jarak;
}
async function pokeDariPanel(id){ const p = await profilDariId(id); await kirimPoke(id, p ? p.display_name : "teman"); renderPanelKanan(); }
async function lihatProfil(id){ profilLihat = id; tampil("profil"); }
function tulisCepat(){ tampil("beranda").then(() => { const el = $("inStatus"); if (el) { el.focus(); el.scrollIntoView({ block: "center", behavior: "smooth" }); } }); }

/* ---------- Beranda ala RedNote ---------- */
let tabBeranda = "jelajah", kanalTerdekat = "Semua", detailPostId = null;
let rekomendasiTutup = [];
function setTabBeranda(tab){ tabBeranda = tab; tampil("beranda"); }
function setKanal(k){ kanalTerdekat = k; tampil("beranda"); }
function tutupRekomendasi(id){ rekomendasiTutup.push(id); tampil(view); }
const KANAL = {
  "Kuliner": ["makan","kuliner","kopi","nasi","kue","warung","resto","minum","masak","ayam","babi","ikan","sayur","soto","bakso","mie","jajanan","lapar","sarapan"],
  "Wisata": ["wisata","pantai","air terjun","gunung","danau","libur","trip","jalan-jalan","piknik","sunset","pemandangan","waingapu","waikabubak"],
  "Acara": ["acara","pesta","nikah","gereja","ibadah","lomba","konser","rapat","sekolah","wisuda","syukur","ulang tahun","festival"],
  "Jual Beli": ["jual","dijual","harga","rp","beli","promo","diskon","ready","stok","order","po "]
};
function cocokKanal(teks, kanal){
  if (kanal === "Semua") return true;
  const t = " " + String(teks || "").toLowerCase() + " ";
  return (KANAL[kanal] || []).some((k) => t.includes(k));
}
async function gridStatusHTML(postingan){
  const semua = {};
  try { (await semuaProfil()).forEach((p) => semua[p.id] = p); } catch(e){}
  let html = `<div class="grid2">`;
  for (const p of postingan) {
    const pemilik = semua[p.user_id] || { display_name: "Pengguna", username: "?", avatar_color: "#888" };
    const suka = await hitungSuka(p.id);
    html += `<article class="kartu-mini" onclick="bukaDetail('${p.id}')">
      <div class="mini-gambar" style="background:${warnaKartu(p.id)}">${p.image_url ? `<img src="${esc(p.image_url)}" style="width:100%;height:100%;object-fit:cover;display:block">` : p.video_url ? `<video src="${esc(p.video_url)}" preload="metadata" style="width:100%;height:100%;object-fit:cover;display:block"></video>` : `<span class="mini-teks">${esc((p.body || "").slice(0, 90))}${(p.body || "").length > 90 ? "…" : ""}</span>`}</div>
      <div class="mini-isi"><div class="mini-judul">${esc((p.body || "").slice(0, 60))}</div>
      <div class="mini-bawah">${avatarHtml(pemilik, "kecil")}<span class="mini-nama">${esc(pemilik.display_name)}</span>${p.visibility === "friends" ? `<span class="mini-suka">👥 Teman saja</span>` : ""}<span class="mini-suka">♥ ${suka.length}</span></div></div></article>`;
  }
  return html + `</div>`;
}
async function blokRekomendasi(){
  const semua = await semuaProfil();
  const temanIds = await temanDiterima();
  const relasi = await daftarTeman();
  const terkait = new Set([...temanIds, ...relasi.map(idTemanLain)]);
  const calon = semua.filter((p) => p.id !== me.id && !terkait.has(p.id) && !rekomendasiTutup.includes(p.id)).slice(0, 8);
  if (!calon.length) return "";
  return `<div class="kartu"><h2>Direkomendasikan Untukmu</h2>
    ${calon.map((p) => `<div class="item-pengguna">${avatarHtml(p)}<div class="info"><div class="nama">${esc(p.display_name)}</div><div class="sub">@${esc(p.username)}${p.bio ? " — " + esc(p.bio) : ""}</div></div><button class="tombol kecil hijau" onclick="tambahTemanUI('${p.id}')">Ikuti</button> <button class="tombol kecil abu" onclick="tutupRekomendasi('${p.id}')">✕</button></div>`).join("")}
  </div>`;
}
async function renderBeranda(t){
  const tabs = $("tabsAtas");
  tabs.style.display = "flex";
  tabs.innerHTML = `<button class="subtab ${tabBeranda === "mengikuti" ? "aktif" : ""}" onclick="setTabBeranda('mengikuti')">Mengikuti</button>
  <button class="subtab ${tabBeranda === "jelajah" ? "aktif" : ""}" onclick="setTabBeranda('jelajah')">Jelajah</button>
  <button class="subtab ${tabBeranda === "terdekat" ? "aktif" : ""}" onclick="setTabBeranda('terdekat')">Terdekat</button>`;
  const draft = muatDraft();
  let html = `<div class="kartu"><div class="komposer">
      <div class="baris" style="margin-bottom:8px">${avatarHtml(me)}<textarea id="inStatus" placeholder="Bagikan sesuatu, ${esc(me.display_name)}…" maxlength="2000">${esc(draft)}</textarea></div>
      <div id="previewStatus"></div>
      <div class="kaki-komposer"><select id="inVisibility" class="pilih-visibilitas"><option value="public">🌍 Publik — semua pengguna</option><option value="friends">👥 Teman saja</option></select><div style="display:flex;align-items:center;gap:10px"><span class="muted" id="hitungStatus">${String(draft).length}/2000</span><button class="tombol kecil" onclick="bagikanStatus()">Bagikan</button></div></div>
    </div></div>`;
  const semuaPost = await ambilPostingan(null);
  if (tabBeranda === "mengikuti") {
    const temanIds = await temanDiterima();
    const postingan = semuaPost.filter((p) => temanIds.includes(p.user_id));
    if (!temanIds.length) {
      html += `<div class="kartu tengah"><b>Kamu belum mengikuti siapa pun.</b><br><span class="muted">Ikuti teman supaya status mereka muncul di sini.</span></div>`;
      html += await blokRekomendasi();
    } else if (!postingan.length) {
      html += `<div class="kartu tengah"><b>Temanmu belum menulis status.</b><br><span class="muted">Coba lihat Jelajah untuk status semua pengguna.</span></div>`;
    } else {
      html += await gridStatusHTML(postingan);
    }
  } else if (tabBeranda === "terdekat") {
    const kanalList = ["Semua", "Kuliner", "Wisata", "Acara", "Jual Beli"];
    html += `<div class="kartu"><div class="chip-baris" style="padding-top:2px">${kanalList.map((k) => `<button class="chip-kanal ${kanalTerdekat === k ? "aktif" : ""}" onclick="setKanal('${k}')">${k}</button>`).join("")}</div></div>`;
    const postingan = semuaPost.filter((p) => cocokKanal(p.body, kanalTerdekat));
    if (!postingan.length) {
      html += `<div class="kartu tengah"><b>Belum ada status di kanal ${esc(kanalTerdekat)}.</b><br><span class="muted">Coba ganti kanal lain.</span></div>`;
    } else {
      html += await gridStatusHTML(postingan);
    }
  } else {
    if (!semuaPost.length) {
      html += `<div class="kartu tengah"><b>Belum ada status sama sekali.</b><br><span class="muted">Jadilah yang pertama menulis status di HUMBA!</span></div>`;
    } else {
      html += await gridStatusHTML(semuaPost);
    }
  }
  t.innerHTML = html;
  const ta = $("inStatus");
  if (ta) ta.addEventListener("input", (e) => {
    $("hitungStatus").textContent = e.target.value.length + "/2000";
    try { localStorage.setItem(kunciAkun("draft"), e.target.value); } catch(err){}
  });
  renderPanelKanan(); hitungBelumDibaca(); tampilPreviewStatus();
}
async function bagikanStatus(){
  const vis = ($("inVisibility") && $("inVisibility").value) || "public";
  const err = await kirimStatus($("inStatus").value, null, mediaStatus, vis);
  if (err) { alert(err); return; }
  mediaStatus = null;
  try { localStorage.removeItem(kunciAkun("draft")); } catch(e){}
  tampil("beranda");
}
function bukaDetail(id){ detailPostId = id; catatRiwayat(id); tampil("detail"); }
async function renderDetail(t){
  const tabs = $("tabsAtas"); if (tabs) tabs.style.display = "none";
  const p = await ambilPostinganById(detailPostId);
  if (!p) { t.innerHTML = `<div class="kartu"><button class="tombol kecil abu" onclick="kembaliMenu()">← Kembali</button><div class="pesan-info merah" style="margin-top:10px">Status tidak ditemukan (mungkin sudah dihapus).</div></div>`; return; }
  const pemilik = await profilDariId(p.user_id) || { display_name: "Pengguna", username: "?", avatar_color: "#888" };
  const suka = await hitungSuka(p.id);
  const sayaSuka = suka.some((s) => s.user_id === me.id);
  const komen = await ambilKomentar(p.id);
  const semua = {}; (await semuaProfil()).forEach((x) => semua[x.id] = x);
  t.innerHTML = `<div class="kartu feed">
    <button class="tombol kecil abu" onclick="kembaliMenu()">← Kembali</button>
    <div class="feed-kepala" style="margin-top:10px">${avatarHtml(pemilik)}
      <div class="info"><a href="#" class="nama" onclick="lihatProfil('${p.user_id}');return false">${esc(pemilik.display_name)}</a>
      <div class="sub">${waktuRelatif(p.created_at)}${p.visibility === "friends" ? " · 👥 Teman saja" : ""}</div></div>
      ${p.user_id === me.id ? `<button class="tombol kecil" onclick="mulaiEditStatus('${p.id}', '${p.visibility || "public"}', ${p.image_url || p.video_url ? "true" : "false"})">Ubah</button> <button class="tombol kecil abu" onclick="hapusStatusUI('${p.id}')">Hapus</button>` : ""}
    </div>
    <div class="status"><div class="teks" id="teksStatus-${p.id}">${esc(p.body)}</div>${mediaPostHTML(p)}</div>
    <div class="aksi">
      <button class="${sayaSuka ? "suka-aktif" : ""}" onclick="sukaUI('${p.id}')">${ikonSuka(sayaSuka)}<span>Suka ${suka.length}</span></button>
      <button onclick="fokusKomen('${p.id}')">${ikonKomen()}<span>Komentar ${komen.length}</span></button>
      <button onclick="toggleSimpan('${p.id}')">${sudahSimpan(p.id) ? "★ Tersimpan" : "☆ Simpan"}</button>
    </div>
    <div id="komen-${p.id}">
      ${komen.map((k) => { const kp = semua[k.user_id] || { display_name: "?", avatar_color: "#888" }; return `<div class="komentar"><b>${esc(kp.display_name)}</b> <span class="muted">${waktuRelatif(k.created_at)}</span>${k.user_id === me.id ? ` <button class="tombol kecil abu" onclick="mulaiEditKomen('${k.id}')">Ubah</button>` : ""}<div class="teks" id="teksKomen-${k.id}">${esc(k.body)}</div></div>`; }).join("") || `<p class="muted" style="margin-top:8px">Belum ada komentar.</p>`}
    </div>
    <div class="komen-form"><input id="inKomen-${p.id}" placeholder="Tulis komentar…" maxlength="500" onkeydown="if(event.key==='Enter')kirimKomenUI('${p.id}')"><button onclick="kirimKomenUI('${p.id}')">Kirim</button></div>
  </div>`;
  renderPanelKanan();
}

async function hapusStatusUI(id){ if (!confirm("Hapus status ini?")) return; await hapusStatus(id); tampil(view === "detail" ? "beranda" : view); }
function mulaiEditStatus(id, vis, punyaMedia){
  const el = $("teksStatus-" + id);
  if (!el) return;
  const lama = el.textContent;
  const v = vis === "friends" ? "friends" : "public";
  el.innerHTML = `<textarea id="editStatus-${id}" maxlength="2000" style="width:100%;min-height:80px">${esc(lama)}</textarea><div style="margin-top:6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><select id="editVis-${id}" class="pilih-visibilitas"><option value="public"${v === "public" ? " selected" : ""}>🌍 Publik</option><option value="friends"${v === "friends" ? " selected" : ""}>👥 Teman saja</option></select><button class="tombol kecil" onclick="simpanEditStatus('${id}', ${punyaMedia ? "true" : "false"})">Simpan</button><button class="tombol kecil abu" onclick="tampil(view)">Batal</button></div>`;
  const ta = $("editStatus-" + id); if (ta) ta.focus();
}
async function simpanEditStatus(id, punyaMedia){
  const el = $("editStatus-" + id);
  const baru = (el.value || "").trim();
  if (baru.length > 2000) { alert("Status maksimal 2000 karakter."); return; }
  if (!baru && !punyaMedia) { alert("Status tidak boleh kosong kalau tidak ada foto/video."); return; }
  const visEl = $("editVis-" + id);
  const vis = visEl ? visEl.value : "public";
  await editStatus(id, baru, vis);
  tampil(view);
}
function mulaiEditKomen(id){
  const el = $("teksKomen-" + id);
  if (!el) return;
  const lama = el.textContent;
  el.innerHTML = `<textarea id="editKomen-${id}" maxlength="500" style="width:100%;min-height:60px">${esc(lama)}</textarea><div style="margin-top:6px;display:flex;gap:8px"><button class="tombol kecil" onclick="simpanEditKomen('${id}')">Simpan</button><button class="tombol kecil abu" onclick="tampil(view)">Batal</button></div>`;
  const ta = $("editKomen-" + id); if (ta) ta.focus();
}
async function simpanEditKomen(id){
  const el = $("editKomen-" + id);
  const baru = (el.value || "").trim();
  if (!baru) { alert("Komentar tidak boleh kosong."); return; }
  if (baru.length > 500) { alert("Komentar maksimal 500 karakter."); return; }
  await editKomentar(id, baru);
  tampil(view);
}
async function sukaUI(id){ await toggleSuka(id); tampil(view); }
function fokusKomen(id){ const el = $("inKomen-" + id); if (el) el.focus(); }
async function kirimKomenUI(id){ const el = $("inKomen-" + id); await kirimKomentar(id, el.value); tampil(view); }

/* ---------- Teman ---------- */
async function cariTeman(){
  const q = ($("inCari").value || "").trim().toLowerCase();
  if (!q) { tampil("teman"); return; }
  const semua = await semuaProfil();
  hasilCari = semua.filter((p) => p.id !== me.id && (p.username.includes(q) || p.display_name.toLowerCase().includes(q)));
  tampil("teman");
}
async function renderTeman(t){
  const relasi = await daftarTeman();
  const masuk = relasi.filter((f) => f.addressee_id === me.id && f.status === "pending");
  const keluar = relasi.filter((f) => f.requester_id === me.id && f.status === "pending");
  const diterima = relasi.filter((f) => f.status === "accepted");
  const semua = {}; (await semuaProfil()).forEach((p) => semua[p.id] = p);
  const kartuOrang = (p, tombol) => `<div class="item-pengguna">${avatarHtml(p)}<div class="info"><a href="#" class="nama" onclick="lihatProfil('${p.id}');return false">${esc(p.display_name)}</a><div class="sub">@${esc(p.username)}${p.bio ? " — " + esc(p.bio) : ""}</div></div>${tombol || ""}</div>`;
  const tombolUntuk = (p) => {
    const r = relasi.find((f) => idTemanLain(f) === p.id);
    if (!r) return `<button class="tombol kecil" onclick="tambahTemanUI('${p.id}')">+ Teman</button>`;
    if (r.status === "accepted") return `<button class="tombol kecil abu" onclick="bukaChat('${p.id}')">Pesan</button> <button class="tombol kecil" onclick="pokeDariPanel('${p.id}')">Poke</button>`;
    if (r.requester_id === me.id) return `<span class="muted">Permintaan terkirim</span>`;
    return `<button class="tombol kecil hijau" onclick="jawabTemanUI('${r.id}',true)">Terima</button> <button class="tombol kecil abu" onclick="jawabTemanUI('${r.id}',false)">Tolak</button>`;
  };
  t.innerHTML = `
  <div class="kartu"><h2>Teman</h2>
    <div class="komen-form" style="margin-top:0"><input id="inCariTeman" placeholder="Cari username atau nama…" value="${esc($("inCari").value || "")}" onkeydown="if(event.key==='Enter')cariTemanDariTab()"><button onclick="cariTemanDariTab()">Cari</button></div>
    ${hasilCari.length || $("inCari").value ? `<h4>Hasil pencarian (${hasilCari.length})</h4>${hasilCari.length ? hasilCari.map((p) => kartuOrang(p, tombolUntuk(p))).join("") : `<p class="muted">Tidak ditemukan.</p>`}` : ""}
  </div>
  ${masuk.length ? `<div class="kartu"><h2>Permintaan Pertemanan (${masuk.length})</h2>${masuk.map((f) => { const p = semua[f.requester_id]; return p ? kartuOrang(p, `<button class="tombol kecil hijau" onclick="jawabTemanUI('${f.id}',true)">Terima</button> <button class="tombol kecil abu" onclick="jawabTemanUI('${f.id}',false)">Tolak</button>`) : ""; }).join("")}</div>` : ""}
  ${keluar.length ? `<div class="kartu"><h2>Permintaan Terkirim (${keluar.length})</h2>${keluar.map((f) => { const p = semua[f.addressee_id]; return p ? kartuOrang(p, `<span class="muted">Menunggu jawaban</span>`) : ""; }).join("")}</div>` : ""}
  <div class="kartu"><h2>Teman Saya (${diterima.length})</h2>
    ${diterima.length ? diterima.map((f) => { const p = semua[idTemanLain(f)]; return p ? kartuOrang(p, `<button class="tombol kecil abu" onclick="bukaChat('${p.id}')">Pesan</button> <button class="tombol kecil" onclick="pokeDariPanel('${p.id}')">Poke</button>`) : ""; }).join("") : `<p class="muted">Belum ada teman. Cari username temanmu di atas lalu tambah.</p>`}
  </div>
  <div class="kartu"><h2>Semua Pengguna</h2>
    ${(await semuaProfil()).filter((p) => p.id !== me.id).slice(0, 30).map((p) => kartuOrang(p, tombolUntuk(p))).join("") || `<p class="muted">Belum ada pengguna lain.</p>`}
  </div>`;
  renderPanelKanan();
}
async function cariTemanDariTab(){ $("inCari").value = $("inCariTeman").value; await cariTeman(); }
async function tambahTemanUI(id){ const err = await kirimPermintaanTeman(id); if (err) alert(err); else alert("Permintaan pertemanan terkirim."); tampil("teman"); }
async function jawabTemanUI(id, terima){ await jawabTeman(id, terima); tampil("teman"); }

/* ---------- Profil & Dinding ---------- */
async function renderProfil(t, userId){
  const p = await profilDariId(userId);
  if (!p) { t.innerHTML = `<div class="kartu"><div class="pesan-info merah">Profil tidak ditemukan.</div></div>`; return; }
  const saya = p.id === me.id;
  const temanIds = await temanDiterima();
  const adalahTeman = saya || temanIds.includes(p.id);
  const wall = await ambilPostingan(p.id);
  const semua = {}; (await semuaProfil()).forEach((x) => semua[x.id] = x);
  t.innerHTML = `
  <div class="kartu">
    ${saya
      ? `<div class="sampul ${p.cover_url ? "" : "kosong"}" ${p.cover_url ? `style="background-image:url('${urlCss(p.cover_url)}')"` : ""} onclick="pilihFoto('sampul')">${p.cover_url ? `<button class="ganti-sampul" onclick="event.stopPropagation();pilihFoto('sampul')">📷 Ganti Sampul</button>` : `<span>📷 Ketuk untuk pasang foto sampul</span>`}</div>`
      : (p.cover_url ? `<div class="sampul" style="background-image:url('${urlCss(p.cover_url)}')"></div>` : "")}
    <div class="baris" style="margin-top:12px">${saya ? `<span class="foto-profil-wrap" onclick="pilihFoto('profil')" title="Ketuk untuk ganti foto profil">${avatarHtml(p, "besar")}<span class="lencana-kamera">📷</span></span>` : avatarHtml(p, "besar")}
      <div style="flex:1;min-width:0">
        <h2 style="margin-bottom:2px">${esc(p.display_name)}</h2>
        <div class="muted">@${esc(p.username)} · Bergabung ${p.created_at ? tglIndo(p.created_at) : "-"}</div>
        <div style="margin-top:6px">${p.bio ? esc(p.bio) : "<span class='muted'>Belum ada bio.</span>"}</div>
        ${p.birthdate ? `<div class="kecil" style="margin-top:4px">🎂 Lahir ${tglUltah(p.birthdate)}</div>` : ""}
        ${saya ? `<div class="stat-baris"><div><b>${temanIds.length}</b>Teman</div><div><b>${wall.length}</b>Kiriman</div></div>` : ""}
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          ${saya ? `<button class="tombol kecil" onclick="editProfilUI()">Ubah Profil</button>` : ""}
          ${!saya ? `<button class="tombol kecil" onclick="tambahTemanUI('${p.id}')">+ Teman</button> <button class="tombol kecil abu" onclick="bukaChat('${p.id}')">Pesan</button> <button class="tombol kecil" onclick="pokeDariPanel('${p.id}')">Poke</button>` : ""}
        </div>
      </div>
    </div>
    <div id="formProfil" style="display:none;margin-top:12px">
      <div class="field"><label>Nama tampilan</label><input id="editNama" value="${esc(p.display_name)}"></div>
      <div class="field"><label>Bio</label><textarea id="editBio" maxlength="200">${esc(p.bio || "")}</textarea></div>
      <div class="field"><label>Tanggal lahir</label><input id="editTgl" type="date" value="${p.birthdate || ""}"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button type="button" class="tombol kecil abu" onclick="pilihFoto('profil')">📷 Ganti Foto Profil</button><button type="button" class="tombol kecil abu" onclick="pilihFoto('sampul')">🖼️ Ganti Foto Sampul</button></div>
      <button class="tombol kecil" onclick="simpanProfilUI()">Simpan</button>
    </div>
  </div>
  <div class="kartu">
    <h2>Dinding ${esc(p.display_name)}</h2>
    ${adalahTeman ? `<div class="komposer">
      <textarea id="inWall" placeholder="Tulis sesuatu di dinding ${esc(p.display_name)}…" maxlength="2000"></textarea>
      <div style="text-align:right;margin-top:8px"><button class="tombol kecil" onclick="bagikanWall('${p.id}')">Tulis di Dinding</button></div>
    </div>` : `<p class="muted">Hanya teman yang bisa menulis di dinding ini. Tambah teman dulu.</p>`}
    <div id="daftarWall">${wall.length ? "" : `<p class="muted" style="margin-top:10px">Belum ada tulisan di dinding ini.</p>`}</div>
  </div>`;
  for (const w of wall) {
    const pemilik = semua[w.user_id] || { display_name: "?", avatar_color: "#888" };
    const suka = await hitungSuka(w.id);
    const komen = await ambilKomentar(w.id);
    const div = document.createElement("div");
    div.className = "status";
    div.innerHTML = `
      <div class="baris">${avatarHtml(pemilik, "kecil")}<div style="flex:1;min-width:0"><a href="#" class="nama" onclick="lihatProfil('${w.user_id}');return false">${esc(pemilik.display_name)}</a> <span class="muted">${waktuRelatif(w.created_at)}${w.visibility === "friends" ? " · 👥 Teman saja" : ""}</span>${w.user_id === me.id ? ` <button class="tombol kecil" onclick="mulaiEditStatus('${w.id}', '${w.visibility || "public"}', ${w.image_url || w.video_url ? "true" : "false"})">Ubah</button>` : ""}${w.user_id === me.id || w.wall_user_id === me.id ? ` <button class="tombol kecil abu" onclick="hapusStatusUI('${w.id}')">Hapus</button>` : ""}<div class="teks" id="teksStatus-${w.id}">${esc(w.body)}</div>${mediaPostHTML(w)}
      <div class="aksi"><button class="${suka.some((s) => s.user_id === me.id) ? "suka-aktif" : ""}" onclick="sukaUI('${w.id}')">${ikonSuka(suka.some((s) => s.user_id === me.id))}<span>Suka ${suka.length}</span></button><button onclick="fokusKomen('${w.id}')">${ikonKomen()}<span>Komentar ${komen.length}</span></button></div>
      <div id="komen-${w.id}">${komen.map((k) => { const kp = semua[k.user_id] || { display_name: "?", avatar_color: "#888" }; return `<div class="komentar"><b>${esc(kp.display_name)}</b> <span class="muted">${waktuRelatif(k.created_at)}</span>${k.user_id === me.id ? ` <button class="tombol kecil abu" onclick="mulaiEditKomen('${k.id}')">Ubah</button>` : ""}<div class="teks" id="teksKomen-${k.id}">${esc(k.body)}</div></div>`; }).join("")}</div>
      <div class="komen-form"><input id="inKomen-${w.id}" placeholder="Tulis komentar…" maxlength="500" onkeydown="if(event.key==='Enter')kirimKomenUI('${w.id}')"><button onclick="kirimKomenUI('${w.id}')">Kirim</button></div>
      </div></div>`;
    $("daftarWall").appendChild(div);
  }
  renderPanelKanan();
}
function editProfilUI(){ $("formProfil").style.display = $("formProfil").style.display === "none" ? "block" : "none"; }
async function simpanProfilUI(){
  const nama = ($("editNama").value || "").trim();
  const bio = ($("editBio").value || "").trim();
  const tgl = $("editTgl").value || null;
  if (nama.length < 2 || nama.length > 32) { alert("Nama tampilan 2–32 karakter."); return; }
  if (bio.length > 200) { alert("Bio maksimal 200 karakter."); return; }
  if (mode === "local") {
    const d = dbLokal(); const u = d.users.find((x) => x.id === me.id);
    if (u) { u.display_name = nama; u.bio = bio; u.birthdate = tgl; simpanLokal(d); me = profilLokal(u); }
  } else {
    const { error } = await sb.from("humba_profiles").update({ display_name: nama, bio, birthdate: tgl }).eq("id", me.id);
    if (error) { alert("Gagal menyimpan: " + error.message); return; }
    me.display_name = nama; me.bio = bio; me.birthdate = tgl;
  }
  $("namaTop").textContent = me.display_name; renderPanelProfil(); tampil("profil");
}
/* ---------- Foto profil & sampul ---------- */
function kompresFoto(file, lebarMaks, tinggiMaks){
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        let w = img.naturalWidth, h = img.naturalHeight;
        const skala = Math.min(1, lebarMaks / w, tinggiMaks / h);
        w = Math.max(1, Math.round(w * skala)); h = Math.max(1, Math.round(h * skala));
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        res(c.toDataURL("image/jpeg", 0.8));
      } catch(e){ URL.revokeObjectURL(url); rej(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Gambar tidak bisa dibaca.")); };
    img.src = url;
  });
}
function pilihFoto(jenis){ const el = $(jenis === "sampul" ? "inFotoSampul" : "inFotoProfil"); if (el) el.click(); }
async function fotoDipilih(input, jenis){
  const f = input.files && input.files[0];
  input.value = "";
  if (!f) return;
  if (!f.type || !f.type.startsWith("image/")) { alert("Pilih file gambar (JPG/PNG)."); return; }
  try {
    const dataUrl = await kompresFoto(f, jenis === "sampul" ? 800 : 256, jenis === "sampul" ? 300 : 256);
    const ok = await simpanFoto(jenis, dataUrl);
    if (ok) alert(jenis === "sampul" ? "Foto sampul diganti." : "Foto profil diganti.");
  } catch(e){ alert("Gagal memproses foto: " + (e.message || e)); }
}
async function simpanFoto(jenis, dataUrl){
  const kolom = jenis === "sampul" ? "cover_url" : "avatar_url";
  if (mode === "local") {
    const d = dbLokal(); const u = d.users.find((x) => x.id === me.id);
    if (u) { u[kolom] = dataUrl; simpanLokal(d); me = profilLokal(u); }
  } else {
    const { error } = await sb.from("humba_profiles").update({ [kolom]: dataUrl }).eq("id", me.id);
    if (error) { alert("Gagal menyimpan foto: " + error.message + "\n\nJalankan supabase/migrasi-foto-profil.sql di SQL Editor Supabase dulu, lalu coba lagi."); return false; }
    me[kolom] = dataUrl;
  }
  renderPanelProfil();
  if (view === "profil" || view === "saya") tampil(view);
  return true;
}
async function bagikanWall(wallId){
  const err = await kirimStatus($("inWall").value, wallId);
  if (err) { alert(err); return; }
  tampil("profil");
}

/* ---------- Grup ---------- */
async function ambilGrup(){
  if (mode === "local") return dbLokal().groups.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const { data } = await sb.from("humba_groups").select("*").order("created_at", { ascending: false });
  return data || [];
}
async function anggotaGrupSaya(){
  if (mode === "local") return dbLokal().members.filter((m) => m.user_id === me.id).map((m) => m.group_id);
  const { data } = await sb.from("humba_group_members").select("group_id").eq("user_id", me.id);
  return (data || []).map((m) => m.group_id);
}
async function buatGrupUI(){
  const nama = ($("inNamaGrup").value || "").trim();
  const desk = ($("inDeskGrup").value || "").trim();
  if (nama.length < 2) { alert("Nama grup minimal 2 karakter."); return; }
  if (mode === "local") {
    const d = dbLokal(); const g = { id: uidBaru(), name: nama, description: desk, created_by: me.id, created_at: sekarang() };
    d.groups.push(g); d.members.push({ group_id: g.id, user_id: me.id, joined_at: sekarang() }); simpanLokal(d);
  } else {
    const { data, error } = await sb.from("humba_groups").insert({ name: nama, description: desk, created_by: me.id }).select("id").single();
    if (error) { alert("Gagal membuat grup: " + error.message); return; }
    await sb.from("humba_group_members").insert({ group_id: data.id, user_id: me.id });
  }
  tampil("grup");
}
async function gabungGrupUI(gid){
  if (mode === "local") { const d = dbLokal(); if (!d.members.some((m) => m.group_id === gid && m.user_id === me.id)) { d.members.push({ group_id: gid, user_id: me.id, joined_at: sekarang() }); simpanLokal(d); } }
  else await sb.from("humba_group_members").insert({ group_id: gid, user_id: me.id });
  grupBuka = gid; tampil("grup");
}
async function renderGrup(t){
  const semuaGrup = await ambilGrup();
  const saya = await anggotaGrupSaya();
  if (grupBuka) {
    const g = semuaGrup.find((x) => x.id === grupBuka);
    if (!g) { grupBuka = null; return renderGrup(t); }
    let kiriman = [];
    if (mode === "local") kiriman = dbLokal().gposts.filter((x) => x.group_id === g.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else { const r = await sb.from("humba_group_posts").select("*").eq("group_id", g.id).order("created_at", { ascending: false }); kiriman = r.data || []; }
    const semua = {}; (await semuaProfil()).forEach((p) => semua[p.id] = p);
    t.innerHTML = `
    <div class="kartu"><button class="tombol kecil abu" onclick="grupBuka=null;tampil('grup')">← Semua Grup</button>
      <h2 style="margin-top:8px">${esc(g.name)}</h2>
      <p class="muted">${esc(g.description || "")}</p>
      <div class="komposer" style="margin-top:10px"><textarea id="inGPost" placeholder="Tulis sesuatu di grup ini…" maxlength="2000"></textarea>
      <div style="text-align:right;margin-top:8px"><button class="tombol kecil" onclick="kirimGPost('${g.id}')">Kirim ke Grup</button></div></div>
    </div>
    <div class="kartu"><h2>Kiriman Grup</h2><div id="daftarGPost">${kiriman.length ? "" : `<p class="muted">Belum ada kiriman di grup ini.</p>`}</div></div>`;
    for (const k of kiriman) {
      const pemilik = semua[k.user_id] || { display_name: "?", avatar_color: "#888" };
      const div = document.createElement("div");
      div.className = "status";
      div.innerHTML = `<div class="baris">${avatarHtml(pemilik, "kecil")}<div style="flex:1;min-width:0"><a href="#" class="nama" onclick="lihatProfil('${k.user_id}');return false">${esc(pemilik.display_name)}</a> <span class="muted">${waktuRelatif(k.created_at)}</span><div class="teks">${esc(k.body)}</div></div></div>`;
      $("daftarGPost").appendChild(div);
    }
    renderPanelKanan(); return;
  }
  t.innerHTML = `
  <div class="kartu"><h2>Buat Grup Baru</h2>
    <div class="field"><label>Nama grup</label><input id="inNamaGrup" placeholder="contoh: Mio Sporty Mks"></div>
    <div class="field"><label>Deskripsi</label><input id="inDeskGrup" placeholder="Tentang grup ini…"></div>
    <button class="tombol" onclick="buatGrupUI()">Buat Grup</button>
  </div>
  <div class="kartu"><h2>Grup Saya (${semuaGrup.filter((g) => saya.includes(g.id)).length})</h2>
    ${semuaGrup.filter((g) => saya.includes(g.id)).map((g) => `<div class="item-pengguna daftar-grup" onclick="grupBuka='${g.id}';tampil('grup')"><span class="avatar" style="background:linear-gradient(135deg,#ff5b6e,#ff2442)">${ikonGrup()}</span><div class="info"><div class="nama">${esc(g.name)}</div><div class="sub">${esc(g.description || "")}</div></div><span class="muted">Buka →</span></div>`).join("") || `<p class="muted">Kamu belum bergabung ke grup mana pun.</p>`}
  </div>
  <div class="kartu"><h2>Semua Grup (${semuaGrup.length})</h2>
    ${semuaGrup.map((g) => `<div class="item-pengguna"><span class="avatar" style="background:linear-gradient(135deg,#ff5b6e,#ff2442)">${ikonGrup()}</span><div class="info"><div class="nama">${esc(g.name)}</div><div class="sub">${esc(g.description || "")}</div></div>${saya.includes(g.id) ? `<button class="tombol kecil abu" onclick="grupBuka='${g.id}';tampil('grup')">Buka</button>` : `<button class="tombol kecil" onclick="gabungGrupUI('${g.id}')">Gabung</button>`}</div>`).join("") || `<p class="muted">Belum ada grup. Buat grup pertama di atas!</p>`}
  </div>`;
  renderPanelKanan();
}
async function kirimGPost(gid){
  const body = ($("inGPost").value || "").trim();
  if (!body) return;
  if (mode === "local") { const d = dbLokal(); d.gposts.push({ id: uidBaru(), group_id: gid, user_id: me.id, body, created_at: sekarang() }); simpanLokal(d); }
  else await sb.from("humba_group_posts").insert({ group_id: gid, user_id: me.id, body });
  tampil("grup");
}

/* ---------- Catatan (Notes) ---------- */
async function ambilCatatan(){
  if (mode === "local") return dbLokal().notes.filter((n) => n.user_id === me.id).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const { data } = await sb.from("humba_notes").select("*").eq("user_id", me.id).order("updated_at", { ascending: false });
  return data || [];
}
async function simpanCatatanUI(){
  const judul = ($("inJudulCatatan").value || "").trim();
  const isi = ($("inIsiCatatan").value || "").trim();
  const publik = $("inPublikCatatan").checked;
  if (!judul && !isi) { alert("Isi dulu judul atau isi catatannya."); return; }
  if (mode === "local") {
    const d = dbLokal();
    if (catatanBuka) { const n = d.notes.find((x) => x.id === catatanBuka); if (n) { n.title = judul; n.body = isi; n.is_public = publik; n.updated_at = sekarang(); } }
    else d.notes.push({ id: uidBaru(), user_id: me.id, title: judul, body: isi, is_public: publik, created_at: sekarang(), updated_at: sekarang() });
    simpanLokal(d);
  } else {
    if (catatanBuka) await sb.from("humba_notes").update({ title: judul, body: isi, is_public: publik, updated_at: sekarang() }).eq("id", catatanBuka);
    else await sb.from("humba_notes").insert({ user_id: me.id, title: judul, body: isi, is_public: publik });
  }
  catatanBuka = null; tampil("catatan");
}
async function hapusCatatanUI(id){
  if (!confirm("Hapus catatan ini?")) return;
  if (mode === "local") { const d = dbLokal(); d.notes = d.notes.filter((n) => n.id !== id); simpanLokal(d); }
  else await sb.from("humba_notes").delete().eq("id", id);
  tampil("catatan");
}
async function renderCatatan(t){
  const daftar = await ambilCatatan();
  const buka = catatanBuka ? daftar.find((n) => n.id === catatanBuka) : null;
  t.innerHTML = `
  <div class="kartu"><h2>${buka ? "Ubah Catatan" : "Catatan Baru"}</h2>
    <div class="field"><label>Judul</label><input id="inJudulCatatan" value="${buka ? esc(buka.title) : ""}" placeholder="Judul catatan…"></div>
    <div class="field"><label>Isi</label><textarea class="editor-catatan" id="inIsiCatatan" placeholder="Tulis catatanmu di sini…">${buka ? esc(buka.body) : ""}</textarea></div>
    <label class="kecil"><input type="checkbox" id="inPublikCatatan" ${buka && buka.is_public ? "checked" : ""}> Publikasikan (bisa dibaca semua pengguna)</label>
    <div style="margin-top:12px;display:flex;gap:8px"><button class="tombol" onclick="simpanCatatanUI()">Simpan Catatan</button>${buka ? `<button class="tombol abu" onclick="catatanBuka=null;tampil('catatan')">Batal</button>` : ""}</div>
  </div>
  <div class="kartu"><h2>Catatan Saya (${daftar.length})</h2>
    ${daftar.map((n) => `<div class="item-pengguna"><span class="avatar" style="background:linear-gradient(135deg,#ff5b6e,#ff2442)">${ikonCatatan()}</span><div class="info"><div class="judul-catatan">${esc(n.title || "(tanpa judul)")} ${n.is_public ? `<span class="chip">Publik</span>` : `<span class="chip">Pribadi</span>`}</div><div class="sub">${esc((n.body || "").slice(0, 120))}${(n.body || "").length > 120 ? "…" : ""}</div><div class="muted">${waktuRelatif(n.updated_at)}</div></div><button class="tombol kecil" onclick="catatanBuka='${n.id}';tampil('catatan')">Buka</button> <button class="tombol kecil abu" onclick="hapusCatatanUI('${n.id}')">Hapus</button></div>`).join("") || `<p class="muted">Belum ada catatan. Tulis catatan pertamamu di atas!</p>`}
  </div>`;
  renderPanelKanan();
}

/* ---------- Pesan pribadi ---------- */
async function daftarPercakapan(){
  let semuaPesan = [];
  if (mode === "local") semuaPesan = dbLokal().messages.filter((m) => m.sender_id === me.id || m.recipient_id === me.id);
  else { const { data } = await sb.from("humba_messages").select("*").or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`).order("created_at", { ascending: false }).limit(200); semuaPesan = data || []; }
  const peta = new Map();
  for (const m of semuaPesan) {
    const lain = m.sender_id === me.id ? m.recipient_id : m.sender_id;
    if (!peta.has(lain) || new Date(m.created_at) > new Date(peta.get(lain).created_at)) peta.set(lain, m);
  }
  return [...peta.entries()].sort((a, b) => new Date(b[1].created_at) - new Date(a[1].created_at));
}
async function ambilRiwayat(lainId){
  if (mode === "local") return dbLokal().messages.filter((m) => (m.sender_id === me.id && m.recipient_id === lainId) || (m.sender_id === lainId && m.recipient_id === me.id)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(-100);
  const { data } = await sb.from("humba_messages").select("*").or(`and(sender_id.eq.${me.id},recipient_id.eq.${lainId}),and(sender_id.eq.${lainId},recipient_id.eq.${me.id})`).order("created_at").limit(100);
  return data || [];
}
async function tandaiDibaca(lainId){
  if (mode === "local") { const d = dbLokal(); d.messages.forEach((m) => { if (m.sender_id === lainId && m.recipient_id === me.id && !m.read_at) m.read_at = sekarang(); }); simpanLokal(d); }
  else await sb.from("humba_messages").update({ read_at: sekarang() }).eq("sender_id", lainId).eq("recipient_id", me.id).is("read_at", null);
}
async function kirimPesanUI(){
  const teks = ($("inPesan").value || "").trim();
  if (!teks || !chatDengan) return;
  if (mode === "local") { const d = dbLokal(); d.messages.push({ id: uidBaru(), sender_id: me.id, recipient_id: chatDengan, body: teks, created_at: sekarang(), read_at: null }); simpanLokal(d); }
  else await sb.from("humba_messages").insert({ sender_id: me.id, recipient_id: chatDengan, body: teks });
  $("inPesan").value = ""; tampil("pesan");
}
async function bukaChat(id){ chatDengan = id; tampil("pesan"); }
/* ---------- Baru: penyimpanan lokal fitur RedNote ---------- */
function muatJSON(kunci, awal){ try { const v = JSON.parse(localStorage.getItem(kunci) || "null"); return v ?? awal; } catch(e){ return awal; } }
function simpanJSON(kunci, nilai){ try { localStorage.setItem(kunci, JSON.stringify(nilai)); } catch(e){} }
/* Kunci data per akun: supaya draft/simpan/riwayat/keranjang/wishlist/
   pesanan tidak tercampur saat ganti akun di HP yang sama. Data lama
   di kunci tanpa akhiran id dipindahkan otomatis saat pertama dibaca. */
function kunciAkun(nama){ return (me && me.id) ? "ch." + nama + "." + me.id : "ch." + nama; }
function bacaAkun(nama, awal){ const k = kunciAkun(nama); try { const v = JSON.parse(localStorage.getItem(k) || "null"); if (v !== null && v !== undefined) return v; if (k !== "ch." + nama) { const lama = JSON.parse(localStorage.getItem("ch." + nama) || "null"); if (lama !== null && lama !== undefined) { try { localStorage.setItem(k, JSON.stringify(lama)); localStorage.removeItem("ch." + nama); } catch(e){} return lama; } } return awal; } catch(e){ return awal; } }
function tulisAkun(nama, nilai){ try { localStorage.setItem(kunciAkun(nama), JSON.stringify(nilai)); } catch(e){} }
function muatDraft(){ const k = kunciAkun("draft"); try { let v = localStorage.getItem(k); if (v === null && k !== "ch.draft") { v = localStorage.getItem("ch.draft"); if (v !== null) { try { localStorage.setItem(k, v); localStorage.removeItem("ch.draft"); } catch(e){} } } if (!v) return ""; try { return JSON.parse(v); } catch(e){ return v; } } catch(e){ return ""; } }
const muatSimpan = () => bacaAkun("simpan", []);
function toggleSimpan(id){
  const a = muatSimpan(); const i = a.indexOf(id);
  if (i >= 0) a.splice(i, 1); else a.push(id);
  tulisAkun("simpan", a); tampil(view);
}
const sudahSimpan = (id) => muatSimpan().includes(id);
function catatRiwayat(id){
  let r = bacaAkun("riwayat", []);
  r = r.filter((x) => x.id !== id);
  r.unshift({ id, waktu: sekarang() });
  tulisAkun("riwayat", r.slice(0, 50));
}
const muatKeranjang = () => bacaAkun("keranjang", []);
const muatWishlist = () => bacaAkun("wishlist", []);
const muatPesanan = () => bacaAkun("pesanan", []);
const formatRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const WARNA_KARTU = ["linear-gradient(135deg,#ff9a7a,#ff2442)","linear-gradient(135deg,#ffb03a,#ff7a1a)","linear-gradient(135deg,#37c978,#1d9e6c)","linear-gradient(135deg,#5aa9ff,#7a5cff)","linear-gradient(135deg,#ff7ab8,#b04dff)","linear-gradient(135deg,#2bb3a3,#1d7a9e)","linear-gradient(135deg,#ff6b6b,#c92a2a)"];
const warnaKartu = (id) => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return WARNA_KARTU[h % WARNA_KARTU.length]; };
const KAT_PRODUK = ["Semua", "Kuliner", "Fashion", "Elektronik", "Rumah", "Jasa", "Lainnya"];
function normalisasiWA(wa){
  let d = String(wa || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return d;
}
function linkWA(wa, teks){ return "https://wa.me/" + normalisasiWA(wa) + "?text=" + encodeURIComponent(teks || "Halo!"); }

/* ---------- Toko: data produk ---------- */
let tokoBelumAktif = false;
async function ambilProduk(){
  if (mode === "local") return dbLokal().produk.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const { data, error } = await sb.from("humba_produk").select("*").order("created_at", { ascending: false });
  if (error) {
    const m = String((error.message || "") + " " + (error.code || ""));
    if (/does not exist|Could not find the table|PGRST205|42P01/i.test(m)) { tokoBelumAktif = true; return []; }
    throw error;
  }
  return data || [];
}
async function pasangProduk(d){
  if (mode === "local") { const db = dbLokal(); db.produk.push({ id: uidBaru(), seller_id: me.id, ...d, created_at: sekarang() }); simpanLokal(db); return null; }
  const { error } = await sb.from("humba_produk").insert({ seller_id: me.id, ...d });
  if (error) {
    const m = String(error.message || "");
    if (/does not exist|Could not find the table|PGRST205|42P01/i.test(m)) { tokoBelumAktif = true; return "TABEL_BELUM_ADA"; }
    return error.message;
  }
  return null;
}
async function produkDariId(id){ const semua = await ambilProduk(); return semua.find((x) => x.id === id) || null; }
async function hubungiWA(id){
  const produk = await produkDariId(id);
  if (!produk) return;
  const ps = muatPesanan();
  ps.unshift({ produk_id: produk.id, nama: produk.nama, harga: produk.harga, seller_id: produk.seller_id, waktu: sekarang() });
  tulisAkun("pesanan", ps.slice(0, 100));
}
function tambahKeranjangUI(id){
  const k = muatKeranjang();
  if (!k.includes(id)) k.push(id);
  tulisAkun("keranjang", k);
  alert("Barang masuk keranjang.");
}
function hapusKeranjangUI(id){ tulisAkun("keranjang", muatKeranjang().filter((x) => x !== id)); tampil("keranjang"); }
function toggleWishlistUI(id){
  const w = muatWishlist(); const i = w.indexOf(id);
  if (i >= 0) w.splice(i, 1); else w.push(id);
  tulisAkun("wishlist", w); tampil(view);
}

/* ---------- Statistik dari data asli ---------- */
async function dataSaya(){
  const semuaPost = await ambilPostingan(null);
  const saya = semuaPost.filter((p) => p.user_id === me.id);
  let sukaDiterima = 0, komenDiterima = 0, suka7 = 0, komen7 = 0;
  const batas7 = Date.now() - 7 * 86400000;
  for (const p of saya) {
    const s = await hitungSuka(p.id); sukaDiterima += s.length;
    const k = await ambilKomentar(p.id); komenDiterima += k.length;
    if (new Date(p.created_at).getTime() >= batas7) { suka7 += s.length; komen7 += k.length; }
  }
  const teman = await daftarTeman();
  const diterima = teman.filter((f) => f.status === "accepted");
  const pengikut7 = diterima.filter((f) => new Date(f.created_at).getTime() >= batas7).length;
  const masuk = teman.filter((f) => f.addressee_id === me.id && f.status === "pending");
  let sebut = 0;
  for (const p of semuaPost) {
    const k = await ambilKomentar(p.id);
    sebut += k.filter((c) => String(c.body || "").toLowerCase().includes("@" + me.username.toLowerCase())).length;
  }
  return { saya, sukaDiterima, komenDiterima, suka7, komen7, diterima, pengikut7, masuk, sebut, semuaPost };
}
async function postIdDisukai(){
  if (mode === "local") return dbLokal().likes.filter((l) => l.user_id === me.id).map((l) => l.post_id);
  const { data } = await sb.from("humba_likes").select("post_id").eq("user_id", me.id);
  return (data || []).map((x) => x.post_id);
}

/* ---------- Drawer & lembar + ---------- */
function bukaDrawer(e){
  if (e) e.preventDefault();
  $("drawerKepala").innerHTML = `<div class="baris-tengah">${avatarHtml(me, "besar")}<div><div class="nama">${esc(me.display_name)}</div><div class="muted">@${esc(me.username)}</div></div></div>`;
  $("drawerOverlay").style.display = "block"; $("drawer").style.display = "block";
}
function tutupDrawer(){ const o = $("drawerOverlay"), d = $("drawer"); if (o) o.style.display = "none"; if (d) d.style.display = "none"; }
function bukaLembarPlus(){ $("sheetPlus").style.display = "block"; }
function tutupLembarPlus(){ $("sheetPlus").style.display = "none"; }
function pilihTeks(){ tutupLembarPlus(); tabBeranda = "jelajah"; tampil("beranda").then(() => { const el = $("inStatus"); if (el) el.focus(); }); }
function pilihAlbum(){ tutupLembarPlus(); const el = $("inFotoStatus"); if (el) el.click(); }
function pilihAlbumVideo(){ tutupLembarPlus(); const el = $("inVideoStatus"); if (el) el.click(); }
function pilihKamera(){ tutupLembarPlus(); const el = $("inKameraFoto"); if (el) el.click(); }
function pilihKameraVideo(){ tutupLembarPlus(); const el = $("inKameraVideo"); if (el) el.click(); }
function pilihJualan(){ tutupLembarPlus(); tampil("jual"); }

/* ---------- Toko (Market) ---------- */
let tokoKat = "Semua", tokoCari = "";
function setTokoKat(k){ tokoKat = k; tampil("toko"); }
function cariToko(){ const el = $("inCariToko"); tokoCari = el ? el.value : ""; tampil("toko"); }
function kartuProdukHTML(x, penjual){
  return `<article class="kartu-mini" onclick="bukaProduk('${x.id}')">
    <div class="mini-gambar" style="background:${warnaKartu(x.id)}"><span class="mini-teks">${esc((x.nama || "").slice(0, 40))}</span></div>
    <div class="mini-isi"><div class="produk-nama">${esc(x.nama)}</div>
    <div class="produk-harga">${formatRp(x.harga)}</div>
    <div class="produk-sub">${esc(penjual ? penjual.display_name : "Penjual")} · ${esc(x.lokasi || "-")}</div></div></article>`;
}
async function renderToko(t){
  let produk = [], errToko = null;
  try { produk = await ambilProduk(); } catch(e){ errToko = e; }
  const semua = {}; (await semuaProfil()).forEach((p) => semua[p.id] = p);
  let daftar = produk;
  if (tokoKat !== "Semua") daftar = daftar.filter((x) => (x.kategori || "Lainnya") === tokoKat);
  if (tokoCari) { const q = tokoCari.toLowerCase(); daftar = daftar.filter((x) => (x.nama || "").toLowerCase().includes(q) || (x.lokasi || "").toLowerCase().includes(q)); }
  let html = `<div class="kartu">
    <div class="komen-form" style="margin-top:0"><input id="inCariToko" placeholder="Cari barang…" value="${esc(tokoCari)}" onkeydown="if(event.key==='Enter')cariToko()"><button onclick="cariToko()">Cari</button></div>
    <div class="chip-baris">${KAT_PRODUK.map((k) => `<button class="chip-kanal ${tokoKat === k ? "aktif" : ""}" onclick="setTokoKat('${k}')">${k}</button>`).join("")}</div>
    <div class="pintasan"><button onclick="tampil('pesanan')">📦 Pesanan</button><button onclick="tampil('keranjang')">🛒 Keranjang</button><button onclick="tampil('riwayat')">🕘 Riwayat</button></div>
  </div>`;
  if (tokoBelumAktif) html += `<div class="kartu"><div class="pesan-info kuning">Toko belum aktif di cloud: jalankan <b>supabase/migrasi-toko.sql</b> di SQL Editor Supabase untuk mengaktifkan Toko.</div></div>`;
  if (errToko) html += `<div class="kartu"><div class="pesan-info merah">Gagal memuat Toko: ${esc(errToko.message || errToko)}</div></div>`;
  if (daftar.length) html += `<div class="grid2">${daftar.map((x) => kartuProdukHTML(x, semua[x.seller_id])).join("")}</div>`;
  else if (!errToko && !tokoBelumAktif) html += `<div class="kartu tengah"><b>Belum ada barang${tokoKat !== "Semua" ? " di kategori " + esc(tokoKat) : ""}.</b><br><span class="muted">Jadilah yang pertama memasang barang!</span></div>`;
  html += `<div style="text-align:center;margin:6px 0 10px"><button class="tombol" onclick="tampil('jual')">+ Pasang Barang</button></div>`;
  t.innerHTML = html;
  renderPanelKanan();
}
function renderJual(t){
  t.innerHTML = `<div class="kartu"><h2>Pasang Barang</h2>
    <p class="muted" style="margin-bottom:10px">Barangmu tampil di Toko HUMBA. Pembeli menghubungimu lewat WhatsApp atau chat HUMBA — tidak ada pembayaran di dalam aplikasi.</p>
    <div class="field"><label>Nama barang</label><input id="inNamaProduk" maxlength="200" placeholder="contoh: Kopi Sumba 1 kg"></div>
    <div class="field"><label>Harga (Rp, angka saja)</label><input id="inHargaProduk" type="number" min="0" placeholder="contoh: 50000"></div>
    <div class="field"><label>Kategori</label><select id="inKatProduk">${KAT_PRODUK.slice(1).map((k) => `<option>${k}</option>`).join("")}</select></div>
    <div class="field"><label>Keterangan</label><textarea id="inKetProduk" maxlength="2000" placeholder="Kondisi barang, berat, dll…"></textarea></div>
    <div class="field"><label>Lokasi</label><input id="inLokasiProduk" maxlength="100" placeholder="contoh: Waingapu"></div>
    <div class="field"><label>No. WA penjual (aktif)</label><input id="inWAProduk" maxlength="20" placeholder="contoh: 081234567890"></div>
    <button class="tombol" onclick="simpanProdukUI()">Pasang di Toko</button>
    <button class="tombol abu" style="margin-left:8px" onclick="tampil('toko')">Batal</button>
  </div>`;
}
async function simpanProdukUI(){
  const nama = ($("inNamaProduk").value || "").trim();
  const harga = parseInt(($("inHargaProduk").value || "").replace(/\D/g, ""), 10);
  const kategori = $("inKatProduk").value || "Lainnya";
  const keterangan = ($("inKetProduk").value || "").trim();
  const lokasi = ($("inLokasiProduk").value || "").trim();
  const wa = ($("inWAProduk").value || "").trim();
  if (nama.length < 2) { alert("Nama barang minimal 2 karakter."); return; }
  if (!harga || harga <= 0) { alert("Harga harus angka lebih dari 0."); return; }
  if (!wa) { alert("Isi nomor WA supaya pembeli bisa menghubungimu."); return; }
  if (!/^[0-9+ -]+$/.test(wa)) { alert("No. WA hanya boleh angka, +, spasi, dan -."); return; }
  const err = await pasangProduk({ nama, harga, kategori, keterangan, lokasi, wa });
  if (err === "TABEL_BELUM_ADA") { alert("Toko belum aktif di cloud. Jalankan supabase/migrasi-toko.sql di SQL Editor Supabase untuk mengaktifkan Toko."); return; }
  if (err) { alert("Gagal memasang barang: " + err); return; }
  tampil("toko");
}
async function bukaProduk(id){
  const x = await produkDariId(id);
  const isi = $("isiProduk");
  if (!x) { isi.innerHTML = `<h3>Barang tidak ditemukan</h3><button class="batal" onclick="tutupProduk()">Tutup</button>`; $("overlayProduk").style.display = "block"; return; }
  const penjual = await profilDariId(x.seller_id) || { display_name: "Penjual", username: "?" };
  const diWishlist = muatWishlist().includes(x.id);
  isi.innerHTML = `<div class="isi-sheet">
    <div class="mini-gambar" style="background:${warnaKartu(x.id)};border-radius:12px"><span class="mini-teks">${esc(x.nama)}</span></div>
    <h3 style="margin-top:10px">${esc(x.nama)}</h3>
    <div class="produk-harga" style="font-size:18px">${formatRp(x.harga)}</div>
    <p style="margin-top:8px;white-space:pre-wrap;word-break:break-word">${esc(x.keterangan || "Tidak ada keterangan.")}</p>
    <p class="muted" style="margin-top:8px">Penjual: <b>${esc(penjual.display_name)}</b> (@${esc(penjual.username)}) · ${esc(x.lokasi || "-")} · ${esc(x.kategori || "Lainnya")}</p>
    <p class="muted">Dipajang ${waktuRelatif(x.created_at)}</p>
    <button class="tombol hijau tombol-penuh" style="margin-top:10px" onclick="tutupProduk();bukaChat('${x.seller_id}')">Chat di HUMBA</button>
    <button class="tombol abu tombol-penuh" style="margin-top:8px" onclick="konfirmasiWA('${x.id}')">Hubungi via WA</button>
    <button class="tombol abu tombol-penuh" style="margin-top:8px" onclick="tambahKeranjangUI('${x.id}')">+ Keranjang</button>
    <button class="tombol abu tombol-penuh" style="margin-top:8px" onclick="toggleWishlistUI('${x.id}')">${diWishlist ? "★ Hapus dari Wishlist" : "☆ Simpan ke Wishlist"}</button>
    <button class="batal" onclick="tutupProduk()">Tutup</button>
  </div>`;
  $("overlayProduk").style.display = "block";
}
function tutupProduk(){ $("overlayProduk").style.display = "none"; }
/* WA di Toko jadi pilihan kedua: nomor penjual baru tampil setelah
   pembeli menekan tombol WA dan mengonfirmasi di modal ini, supaya
   nomor tidak mudah diambil massal dari halaman barang. */
let waProdukId = null;
async function konfirmasiWA(id){
  const x = await produkDariId(id);
  if (!x) return;
  const penjual = await profilDariId(x.seller_id) || { display_name: "Penjual" };
  waProdukId = x.id;
  $("waNomorTeks").textContent = penjual.display_name + " · " + x.wa;
  $("waBukaLink").href = linkWA(x.wa, "Halo " + penjual.display_name + ", saya mau tanya barang " + x.nama + " (" + formatRp(x.harga) + ") di HUMBA.");
  $("overlayWA").style.display = "block";
}
function tutupWA(){ $("overlayWA").style.display = "none"; }

/* ---------- Pesan (baru: 3 kartu atas + chat + rekomendasi) ---------- */
async function renderPesan(t){
  const st = await dataSaya();
  const simpanSaya = muatSimpan().filter((id) => st.saya.some((p) => p.id === id)).length;
  const temanIds = await temanDiterima();
  const semua = {}; (await semuaProfil()).forEach((p) => semua[p.id] = p);
  const percakapan = await daftarPercakapan();
  let html = `<div class="kartu"><h2>Pesan</h2>
    <div class="baris-angka">
      <div class="kartu-angka"><b>${st.sukaDiterima}</b><span>♥ Suka diterima</span><br><span>💾 Disimpan (HP ini): ${simpanSaya}</span></div>
      <div class="kartu-angka"><b>${st.diterima.length}</b><span>Teman</span><br><span>⏳ Minta berteman: ${st.masuk.length}</span></div>
      <div class="kartu-angka"><b>${st.komenDiterima}</b><span>💬 Komentar diterima</span><br><span>@ Menyebutku: ${st.sebut}</span></div>
    </div>
  </div>`;
  if (chatDengan) {
    const lawan = semua[chatDengan] || { display_name: "?", username: "?", avatar_color: "#888" };
    const riwayat = await ambilRiwayat(chatDengan);
    await tandaiDibaca(chatDengan); hitungBelumDibaca();
    html += `<div class="kartu"><button class="tombol kecil abu" onclick="chatDengan=null;tampil('pesan')">← Semua Pesan</button>
      <div class="baris-tengah" style="margin-top:10px">${avatarHtml(lawan)}<div><div class="nama">${esc(lawan.display_name)}</div><div class="muted">@${esc(lawan.username)}</div></div>
      <span style="margin-left:auto"><button class="tombol kecil" onclick="pokeDariPanel('${lawan.id}')">Poke</button></span></div>
    </div>
    <div class="kartu"><div class="chat-wrap"><div class="chat-area" id="areaChat">
      ${riwayat.length ? riwayat.map((m) => `<div class="gelembung ${m.sender_id === me.id ? "kirim" : "terima"}">${esc(m.body)}<div class="waktu">${jamSingkat(m.created_at)}</div></div>`).join("") : `<p class="muted tengah">Belum ada pesan. Sapa ${esc(lawan.display_name)}!</p>`}
    </div>
    <div class="chat-input"><input id="inPesan" placeholder="Tulis pesan…" maxlength="2000" onkeydown="if(event.key==='Enter')kirimPesanUI()"><button class="tombol" onclick="kirimPesanUI()">Kirim</button></div></div></div>`;
    t.innerHTML = html;
    const area = $("areaChat"); if (area) area.scrollTop = area.scrollHeight;
    const inp = $("inPesan"); if (inp) inp.focus();
    renderPanelKanan(); return;
  }
  html += `<div class="kartu"><h2>Percakapan</h2>
    ${percakapan.length ? percakapan.map(([lainId, m]) => { const p = semua[lainId]; if (!p) return ""; return `<div class="item-pengguna daftar-grup" onclick="bukaChat('${lainId}')">${avatarHtml(p)}<div class="info"><div class="nama">${esc(p.display_name)}</div><div class="sub">${m.sender_id === me.id ? "Kamu: " : ""}${esc((m.body || "").slice(0, 80))}</div></div><span class="muted">${waktuRelatif(m.created_at)}</span></div>`; }).join("") : `<p class="muted">Belum ada percakapan.</p>`}
  </div>
  <div class="kartu"><h2>Mulai Chat dengan Teman</h2>
    ${temanIds.length ? temanIds.map((id) => { const p = semua[id]; return p ? `<div class="item-pengguna">${avatarHtml(p)}<div class="info"><div class="nama">${esc(p.display_name)}</div><div class="sub">@${esc(p.username)}</div></div><button class="tombol kecil" onclick="bukaChat('${p.id}')">Chat</button></div>` : ""; }).join("") : `<p class="muted">Belum ada teman. Tambah teman dulu di menu Teman.</p>`}
  </div>`;
  html += await blokRekomendasi();
  t.innerHTML = html;
  renderPanelKanan();
}

/* ---------- Saya (Me) ---------- */
let tabSaya = "catatan", cariSayaQ = "", cariSayaBuka = false;
function setTabSaya(tab){ tabSaya = tab; tampil("saya"); }
function toggleCariSaya(){ cariSayaBuka = !cariSayaBuka; tampil("saya"); }
async function renderSaya(t){
  const st = await dataSaya();
  const simpan = muatSimpan();
  const disukai = await postIdDisukai();
  const semuaPost = st.semuaPost;
  let daftar = [];
  if (tabSaya === "catatan") daftar = st.saya;
  else if (tabSaya === "suka") daftar = semuaPost.filter((p) => disukai.includes(p.id));
  else daftar = semuaPost.filter((p) => simpan.includes(p.id));
  if (cariSayaQ) { const q = cariSayaQ.toLowerCase(); daftar = daftar.filter((p) => (p.body || "").toLowerCase().includes(q)); }
  const kosong = {
    catatan: "Kamu belum menulis status. Tulis status pertamamu dari Beranda!",
    suka: "Kamu belum menyukai catatan apa pun.",
    disimpan: "Kamu belum menyimpan catatan apa pun."
  }[tabSaya];
  let html = `<div class="kartu">
    <div class="sampul ${me.cover_url ? "" : "kosong"}" ${me.cover_url ? `style="background-image:url('${urlCss(me.cover_url)}')"` : ""} onclick="pilihFoto('sampul')">${me.cover_url ? `<button class="ganti-sampul" onclick="event.stopPropagation();pilihFoto('sampul')">📷 Ganti Sampul</button>` : `<span>📷 Ketuk untuk pasang foto sampul</span>`}</div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:12px">
      <button class="tombol kecil abu" onclick="bukaDrawer(event)">☰ Menu</button>
      <button class="tombol kecil" onclick="tampil('profil')">Edit Profil</button>
    </div>
    <div style="text-align:center;margin-top:6px"><span class="foto-profil-wrap" onclick="pilihFoto('profil')" title="Ketuk untuk ganti foto profil">${avatarHtml(me, "besar")}<span class="lencana-kamera">📷</span></span>
      <h2 style="margin-top:8px">${esc(me.display_name)}</h2>
      <div class="muted">@${esc(me.username)} · Indonesia</div>
      <div class="stat-baris" style="justify-content:center"><div><b>${st.diterima.length}</b>Mengikuti</div><div><b>${st.diterima.length}</b>Pengikut</div><div><b>${st.sukaDiterima}</b>Suka &amp; Simpan</div></div>
      <div style="margin-top:8px">${me.bio ? esc(me.bio) : "<span class='muted'>Belum ada bio.</span>"}</div>
    </div>
    <div class="baris-angka" style="margin-top:14px">
      <div class="kartu-angka" style="cursor:pointer" onclick="tampil('riwayat')"><b>🕘</b><span>Riwayat</span></div>
      <div class="kartu-angka" style="cursor:pointer" onclick="tampil('dompet')"><b>👛</b><span>Dompet</span></div>
      <div class="kartu-angka" style="cursor:pointer" onclick="tampil('creator')"><b>📊</b><span>Statistik</span></div>
    </div>
    <div class="tab-saya">
      <button class="${tabSaya === "catatan" ? "aktif" : ""}" onclick="setTabSaya('catatan')">Catatan</button>
      <button class="${tabSaya === "suka" ? "aktif" : ""}" onclick="setTabSaya('suka')">Suka</button>
      <button class="${tabSaya === "disimpan" ? "aktif" : ""}" onclick="setTabSaya('disimpan')">Disimpan</button>
      <button style="flex:0 0 44px" onclick="toggleCariSaya()">🔍</button>
    </div>
    ${cariSayaBuka ? `<div class="komen-form"><input id="inCariSaya" placeholder="Cari catatan, suka, dan simpananku…" value="${esc(cariSayaQ)}" onkeydown="if(event.key==='Enter')cariSaya()"><button onclick="cariSaya()">Cari</button><button onclick="cariSayaQ='';cariSayaBuka=false;tampil('saya')">Batal</button></div>` : ""}
  </div>`;
  if (!daftar.length) html += `<div class="kartu tengah"><b>${esc(kosong)}</b></div>`;
  else html += await gridStatusHTML(daftar);
  t.innerHTML = html;
  renderPanelKanan();
}
function cariSaya(){ const el = $("inCariSaya"); cariSayaQ = el ? el.value : ""; tampil("saya"); }

/* ---------- Tambah Teman (Add friends) ---------- */
let cariTambahQ = "";
async function renderTambahTeman(t){
  const semua = await semuaProfil();
  let hasil = [];
  if (cariTambahQ) { const q = cariTambahQ.toLowerCase(); hasil = semua.filter((p) => p.id !== me.id && (p.username.includes(q) || p.display_name.toLowerCase().includes(q))); }
  t.innerHTML = `<div class="kartu tengah">
    <div style="margin:8px 0">${avatarHtml(me, "besar")}</div>
    <h2>${esc(me.display_name)}</h2>
    <div class="muted">ID: @${esc(me.username)}</div>
    <p class="muted" style="margin-top:8px">Bagikan ID ini ke teman supaya mereka bisa menemukanmu di HUMBA.</p>
  </div>
  <div class="kartu">
    <button class="menu-baris" onclick="alert('ID kamu: @${esc(me.username)} — salin dan kirim ke temanmu.')">🔍 Pindai / Tampilkan ID-ku <span class="panah">›</span></button>
    <a class="menu-baris" href="https://wa.me/?text=${encodeURIComponent("Gabung HUMBA bareng aku! Cari aku dengan ID @" + me.username + " di https://tulus-kn.github.io/humba/")}" target="_blank" rel="noopener">💬 Bagikan ke WhatsApp <span class="panah">›</span></a>
  </div>
  <div class="kartu"><h2>Cari Pengguna HUMBA</h2>
    <div class="komen-form" style="margin-top:0"><input id="inCariTambah" placeholder="Cari username atau nama…" value="${esc(cariTambahQ)}" onkeydown="if(event.key==='Enter')cariTambah()"><button onclick="cariTambah()">Cari</button></div>
    ${cariTambahQ ? (hasil.length ? hasil.map((p) => `<div class="item-pengguna">${avatarHtml(p)}<div class="info"><div class="nama">${esc(p.display_name)}</div><div class="sub">@${esc(p.username)}</div></div><button class="tombol kecil" onclick="tambahTemanUI('${p.id}')">+ Teman</button></div>`).join("") : `<p class="muted">Tidak ditemukan.</p>`) : `<p class="muted">Ketik nama atau username di atas.</p>`}
  </div>`;
}
function cariTambah(){ const el = $("inCariTambah"); cariTambahQ = el ? el.value : ""; tampil("tambah-teman"); }

/* ---------- Creator Center / Statistik ---------- */
let tabCreator = "percikan";
async function renderCreator(t){
  const st = await dataSaya();
  const terbaru = st.saya[0];
  let sukaTerbaru = 0, komenTerbaru = 0;
  if (terbaru) { sukaTerbaru = (await hitungSuka(terbaru.id)).length; komenTerbaru = (await ambilKomentar(terbaru.id)).length; }
  t.innerHTML = `<div class="kartu"><h2>Creator Center</h2>
    <p class="muted">Angka di bawah ini dihitung dari data asli HUMBA (7 hari terakhir). HUMBA tidak menghitung views — hanya suka, komentar, dan pengikut yang benar-benar ada.</p>
    <h4>7 Hari Terakhir</h4>
    <div class="baris-angka">
      <div class="kartu-angka"><b>${st.suka7}</b><span>Suka diterima</span></div>
      <div class="kartu-angka"><b>${st.komen7}</b><span>Komentar diterima</span></div>
      <div class="kartu-angka"><b>${st.pengikut7}</b><span>Pengikut baru</span></div>
    </div>
    <h4>Catatan Terbaru</h4>
    ${terbaru ? `<div class="komentar" style="margin-top:4px"><div class="teks">${esc((terbaru.body || "").slice(0, 200))}</div><div class="muted" style="margin-top:6px">♥ ${sukaTerbaru} suka · 💬 ${komenTerbaru} komentar · ${waktuRelatif(terbaru.created_at)}</div></div>` : `<p class="muted">Kamu belum menulis status.</p>`}
    <h4>Pusat</h4>
    <div class="pintasan">
      <button onclick="tabBeranda='terdekat';kanalTerdekat='Acara';tampil('beranda')">🎉 Pusat Acara</button>
      <button onclick="alert('Pusat Pertumbuhan segera hadir di HUMBA.')">🌱 Pusat Pertumbuhan</button>
      <button onclick="alert('Pusat Live segera hadir di HUMBA.')">📺 Pusat Live</button>
      <button onclick="tampil('jual')">🛍️ Pusat Kreasi (Jualan)</button>
    </div>
    <div class="tab-saya">
      <button class="${tabCreator === "percikan" ? "aktif" : ""}" onclick="tabCreator='percikan';tampil('creator')">Percikan</button>
      <button class="${tabCreator === "belajar" ? "aktif" : ""}" onclick="tabCreator='belajar';tampil('creator')">Belajar</button>
    </div>
    <div class="chip-baris">${["Rekomendasi", "Populer", "Acara"].map((k) => `<span class="chip-kanal">${k}</span>`).join("")}</div>
    ${tabCreator === "percikan" ? `
    <div class="faq"><b>🎉 Festival Budaya Sumba — ide acara</b><p>Bagikan momen festival di daerahmu. Tulis status dengan kata "acara" supaya muncul di kanal Acara.</p><button class="tombol kecil" onclick="pilihTeks()">Posting Sekarang</button></div>
    <div class="faq"><b>🥘 Kuliner Sumba — ide acara</b><p>Ceritakan makanan khas favoritmu. Tulis status dengan kata "kuliner" supaya muncul di kanal Kuliner.</p><button class="tombol kecil" onclick="pilihTeks()">Posting Sekarang</button></div>` : `
    <div class="faq"><b>Cara menambah teman</b><p>Buka menu ☰ → Tambah Teman, cari username, lalu tekan + Teman.</p></div>
    <div class="faq"><b>Cara jualan di Toko</b><p>Buka Toko → Pasang Barang, isi nama, harga, dan nomor WA. Pembeli menghubungimu lewat WhatsApp.</p></div>`}
    <h4>Semua Waktu</h4>
    <div class="baris-angka">
      <div class="kartu-angka"><b>${st.saya.length}</b><span>Postingan</span></div>
      <div class="kartu-angka"><b>${st.sukaDiterima}</b><span>Total suka diterima</span></div>
      <div class="kartu-angka"><b>${st.komenDiterima}</b><span>Total komentar diterima</span></div>
      <div class="kartu-angka"><b>${st.diterima.length}</b><span>Pengikut</span></div>
    </div>
  </div>`;
}

/* ---------- Draft & Riwayat ---------- */
function renderDraft(t){
  const d = muatDraft();
  t.innerHTML = `<div class="kartu"><h2>Draft</h2>
    <p class="muted">Teks status yang belum terkirim tersimpan otomatis saat kamu mengetik di komposer.</p>
    ${d ? `<div class="komentar" style="margin-top:10px"><div class="teks">${esc(d)}</div></div>
    <div style="margin-top:12px;display:flex;gap:8px"><button class="tombol" onclick="lanjutkanDraft()">Lanjutkan</button><button class="tombol abu" onclick="hapusDraft()">Hapus</button></div>`
    : `<p class="muted" style="margin-top:10px">Tidak ada draft. Draft dari status yang batal dikirim tersimpan di sini.</p>`}
  </div>`;
}
function lanjutkanDraft(){ tabBeranda = "jelajah"; tampil("beranda"); }
function hapusDraft(){ try { localStorage.removeItem(kunciAkun("draft")); } catch(e){} tampil("draft"); }
let tabRiwayat = "catatan";
async function renderRiwayat(t){
  const r = bacaAkun("riwayat", []);
  const semuaPost = await ambilPostingan(null);
  const peta = {}; semuaPost.forEach((p) => peta[p.id] = p);
  const daftar = r.map((x) => peta[x.id]).filter(Boolean);
  t.innerHTML = `<div class="kartu"><h2>Riwayat</h2>
    <div class="tab-saya">
      <button class="${tabRiwayat === "catatan" ? "aktif" : ""}" onclick="tabRiwayat='catatan';tampil('riwayat')">Catatan</button>
      <button class="${tabRiwayat === "live" ? "aktif" : ""}" onclick="tabRiwayat='live';tampil('riwayat')">Live</button>
    </div>
    ${tabRiwayat === "live" ? `<p class="muted">Tidak ada riwayat live.</p>` : ""}
  </div>`;
  if (tabRiwayat === "catatan") {
    if (!daftar.length) t.innerHTML += `<div class="kartu tengah"><b>Belum ada riwayat.</b><br><span class="muted">Status yang kamu buka akan muncul di sini (maksimal 50).</span></div>`;
    else t.innerHTML += `<div class="kartu"><h2>Sebulan Terakhir</h2></div>` + await gridStatusHTML(daftar);
  }
}

/* ---------- Pesanan, Keranjang, Dompet ---------- */
let tabPesanan = "semua", cariPesananQ = "";
async function renderPesanan(t){
  const ps = muatPesanan();
  let daftar = ps;
  if (cariPesananQ) { const q = cariPesananQ.toLowerCase(); daftar = daftar.filter((x) => (x.nama || "").toLowerCase().includes(q)); }
  const semua = {}; (await semuaProfil()).forEach((p) => semua[p.id] = p);
  let html = `<div class="kartu"><h2>Pesanan</h2>
    <p class="muted">Pesanan di HUMBA = barang Toko yang pernah kamu hubungi lewat WhatsApp. Tidak ada pembayaran di dalam aplikasi.</p>
    <div class="chip-baris">${["semua", "Menunggu bayar", "Diproses", "Diterima", "Ulasan", "Bantuan"].map((k) => `<button class="chip-kanal ${tabPesanan === k ? "aktif" : ""}" onclick="tabPesanan='${k}';tampil('pesanan')">${k === "semua" ? "Semua" : k}</button>`).join("")}</div>
    <div class="komen-form"><input id="inCariPesanan" placeholder="Cari pesananku…" value="${esc(cariPesananQ)}" onkeydown="if(event.key==='Enter')cariPesanan()"><button onclick="cariPesanan()">Cari</button></div>
  </div>`;
  if (!daftar.length) {
    html += `<div class="kartu tengah"><b>Belum ada pesanan.</b><br><span class="muted">Tidak menemukan pesananmu? Coba ganti akun.</span></div>`;
    const produk = (await ambilProduk()).slice(0, 4);
    if (produk.length) html += `<div class="kartu"><h2>Mungkin Kamu Suka</h2></div><div class="grid2">${produk.map((x) => kartuProdukHTML(x, semua[x.seller_id])).join("")}</div>`;
  } else {
    html += `<div class="kartu">${daftar.map((x) => { const s = semua[x.seller_id]; return `<div class="item-pengguna"><div class="info"><div class="nama">${esc(x.nama)}</div><div class="sub">${formatRp(x.harga)} · Penjual: ${esc(s ? s.display_name : "?")} · ${waktuRelatif(x.waktu)}</div><div class="muted">Status: Dihubungi via WA</div></div><button class="tombol kecil" onclick="bukaProduk('${x.produk_id}')">Lihat</button></div>`; }).join("")}</div>`;
  }
  t.innerHTML = html;
}
function cariPesanan(){ const el = $("inCariPesanan"); cariPesananQ = el ? el.value : ""; tampil("pesanan"); }
let tabKeranjang = "keranjang";
async function renderKeranjang(t){
  const semua = {}; (await semuaProfil()).forEach((p) => semua[p.id] = p);
  const produk = await ambilProduk();
  const peta = {}; produk.forEach((x) => peta[x.id] = x);
  let html = `<div class="kartu"><h2>Keranjang</h2>
    <div class="tab-saya">
      <button class="${tabKeranjang === "keranjang" ? "aktif" : ""}" onclick="tabKeranjang='keranjang';tampil('keranjang')">Keranjang</button>
      <button class="${tabKeranjang === "wishlist" ? "aktif" : ""}" onclick="tabKeranjang='wishlist';tampil('keranjang')">Wishlist</button>
    </div></div>`;
  if (tabKeranjang === "keranjang") {
    const isi = muatKeranjang().map((id) => peta[id]).filter(Boolean);
    const total = isi.reduce((a, x) => a + (Number(x.harga) || 0), 0);
    if (!isi.length) html += `<div class="kartu tengah"><b>Keranjangmu kosong.</b><br><span class="muted">Tambah barang dari Toko sekarang!</span></div>`;
    else html += `<div class="kartu">${isi.map((x) => `<div class="item-pengguna"><div class="info"><div class="nama">${esc(x.nama)}</div><div class="sub">${formatRp(x.harga)} · ${esc(x.lokasi || "-")}</div></div><a class="tombol kecil" href="${linkWA(x.wa, "Halo, saya mau beli " + x.nama + " (" + formatRp(x.harga) + ") di HUMBA.")}" target="_blank" rel="noopener" onclick="hubungiWA('${x.id}')">WA</a> <button class="tombol kecil abu" onclick="hapusKeranjangUI('${x.id}')">Hapus</button></div>`).join("")}</div>
    <div class="kartu"><div class="baris-tengah"><div style="flex:1"><b>Semua — ${formatRp(total)}</b><br><span class="muted">Checkout = hubungi tiap penjual lewat WA (bukan pembayaran).</span></div><button class="tombol" onclick="alert('Checkout HUMBA bukan pembayaran. Hubungi tiap penjual lewat tombol WA di atas untuk memesan.')">Checkout</button></div></div>`;
    const rekomendasi = produk.filter((x) => !muatKeranjang().includes(x.id)).slice(0, 4);
    if (rekomendasi.length) html += `<div class="kartu"><h2>Mungkin Kamu Suka</h2></div><div class="grid2">${rekomendasi.map((x) => kartuProdukHTML(x, semua[x.seller_id])).join("")}</div>`;
  } else {
    const isi = muatWishlist().map((id) => peta[id]).filter(Boolean);
    if (!isi.length) html += `<div class="kartu tengah"><b>Wishlist masih kosong.</b><br><span class="muted">Mulai jelajahi Toko.</span></div>`;
    else html += `<div class="grid2">${isi.map((x) => kartuProdukHTML(x, semua[x.seller_id])).join("")}</div>`;
    const rekomendasi = produk.filter((x) => !muatWishlist().includes(x.id)).slice(0, 4);
    if (rekomendasi.length) html += `<div class="kartu"><h2>Mungkin Kamu Suka</h2></div><div class="grid2">${rekomendasi.map((x) => kartuProdukHTML(x, semua[x.seller_id])).join("")}</div>`;
  }
  t.innerHTML = html;
}
function renderDompet(t){
  t.innerHTML = `<div class="kartu"><h2>Dompet</h2>
    <div class="dompet-merah"><div>Total Aset</div><div class="total">Rp 0</div><div style="font-size:12px;opacity:.85">HUMBA bukan dompet pembayaran sungguhan — semua angka di sini 0 dan tidak ada saldo.</div></div>
    <button class="menu-baris" onclick="alert('Dompet pribadi: Rp 0. HUMBA tidak menyimpan uang.')">👛 Dompet Pribadi <span class="panah">Rp 0 ›</span></button>
    <button class="menu-baris" onclick="alert('Dompet usaha: Rp 0. Penjualan Toko dibayar langsung pembeli ke penjual lewat WA, di luar aplikasi.')">🏪 Dompet Usaha <span class="panah">Rp 0 ›</span></button>
    <button class="menu-baris" onclick="alert('Koin: 0 · Kupon: 0 · Amplop belanja: 0. Belum ada program hadiah di HUMBA.')">🎁 Koin, Kupon &amp; Amplop <span class="panah">0 ›</span></button>
  </div>`;
}

/* ---------- Panduan, Bantuan, Pengaturan, Tentang ---------- */
function renderPanduan(t){
  t.innerHTML = `<div class="kartu"><h2>Panduan Komunitas HUMBA</h2>
    <p style="margin-bottom:10px">Membangun komunitas Sumba yang aman &amp; asli.</p>
    <div class="faq"><b>🌍 Terbuka &amp; Ramah</b><p>Semua orang Sumba dipersilakan. Sapa dengan sopan, seperti bertemu di kampung sendiri.</p></div>
    <div class="faq"><b>🤝 Jujur &amp; Transparan</b><p>Tulis status dan jualan apa adanya. Jangan meniru identitas orang lain atau menjual barang yang tidak ada.</p></div>
    <div class="faq"><b>🙏 Bertanggung Jawab &amp; Hormat</b><p>Jangan menyebar hoaks, ujaran kebencian, atau konten yang merendahkan orang lain. Jaga nama baik bersama.</p></div>
    <div class="faq"><b>🔒 Aman</b><p>Jangan membagikan password, kode verifikasi, atau data pribadi orang lain. Laporkan konten yang melanggar lewat Pusat Bantuan.</p></div>
  </div>`;
}
function renderBantuan(t){
  t.innerHTML = `<div class="kartu"><h2>Pusat Bantuan</h2>
    <h4>Layanan Mandiri</h4>
    <button class="menu-baris" onclick="tampil('saya')">👤 Cek Akun <span class="panah">›</span></button>
    <button class="menu-baris" onclick="alert('Banding catatan: hubungi admin HUMBA lewat Pesan dan sertakan nama statusmu.')">📝 Banding Catatan <span class="panah">›</span></button>
    <button class="menu-baris" onclick="tampil('pengaturan')">🔐 Keamanan Akun <span class="panah">›</span></button>
    <button class="menu-baris" onclick="tampil('jual')">🛍️ Cara Jualan <span class="panah">›</span></button>
    <button class="menu-baris" onclick="tampil('tambah-teman')">👥 Cara Tambah Teman <span class="panah">›</span></button>
    <h4>Pertanyaan yang Sering Ditanya</h4>
    <div class="faq"><b>Bagaimana cara daftar?</b><p>Di layar masuk, tekan "Belum punya akun? Daftar di sini", isi username, nama, dan password.</p></div>
    <div class="faq"><b>Bagaimana cara jualan?</b><p>Buka Toko → Pasang Barang. Pembeli menghubungimu lewat WhatsApp — tidak ada pembayaran di aplikasi.</p></div>
    <div class="faq"><b>Lupa password, bagaimana?</b><p>Di layar masuk, tekan "Lupa Password?", masukkan username, kode pemulihan, dan password baru.</p></div>
    <div class="faq"><b>Bagaimana cara mengubah status atau komentar?</b><p>Di status atau komentar milikmu, tekan tombol "Ubah", edit teksnya, lalu Simpan.</p></div>
    <button class="tombol tombol-penuh" style="margin-top:10px" onclick="alert('Dukungan resmi HUMBA: hubungi admin lewat Pesan di aplikasi.')">Dukungan Resmi</button>
  </div>`;
}
function ukuranCache(){
  let total = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("ch.")) total += (localStorage.getItem(k) || "").length; } } catch(e){}
  return (total / 1024).toFixed(1) + " KB";
}
function renderPengaturan(t){
  t.innerHTML = `<div class="kartu"><h2>Pengaturan</h2>
    <button class="menu-baris" onclick="tampil('pengaturan');setTimeout(()=>{const e=$('inPassBaru');if(e)e.focus();},50)">🔐 Keamanan Akun <span class="panah">›</span></button>
    <div class="field" style="margin-top:10px"><label>Ganti Password</label><input id="inPassBaru" type="password" placeholder="Password baru (min. 6 karakter)"></div>
    <button class="tombol kecil" onclick="gantiPasswordUI()">Simpan Password Baru</button>
    <button class="tombol kecil abu" style="margin-top:8px" onclick="kodeBaruAkun()">Buat Kode Pemulihan Baru</button>
    <p class="muted" style="margin-top:4px">Kode pemulihan dipakai untuk reset password kalau kamu lupa. Kode hanya tampil sekali — simpan baik-baik.</p>
    <h4 style="margin-top:16px">Umum</h4>
    <div class="menu-baris">🌐 Bahasa <span class="panah">Bahasa Indonesia</span></div>
    <div class="menu-baris">🔔 Notifikasi <span class="panah">${muatJSON("ch.notif", true) ? "Aktif" : "Mati"} · <a href="#" onclick="toggleNotif(event)">ubah</a></span></div>
    <div class="menu-baris">👶 Mode Anak <span class="panah">Nonaktif</span></div>
    <div class="menu-baris">✨ Coba Fitur Baru <span class="panah">Segera hadir</span></div>
    <h4 style="margin-top:16px">Privasi &amp; Data</h4>
    <div class="menu-baris">📍 Alamat / Lokasi <span class="panah">${esc(muatJSON("ch.alamat", "")) || "Belum diisi"}</span></div>
    <div class="field" style="margin-top:8px"><label>Isi alamat / lokasi (dipakai untuk Toko)</label><input id="inAlamat" value="${esc(muatJSON("ch.alamat", ""))}" placeholder="contoh: Waingapu, Sumba Timur"></div>
    <button class="tombol kecil" onclick="simpanAlamatUI()">Simpan Alamat</button>
    <div style="margin-top:12px"><span class="muted">Ukuran cache lokal (ch.*): <b>${ukuranCache()}</b></span></div>
    <button class="tombol kecil abu" style="margin-top:8px" onclick="hapusCacheUI()">Hapus Cache</button>
    <p class="muted" style="margin-top:6px">Menghapus cache tidak mengeluarkanmu dari akun dan tidak menghapus kunci anon.</p>
    <h4 style="margin-top:16px">Lainnya</h4>
    <button class="menu-baris" onclick="tampil('bantuan')">❓ Pusat Bantuan <span class="panah">›</span></button>
    <button class="menu-baris" onclick="tampil('tentang')">ℹ️ Tentang HUMBA <span class="panah">›</span></button>
    <button class="menu-baris" onclick="keluar()">🔄 Ganti Akun <span class="panah">›</span></button>
    <button class="menu-baris" onclick="keluar()">🚪 Keluar <span class="panah">›</span></button>
    <p class="muted" style="margin-top:12px">Dengan memakai HUMBA kamu menyetujui: <a href="#" onclick="alert('Perjanjian Layanan HUMBA (ringkas): pakai aplikasi dengan jujur, jangan meniru orang lain, jangan menyebar konten yang melanggar hukum.');return false">Perjanjian Layanan</a> · <a href="#" onclick="alert('Kebijakan Privasi HUMBA (ringkas): datamu tersimpan di Supabase proyek HUMBA dan di HP-mu sendiri. Kami tidak menjual datamu.');return false">Kebijakan Privasi</a> · <a href="#" onclick="alert('Kekayaan Intelektual HUMBA (ringkas): konten yang kamu tulis tetap milikmu; jangan mengunggah karya orang lain tanpa izin.');return false">Kekayaan Intelektual</a></p>
  </div>`;
}
function toggleNotif(e){ if (e) e.preventDefault(); simpanJSON("ch.notif", !muatJSON("ch.notif", true)); tampil("pengaturan"); }
function simpanAlamatUI(){ simpanJSON("ch.alamat", ($("inAlamat").value || "").trim()); alert("Alamat tersimpan."); tampil("pengaturan"); }
async function gantiPasswordUI(){
  const baru = ($("inPassBaru").value || "");
  if (baru.length < 6) { alert("Password baru minimal 6 karakter."); return; }
  if (mode === "local") {
    const d = dbLokal(); const u = d.users.find((x) => x.id === me.id);
    if (u) { u.pass = baru; simpanLokal(d); alert("Password berhasil diganti."); tampil("pengaturan"); return; }
  }
  try {
    const { error } = await sb.auth.updateUser({ password: baru });
    if (error) { alert("Gagal ganti password: " + error.message); return; }
    alert("Password berhasil diganti.");
  } catch(e){ alert("Gagal ganti password: " + (e.message || e)); }
  tampil("pengaturan");
}
function hapusCacheUI(){
  /* Hapus semua kunci "ch.*" kecuali sesi login dan kunci anon.
     "ch_local" (database Mode Lokal: akun, pesan, postingan lokal)
     SENGAJA tidak dihapus. */
  try {
    const simpan = ["ch.sesi", "ch.anonkey"];
    const hapus = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("ch.") && !simpan.includes(k)) hapus.push(k); }
    hapus.forEach((k) => localStorage.removeItem(k));
  } catch(e){}
  alert("Cache dihapus. Sesi login dan kunci anon tetap tersimpan.");
  tampil("pengaturan");
}
function renderTentang(t){
  const logoEl = document.querySelector('img[alt="Logo HUMBA"]');
  const logoHtml = logoEl ? `<img src="${logoEl.src}" width="62" height="62" alt="Logo HUMBA" style="border-radius:14px">` : `<div style="width:62px;height:62px;border-radius:14px;background:#ff2442;color:#fff;font-size:32px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto">H</div>`;
  t.innerHTML = `<div class="kartu tengah">
    <div style="margin:8px 0">${logoHtml}</div>
    <h2>HUMBA</h2>
    <p class="muted">v1.2</p>
    <p style="margin-top:10px">Jejaring sosial khusus Sumba. Tulis status, tambah teman, buat grup, tulis catatan, kirim pesan, dan jualan di Toko \u2014 semua dalam satu tempat.</p>
  </div>`;
}
/* ---------- Mulai ---------- */
window.addEventListener("DOMContentLoaded", async () => {
  $("layarAuth").style.display = "block";
  document.querySelectorAll("#layarAuth .field, #layarAuth .tombol, #layarAuth details").forEach((el) => { el.style.display = "none"; });
  infoAuth(`<div class="pesan-info">Memuat HUMBA…</div>`);
  const ok = await initSupabase();
  if (pilihanLokal) return;
  if (ok) {
    mode = "cloud";
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session && session.user) {
        const okProfil = await muatProfilCloud(session.user.id);
        if (okProfil) { masukAplikasi(); return; }
      }
    } catch(e){}
    tampilAuth();
    infoAuth(`<div class="pesan-info hijau">☁️ Tersambung ke Supabase. Silakan daftar atau masuk.</div>`);
  }
  else {
    mode = "local";
    try {
      const sid = localStorage.getItem("ch.sesi");
      if (sid) {
        const d = dbLokal();
        const u = d.users.find((x) => x.id === sid);
        if (u) { sesiLokal = u.id; me = profilLokal(u); masukAplikasi(); return; }
      }
    } catch(e){}
    tampilAuth();
    infoAuth(`<div class="pesan-info kuning">⚠️ Belum tersambung ke Supabase (tabel belum dibuat atau kunci belum aktif). Aplikasi jalan dalam <b>Mode Lokal (demo)</b> — akun hanya tersimpan di HP ini. Jalankan <b>supabase/schema.sql</b> di SQL Editor lalu muat ulang halaman ini untuk mengaktifkan sinkron antar HP.</div>`);
  }
});
