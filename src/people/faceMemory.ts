export interface PersonProfile { id: string; name: string; descriptor: number[]; createdAt: string }
export interface FaceObservation { descriptor: number[]; x: number; y: number; width: number; height: number }
export interface FaceTrack extends FaceObservation { id: number; frames: number; lastSeen: number; person: PersonProfile | null }

export function validDescriptor(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 128 && value.every(n => Number.isFinite(n));
}
export function faceDistance(a: number[], b: number[]): number {
  if (!validDescriptor(a) || !validDescriptor(b)) return Infinity;
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}
/** Conservative matches; ambiguous neighbours remain unknown. Not an authentication mechanism. */
export function matchPerson(descriptor: number[], profiles: PersonProfile[]): PersonProfile | null {
  const ranked = profiles.map(person => ({ person, distance: faceDistance(descriptor, person.descriptor) })).sort((a, b) => a.distance - b.distance);
  if (!ranked.length || ranked[0].distance > .48) return null;
  if (ranked[1] && ranked[1].distance - ranked[0].distance < .08) return null;
  return ranked[0].person;
}
export function spokenName(text: string): string {
  return text.replace(/^(?:my name is|i am|i'm|mera naam|मेरा नाम)\s+/iu, '').replace(/\s+(?:hai|है)[.!।]?$/iu, '').trim().replace(/[.!।]+$/u, '').slice(0, 60).trim();
}
export class FaceTracker {
  private tracks: FaceTrack[] = [];
  private nextId = 1;
  update(observations: FaceObservation[], profiles: PersonProfile[], now: number): FaceTrack[] {
    const available = this.tracks.filter(track => now - track.lastSeen < 10000);
    const used = new Set<number>();
    this.tracks = observations.filter(face => validDescriptor(face.descriptor)).map(face => {
      const candidates = available.filter(track => !used.has(track.id)).map(track => ({ track, distance: faceDistance(face.descriptor, track.descriptor) })).sort((a, b) => a.distance - b.distance);
      // Reassign only a unique close appearance, so crossing people don't swap names.
      const best = candidates[0];
      const previous = best && best.distance < .42 && (!candidates[1] || candidates[1].distance - best.distance > .04) ? best.track : null;
      if (previous) used.add(previous.id);
      return { ...face, id: previous?.id ?? this.nextId++, frames: (previous?.frames ?? 0) + 1, lastSeen: now, person: matchPerson(face.descriptor, profiles) };
    });
    // Two detections cannot both confidently claim the same stored identity.
    const counts = new Map<string, number>();
    this.tracks.forEach(track => { if (track.person) counts.set(track.person.id, (counts.get(track.person.id) || 0) + 1); });
    return this.tracks.map(track => ({ ...track, person: track.person && counts.get(track.person.id) === 1 ? track.person : null }));
  }
  reset() { this.tracks = []; }
}

async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jarvis-people-memory', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('people', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Face memory is unavailable. Check browser storage permissions.'));
  });
}
async function transact<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('people', mode);
    const request = action(transaction.objectStore('people'));
    transaction.oncomplete = () => { db.close(); resolve(request.result); };
    transaction.onabort = transaction.onerror = () => { db.close(); reject(new Error('Could not save face memory in this browser.')); };
  });
}
export async function loadPeople(): Promise<PersonProfile[]> {
  const people = await transact<PersonProfile[]>('readonly', store => store.getAll());
  return people.filter(person => typeof person.id === 'string' && typeof person.name === 'string' && validDescriptor(person.descriptor));
}
export async function savePerson(person: PersonProfile): Promise<void> {
  if (!person.name.trim() || person.name.length > 60 || !validDescriptor(person.descriptor)) throw new Error('A name and a clear face are required.');
  await transact('readwrite', store => store.put(person));
}
export async function deletePerson(id: string): Promise<void> { await transact('readwrite', store => store.delete(id)); }
export async function clearPeople(): Promise<void> { await transact('readwrite', store => store.clear()); }
