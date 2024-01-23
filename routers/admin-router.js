import express from 'express';
import pool from '../connect-to-PostgreSQL.js'
import path from 'path';

export const adminRouter = express.Router();

adminRouter.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), "pages", "admin.html"));
})

adminRouter.get('/issued-orders', async (req, res) => {
    try {
        res.sendFile(path.join(path.resolve(), "pages", "issued-orders.html"));
    } catch (error) {
        console.log(error.message);
        res.send("<pre>Server error</pre>");
    }
})