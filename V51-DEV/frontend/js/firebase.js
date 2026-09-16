import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAGwu-Gntk60VWU6C9nrgZNrRNsuAwmiU4',
  authDomain: 'smart-estoque-v51.firebaseapp.com',
  projectId: 'smart-estoque-v51',
  storageBucket: 'smart-estoque-v51.firebasestorage.app',
  messagingSenderId: '530974032242',
  appId: '1:530974032242:web:eaec6133d1505a0e4d1deb'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const catalogoRef = collection(db, 'catalogo');

export function idProduto(produto, index = 0) {
  const base = produto.gtin || produto.sku || produto.codigo || `linha-${index}`;
  const local = produto.local || 'SEM_LOCAL';
  return `${String(base)}__${String(local)}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

export async function salvarProdutoNuvem(produto, index = 0) {
  const id = idProduto(produto, index);
  await setDoc(doc(catalogoRef, id), { ...produto, id, atualizadoEm: Date.now() }, { merge: true });
  return id;
}

export async function enviarCatalogoNuvem(produtos) {
  if (!Array.isArray(produtos) || !produtos.length) return 0;

  const TAMANHO_LOTE = 500;
  let enviados = 0;

  for (let inicio = 0; inicio < produtos.length; inicio += TAMANHO_LOTE) {
    const lote = produtos.slice(inicio, inicio + TAMANHO_LOTE);
    const batch = writeBatch(db);

    lote.forEach((produto, indice) => {
      const indiceGlobal = inicio + indice;
      const id = idProduto(produto, indiceGlobal);
      batch.set(
        doc(catalogoRef, id),
        { ...produto, id, atualizadoEm: Date.now() },
        { merge: true }
      );
    });

    await batch.commit();
    enviados += lote.length;
  }

  return enviados;
}

export async function excluirProdutoNuvem(produto, index = 0) {
  await deleteDoc(doc(catalogoRef, idProduto(produto, index)));
}

export function observarCatalogoNuvem(callback, onError = console.error) {
  return onSnapshot(catalogoRef, snap => callback(snap.docs.map(d => d.data())), onError);
}

export { firebaseConfig };
