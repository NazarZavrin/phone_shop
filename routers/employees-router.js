import express from 'express';
import pool from '../connect-to-PostgreSQL.js';
import path from 'path';
import bcrypt from 'bcrypt';

export const employeesRouter = express.Router();

employeesRouter.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), "pages", "employees.html"));
})

employeesRouter.post("/create-account", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.name || !req.body.phoneNum || !req.body.email || !req.body.passportNum || !req.body.password || !req.body.creatorName) {
            throw new Error("Employee account creation: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        if (req.body.creatorName !== 'Admin') {
            throw new Error("Employee is not admin");
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
        SELECT * FROM employees WHERE passport_num = $1 AND is_fired = FALSE;
        `, [req.body.passportNum]);
        if (result.rowCount > 0) {
            await pool.query("ROLLBACK;");
            res.json({ success: false, message: "Employee with such passport number already exists." });
            return;
        }
        req.body.password = await bcrypt.hash(req.body.password, Number(process.env.SALT_ROUNDS));
        result = await pool.query(`
            INSERT INTO employees (phone_num, name, email, passport_num, password) 
            VALUES ($1, $2, $3, $4, $5) RETURNING name, phone_num;
            `, [req.body.phoneNum, req.body.name, req.body.email, req.body.passportNum, req.body.password]);
        await pool.query(`COMMIT;`);
        res.json({ success: true, message: "Employee was added.", employeeData: result.rows[0] });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

employeesRouter.get("/get-employees", async (req, res) => {
    try {
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`
        SELECT name, phone_num, passport_num, email 
        FROM employees WHERE is_fired = FALSE AND name != 'Admin' 
        ORDER BY id ASC;`);
        await pool.query("COMMIT;");
        res.json({ success: true, employees: result.rows });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

employeesRouter.propfind("/get-employee-additional-info", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.phoneNum|| !req.body.name) {
            throw new Error("Getting employee additional info: req.body doesn't contain some data: : " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`SELECT passport_num, email FROM employees 
        WHERE phone_num = $1 AND name = $2;`, [req.body.phoneNum, req.body.name]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Employee with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several employees with such data.`;
        }
        /*if (message.length > 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: message });
            return;
        }*/
        if (message.length > 0) {
            throw new Error(message);
        }
        await pool.query(`COMMIT;`);
        res.json({ success: true, employeeData: result.rows[0] });
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
        let result = await pool.query(`SELECT name, phone_num, password FROM employees 
        WHERE phone_num = $1 AND is_fired = FALSE;`, [req.body.phoneNum]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Employee with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several employees with such data.`;
        } else if (await bcrypt.compare(req.body.password, result.rows?.[0].password) != true) {
            /*console.log(result.rows?.[0].name);
            console.log("Wrong:" + req.body.password);
            console.log("Correct:" + result.rows?.[0].password);*/
            message = `Wrong password.`;
        }
        /*if (message.length > 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: message });
            return;
        }*/
        if (message.length > 0) {
            throw new Error(message);
        }
        await pool.query(`COMMIT;`);
        delete result.rows?.[0].password;
        res.json({ success: true, employeeData: result.rows[0] });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

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
        } else if (await bcrypt.compare(req.body.oldPassword, result.rows?.[0].password) != true) {
            /*console.log(result.rows?.[0].name);
            console.log("Wrong:" + req.body.oldPassword);
            console.log("Correct:" + result.rows?.[0].password);*/
            message = `Wrong password.`;
        }
        /*if (message.length > 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: message });
            return;
        }*/
        if (message.length > 0) {
            throw new Error(message);
        }
        req.body.newPassword = await bcrypt.hash(req.body.newPassword, Number(process.env.SALT_ROUNDS));
        result = await pool.query(`UPDATE employees SET password = $1 
        WHERE phone_num = $2 AND is_fired = FALSE;`,
            [req.body.newPassword, req.body.employeePhoneNum]);
        if (result.rowCount === 0) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: "Server error: employee's password update error." });
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

employeesRouter.patch("/edit", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!['editorName', 'newEmployeeName', 'newEmployeePhoneNum', 'newEmployeeEmail', 'newEmployeePassportNum',
            'oldInfo'].every(key => Object.keys(req.body).includes(key))
            || !['name', 'phoneNum', 'email', 'passportNum'].every(key => Object.keys(req.body.oldInfo).includes(key))) {
            throw new Error("Employee info changing: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        if (req.body.editorName !== 'Admin') {
            throw new Error("Employee who edits is not admin");
        }
        await pool.query(`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`);
        let result;
        if (req.body.newEmployeePhoneNum !== req.body.oldInfo.phoneNum) {
            result = await pool.query(`
            SELECT * FROM employees WHERE phone_num = $1 AND is_fired = FALSE;
            `, [req.body.newEmployeePhoneNum]);
            if (result.rowCount > 0) {
                res.json({ success: false, message: "Employee with such phone number already exists." });
                return;
            }
        }
        if (req.body.newEmployeePassportNum !== req.body.oldInfo.passportNum) {
            result = await pool.query(`
            SELECT * FROM employees WHERE passport_num = $1 AND is_fired = FALSE;
            `, [req.body.newEmployeePassportNum]);
            if (result.rowCount > 0) {
                res.json({ success: false, message: "Employee with such passport number already exists." });
                return;
            }
        }
        result = await pool.query(`UPDATE employees 
        SET name = $1, phone_num = $2, email = $3, passport_num = $4 
        WHERE phone_num = $5 AND is_fired = FALSE;`,
            [req.body.newEmployeeName, req.body.newEmployeePhoneNum,
            req.body.newEmployeeEmail, req.body.newEmployeePassportNum,
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

employeesRouter.delete("/delete", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.employeeWhoDeletesName || !req.body.employeeToDeletePhoneNum) {
            throw new Error("Employee deletion: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        if (req.body.employeeWhoDeletesName !== 'Admin') {
            throw new Error("Employee who deletes is not admin");
        }
        await pool.query(`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`);
        let result = await pool.query(`
        SELECT COUNT(*) as count FROM employees 
        WHERE name = 'Admin' AND phone_num = $1
        `, [req.body.employeeToDeletePhoneNum]);
        if (Number(result.rows[0].count) > 0) {
            throw new Error("Can not delete an admin");
        }
        result = await pool.query(`
        UPDATE employees SET is_fired = TRUE 
        WHERE phone_num = $1 AND is_fired = FALSE;`,
            [req.body.employeeToDeletePhoneNum]);
        if (result.rowCount !== 1) {
            await pool.query(`ROLLBACK;`);
            res.json({ success: false, message: "Server error: employee deletion error." });
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