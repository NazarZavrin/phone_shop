import express from 'express';
import pool from '../connect-to-PostgreSQL.js';

export const employeesRouter = express.Router();

// !!! to do
employeesRouter.post("/create-account", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.name || !req.body.phoneNum || !req.body.email || !req.body.password) {
            throw new Error("Employee account creation: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`
        SELECT * FROM employees WHERE phone_num = $1 AND is_fired = FALSE;
        `, [req.body.phoneNum]);
        if (result.rowCount > 0) {
            await pool.query("ROLLBACK;");
            res.json({ success: false, message: "Employee with such phone number already exists." });
            return;
        }
        result = await pool.query(`
            INSERT INTO employees (phone_num, name, email, password) 
            VALUES ($1, $2, $3, $4) RETURNING name, phone_num;
            `, [req.body.phoneNum, req.body.name, req.body.email, req.body.password]);
        await pool.query(`COMMIT;`);
        res.json({ success: true, message: "Employee was added.", employeeData: result.rows[0] });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

employeesRouter.propfind("/log-in", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.phoneNum || !req.body.password) {
            throw new Error("Employee log in: req.body doesn't contain some data: : " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`SELECT phone_num FROM employees 
        WHERE phone_num = $1 AND is_fired = FALSE;`, [req.body.phoneNum]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Employee with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several employees with such data.`;
        }
        if (message.length > 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: message });
            return;
        }
        result = await pool.query(`SELECT name, phone_num FROM employees 
        WHERE phone_num = $1 AND password = $2 AND is_fired = FALSE;
        `, [req.body.phoneNum, req.body.password]);
        if (result.rowCount === 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: "Wrong password." });
            return;
        }
        await pool.query(`COMMIT;`);
        res.json({ success: true, employeeData: result.rows[0] });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})
// !!! to do
employeesRouter.patch("/change-password", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.employeePhoneNum || !req.body.oldPassword || !req.body.newPassword) {
            throw new Error("Employee password changing: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`SELECT * FROM employees 
        WHERE phone_num = $1 AND is_fired = FALSE;
        `, [req.body.employeePhoneNum]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Employee with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several employees with such data.`;
        }
        if (message.length > 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: message });
            return;
        }
        result = await pool.query(`UPDATE employees SET password = $1 
        WHERE phone_num = $2 AND password = $3 AND is_fired = FALSE;`,
            [req.body.newPassword, req.body.employeePhoneNum, req.body.oldPassword]);
        if (result.rowCount === 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: "Wrong password." });
            return;
        }
        await pool.query(`COMMIT;`);
        res.json({ success: true });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})