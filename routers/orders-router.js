import express from 'express';
import pool from '../connect-to-PostgreSQL.js';
import path from 'path';

export const ordersRouter = express.Router();

ordersRouter.get("/", async (req, res) => {
    res.sendFile(path.join(path.resolve(), "pages", "orders.html"));
})

ordersRouter.post("/create-order", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    try {
        // console.log(req.body);
        if (!req.body.customerPhoneNum || !Array.isArray(req.body.orderItems) || req.body.orderItems?.length == 0) {
            throw new Error("Order creation: req.body doesn't contain some data: " + JSON.stringify(req.body));
        }
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;
        `);
        let result = await pool.query(`SELECT NOW();`);
        const currentDateTime = result.rows[0].now;
        result = await pool.query(`INSERT INTO orders 
        (num, datetime, customer_phone_num) VALUES
        (DEFAULT, $1, $2) RETURNING num, datetime;
        `, [currentDateTime, req.body.customerPhoneNum]);
        const orderNum = result.rows[0].num;
        for (const orderItem of req.body.orderItems) {
            result = await pool.query(`INSERT INTO order_items 
                (product_name, product_brand, order_num, amount) VALUES
                ($1, $2, $3, $4);
                `, [orderItem.name, orderItem.brand, orderNum, orderItem.amount]);
        }
        let orderCost = 0;
        for (const orderItem of req.body.orderItems) {
            // console.log(orderItem);
            result = await pool.query(`SELECT order_items.amount * products.price AS order_item_cost 
                FROM order_items INNER JOIN products 
                ON product_name = name AND product_brand = brand 
                WHERE order_num = $1 AND product_name = $2 AND product_brand = $3;
                `, [orderNum, orderItem.name, orderItem.brand]);
            orderCost += Number(result.rows[0].order_item_cost);
        }
        result = await pool.query(`UPDATE orders 
        SET cost = $1 WHERE num = $2;
        `, [orderCost, orderNum]);
        await pool.query("COMMIT;");
        res.json({ success: true, message: "Order was created successfully.", num: orderNum });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})

ordersRouter.propfind("/get-orders", async (req, res) => {
    try {
        await pool.query(`
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN;
        `);
        let result = await pool.query(`
        SELECT num, datetime, cost, customer_phone_num, customers.name AS customer_name 
        FROM orders INNER JOIN customers ON customer_phone_num = phone_num 
        WHERE issuance_datetime IS NULL 
        ORDER BY datetime ASC;`);
        const orders = result.rows;
        for (const order of orders) {
            result = await pool.query(`
            SELECT product_name, product_brand, amount 
            FROM order_items WHERE order_num = $1`, [order.num]);
            order.orderItems = result.rows;
        }
        await pool.query("COMMIT;");
        res.json({ success: true, orders: orders });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
})