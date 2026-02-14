// Storage utilities for localStorage and IndexedDB

const DB_NAME = 'loveapp';
const DB_VERSION = 1;
const PHOTOS_STORE = 'photos';

const PASS_SALT_KEY = 'love_pass_salt';
const PASS_HASH_KEY = 'love_pass_hash';
const LEGACY_PASSCODE_KEY = 'love_passcode';
const UNLOCKED_KEY = 'love_unlocked';

const PROFILE_NAME_KEY = 'love_profile_name';
const PROFILE_NAME_PLAIN_KEY = 'love_profile_name_plain';
const PROFILE_NAME_PUBLIC_KEY = 'love_profile_name_public';

const ENC_PREFIX = 'enc:v1:';
const PBKDF2_ITERS = 210_000;

// ---- localStorage helpers ----
export function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setSession<T>(key: string, value: T): void {
  sessionStorage.setItem(key, JSON.stringify(value));
}

async function hydratePlainCacheFromEncrypted(): Promise<void> {
  if (!sessionKey) return;

  const mapping: Array<{ encryptedKey: string; plainKey: string }> = [
    { encryptedKey: 'love_messages', plainKey: 'love_messages_plain' },
    { encryptedKey: 'love_dates', plainKey: 'love_dates_plain' },
    { encryptedKey: 'love_challenges', plainKey: 'love_challenges_plain' },
    { encryptedKey: 'love_reasons', plainKey: 'love_reasons_plain' },
    { encryptedKey: 'love_letter', plainKey: 'love_letter_plain' },
    { encryptedKey: 'love_quiz', plainKey: 'love_quiz_plain' },
    { encryptedKey: 'love_quiz_best', plainKey: 'love_quiz_best_plain' },
    { encryptedKey: PROFILE_NAME_KEY, plainKey: PROFILE_NAME_PLAIN_KEY },
  ];

  for (const { encryptedKey, plainKey } of mapping) {
    const raw = localStorage.getItem(encryptedKey);
    if (!raw || !raw.startsWith(ENC_PREFIX)) continue;
    try {
      const plain = await decryptString(raw);
      sessionStorage.setItem(plainKey, plain);
    } catch {
      // ignore
    }
  }
}

export function setLocal<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

let sessionKey: CryptoKey | null = null;

export function hasSessionKey(): boolean {
  return sessionKey !== null;
}

async function deriveAesKeyFromPasscode(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(passcode), 'PBKDF2', false, [
    'deriveKey',
    'deriveBits',
  ]);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERS,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function derivePassHash(passcode: string, salt: Uint8Array): Promise<string> {
  const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(passcode), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERS,
    },
    baseKey,
    256
  );
  return bytesToB64(new Uint8Array(bits));
}

function getPassSaltBytes(): Uint8Array | null {
  const saltB64 = localStorage.getItem(PASS_SALT_KEY);
  return saltB64 ? b64ToBytes(saltB64) : null;
}

function getStoredPassHash(): string | null {
  return localStorage.getItem(PASS_HASH_KEY);
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCKED_KEY) === 'true' && hasSessionKey();
}

export function lock(): void {
  sessionKey = null;
  sessionStorage.removeItem(UNLOCKED_KEY);
}

function unlockSession(key: CryptoKey): void {
  sessionKey = key;
  sessionStorage.setItem(UNLOCKED_KEY, 'true');
}

export async function ensurePasscodeInitialized(defaultPasscode = '1414'): Promise<void> {
  const salt = getPassSaltBytes();
  const hash = getStoredPassHash();
  if (salt && hash) return;

  const legacy = getLocal<string>(LEGACY_PASSCODE_KEY, defaultPasscode);
  const newSalt = crypto.getRandomValues(new Uint8Array(16));
  const newHash = await derivePassHash(legacy, newSalt);
  localStorage.setItem(PASS_SALT_KEY, bytesToB64(newSalt));
  localStorage.setItem(PASS_HASH_KEY, newHash);
  localStorage.removeItem(LEGACY_PASSCODE_KEY);
}

export async function verifyAndUnlock(passcode: string): Promise<boolean> {
  await ensurePasscodeInitialized();
  const salt = getPassSaltBytes();
  const storedHash = getStoredPassHash();
  if (!salt || !storedHash) return false;

  const hash = await derivePassHash(passcode, salt);
  if (hash !== storedHash) return false;

  const key = await deriveAesKeyFromPasscode(passcode, salt);
  unlockSession(key);
  await migratePlaintextToEncrypted();
  await migratePhotosToEncrypted();
  await hydratePlainCacheFromEncrypted();
  return true;
}

