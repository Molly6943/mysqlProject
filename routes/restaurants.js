const dbtool = require('../dbtool.js')
const express = require('express')
const router = express.Router()

router.get('/', async function (req, res) {
    const [restaurants] = await dbtool.pool.execute({
        'sql': `
        SELECT * from restaurants;
        `
    });
    res.render('restaurants/list', {
        restaurants
    })
});

router.get('/:id/detail', async function (req, res) {
    const sql = "select * from restaurants where id = ?";
    const [restaurants] = await dbtool.pool.execute(sql, [req.params.id]);
    const restaurant = restaurants[0];

    const [menuItems] = await dbtool.pool.execute({ sql: `SELECT * from menu_items where restaurant_id = ?`}, [req.params.id]);
    res.render('restaurants/detail', {
        restaurant, menuItems
    })
});

router.get('/create', async function (req, res) {
    // const [companies] = await connection.execute(`SELECT * from Companies`);
    res.render("restaurants/create");
});

router.post('/create', async function (req, res) {
    const { name, description, location, contact } = req.body;
    const query = `
         INSERT INTO restaurants (name, description, location, contact) 
         VALUES (?, ?, ?, ?)
    `;
    // prepare the values in order of the question marks in the query
    const bindings = [name, description, location, contact];
    await dbtool.pool.execute(query, bindings);
    res.redirect('/restaurants');
});

router.get('/search', async function (req, res) {
    let sql = "SELECT * from restaurants WHERE 1";
    const bindings = [];
    if (req.query.searchTerms) {
        sql += ` AND (name LIKE ? OR location LIKE ?)`;
        bindings.push(`%${req.query.searchTerms}%`);
        bindings.push(`%${req.query.searchTerms}%`);
    }
    const [restaurants] = await dbtool.pool.execute(sql, bindings);
    res.render('restaurants/list', {
        restaurants
    });
});

// Delete
router.get('/:id/delete', async function (req, res) {
    const sql = "select * from restaurants where id = ?";
    const [restaurants] = await dbtool.pool.execute(sql, [req.params.id]);
    const restaurant = restaurants[0];
    res.render('restaurants/delete', {
        restaurant
    })
});

router.post('/:id/delete', async function (req, res) {
    const query = "DELETE FROM restaurants WHERE id = ?";
    await dbtool.pool.execute(query, [req.params.id]);
    res.redirect('/restaurants');
});

// update
router.get('/:id/update', async function (req, res) {
    const query = "SELECT * FROM restaurants WHERE id = ?";
    const [restaurants] = await dbtool.pool.execute(query, [req.params.id]);
    const restaurant = restaurants[0];
    // const [companies] = await dbtool.pool.execute(`SELECT * from Companies`);
    res.render('restaurants/update', {
        restaurant
    })
});

router.post('/:id/update', async function (req, res) {
    const { name, description, location, contact } = req.body;
    const query = `UPDATE restaurants SET name=?,
                                        description =?,
                                        location=?,
                                        contact=?
                                    WHERE id = ?
    `;
    const bindings = [name, description, location, contact, req.params.id];
    await dbtool.pool.execute(query, bindings);
    res.redirect('/restaurants');
})

// Display the form to create an menu item
router.get('/:id/menu/create', async function (req, res) {
    const query = "SELECT * FROM restaurants WHERE id = ?";
    const [restaurants] = await dbtool.pool.execute(query, [req.params.id]);
    const restaurant = restaurants[0];
    res.render("menuItems/create", {
        restaurant
    });
});

// Process the form to create an menu item
router.post('/:id/menu/create', async function (req, res) {
    const { name, description, price, category, status } = req.body;
    const query = `
    INSERT INTO menu_items (name, description, price, category, status, restaurant_id) 
    VALUES (?, ?, ?, ?, ?, ?)
`;
    const bindings = [name, description, parseInt(price), category, parseInt(status), parseInt(req.params.id)];
    try {
        await dbtool.pool.execute(query, bindings);
    } catch (err) {
        throw err;
    }

    res.redirect(`/restaurants/${req.params.id}/detail`);
});

