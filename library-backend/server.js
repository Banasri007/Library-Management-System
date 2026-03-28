// ═══════════════════════════════════════════════════════════════
// server.js  —  Library Management System Backend (MySQL)
//
// INSTALL:  npm install express mysql2 cors dotenv
// RUN:      node server.js
// ═══════════════════════════════════════════════════════════════

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
console.log("ENV PASSWORD:", process.env.DB_PASSWORD);
const express = require("express");
const mysql   = require("mysql2/promise");   // ← mysql2, not oracledb
const cors    = require("cors");

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// CONNECTION POOL
// mysql2 pool manages multiple connections automatically.
// Every request grabs one connection, uses it, releases it back.
// ─────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host     : process.env.DB_HOST     || "localhost",
  port     : process.env.DB_PORT     || 3306,
  user     : process.env.DB_USER     || "root",
  password : process.env.DB_PASSWORD || "",
  database : process.env.DB_NAME     || "library_db",
  waitForConnections : true,
  connectionLimit    : 10,
  queueLimit         : 0,
});

// ─────────────────────────────────────────────────────────────
// HOW SQL WORKS WITH MYSQL2 — the two patterns you need:
//
// Pattern A — SELECT (returns rows):
//   const [rows] = await pool.execute("SELECT * FROM lms_books");
//   rows  →  [ { book_id:'B001', title:'1984', ... }, ... ]
//
// Pattern B — INSERT/UPDATE/DELETE (returns metadata):
//   const [result] = await pool.execute("UPDATE ... WHERE ...", [val]);
//   result.affectedRows  →  how many rows changed
//   result.insertId      →  auto-increment ID for INSERT
//
// BIND VALUES — always use ? placeholders (never string concatenation):
//   pool.execute("SELECT * FROM lms_books WHERE book_id = ?", [id])
//   pool.execute("INSERT INTO lms_books (title) VALUES (?)", [title])
//   pool.execute("UPDATE lms_books SET title=? WHERE book_id=?", [title,id])
//
// CALLING STORED PROCEDURES:
//   pool.execute("CALL sp_issue_book(?, ?, @txn_id, @due_date, @error)", [memberId, bookId])
//   then: pool.execute("SELECT @txn_id, @due_date, @error")
// ─────────────────────────────────────────────────────────────

// Test connection on startup
pool.getConnection()
  .then(conn => { console.log("✅ MySQL connected — library_db"); conn.release(); })
  .catch(err  => { console.error("❌ MySQL connection failed:", err.message); process.exit(1); });

// ═══════════════════════════════════════════════════════════════
//  BOOKS
// ═══════════════════════════════════════════════════════════════

