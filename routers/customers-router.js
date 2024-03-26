import express from 'express';
import pool from '../connect-to-PostgreSQL.js';
import bcrypt from 'bcrypt';

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
        SELECT * FROM customers WHERE phone_num = $1 AND is_deleted = FALSE;
        `, [req.body.phoneNum]);
        if (result.rowCount > 0) {
            await pool.query("ROLLBACK;");
            res.json({ success: false, message: "Customer with such phone number already exists." });
            return;
        }
        // hash the password
        req.body.password = await bcrypt.hash(req.body.password, Number(process.env.SALT_ROUNDS));
        // add the customer
        result = await pool.query(`
            INSERT INTO customers (phone_num, name, email, password) 
            VALUES ($1, $2, $3, $4) RETURNING name, phone_num;
            `, [req.body.phoneNum, req.body.name, req.body.email, req.body.password]);
        await pool.query(`COMMIT;`);
        res.json({ success: true, message: "Customer was added.", customerData: result.rows[0] });
    } catch (error) {
        await pool.query("ROLLBACK;");
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
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`SELECT name, phone_num, password 
        FROM customers WHERE phone_num = $1 AND is_deleted = FALSE;`
        , [req.body.phoneNum]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Customer with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several customers with such data.`;
        } else if (await bcrypt.compare(req.body.password, result.rows?.[0].password) != true) {
            console.log(result.rows?.[0].name);
            console.log("Wrong:" + req.body.password);
            console.log("Correct:" + result.rows?.[0].password);
            message = `Wrong password.`;
        }
        if (message.length > 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: message });
            return;
        }
        await pool.query(`COMMIT;`);
        delete result.rows?.[0].password;
        res.json({ success: true, customerData: result.rows[0] });
    } catch (error) {
        await pool.query("ROLLBACK;");
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
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`SELECT * FROM customers 
        WHERE phone_num = $1 AND is_deleted = FALSE;
        `, [req.body.customerPhoneNum]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Customer with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several customers with such data.`;
        } else if (await bcrypt.compare(req.body.oldPassword, result.rows?.[0].password) != true) {
            console.log(result.rows?.[0].name);
            console.log("Wrong:" + req.body.oldPassword);
            console.log("Correct:" + result.rows?.[0].password);
            message = `Wrong password.`;
        }
        if (message.length > 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: message });
            return;
        }
        req.body.newPassword = await bcrypt.hash(req.body.newPassword, Number(process.env.SALT_ROUNDS));
        result = await pool.query(`UPDATE customers SET password = $1 
        WHERE phone_num = $2 AND is_deleted = FALSE;`,
            [req.body.newPassword, req.body.customerPhoneNum]);
        if (result.rowCount === 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: "Server error: customer's password update error." });
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