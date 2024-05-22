import express from 'express';
import pool from '../connect-to-PostgreSQL.js';
import path from 'path';

export const ordersRouter = express.Router();

ordersRouter.get("/", (req, res) => {
    res.sendFile(path.join(path.resolve(), "pages", "orders.html"));
})

ordersRouter.post("/create", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.customerPhoneNum || !Array.isArray(req.body.orderItems) || req.body.orderItems?.length == 0) {
            throw new Error("Order creation: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`SELECT NOW();`);
        const currentDateTime = result.rows[0].now;
        result = await pool.query(`SELECT id FROM customers 
        WHERE phone_num = $1 AND is_deleted = FALSE`,
            [req.body.customerPhoneNum]);
        let message = "";
        if (result.rowCount === 0) {
            message = "Customer with such data does not exist.";
        } else if (result.rowCount > 1) {
            message = `Found several customers with such data.`;
        }
        if (message.length > 0) {
            throw new Error(message);
        }
        result = await pool.query(`INSERT INTO orders 
        (num, datetime, customer_id) VALUES
        (DEFAULT, $1, $2) 
        RETURNING num, datetime;
        `, [currentDateTime, result.rows[0].id]);
        const orderNum = result.rows[0].num;
        for (const orderItem of req.body.orderItems) {
            result = await pool.query(`WITH brand_info AS (SELECT * FROM brands WHERE name = $1) 
            UPDATE products SET amount = amount - $2 FROM brand_info
            WHERE model = $3 AND brand_id = brand_info.id
            RETURNING products.id AS product_id, model, brand_info.name, amount;
            `, [orderItem.brand, orderItem.amount, orderItem.model]);
            if (result.rows[0].amount < 0) {
                throw new Error(`Only ${result.rows[0].amount + orderItem.amount}`
                    + ` phones ${orderItem.brand + " " + orderItem.model} are available.`);
            }
            result = await pool.query(`INSERT INTO order_items 
                (product_id, order_num, amount) VALUES
                ($1, $2, $3);
                `, [result.rows[0].product_id, orderNum, orderItem.amount]);
        }
        let orderCost = 0;
        for (const orderItem of req.body.orderItems) {
            result = await pool.query(`SELECT order_items.amount * products.price AS order_item_cost 
                FROM order_items INNER JOIN products 
                ON product_id = products.id 
                WHERE order_num = $1 AND products.model = $2 AND products.brand_id = (SELECT id FROM brands WHERE name = $3);
                `, [orderNum, orderItem.model, orderItem.brand]);
            orderCost += Number(result.rows[0].order_item_cost);
        }
        result = await pool.query(`UPDATE orders 
        SET cost = $1 WHERE num = $2;
        `, [orderCost, orderNum]);
        if (req.body.currentProductInfo) {
            result = await pool.query(`SELECT amount FROM products 
            WHERE model = $1 AND brand_id = (SELECT id FROM brands WHERE name = $2);
            `, [req.body.currentProductInfo.model, req.body.currentProductInfo.brand]);
        }
        await pool.query("COMMIT;");
        res.json({ success: true, message: "Order was created successfully.", num: orderNum, newAmount: result.rows[0]?.amount });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

ordersRouter.get("/get-orders", async (req, res) => {
    try {
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`
        SELECT num, datetime, cost, customers.phone_num AS customer_phone_num, customers.name AS customer_name 
        FROM orders INNER JOIN customers ON customer_id = customers.id 
        WHERE issuance_datetime IS NULL 
        ORDER BY datetime ASC;`);
        const orders = result.rows;
        for (const order of orders) {
            result = await pool.query(`
            SELECT model, brands.name AS brand, order_items.amount AS amount 
            FROM order_items 
            INNER JOIN products ON products.id = product_id 
            INNER JOIN brands ON brands.id = brand_id 
            WHERE order_num = $1`, [order.num]);
            order.orderItems = result.rows;
        }
        await pool.query("COMMIT;");
        res.json({ success: true, orders: orders });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

ordersRouter.patch("/issue", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.num || !req.body.employeePhoneNum || !req.body.paid) {
            throw new Error("Order issuance: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`SELECT NOW();`);
        const currentDateTime = result.rows[0].now;
        result = await pool.query(`UPDATE orders 
        SET issuance_datetime = $1, paid = $2, 
        employee_id = (SELECT id FROM employees WHERE phone_num = $3 AND is_fired = FALSE) 
        WHERE num = $4;
        `, [currentDateTime, req.body.paid, req.body.employeePhoneNum, req.body.num]);
        await pool.query("COMMIT;");
        res.json({ success: true, message: "Order was issued successfully." });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

ordersRouter.delete("/delete", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.num) {
            throw new Error("Order deletion: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        // we don't need to start a transaction because there is only one request to the database
        await pool.query(`DELETE FROM orders WHERE num = $1;`,
            [req.body.num]);
        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

ordersRouter.get("/get-issued-orders", async (req, res) => {
    try {
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;`);
        let result = await pool.query(`
        SELECT num, datetime, cost, issuance_datetime FROM orders 
        WHERE issuance_datetime IS NOT NULL 
        ORDER BY datetime ASC;`);
        const orders = result.rows;
        for (const order of orders) {
            result = await pool.query(`
            SELECT model, brands.name AS brand, order_items.amount AS amount 
            FROM order_items 
            INNER JOIN products ON products.id = product_id 
            INNER JOIN brands ON brands.id = brand_id 
            WHERE order_num = $1`, [order.num]);
            order.orderItems = result.rows;
        }
        await pool.query("COMMIT;");
        res.json({ success: true, orders: orders });
    } catch (error) {
        await pool.query("ROLLBACK;");
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

ordersRouter.all(/^\/receipt\/(\d+)$/, async (req, res, next) => {
    if (req.method === "GET") {
        res.sendFile(path.join(path.resolve(), "pages", "receipt.html"));
    } else if (req.method === "PROPFIND") {
        try {
            await pool.query(`
            SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
            BEGIN;`);
            let receipt_num = Number(req.url.match(/^\/receipt\/(\d+)$/)[1]);
            let result = await pool.query(`
            SELECT num, datetime, cost, issuance_datetime, paid, customers.name AS customer_name 
            FROM orders INNER JOIN customers ON customer_id = customers.id 
            WHERE issuance_datetime IS NOT NULL AND num = $1;`, [receipt_num]);
            if (result.rowCount === 0) {
                await pool.query("ROLLBACK;");
                res.json({ success: false, message: "Non-existent receipt number." });
                return;
            }
            const order = result.rows[0];
            result = await pool.query(`
            SELECT model, brands.name AS brand, order_items.amount AS amount, 
            order_items.amount * products.price AS cost 
            FROM order_items 
            INNER JOIN products ON products.id = product_id 
            INNER JOIN brands ON brands.id = brand_id 
            WHERE order_num = $1`, [order.num]);
            order.orderItems = result.rows;
            await pool.query("COMMIT;");
            res.json({ success: true, order: order });
        } catch (error) {
            await pool.query("ROLLBACK;");
            console.log(error.message);
            res.json({ success: false, message: error.message });
        }
    } else {
        next();
    }
})

ordersRouter.propfind("/get-data-for-chart", (req, res, next) => {
    express.json({
        limit: req.get('content-length')
    })(req, res, next);
}, async (req, res) => {
    try {
        if (!req.body.from || !req.body.to) {
            throw new Error("Receiving data for chart: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        let result = await pool.query(`SELECT *
        FROM (SELECT EXTRACT(YEAR FROM issuance_datetime) AS year, 
        EXTRACT(MONTH FROM issuance_datetime) AS month, SUM(cost) AS income
        FROM orders WHERE cost > 0 AND issuance_datetime BETWEEN $1 AND $2 
        GROUP BY year, month) AS income_info
        FULL JOIN (SELECT EXTRACT(YEAR FROM datetime) AS year, 
        EXTRACT(MONTH FROM datetime) AS month, SUM(cost) * -1 AS spending 
        FROM orders WHERE cost < 0 AND datetime BETWEEN $1 AND $2 
        GROUP BY year, month) AS spending_info
        ON income_info.year = spending_info.year AND income_info.month = spending_info.month
        ORDER BY LEAST(income_info.year, spending_info.year), LEAST(income_info.month, spending_info.month) ASC;`// for ORDER BY DESC use GREATEST() instead of LEAST() (https://stackoverflow.com/questions/66231376/sort-full-join-based-on-two-columns-on-two-different-tables)
            , [req.body.from, req.body.to]);
        res.json({ success: true, dataForChart: result.rows });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
})