// GET /api/books
app.get("/api/books", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.book_id,
             b.isbn,
             b.title,
             a.full_name        AS author,
             c.category_name    AS category,
             b.publisher,
             b.pub_year         AS year,
             b.total_copies     AS copies,
             b.available_copies AS available,
             b.shelf_loc        AS shelf,
             b.avg_rating       AS rating,
             CASE
               WHEN b.available_copies = 0 THEN 'OUT_OF_STOCK'
               WHEN b.available_copies <= 1 THEN 'LOW_STOCK'
               ELSE 'AVAILABLE'
             END AS status
      FROM   lms_books b
      JOIN   lms_authors    a ON b.author_id   = a.author_id
      JOIN   lms_categories c ON b.category_id = c.category_id
      ORDER  BY b.title`);

    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/books/search?q=keyword
app.get("/api/books/search", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;

    // ? placeholders — mysql2 escapes values safely, no SQL injection
    const [rows] = await pool.execute(`
      SELECT b.book_id, b.title, a.full_name AS author,
             c.category_name AS category, b.available_copies AS available
      FROM   lms_books b
      JOIN   lms_authors    a ON b.author_id   = a.author_id
      JOIN   lms_categories c ON b.category_id = c.category_id
      WHERE  b.title     LIKE ?
         OR  a.full_name LIKE ?
         OR  b.isbn      LIKE ?
      ORDER  BY b.title`,
    [q, q, q]);   // ← three ? = three values in array

    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/books
app.post("/api/books", async (req, res) => {
  try {
    const { isbn, title, authorId, categoryId, publisher, pubYear, totalCopies, shelfLoc } = req.body;

    // Call stored procedure
    await pool.execute(
      "CALL sp_add_book(?, ?, ?, ?, ?, ?, ?, ?)",
      [isbn, title, authorId, categoryId, publisher, pubYear, totalCopies, shelfLoc]
    );

    res.status(201).json({ success: true, message: "Book added" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/books/:id
app.put("/api/books/:id", async (req, res) => {
  try {
    const { title, publisher, totalCopies, shelfLoc } = req.body;

    const [result] = await pool.execute(
      `UPDATE lms_books
       SET title=?, publisher=?, total_copies=?, shelf_loc=?
       WHERE book_id=?`,
      [title, publisher, totalCopies, shelfLoc, req.params.id]
    );

    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/books/:id
app.delete("/api/books/:id", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM lms_books WHERE book_id = ?",
      [req.params.id]
    );
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  MEMBERS
// ═══════════════════════════════════════════════════════════════

// GET /api/members
app.get("/api/members", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT m.member_id                              AS id,
             m.full_name                               AS name,
             m.email, m.phone,
             mt.type_name                              AS type,
             DATE_FORMAT(m.join_date,   '%Y-%m-%d')   AS joined,
             DATE_FORMAT(m.expiry_date, '%Y-%m-%d')   AS expiry,
             IFNULL(iss.cnt,   0)                     AS issued,
             IFNULL(fin.total, 0)                     AS fines,
             m.account_status                         AS status
      FROM   lms_members m
      JOIN   lms_member_types mt ON m.type_id = mt.type_id
      LEFT JOIN (
        SELECT member_id, COUNT(*) cnt
        FROM   lms_transactions WHERE return_date IS NULL
        GROUP  BY member_id
      ) iss ON m.member_id = iss.member_id
      LEFT JOIN (
        SELECT member_id, SUM(amount) total
        FROM   lms_fines WHERE paid_flag = 'N'
        GROUP  BY member_id
      ) fin ON m.member_id = fin.member_id
      ORDER  BY m.full_name`);

    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/members  — calls sp_register_member stored procedure
