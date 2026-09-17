const DB_NAME = "radio-local-library";
const DB_VERSION = 2;
const TRACKS = "tracks";
const APP_STATE = "app-state";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Local storage request failed."));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Local storage transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Local storage transaction was cancelled."));
  });
}

let databasePromise;
export function openRadioDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(TRACKS)) {
          const tracks = database.createObjectStore(TRACKS, { keyPath: "id" });
          tracks.createIndex("createdAt", "createdAt");
          tracks.createIndex("stationId", "station.id");
        }
        const tracks = request.transaction.objectStore(TRACKS);
        if (tracks.indexNames.contains("favorite")) tracks.deleteIndex("favorite");
        if (!database.objectStoreNames.contains(APP_STATE)) database.createObjectStore(APP_STATE, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open the local song library."));
    });
  }
  return databasePromise;
}

export async function putTrack(record) {
  const database = await openRadioDatabase();
  const transaction = database.transaction(TRACKS, "readwrite");
  const done = transactionDone(transaction);
  transaction.objectStore(TRACKS).put(record);
  await done;
  return record;
}

export async function getTrack(id) {
  const database = await openRadioDatabase();
  const transaction = database.transaction(TRACKS, "readonly");
  const done = transactionDone(transaction);
  const result = await requestResult(transaction.objectStore(TRACKS).get(id));
  await done;
  return result || null;
}

export async function listTracks() {
  const database = await openRadioDatabase();
  const transaction = database.transaction(TRACKS, "readonly");
  const done = transactionDone(transaction);
  const records = await requestResult(transaction.objectStore(TRACKS).getAll());
  await done;
  return records.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function deleteTrack(id) {
  const database = await openRadioDatabase();
  const transaction = database.transaction(TRACKS, "readwrite");
  const done = transactionDone(transaction);
  transaction.objectStore(TRACKS).delete(id);
  await done;
}

export async function putAppState(key, value) {
  const database = await openRadioDatabase();
  const transaction = database.transaction(APP_STATE, "readwrite");
  const done = transactionDone(transaction);
  transaction.objectStore(APP_STATE).put({ key, value, updatedAt: new Date().toISOString() });
  await done;
}

export async function getAppState(key) {
  const database = await openRadioDatabase();
  const transaction = database.transaction(APP_STATE, "readonly");
  const done = transactionDone(transaction);
  const record = await requestResult(transaction.objectStore(APP_STATE).get(key));
  await done;
  return record?.value ?? null;
}
