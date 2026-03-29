-- ═══════════════════════════════════════════════════════════════
-- schema.sql  —  Library Management System (MySQL)
-- HOW TO RUN:
--   Option A (terminal): mysql -u root -p < schema.sql
--   Option B (Workbench): Open file → Run All (Ctrl+Shift+Enter)
-- ═══════════════════════════════════════════════════════════════

DROP DATABASE IF EXISTS library_db;
CREATE DATABASE library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

-- ─────────────────────────────────────────────────────────────
-- REFERENCE TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE lms_categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE lms_authors (
    author_id   INT AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(100) NOT NULL,
    nationality VARCHAR(50),
    birth_year  INT
);

CREATE TABLE lms_member_types (
    type_id    INT          AUTO_INCREMENT PRIMARY KEY,
    type_name  VARCHAR(20)  NOT NULL UNIQUE,
    max_books  INT          DEFAULT 3,
    loan_days  INT          DEFAULT 14,
    fine_rate  DECIMAL(5,2) DEFAULT 2.00
);

-- ─────────────────────────────────────────────────────────────
-- CORE TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE lms_books (
    book_id          VARCHAR(10)  PRIMARY KEY,
    isbn             VARCHAR(20)  UNIQUE NOT NULL,
    title            VARCHAR(200) NOT NULL,
    author_id        INT          NOT NULL,
    category_id      INT          NOT NULL,
    publisher        VARCHAR(100),
    pub_year         YEAR,
    total_copies     INT          DEFAULT 1,
    available_copies INT          DEFAULT 1,
    shelf_loc        VARCHAR(10),
    avg_rating       DECIMAL(3,1),
    added_dt         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id)   REFERENCES lms_authors(author_id),
    FOREIGN KEY (category_id) REFERENCES lms_categories(category_id),
    CONSTRAINT chk_avail CHECK (available_copies >= 0)
);

CREATE TABLE lms_members (
    member_id      VARCHAR(10)  PRIMARY KEY,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(100) UNIQUE NOT NULL,
    phone          VARCHAR(15),
    type_id        INT          NOT NULL,
    account_status VARCHAR(15)  DEFAULT 'ACTIVE',
    join_date      DATE         DEFAULT (CURDATE()),
    expiry_date    DATE         NOT NULL,
    created_dt     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES lms_member_types(type_id),
    CONSTRAINT chk_status CHECK (account_status IN ('ACTIVE','SUSPENDED','EXPIRED'))
);

CREATE TABLE lms_transactions (
    txn_id       VARCHAR(15)  PRIMARY KEY,
    book_id      VARCHAR(10)  NOT NULL,
    member_id    VARCHAR(10)  NOT NULL,
    issue_date   DATE         DEFAULT (CURDATE()),
    due_date     DATE         NOT NULL,
    return_date  DATE         DEFAULT NULL,
    fine_amount  DECIMAL(8,2) DEFAULT 0.00,
    status       VARCHAR(10)  DEFAULT 'ISSUED',
    FOREIGN KEY (book_id)   REFERENCES lms_books(book_id),
    FOREIGN KEY (member_id) REFERENCES lms_members(member_id)
);

CREATE TABLE lms_fines (
    fine_id    INT          AUTO_INCREMENT PRIMARY KEY,
    txn_id     VARCHAR(15)  NOT NULL,
    member_id  VARCHAR(10)  NOT NULL,
    amount     DECIMAL(8,2) NOT NULL,
    paid_flag  CHAR(1)      DEFAULT 'N',
    created_dt DATETIME     DEFAULT CURRENT_TIMESTAMP,
    paid_dt    DATETIME     DEFAULT NULL,
    FOREIGN KEY (txn_id)    REFERENCES lms_transactions(txn_id),
    FOREIGN KEY (member_id) REFERENCES lms_members(member_id)
);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════
DELIMITER $$

-- Trigger 1: When a book is issued, reduce available copies
CREATE TRIGGER trg_decrease_avail
AFTER INSERT ON lms_transactions
FOR EACH ROW
BEGIN
    UPDATE lms_books
    SET    available_copies = available_copies - 1
    WHERE  book_id = NEW.book_id;
END$$

-- Trigger 2: When book is returned, restore copy + auto-create fine record
CREATE TRIGGER trg_on_return
AFTER UPDATE ON lms_transactions
FOR EACH ROW
BEGIN
    IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN

        UPDATE lms_books
        SET    available_copies = available_copies + 1
        WHERE  book_id = NEW.book_id;

        IF NEW.return_date > OLD.due_date THEN
            INSERT INTO lms_fines (txn_id, member_id, amount, paid_flag)
            SELECT NEW.txn_id, NEW.member_id,
                   DATEDIFF(NEW.return_date, OLD.due_date) * mt.fine_rate,
                   'N'
            FROM   lms_members m
            JOIN   lms_member_types mt ON m.type_id = mt.type_id
            WHERE  m.member_id = NEW.member_id;
        END IF;

    END IF;
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- STORED PROCEDURES
-- ═══════════════════════════════════════════════════════════════
DELIMITER $$

