// ─────────────────────────────────────────────────────────────
// api.js  —  place in your React src/ folder
//
// In LibraryMS_Cyber.jsx:
//   1. DELETE the entire const OracleDB = { ... } block
//   2. ADD at the very top:  import * as API from './api';
//   3. Replace every call (full map at the bottom of this file)
// ─────────────────────────────────────────────────────────────

const BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const handle = async (resPromise) => {
  const res = await resPromise;   // ✅ THIS WAS MISSING

  if (!res || typeof res.json !== "function") {
    throw new Error("Invalid response from server");
  }

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};

const post = (url, body) =>
  handle(fetch(url, {
    method  : "POST",
    headers : { "Content-Type": "application/json" },
    body    : JSON.stringify(body),
  }));

const patch = (url, body = {}) =>
  handle(fetch(url, {
    method  : "PATCH",
    headers : { "Content-Type": "application/json" },
    body    : JSON.stringify(body),
  }));

// ── Books ──────────────────────────────────────────────────────
export const getBooks    = ()       =>
  handle(fetch(`${BASE}/books`)).then(d =>
    d.rows.map(r => ({
      id: r.id ?? r.book_id,
      isbn: r.isbn ?? "",
      title: r.title ?? "",
      author: r.author ?? r.full_name ?? "",
      category: r.category ?? r.category_name ?? "",
      year: Number(r.year ?? r.pub_year ?? 0),
      copies: Number(r.copies ?? r.total_copies ?? 0),
      available: Number(r.available ?? r.available_copies ?? 0),
      shelf: r.shelf ?? r.shelf_loc ?? "",
      rating: Number(r.rating ?? r.avg_rating ?? 0),
      status: r.status ?? "AVAILABLE",
    }))
  );
export const searchBooks = q        => handle(fetch(`${BASE}/books/search?q=${encodeURIComponent(q)}`)).then(d => d.rows);
export const addBook     = form     => post(`${BASE}/books`, form);
export const updateBook  = (id, f)  => handle(fetch(`${BASE}/books/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(f) }));
export const deleteBook  = id       => handle(fetch(`${BASE}/books/${id}`, { method:"DELETE" }));

// ── Members ────────────────────────────────────────────────────
export const getMembers      = ()            =>
  handle(fetch(`${BASE}/members`)).then(d =>
    d.rows.map(r => ({
      id: r.id ?? r.member_id,
      name: r.name ?? r.full_name ?? "",
      email: r.email ?? "",
      phone: r.phone ?? "",
      type: r.type ?? r.type_name ?? "STANDARD",
      joined: r.joined ?? r.join_date ?? "",
      expiry: r.expiry ?? r.expiry_date ?? "",
      issued: Number(r.issued ?? 0),
      fines: Number(r.fines ?? 0),
      status: r.status ?? r.account_status ?? "ACTIVE",
    }))
  );
export const addMember       = form          => post(`${BASE}/members`, form);
export const setMemberStatus = (id, status)  => patch(`${BASE}/members/${id}/status`, { status });
export const updateMember    = (id, form)    =>
  handle(fetch(`${BASE}/members/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  }));

// ── Transactions ───────────────────────────────────────────────
export const getTransactions = ()            =>
  handle(fetch(`${BASE}/transactions`)).then(d =>
    d.rows.map(r => ({
      id: r.id ?? r.txn_id,
      bookId: r.bookId ?? r.book_id,
      bookTitle: r.bookTitle ?? r.book ?? r.book_title ?? "",
      memberId: r.memberId ?? r.member_id,
      member: r.member ?? "",
      issueDate: r.issueDate,
      dueDate: r.dueDate,
      returnDate: r.returnDate,
      fine: Number(r.fine ?? r.fine_amount ?? 0),
      status: r.status || (r.returnDate ? "RETURNED" : "ISSUED"),
    }))
  );
export const issueBook       = (mId, bId)    => post(`${BASE}/transactions/issue`,  { memberId: mId, bookId: bId });
export const returnBook      = txnId         => post(`${BASE}/transactions/return`, { txnId });

// ── Fines ──────────────────────────────────────────────────────
export const getFines    = ()      => handle(fetch(`${BASE}/fines`)).then(d => d.rows);
export const collectFine = fineId  => patch(`${BASE}/fines/${fineId}/collect`);

// ── Dashboard ──────────────────────────────────────────────────
export const getStats = () => handle(fetch(`${BASE}/stats`)).then(d => d.stats);

// ─────────────────────────────────────────────────────────────
// REPLACEMENT MAP for LibraryMS_Cyber.jsx
// ─────────────────────────────────────────────────────────────
// OracleDB.getBooks()              → API.getBooks()
// OracleDB.getMembers()            → API.getMembers()
// OracleDB.getTransactions()       → API.getTransactions()
// OracleDB.getStats()              → API.getStats()
// OracleDB.issueBook(mId, bId)     → API.issueBook(mId, bId)
// OracleDB.returnBook(txnId)       → API.returnBook(txnId)
// OracleDB.getFines  (if exists)   → API.getFines()
//
// In useEffect blocks, change like this:
//
//   // BEFORE (simulation):
//   OracleDB.getBooks().then(d => { setBooks(d); setLB(false); });
//
//   // AFTER (real MySQL):
//   API.getBooks()
//     .then(d  => { setBooks(d); setLB(false); })
//     .catch(e => { console.error(e); setLB(false); });
