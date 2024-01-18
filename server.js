import express from 'express';
import pool from './connect-to-PostgreSQL.js';
import path from 'path';
import { customersRouter } from './routers/customers-router.js';
import { employeesRouter } from './routers/employees-router.js';
import { ordersRouter } from './routers/orders-router.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'pages'));
app.use(express.static(path.join(path.resolve(), 'pages')));

app.use("/customers", customersRouter);
app.use("/employees", employeesRouter);
app.use("/orders", ordersRouter);

app.get('/', async (req, res) => {
    try {
        await pool.query(`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`);
        let result = await pool.query(`SELECT name FROM brands ORDER BY name`);
        let brands = result.rows.map(row => row.name);
        result = await pool.query(`SELECT model, brands.name AS brand, price, amount, image_name 
        FROM products INNER JOIN brands ON brand_id = brands.id 
        ORDER BY brands.name, model`);
        await pool.query(`COMMIT;`);
        res.render('main', {
            products: result.rows,
            brands: brands,
        });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.send("<pre>Server error</pre>");
    }
})

app.get("/products/:product_info", async (req, res, next) => {
    const productInfo = req.params.product_info.match(/^(?<brand>.{1,20})\|(?<model>.{1,30})$/)?.groups;
    try {
        if (productInfo) {
            let result = await pool.query(`SELECT products.*, brands.name AS brand FROM products 
            INNER JOIN brands ON brand_id = brands.id 
            WHERE brands.name = $1 AND model = $2`,
            [productInfo.brand, productInfo.model]);
            if (result.rows.length === 1) {
                res.render('product', {
                    productInfo: result.rows[0]
                });
                return;
            }
        }
        res.send("<pre>Такого продукту не існує!</pre>");
        return;
    } catch (error) {
        console.log(error.message);
        res.send("<pre>Server error</pre>");
    }
})

app.listen(PORT, () => {
    console.log(`Server has been started on port ${PORT}...`);
})