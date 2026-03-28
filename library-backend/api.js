// api.js — place in React src/ folder
// Replace the OracleDB simulation in LibraryMS_Cyber.jsx with:
//   import * as API from './api'

const BASE = "http://localhost:5000/api";
const ok = async res => {
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Request failed");
  return data;
};

export const getBooks        = ()             => fetch(`${BASE}/books`).then(ok).then(d => d.rows);
export const searchBooks     = q             => fetch(`${BASE}/books/search?q=${encodeURIComponent(q)}`).then(ok).then(d => d.rows);
export const addBook         = form          => fetch(`${BASE}/books`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) }).then(ok);
export const updateBook      = (id, f)       => fetch(`${BASE}/books/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(f) }).then(ok);
export const deleteBook      = id            => fetch(`${BASE}/books/${id}`, { method:"DELETE" }).then(ok);

export const getMembers      = ()            => fetch(`${BASE}/members`).then(ok).then(d => d.rows);
export const addMember       = form          => fetch(`${BASE}/members`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) }).then(ok);
export const setMemberStatus = (id, status)  => fetch(`${BASE}/members/${id}/status`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) }).then(ok);

export const getTransactions = ()            => fetch(`${BASE}/transactions`).then(ok).then(d => d.rows);
export const issueBook       = (mId, bId)    => fetch(`${BASE}/transactions/issue`,  { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ memberId:mId, bookId:bId }) }).then(ok);
export const returnBook      = txnId         => fetch(`${BASE}/transactions/return`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ txnId }) }).then(ok);

export const getFines        = ()            => fetch(`${BASE}/fines`).then(ok).then(d => d.rows);
export const collectFine     = fineId        => fetch(`${BASE}/fines/${fineId}/collect`, { method:"PATCH" }).then(ok);

export const getStats        = ()            => fetch(`${BASE}/stats`).then(ok).then(d => d.stats);
