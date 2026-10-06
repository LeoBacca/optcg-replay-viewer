// Piccolo archivio chiave → valore dentro il browser (IndexedDB, database "optcg-replay").
// Serve per le cose che localStorage non sa tenere: il permesso sulla cartella dei log ('dir')
// e l'indice delle partite già analizzate ('index').

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('optcg-replay', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('kv');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Legge un valore; null se non c'è o se l'archivio non è disponibile. */
export async function kvGet(key) {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const request = db.transaction('kv').objectStore('kv').get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/** Salva un valore. Se l'archivio non è disponibile non fa niente. */
export async function kvSet(key, value) {
  try {
    const db = await openDb();
    db.transaction('kv', 'readwrite').objectStore('kv').put(value, key);
  } catch (e) {
    // senza archivio si riparte da capo alla prossima visita
  }
}
