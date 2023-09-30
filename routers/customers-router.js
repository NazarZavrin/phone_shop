import express from 'express';
import pool from '../connect-to-PostgreSQL.js';

export const customersRouter = express.Router();

customersRouter.post("/create-account", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.name || !req.body.phoneNum || !req.body.email || !req.body.password) {
            throw new Error("Customer account creation: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`
        SELECT * FROM customers WHERE phone_num = $1;
        `, [req.body.phoneNum]);
        if (result.rowCount > 0) {
            res.json({ success: false, message: "Customer with such phone number already exists." });
            return;
        }
        result = await pool.query(`
            INSERT INTO customers (phone_num, name, email, password) 
            VALUES ($1, $2, $3, $4) RETURNING name, phone_num;
            `, [req.body.phoneNum, req.body.name, req.body.email, req.body.password]);
        await pool.query(`COMMIT;`);
        res.json({ success: true, message: "Customer was added.", customerData: result.rows[0] });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

customersRouter.propfind("/log-in", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.phoneNum || !req.body.password) {
            throw new Error("Customer log in: req.body doesn't contain some data: : " + JSON.stringify(req.body));
        }
        let result = await pool.query(`SELECT phone_num FROM customers WHERE phone_num = $1;`, [req.body.phoneNum]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Customer with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several customers with such data.`;
        }
        if (message.length > 0) {
            res.json({ success: false, message: message });
            return;
        }
        result = await pool.query(`SELECT name, phone_num FROM customers WHERE phone_num = $1 AND password = $2;`, [req.body.phoneNum, req.body.password]);
        if (result.rowCount === 0) {
            res.json({ success: false, message: "Wrong password." });
            return;
        }
        res.json({ success: true, customerData: result.rows[0] });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

customersRouter.patch("/change-password", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.customerPhoneNum || !req.body.oldPassword || !req.body.newPassword) {
            throw new Error("Customer password changing: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        await pool.query(`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`);
        let result = await pool.query(`
            SELECT * FROM customers WHERE phone_num = $1;
            `, [req.body.customerPhoneNum]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Customer with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several customers with such data.`;
        }
        if (message.length > 0) {
            res.json({ success: false, message: message });
            return;
        }
        result = await pool.query(`UPDATE customers SET password = $1 
        WHERE phone_num = $2 AND password = $3;`,
            [req.body.newPassword, req.body.customerPhoneNum, req.body.oldPassword]);
        if (result.rowCount === 0) {
            res.json({ success: false, message: "Wrong password." });
            return;
        }
        await pool.query(`COMMIT;`);
        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})