CREATE PROCEDURE sp_issue_book (
    IN  p_member_id  VARCHAR(10),
    IN  p_book_id    VARCHAR(10),
    OUT p_txn_id     VARCHAR(15),
    OUT p_due_date   DATE,
    OUT p_error      VARCHAR(200)
)
sp_body: BEGIN
    DECLARE v_status    VARCHAR(15);
    DECLARE v_avail     INT DEFAULT 0;
    DECLARE v_issued    INT DEFAULT 0;
    DECLARE v_max       INT DEFAULT 3;
    DECLARE v_loan_days INT DEFAULT 14;
    DECLARE v_seq       INT DEFAULT 0;

    SET p_error = NULL;

    SELECT account_status INTO v_status
    FROM   lms_members WHERE member_id = p_member_id;

    IF v_status != 'ACTIVE' THEN
        SET p_error = CONCAT('Member account is ', v_status);
        LEAVE sp_body;
    END IF;

    SELECT mt.max_books, mt.loan_days INTO v_max, v_loan_days
    FROM   lms_members m
    JOIN   lms_member_types mt ON m.type_id = mt.type_id
    WHERE  m.member_id = p_member_id;

    SELECT COUNT(*) INTO v_issued
    FROM   lms_transactions
    WHERE  member_id = p_member_id AND return_date IS NULL;

    IF v_issued >= v_max THEN
        SET p_error = CONCAT('Book limit reached (max ', v_max, ')');
        LEAVE sp_body;
    END IF;

    SELECT available_copies INTO v_avail
    FROM   lms_books WHERE book_id = p_book_id;

    IF v_avail < 1 THEN
        SET p_error = 'No copies available';
        LEAVE sp_body;
    END IF;

    SELECT COUNT(*) + 1 INTO v_seq FROM lms_transactions;
    SET p_txn_id   = CONCAT('T', LPAD(v_seq, 5, '0'));
    SET p_due_date = DATE_ADD(CURDATE(), INTERVAL v_loan_days DAY);

    INSERT INTO lms_transactions (txn_id, book_id, member_id, issue_date, due_date, status)
    VALUES (p_txn_id, p_book_id, p_member_id, CURDATE(), p_due_date, 'ISSUED');

END sp_body$$


CREATE PROCEDURE sp_return_book (
    IN  p_txn_id  VARCHAR(15),
    OUT p_fine    DECIMAL(8,2),
    OUT p_error   VARCHAR(200)
)
sp_body: BEGIN
    DECLARE v_status     VARCHAR(10);
    DECLARE v_due        DATE;
    DECLARE v_fine_rate  DECIMAL(5,2);

    SET p_error = NULL;
    SET p_fine  = 0;

    SELECT t.status, t.due_date, mt.fine_rate
    INTO   v_status, v_due, v_fine_rate
    FROM   lms_transactions t
    JOIN   lms_members m       ON t.member_id = m.member_id
    JOIN   lms_member_types mt ON m.type_id   = mt.type_id
    WHERE  t.txn_id = p_txn_id;

    IF v_status = 'RETURNED' THEN
        SET p_error = 'Book already returned';
        LEAVE sp_body;
    END IF;

    SET p_fine = GREATEST(0, DATEDIFF(CURDATE(), v_due)) * v_fine_rate;

    UPDATE lms_transactions
    SET    return_date = CURDATE(),
           status      = 'RETURNED',
           fine_amount = p_fine
    WHERE  txn_id = p_txn_id;

END sp_body$$


CREATE PROCEDURE sp_register_member (
    IN  p_full_name VARCHAR(100),
    IN  p_email     VARCHAR(100),
    IN  p_phone     VARCHAR(15),
    IN  p_type_id   INT,
    OUT p_member_id VARCHAR(10),
    OUT p_error     VARCHAR(200)
)
sp_body: BEGIN
    DECLARE v_seq    INT;
    DECLARE v_expiry DATE;
    DECLARE v_type   VARCHAR(20);
    DECLARE dup_email CONDITION FOR SQLSTATE '23000';

    SET p_error = NULL;

    SELECT type_name INTO v_type FROM lms_member_types WHERE type_id = p_type_id;

    SET v_expiry = CASE WHEN v_type = 'PREMIUM'
                        THEN DATE_ADD(CURDATE(), INTERVAL 2 YEAR)
                        ELSE DATE_ADD(CURDATE(), INTERVAL 1 YEAR) END;

    SELECT COUNT(*) + 1 INTO v_seq FROM lms_members;
    SET p_member_id = CONCAT('M', LPAD(v_seq, 3, '0'));

    INSERT INTO lms_members (member_id, full_name, email, phone, type_id, expiry_date)
    VALUES (p_member_id, p_full_name, p_email, p_phone, p_type_id, v_expiry);

