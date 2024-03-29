import express from 'express';
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

adminRouter.get('/register-supply', (req, res) => {
    res.sendFile(path.join(path.resolve(), "pages", "register-supply.html"));
})

adminRouter.get('/chart', (req, res) => {
    res.sendFile(path.join(path.resolve(), "pages", "chart.html"));
})