export async function setPasscode(code: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassHash(code, salt);
  localStorage.setItem(PASS_SALT_KEY, bytesToB64(salt));
  localStorage.setItem(PASS_HASH_KEY, hash);
  localStorage.removeItem(LEGACY_PASSCODE_KEY);
  const key = await deriveAesKeyFromPasscode(code, salt);
  unlockSession(key);
  await migratePlaintextToEncrypted();
  await migratePhotosToEncrypted();
  await hydratePlainCacheFromEncrypted();
}

async function encryptString(plain: string): Promise<string> {
  if (!sessionKey) throw new Error('Not unlocked');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sessionKey, textEncoder.encode(plain));
  return ENC_PREFIX + bytesToB64(concatBytes(iv, new Uint8Array(cipher)));
}

async function decryptString(payload: string): Promise<string> {
  if (!sessionKey) throw new Error('Not unlocked');
  if (!payload.startsWith(ENC_PREFIX)) throw new Error('Not encrypted');
  const bytes = b64ToBytes(payload.slice(ENC_PREFIX.length));
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sessionKey, data);
  return textDecoder.decode(plainBuf);
}

export async function getSecure<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    if (!raw.startsWith(ENC_PREFIX)) {
      const parsed = JSON.parse(raw) as T;
      await setSecure(key, parsed);
      return parsed;
    }
    const plain = await decryptString(raw);
    return JSON.parse(plain) as T;
  } catch {
    return fallback;
  }
}

export async function setSecure<T>(key: string, value: T): Promise<void> {
  const plain = JSON.stringify(value);
  const enc = await encryptString(plain);
  localStorage.setItem(key, enc);
}

async function migratePlaintextToEncrypted(): Promise<void> {
  if (!sessionKey) return;

  const keysToMigrate: Array<{ encryptedKey: string; plainKey: string }> = [
    { encryptedKey: 'love_messages', plainKey: 'love_messages_plain' },
    { encryptedKey: 'love_dates', plainKey: 'love_dates_plain' },
    { encryptedKey: 'love_challenges', plainKey: 'love_challenges_plain' },
    { encryptedKey: 'love_reasons', plainKey: 'love_reasons_plain' },
    { encryptedKey: 'love_letter', plainKey: 'love_letter_plain' },
    { encryptedKey: 'love_quiz', plainKey: 'love_quiz_plain' },
    { encryptedKey: 'love_quiz_best', plainKey: 'love_quiz_best_plain' },
    { encryptedKey: PROFILE_NAME_KEY, plainKey: PROFILE_NAME_PLAIN_KEY },
  ];

  for (const { encryptedKey, plainKey } of keysToMigrate) {
    const raw = localStorage.getItem(encryptedKey);
    if (!raw) continue;
    if (raw.startsWith(ENC_PREFIX)) continue;
    try {
      const parsed = JSON.parse(raw);
      setSession(plainKey, parsed);
      await setSecure(encryptedKey, parsed);
    } catch {
      // ignore
    }
  }
}

// ---- IndexedDB for photos ----
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface PhotoEntry {
  id: string;
  data: string; // base64
  date: string;
  caption?: string;
}

interface StoredPhotoEntry {
  id: string;
  data: string;
  date: string;
  caption?: string;
  enc?: true;
}

export interface ExportBundleV1 {
  v: 1;
  pass: {
    saltB64: string;
    hashB64: string;
  };
  local: Record<string, string>;
  photos: StoredPhotoEntry[];
  relationshipDate?: string;
}

const EXPORTED_LOCAL_KEYS = [
  'love_messages',
  'love_dates',
  'love_challenges',
  'love_reasons',
  'love_letter',
  'love_quiz',
  'love_quiz_best',
] as const;

async function getAllStoredPhotos(): Promise<StoredPhotoEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readonly');
    const req = tx.objectStore(PHOTOS_STORE).getAll();
    req.onsuccess = () => resolve(req.result as StoredPhotoEntry[]);
    req.onerror = () => reject(req.error);
  });
}

async function putStoredPhotos(entries: StoredPhotoEntry[]): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readwrite');
    const store = tx.objectStore(PHOTOS_STORE);
    for (const e of entries) store.put(e);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function exportBundle(): Promise<string> {
  const saltB64 = localStorage.getItem(PASS_SALT_KEY) ?? '';
  const hashB64 = localStorage.getItem(PASS_HASH_KEY) ?? '';
  if (!saltB64 || !hashB64) {
    throw new Error('Passcode not initialized');
  }

  const local: Record<string, string> = {};
  for (const k of EXPORTED_LOCAL_KEYS) {
    const v = localStorage.getItem(k);
    if (v) local[k] = v;
  }

  const photos = await getAllStoredPhotos();
  const relationshipDate = localStorage.getItem('love_start_date') ?? undefined;

  const bundle: ExportBundleV1 = {
    v: 1,
    pass: { saltB64, hashB64 },
    local,
    photos,
    relationshipDate,
  };

  return JSON.stringify(bundle);
}