END sp_body$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════

CREATE VIEW vw_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM lms_books)                                      AS total_books,
    (SELECT COUNT(*) FROM lms_members WHERE account_status = 'ACTIVE')    AS active_members,
    (SELECT COUNT(*) FROM lms_transactions WHERE return_date IS NULL)      AS on_loan,
    (SELECT IFNULL(SUM(amount), 0) FROM lms_fines WHERE paid_flag = 'N')  AS pending_fines,
    (SELECT COUNT(*) FROM lms_transactions WHERE status = 'OVERDUE')       AS overdue_count;

CREATE VIEW vw_active_transactions AS
SELECT t.txn_id, b.title AS book_title, m.full_name AS member_name,
       t.issue_date, t.due_date,
       GREATEST(0, DATEDIFF(CURDATE(), t.due_date)) AS days_overdue,
       t.status
FROM   lms_transactions t
JOIN   lms_books   b ON t.book_id   = b.book_id
JOIN   lms_members m ON t.member_id = m.member_id
WHERE  t.return_date IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

INSERT INTO lms_member_types VALUES
(1,'STUDENT', 2,14,1.00),
(2,'STANDARD',3,14,2.00),
(3,'PREMIUM', 5,21,0.50);

INSERT INTO lms_categories (category_name) VALUES
('Fiction'),('Dystopian'),('Classic'),('Technology'),
('History'),('Arts'),('Science'),('Biography');

INSERT INTO lms_authors (full_name, nationality, birth_year) VALUES
('Harper Lee','American',1926),('George Orwell','British',1903),
('F. Scott Fitzgerald','American',1896),('J.D. Salinger','American',1919),
('Aldous Huxley','British',1894),('Ramez Elmasri','American',1950),
('Brian Kernighan','Canadian',1942),('Robert C. Martin','American',1952),
('Yuval Noah Harari','Israeli',1976),('Paulo Coelho','Brazilian',1947);

INSERT INTO lms_books VALUES
('B001','978-0-06-112008-4','To Kill a Mockingbird',1,1,'HarperCollins',1960,5,3,'A-12',4.8,NOW()),
('B002','978-0-7432-7356-5','1984',2,2,'Secker & Warburg',1949,4,1,'B-03',4.7,NOW()),
('B003','978-0-14-028329-7','The Great Gatsby',3,3,'Scribner',1925,3,3,'A-07',4.5,NOW()),
('B004','978-0-316-76948-0','The Catcher in the Rye',4,1,'Little Brown',1951,2,0,'C-15',4.2,NOW()),
('B005','978-0-374-52869-9','Brave New World',5,2,'Chatto & Windus',1932,6,4,'B-09',4.6,NOW()),
('B006','978-0-7432-7357-2','Database Systems',6,4,'Pearson',2015,8,5,'D-01',4.4,NOW()),
('B007','978-0-13-110362-7','The C Programming Language',7,4,'Prentice Hall',1988,4,2,'D-04',4.9,NOW()),
('B008','978-0-9771514-1-2','Clean Code',8,4,'Prentice Hall',2008,5,3,'D-06',4.7,NOW()),
('B009','978-0-06-196436-9','Sapiens',9,5,'Harper',2011,7,6,'F-03',4.8,NOW()),
('B010','978-0-385-54734-9','The Alchemist',10,1,'HarperOne',1988,4,4,'A-22',4.6,NOW());

INSERT INTO lms_members VALUES
('M001','Arjun Prabhu','arjun@lib.in','9876543210',3,'ACTIVE',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 2 YEAR),NOW()),
('M002','Kavya Nair','kavya@lib.in','9876543211',2,'ACTIVE',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 1 YEAR),NOW()),
('M003','Rohan Sharma','rohan@lib.in','9876543212',1,'ACTIVE',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 1 YEAR),NOW()),
('M004','Priya Shetty','priya@lib.in','9876543213',3,'SUSPENDED',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 2 YEAR),NOW()),
('M005','Vikram Bhat','vikram@lib.in','9876543214',2,'ACTIVE',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 1 YEAR),NOW()),
('M006','Ananya Rao','ananya@lib.in','9876543215',1,'ACTIVE',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 1 YEAR),NOW());

SELECT 'library_db created successfully!' AS result;
