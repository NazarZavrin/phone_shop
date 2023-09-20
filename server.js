import express from 'express';
import pool from './connect-to-PostgreSQL.js';
import path from 'path';
import { customersRouter } from './routers/customers-router.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'pages'));
app.use(express.static(path.join(path.resolve(), 'pages')));

app.use("/customers", customersRouter);

app.get('/', async (req, res) => {
    try {
        let result = await pool.query(`SELECT * FROM products`);
        // console.log(result.rows);
        res.render('main', {
            phones: result.rows
        });
    } catch (error) {
        console.log(error.message);
        res.send("<pre>Server error</pre>");
    }
})

app.listen(PORT, () => {
    console.log(`Server has been started on port ${PORT}...`);
})