export async function importBundle(bundleJson: string): Promise<void> {
  const parsed = JSON.parse(bundleJson) as ExportBundleV1;
  if (!parsed || parsed.v !== 1) throw new Error('Unsupported bundle');
  if (!parsed.pass?.saltB64 || !parsed.pass?.hashB64) throw new Error('Invalid bundle');

  lock();

  localStorage.setItem(PASS_SALT_KEY, parsed.pass.saltB64);
  localStorage.setItem(PASS_HASH_KEY, parsed.pass.hashB64);
  localStorage.removeItem(LEGACY_PASSCODE_KEY);

  if (parsed.relationshipDate) {
    localStorage.setItem('love_start_date', parsed.relationshipDate);
  }

  for (const k of EXPORTED_LOCAL_KEYS) {
    const v = parsed.local?.[k];
    if (typeof v === 'string') localStorage.setItem(k, v);
  }

  if (Array.isArray(parsed.photos)) {
    await putStoredPhotos(parsed.photos);
  }

  sessionStorage.clear();
}

async function migratePhotosToEncrypted(): Promise<void> {
  if (!sessionKey) return;
  const db = await openDB();

  const all = await new Promise<StoredPhotoEntry[]>((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readonly');
    const req = tx.objectStore(PHOTOS_STORE).getAll();
    req.onsuccess = () => resolve(req.result as StoredPhotoEntry[]);
    req.onerror = () => reject(req.error);
  });

  const toUpdate = all.filter((p) => !p.enc);
  if (toUpdate.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readwrite');
    const store = tx.objectStore(PHOTOS_STORE);

    (async () => {
      for (const p of toUpdate) {
        const enc: StoredPhotoEntry = {
          id: p.id,
          date: p.date,
          enc: true,
          data: await encryptString(p.data),
          caption: p.caption ? await encryptString(p.caption) : undefined,
        };
        store.put(enc);
      }
    })().catch(() => {
      // ignore
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function savePhoto(photo: PhotoEntry): Promise<void> {
  const db = await openDB();

  const stored: StoredPhotoEntry = sessionKey
    ? {
        id: photo.id,
        date: photo.date,
        enc: true,
        data: await encryptString(photo.data),
        caption: photo.caption ? await encryptString(photo.caption) : undefined,
      }
    : { ...photo };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readwrite');
    tx.objectStore(PHOTOS_STORE).put(stored);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllPhotos(): Promise<PhotoEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readonly');
    const req = tx.objectStore(PHOTOS_STORE).getAll();
    req.onsuccess = async () => {
      try {
        const out: PhotoEntry[] = [];
        for (const item of req.result as StoredPhotoEntry[]) {
          if (item.enc) {
            const data = await decryptString(item.data);
            const caption = item.caption ? await decryptString(item.caption) : undefined;
            out.push({ id: item.id, date: item.date, data, caption });
          } else {
            out.push(item as unknown as PhotoEntry);
          }
        }
        resolve(out);
      } catch {
        resolve([]);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, 'readwrite');
    tx.objectStore(PHOTOS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- Relationship date ----
export function getRelationshipDate(): string {
  return getLocal<string>('love_start_date', '2024-02-14');
}

export function setRelationshipDate(date: string): void {
  setLocal('love_start_date', date);
}

// ---- Love messages ----
export interface LoveMessage {
  id: string;
  text: string;
  category: 'sad' | 'miss' | 'surprise';
}

export function getLoveMessages(): LoveMessage[] {
  const fallback: LoveMessage[] = [
    { id: '1', text: "Tu es la plus belle chose qui me soit arrivée. ❤️", category: 'sad' },
    { id: '2', text: "Chaque seconde sans toi est une éternité. 💭", category: 'miss' },
    { id: '3', text: "Je t'aime plus que tous les mots du monde. 💝", category: 'surprise' },
    { id: '4', text: "Ton sourire illumine mes jours les plus sombres. ☀️", category: 'sad' },
    { id: '5', text: "Tu me manques à chaque battement de mon cœur. 💓", category: 'miss' },
    { id: '6', text: "Notre amour est ma plus belle aventure. 🌹", category: 'surprise' },
  ];

  const raw = localStorage.getItem('love_messages');
  if (!raw || !raw.startsWith(ENC_PREFIX)) {
    return getLocal<LoveMessage[]>('love_messages', fallback);
  }

  return getSession<LoveMessage[]>('love_messages_plain', fallback);
}

export function saveLoveMessages(messages: LoveMessage[]): void {
  setSession('love_messages_plain', messages);
  void setSecure('love_messages', messages);
}

// ---- Important dates ----
export interface ImportantDate {
  id: string;
  label: string;
  date: string;
  emoji: string;
}

export function getImportantDates(): ImportantDate[] {
  const fallback: ImportantDate[] = [
    { id: '1', label: 'Notre rencontre', date: '2024-02-14', emoji: '💕' },
    { id: '2', label: 'Notre premier baiser', date: '2024-03-01', emoji: '💋' },
    { id: '3', label: 'Saint-Valentin', date: '2025-02-14', emoji: '❤️' },
  ];

  const raw = localStorage.getItem('love_dates');
  if (!raw || !raw.startsWith(ENC_PREFIX)) {
    return getLocal<ImportantDate[]>('love_dates', fallback);
  }
  return getSession<ImportantDate[]>('love_dates_plain', fallback);
}

export function saveImportantDates(dates: ImportantDate[]): void {
  setSession('love_dates_plain', dates);
  void setSecure('love_dates', dates);
}

// ---- Challenges ----
export interface Challenge {
  id: string;
  text: string;
  done: boolean;
}

export function getChallenges(): Challenge[] {
  const fallback: Challenge[] = [
    { id: '1', text: "Envoie-moi un message vocal 🎤", done: false },
    { id: '2', text: "Dis-moi 3 raisons pourquoi tu m'aimes 💕", done: false },
    { id: '3', text: "Écris-moi un poème 📝", done: false },
    { id: '4', text: "Prépare-moi un petit déjeuner surprise 🥐", done: false },
    { id: '5', text: "Regarde le coucher de soleil en pensant à moi 🌅", done: false },
    { id: '6', text: "Fais-moi un câlin de 2 minutes 🤗", done: false },
    { id: '7', text: "Envoie-moi notre chanson préférée 🎵", done: false },
    { id: '8', text: "Dis-moi ton souvenir préféré de nous deux 💭", done: false },
  ];

  const raw = localStorage.getItem('love_challenges');
  if (!raw || !raw.startsWith(ENC_PREFIX)) {
    return getLocal<Challenge[]>('love_challenges', fallback);
  }
  return getSession<Challenge[]>('love_challenges_plain', fallback);
}

export function saveChallenges(challenges: Challenge[]): void {
  setSession('love_challenges_plain', challenges);
  void setSecure('love_challenges', challenges);
}

// ---- Reasons ----
export interface Reason {
  id: string;
  text: string;
  emoji: string;
}

export function getReasons(fallback: Reason[]): Reason[] {
  const raw = localStorage.getItem('love_reasons');
  if (!raw || !raw.startsWith(ENC_PREFIX)) {
    return getLocal<Reason[]>('love_reasons', fallback);
  }
  return getSession<Reason[]>('love_reasons_plain', fallback);
}

export function saveReasons(reasons: Reason[]): void {
  setSession('love_reasons_plain', reasons);
  void setSecure('love_reasons', reasons);
}

// ---- Letter ----
export function getLetter(fallback: string): string {
  const raw = localStorage.getItem('love_letter');
  if (!raw || !raw.startsWith(ENC_PREFIX)) {
    return getLocal<string>('love_letter', fallback);
  }
  return getSession<string>('love_letter_plain', fallback);
}

export function saveLetter(text: string): void {
  setSession('love_letter_plain', text);
  void setSecure('love_letter', text);
}

// ---- Quiz ----
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
}

export function getQuizQuestions(fallback: QuizQuestion[]): QuizQuestion[] {
  const raw = localStorage.getItem('love_quiz');
  if (!raw || !raw.startsWith(ENC_PREFIX)) {
    return getLocal<QuizQuestion[]>('love_quiz', fallback);
  }
  return getSession<QuizQuestion[]>('love_quiz_plain', fallback);
}

export function getQuizBestScore(fallback = 0): number {
  const raw = localStorage.getItem('love_quiz_best');
  if (!raw || !raw.startsWith(ENC_PREFIX)) {
    return getLocal<number>('love_quiz_best', fallback);
  }
  return getSession<number>('love_quiz_best_plain', fallback);
}

export function getProfileName(fallback = ''): string {
  const raw = localStorage.getItem(PROFILE_NAME_KEY);
  if (!raw || !raw.startsWith(ENC_PREFIX)) {
    return getLocal<string>(PROFILE_NAME_KEY, fallback);
  }
  return getSession<string>(PROFILE_NAME_PLAIN_KEY, fallback);
}

export function saveProfileName(name: string): void {
  const cleaned = name.trim();
  setSession(PROFILE_NAME_PLAIN_KEY, cleaned);
  void setSecure(PROFILE_NAME_KEY, cleaned);
  localStorage.setItem(PROFILE_NAME_PUBLIC_KEY, cleaned);
}

export function getProfileNamePublic(fallback = ''): string {
  const raw = localStorage.getItem(PROFILE_NAME_PUBLIC_KEY);
  return raw ? raw : fallback;
}

export function saveQuizBestScore(s: number): void {
  setSession('love_quiz_best_plain', s);
  void setSecure('love_quiz_best', s);
}