// Delete menu item
router.get('/:restaurant_id/menu/:menu_item_id/delete', async function (req, res) {
    const sql = "select * from menu_items where id = ?";
    const [menuItems] = await dbtool.pool.execute(sql, [req.params.menu_item_id]);
    const menuItem = menuItems[0];
    res.render('menuItems/delete', {
        menuItem, restaurant_id: req.params.restaurant_id
    })
});

router.post('/:restaurant_id/menu/:menu_item_id/delete', async function (req, res) {
    const query = "DELETE FROM menu_items WHERE id = ?";
    await dbtool.pool.execute(query, [req.params.menu_item_id]);
    res.redirect(`/restaurants/${req.params.restaurant_id}`);
});

// update
router.get('/:restaurant_id/menu/:menu_item_id/update', async function (req, res) {
    const query = "SELECT * FROM restaurants WHERE id = ?";
    const [restaurants] = await dbtool.pool.execute(query, [req.params.restaurant_id]);
    const restaurant = restaurants[0];

    const query2 = "SELECT * FROM menu_items WHERE id = ?";
    const [menuItems] = await dbtool.pool.execute(query2, [req.params.menu_item_id]);
    const menuItem = menuItems[0];
    res.render('menuItems/update', {
        restaurant, menuItem
    })
});

router.post('/:restaurant_id/menu/:menu_item_id/update', async function (req, res) {
    const { name, description, price, category, status } = req.body;
    const query = `UPDATE menu_items SET name=?,
                                        description =?,
                                        price=?,
                                        category=?,
                                        status=?
                                    WHERE id = ?
    `;
    const bindings = [name, description, parseInt(price), category, parseInt(status), req.params.menu_item_id];
    await dbtool.pool.execute(query, bindings);
    res.redirect(`/restaurants/${req.params.restaurant_id}`);
})

// order
router.get('/:restaurant_id/menu/:menu_item_id/order', async function (req, res) {
    const query = "SELECT * FROM restaurants WHERE id = ?";
    const [restaurants] = await dbtool.pool.execute(query, [req.params.restaurant_id]);
    const restaurant = restaurants[0];

    const query2 = "SELECT * FROM menu_items WHERE id = ?";
    const [menuItems] = await dbtool.pool.execute(query2, [req.params.menu_item_id]);
    res.render('orders/confirmOrder', {
        restaurant, menuItems
    })
});

router.post('/:restaurant_id/menu/:menu_item_id/order', async function (req, res) {
    const query = "SELECT * FROM menu_items WHERE id = ?";
    const [menuItems] = await dbtool.pool.execute(query, [req.params.menu_item_id]);
    const menuItem = menuItems[0];

    const totalPrice = menuItem.price
    const createAt =  new Date().toISOString().split('T')[0]
    const updateAt = new Date().toISOString().split('T')[0]
    let status = 'Pending'
    let results = undefined

    const query2 = `
    INSERT INTO orders (createAt, updateAt, total, status, restaurant_id) 
    VALUES (?, ?, ?, ?, ?)
`;
    const bindings = [createAt, updateAt, parseInt(totalPrice), status, parseInt(req.params.restaurant_id)];
    try {
        [results] = await dbtool.pool.execute(query2, bindings);
    } catch (err) {
        throw err;
    }
    const newOrderId = results && results.insertId ? results.insertId : 0;
    const quantity = 1
    const query3 = `
    INSERT INTO order_items (quantity, subtotal, order_id, menu_item_id) 
    VALUES (?, ?, ?, ?)
`;
    const bindings3 = [quantity, parseInt(totalPrice), parseInt(newOrderId), parseInt(req.params.menu_item_id)];
    try {
        if (newOrderId) {
            await dbtool.pool.execute(query3, bindings3);
        }
    } catch (err) {
        throw err;
    }

    res.redirect(`/orders/${newOrderId}`);
});

module.exports = router
