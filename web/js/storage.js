// IndexedDB 包裝。儲存所有發票，按日期排序。

const DB_NAME = 'stimlig-invoices';
const DB_VERSION = 1;
const STORE = 'invoices';

let dbPromise = null;

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('date', 'date');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const result = fn(store);
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
  }));
}

export async function saveInvoice(invoice) {
  if (!invoice.id) invoice.id = crypto.randomUUID();
  if (!invoice.createdAt) invoice.createdAt = new Date().toISOString();
  // Date 物件 IndexedDB 可存，但為求 JSON 一致改存 ISO 字串。
  if (invoice.date instanceof Date) invoice.date = invoice.date.toISOString();
  await tx('readwrite', store => store.put(invoice));
  return invoice;
}

export async function getAllInvoices() {
  return tx('readonly', store => new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const result = req.result
        .map(inv => ({ ...inv, date: new Date(inv.date) }))
        .sort((a, b) => b.date - a.date);
      resolve(result);
    };
    req.onerror = () => reject(req.error);
  }));
}

export async function deleteInvoice(id) {
  await tx('readwrite', store => store.delete(id));
}