app.post("/api/members", async (req, res) => {
  try {
    const { fullName, email, phone, typeId, type } = req.body;
    let resolvedTypeId = typeId;

    // Accept type names from UI (e.g. STANDARD) as well as numeric type_id.
    if (!resolvedTypeId && type) {
      const [types] = await pool.execute(
        "SELECT type_id FROM lms_member_types WHERE UPPER(type_name)=UPPER(?) LIMIT 1",
        [type]
      );
      resolvedTypeId = types[0]?.type_id;
    }

    // Step 1: call the procedure with OUT params via @variables
    await pool.execute(
      "CALL sp_register_member(?, ?, ?, ?, @member_id, @error)",
      [fullName, email, phone, resolvedTypeId]
    );

    // Step 2: read the OUT variables
    const [[out]] = await pool.execute(
      "SELECT @member_id AS member_id, @error AS error"
    );

    if (out.error) {
      return res.status(400).json({ success: false, error: out.error });
    }

    res.json({ success: true, memberId: out.member_id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/members/:id/status
app.patch("/api/members/:id/status", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "UPDATE lms_members SET account_status = ? WHERE member_id = ?",
      [req.body.status, req.params.id]
    );
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/members/:id
app.put("/api/members/:id", async (req, res) => {
  try {
    const { fullName, email, phone, typeId, type } = req.body;
    let resolvedTypeId = typeId;

    if (!resolvedTypeId && type) {
      const [types] = await pool.execute(
        "SELECT type_id FROM lms_member_types WHERE UPPER(type_name)=UPPER(?) LIMIT 1",
        [type]
      );
      resolvedTypeId = types[0]?.type_id;
    }

    const [result] = await pool.execute(
      `UPDATE lms_members
       SET full_name = ?,
           email = ?,
           phone = ?,
           type_id = ?
       WHERE member_id = ?`,
      [fullName, email, phone, resolvedTypeId, req.params.id]
    );

    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  TRANSACTIONS
// ═══════════════════════════════════════════════════════════════

// GET /api/transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        t.txn_id AS id,
        t.book_id AS bookId,
        t.member_id AS memberId,
        IFNULL(m.full_name, 'Unknown Member') AS member,
        IFNULL(b.title, 'Unknown Book') AS bookTitle,
        0 AS fine,
        CASE
          WHEN t.return_date IS NOT NULL THEN 'RETURNED'
          WHEN t.due_date < CURDATE() THEN 'OVERDUE'
          ELSE 'ISSUED'
        END AS status,
        DATE_FORMAT(t.issue_date, '%Y-%m-%d') AS issueDate,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate,
        DATE_FORMAT(t.return_date, '%Y-%m-%d') AS returnDate
      FROM lms_transactions t
      LEFT JOIN lms_members m ON t.member_id = m.member_id
      LEFT JOIN lms_books b ON t.book_id = b.book_id
      ORDER BY t.issue_date DESC
      LIMIT 50
    `);

    res.json({ success: true, rows });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transactions/issue — calls sp_issue_book
app.post("/api/transactions/issue", async (req, res) => {
  let conn;
  try {
    const { memberId, bookId } = req.body;

    // Preferred path: stored procedure if present in DB.
    try {
      await pool.execute(
        "CALL sp_issue_book(?, ?, @txn_id, @due_date, @error)",
        [memberId, bookId]
      );

      const [[out]] = await pool.execute(
        "SELECT @txn_id AS txn_id, @due_date AS due_date, @error AS error"
      );

      if (out.error) {
        return res.status(400).json({ success: false, error: out.error });
      }

      return res.json({
        success : true,
        txnId   : out.txn_id,
        dueDate : out.due_date,
      });
    } catch (spErr) {
      // Fallback path: direct SQL flow (for environments without stored procedures).
      conn = await pool.getConnection();
      await conn.beginTransaction();

      const [[member]] = await conn.execute(
        "SELECT account_status FROM lms_members WHERE member_id = ? FOR UPDATE",
        [memberId]
      );
      if (!member) throw new Error("Member not found");
      if (String(member.account_status).toUpperCase() !== "ACTIVE") {
        throw new Error("Member suspended");
      }

      const [[book]] = await conn.execute(
        "SELECT available_copies FROM lms_books WHERE book_id = ? FOR UPDATE",
        [bookId]
      );
      if (!book) throw new Error("Book not found");
      if (Number(book.available_copies || 0) < 1) throw new Error("No copies available");

      const [[idRow]] = await conn.execute(
        "SELECT CONCAT('T', LPAD(IFNULL(MAX(CAST(SUBSTRING(txn_id, 2) AS UNSIGNED)), 0) + 1, 3, '0')) AS nextTxnId FROM lms_transactions"
      );
      const txnId = idRow.nextTxnId;

      await conn.execute(
        `INSERT INTO lms_transactions (txn_id, book_id, member_id, issue_date, due_date, return_date, fine_amount, status)
         VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 0, 'ISSUED')`,
        [txnId, bookId, memberId]
      );

      await conn.execute(
        "UPDATE lms_books SET available_copies = available_copies - 1 WHERE book_id = ?",
        [bookId]
      );

      await conn.commit();
      return res.json({
        success: true,
        txnId,
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      });
    }
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    res.status(400).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/transactions/return — calls sp_return_book
// trg_on_return trigger fires automatically inside MySQL
app.post("/api/transactions/return", async (req, res) => {
  try {
    await pool.execute(
      "CALL sp_return_book(?, @fine, @error)",
      [req.body.txnId]
    );

    const [[out]] = await pool.execute(
      "SELECT @fine AS fine, @error AS error"
    );

    if (out.error) {
      return res.status(400).json({ success: false, error: out.error });
    }

    res.json({ success: true, fine: out.fine });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  FINES
// ═══════════════════════════════════════════════════════════════

// GET /api/fines
app.get("/api/fines", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT f.fine_id, f.txn_id,
             m.full_name                             AS member,
             b.title                                 AS book_title,
             f.amount, f.paid_flag,
             DATE_FORMAT(f.created_dt, '%Y-%m-%d')  AS created_date
      FROM   lms_fines        f
      JOIN   lms_transactions t ON f.txn_id    = t.txn_id
      JOIN   lms_members      m ON f.member_id = m.member_id
      JOIN   lms_books        b ON t.book_id   = b.book_id
      WHERE  f.paid_flag = 'N'
      ORDER  BY f.amount DESC`);

    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/fines/:id/collect
app.patch("/api/fines/:id/collect", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "UPDATE lms_fines SET paid_flag='Y', paid_dt=NOW() WHERE fine_id=?",
      [req.params.id]
    );
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD — reads from MySQL VIEW vw_dashboard_stats
// ═══════════════════════════════════════════════════════════════

app.get("/api/stats", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM vw_dashboard_stats");

    const stats = rows[0];   // ✅ THIS WAS MISSING

    res.json({
      success: true,
      stats: {
        totalBooks: stats.total_books,
        activeMembers: stats.active_members,
        onLoan: stats.on_loan,
        pendingFines: parseFloat(stats.pending_fines),
        overdueCount: stats.overdue_count
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════
const BASE_PORT = Number(process.env.PORT || 5000);
const MAX_PORT_RETRIES = 10;
app.post("/api/sql/execute", async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, error: "No query provided" });
  }

  const trimmed   = query.trim();
  const queryType = trimmed.split(/\s+/)[0].toUpperCase(); // SELECT, INSERT, etc.

  // ── Safety: block dangerous commands ──────────────────────────
  const BLOCKED = ["DROP", "TRUNCATE", "GRANT", "REVOKE", "SHUTDOWN", "RESET", "FLUSH"];
  if (BLOCKED.includes(queryType)) {
    return res.status(403).json({
      success   : false,
      error     : `Command "${queryType}" is blocked in the console for safety.`,
      queryType,
    });
  }

  const startTime = Date.now();

  try {
    const [rows, fields] = await pool.execute(trimmed);
    const executionTime  = Date.now() - startTime;

    // SELECT → rows + columns
    if (Array.isArray(rows) && fields) {
      const columns = fields.map(f => f.name);
      return res.json({
        success       : true,
        queryType,
        columns,
        rows,
        rowCount      : rows.length,
        executionTime,
      });
    }

    // INSERT / UPDATE / DELETE → affected rows
    return res.json({
      success       : true,
      queryType,
      columns       : [],
      rows          : [],
      affectedRows  : rows.affectedRows,
      insertId      : rows.insertId,
      executionTime,
      message       : `${queryType} OK — ${rows.affectedRows} row(s) affected`,
    });

  } catch (err) {
    return res.status(400).json({
      success       : false,
      error         : err.message,
      queryType,
      executionTime : Date.now() - startTime,
    });
  }
});

const startServer = (port, attemptsLeft = MAX_PORT_RETRIES) => {
  const server = app.listen(port, () => {
    console.log(`🚀 LMS API → http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.warn(`⚠ Port ${port} is in use, retrying on ${port + 1}...`);
      startServer(port + 1, attemptsLeft - 1);
      return;
    }
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  });
};

startServer(BASE_PORT);
