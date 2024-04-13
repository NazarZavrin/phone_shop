import express from 'express';
import pool from '../connect-to-PostgreSQL.js';
import path from 'path';

export const adminRouter = express.Router();

adminRouter.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), "pages", "admin.html"));
})

adminRouter.get('/issued-orders', (req, res) => {
    try {
        res.sendFile(path.join(path.resolve(), "pages", "issued-orders.html"));
    } catch (error) {
        console.log(error.message);
        res.send("<pre>Server error</pre>");
    }
})

adminRouter.get('/chart', (req, res) => {
    res.sendFile(path.join(path.resolve(), "pages", "chart.html"));
})

adminRouter.patch("/edit", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!['editorName', 'newAdminPhoneNum', 'newAdminEmail', 'newAdminPassportNum',
            'oldInfo'].every(key => Object.keys(req.body).includes(key))
            || !['phoneNum', 'email', 'passportNum'].every(key => Object.keys(req.body.oldInfo).includes(key))) {
            throw new Error("Admin info changing: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        if (req.body.editorName !== 'Admin') {
            throw new Error("Employee is not admin");
        }
        await pool.query(`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`);
        let result;
        if (req.body.newAdminPhoneNum !== req.body.oldInfo.phoneNum) {
            result = await pool.query(`
            SELECT * FROM employees WHERE phone_num = $1 AND is_fired = FALSE;
            `, [req.body.newAdminPhoneNum]);
            if (result.rowCount > 0) {
                res.json({ success: false, message: "Employee with such phone number already exists." });
                return;
            }
        }
        if (req.body.newAdminPassportNum !== req.body.oldInfo.passportNum) {
            result = await pool.query(`
            SELECT * FROM employees WHERE passport_num = $1 AND is_fired = FALSE;
            `, [req.body.newAdminPassportNum]);
            if (result.rowCount > 0) {
                res.json({ success: false, message: "Employee with such passport number already exists." });
                return;
            }
        }
        result = await pool.query(`UPDATE employees 
        SET phone_num = $1, email = $2, passport_num = $3 
        WHERE phone_num = $4 AND name = 'Admin' AND is_fired = FALSE;`,
            [req.body.newAdminPhoneNum,
            req.body.newAdminEmail, req.body.newAdminPassportNum,
            req.body.oldInfo.phoneNum]);
        if (result.rowCount !== 1) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: "Server error: employee info edition error." });
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