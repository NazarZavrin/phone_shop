import express from 'express';
import pool from './connect-to-PostgreSQL.js';
import path from 'path';
import { customersRouter } from './routers/customers-router.js';
import { employeesRouter } from './routers/employees-router.js';
import { ordersRouter } from './routers/orders-router.js';
import { adminRouter } from './routers/admin-router.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'pages'));
app.use(express.static(path.join(path.resolve(), 'pages')));

app.use("/customers", customersRouter);
app.use("/employees", employeesRouter);
app.use("/orders", ordersRouter);
app.use("/admin", adminRouter);

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
        // throw new Error(error);
        try {
            await pool.query("ROLLBACK;");
        } catch (anotherError) { }
        console.log(error);
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

app.get("/get-storage", async (req, res) => {
    try {
        // await pool.query(`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`);
        let result = await pool.query(`SELECT brands.name AS brand, model, price, amount 
        FROM products INNER JOIN brands ON brand_id = brands.id 
        ORDER BY amount ASC`);
        // await pool.query("COMMIT;");
        res.json({ success: true, products: result.rows });
    } catch (error) {
        // await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

app.post("/register-supply", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.employeePhoneNum || !req.body.products || !Array.isArray(req.body.products)) {
            throw new Error("Supply registration: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`SELECT NOW();`);
        const currentDateTime = result.rows[0].now;
        result = await pool.query(`SELECT id FROM employees 
        WHERE phone_num = $1 AND is_fired = FALSE;`, [req.body.employeePhoneNum]);
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
        result = await pool.query(`INSERT INTO orders 
        (num, datetime, employee_id) VALUES
        (DEFAULT, $1, $2) 
        RETURNING num, datetime;
        `, [currentDateTime, result.rows[0].id]);
        const orderNum = result.rows[0].num;
        let supplyCost = 0;
        for (const product of req.body.products) {
            supplyCost = supplyCost + Number(product.cost);
            result = await pool.query(`WITH brand_info AS (SELECT * FROM brands WHERE name = $1) 
            UPDATE products SET amount = amount + $2 FROM brand_info
            WHERE model = $3 AND brand_id = brand_info.id
            RETURNING products.id AS product_id, model, brand_info.name, amount;
            `, [product.brand, product.amount, product.model]);
            if (result.rowCount == 0) {
                await pool.query(`ROLLBACK;`);
                res.json({ success: false, message: `Некоректні дані про телефон: бренд: ${product.brand}, модель: ${product.model}.` });
                return;
            }
            result = await pool.query(`INSERT INTO order_items 
                (product_id, order_num, amount) VALUES
                ($1, $2, $3);
                `, [result.rows[0].product_id, orderNum, product.amount]);
        }
        result = await pool.query(`UPDATE orders 
        SET cost = $1 WHERE num = $2;
        `, [supplyCost * -1, orderNum]);
        await pool.query(`COMMIT;`);
        res.json({ success: true, message: "Employee was added.", employeeData: result.rows[0] });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

app.listen(PORT, () => {
    console.log(`Server has been started on port ${PORT}...`);
})