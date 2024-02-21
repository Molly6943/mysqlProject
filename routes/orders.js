const dbtool = require('../dbtool.js')
const express = require('express')
const router = express.Router()

router.get('/', async function (req, res) {
    const [orders] = await dbtool.pool.execute({
        'sql':`
            SELECT * from orders
                JOIN restaurants ON restaurants.id = orders.restaurant_id;
            `,
        nestTables: true
    });
    const formattedOrders = orders.map((x) => {
        delete x.restaurants.id
        x.orders.createAt = new Date(x.orders.createAt).toISOString().split('T')[0]
        return Object.assign(x.orders, x.restaurants)
    })
    res.render('orders/list', {
        orders:formattedOrders
    })
});

router.get('/:id', async function (req, res) {
    const sql = "SELECT * from orders JOIN restaurants ON orders.restaurant_id = restaurants.id WHERE orders.id = ? ";
    const [orders] = await dbtool.pool.execute(sql, [req.params.id]);
    const order = orders[0]
    order.createAt = new Date(order.createAt).toISOString().split('T')[0]
    const sql2 = "select * from order_items JOIN menu_items ON order_items.menu_item_id = menu_items.id where order_id = ?";
    const [orderItems] = await dbtool.pool.execute({sql: sql2, nestTables: true}, [req.params.id]);
    const newOrderItems = orderItems.map((x) => {
        delete x.menu_items.id
        return Object.assign(x.order_items, x.menu_items)
    })

    res.render('orders/detail', {
        order, orderItems:newOrderItems
    })
});

// Delete
router.get('/:id/delete', async function (req, res) {
    const sql = "select * from orders where id = ?";
    const [orders] = await dbtool.pool.execute(sql, [req.params.id]);
    const order = orders[0];
    res.render('orders/delete', {
        order
    })
});

router.post('/:id/delete', async function (req, res) {
    const query = "DELETE FROM orders WHERE id = ?";
    await dbtool.pool.execute(query, [req.params.id]);
    res.redirect('/orders');
});

module.exports = router

