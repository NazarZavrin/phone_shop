import express from 'express';
import pool from './connect-to-PostgreSQL.js';
import path from 'path';
import { customersRouter } from './routers/customers-router.js';
import { ordersRouter } from './routers/orders-router.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'pages'));
app.use(express.static(path.join(path.resolve(), 'pages')));

app.use("/customers", customersRouter);
app.use("/orders", ordersRouter);

app.get('/', async (req, res) => {
    try {
        let result = await pool.query(`SELECT name FROM brands`);
        let brands = result.rows.map(row => row.name);
        result = await pool.query(`SELECT name, brand, price, image_name FROM products`);
        // console.log(result.rows);
        res.render('main', {
            products: result.rows,
            brands: brands,
        });
    } catch (error) {
        console.log(error.message);
        res.send("<pre>Server error</pre>");
    }
})

app.get("/products/:product_info", async (req, res, next) => {
    const productInfo = req.params.product_info.match(/^(?<brand>.{1,20})\|(?<name>.{1,15})$/)?.groups;
    if (!productInfo) {
        res.send("<pre>Такого продукту не існує!</pre>");
        return;
    }
    try {
        let result = await pool.query(`SELECT * FROM products 
        WHERE brand = $1 AND name = $2`,
        [productInfo.brand, productInfo.name]);
        // console.log(result.rows);
        res.render('product', {
            productInfo: result.rows[0]
        });
    } catch (error) {
        console.log(error.message);
        res.send("<pre>Server error</pre>");
    }
})

app.get('/report', async (req, res) => {
    try {
        res.sendFile(path.join(path.resolve(), "pages", "report.html"));
    } catch (error) {
        console.log(error.message);
        res.send("<pre>Server error</pre>");
    }
})

app.listen(PORT, () => {
    console.log(`Server has been started on port ${PORT}...`);
})