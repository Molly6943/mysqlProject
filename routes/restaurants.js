const dbtool = require('../dbtool.js')
const express = require('express')
const router = express.Router()

router.get('/restaurants', async function (req, res) {
    // we want the first element from the array returned from connection.execute
    const [restaurants] = await dbtool.pool.execute({
        'sql':`
        SELECT * from restaurants
            JOIN menu_items ON restaurants.id = menu_items.restaurant_id;
        `,
        nestTables: true
    });
    console.log(restaurants);
    // same as: const restaurants = await connection.execute("SELECT * from restaurants")[0];
    res.render('restaurants/index', {
        restaurants
    })
});

// display the form to create a new customer
router.get('/restaurants/create', async function (req, res) {
    const [companies] = await connection.execute(`SELECT * from Companies`);
    res.render("restaurants/create", {
        companies
    });
});

// process the form to create a new customer
router.post('/restaurants/create', async function (req, res) {
    // Using RAW QUERIES -- DANGEROUS! Vulnerable to SQL injections
    // const { first_name, last_name, rating, company_id} = req.body;
    // const query = `
    //      INSERT INTO restaurants (first_name, last_name, rating, company_id) 
    //      VALUES ('${first_name}', '${last_name}', ${rating}, ${company_id})
    // `;
    // await connection.execute(query);
    // res.redirect('/restaurants');

    // USING PRPEARED SQL STATEMENTS
    const { first_name, last_name, rating, company_id } = req.body;
    const query = `
         INSERT INTO restaurants (first_name, last_name, rating, company_id) 
         VALUES (?, ?, ?, ?)
    `;
    // prepare the values in order of the question marks in the query
    const bindings = [first_name, last_name, parseInt(rating), parseInt(company_id)];
    await connection.execute(query, bindings);
    res.redirect('/restaurants');
});

router.get('/restaurants/search', async function (req, res) {

    let sql = "SELECT * from restaurants WHERE 1";
    const bindings = [];
    if (req.query.searchTerms) {
        sql += ` AND (first_name LIKE ? OR last_name LIKE ?)`;
        bindings.push(`%${req.query.searchTerms}%`);
        bindings.push(`%${req.query.searchTerms}%`);
    }

    const [restaurants] = await connection.execute(sql, bindings);

    res.render('restaurants/search-form', {
        restaurants
    });
});

// Delete
router.get('/restaurants/:customer_id/delete', async function (req, res) {
    const sql = "select * from restaurants where customer_id = ?";
    // connection.execute will ALWAYS return an array even if it is just one result
    // that one result will be the only element in the array
    const [restaurants] = await connection.execute(sql, [req.params.customer_id]);
    const customer = restaurants[0];
    res.render('restaurants/delete', {
        customer,
    })
});

// for this to be secure, there must be JWT authentication
// and there must be differnation between access rights
// Can consider not use auto_increment for primary key but use UUID instead
router.post('/restaurants/:customer_id/delete', async function (req, res) {
    const query = "DELETE FROM restaurants WHERE customer_id = ?";
    await connection.execute(query, [req.params.customer_id]);
    res.redirect('/restaurants');
});

router.get('/restaurants/:customer_id/update', async function (req, res) {
    const query = "SELECT * FROM restaurants WHERE customer_id = ?";
    const [restaurants] = await connection.execute(query, [req.params.customer_id]);
    const customer = restaurants[0];

    const [companies] = await connection.execute(`SELECT * from Companies`);

    res.render('restaurants/update', {
        customer, companies
    })
});

router.post('/restaurants/:customer_id/update', async function (req, res) {
    const { first_name, last_name, rating, company_id } = req.body;
    const query = `UPDATE restaurants SET first_name=?,
                                        last_name =?,
                                        rating=?,
                                        company_id=?
                                    WHERE customer_id = ?
    `;
    const bindings = [first_name, last_name, rating, company_id, req.params.customer_id];
    await connection.execute(query, bindings);
    res.redirect('/restaurants');
})

// Display the form to create a new employee
router.get('/employees/create', async function (req, res) {
    const [departments] = await connection.execute(`SELECT * from Departments`);
    const [restaurants] = await connection.execute(`SELECT * FROM restaurants`);
  
    res.render("employees/create", {
        departments, restaurants
    });
});

// Process the form to create a new employee
router.post('/employees/create', async function (req, res) {
    const { first_name, last_name, department_id, restaurants  } = req.body;
    const query = `
    INSERT INTO Employees (first_name, last_name, department_id) 
    VALUES (?, ?, ?)
`;
    const bindings = [first_name, last_name, parseInt(department_id)];
    const [results] = await connection.execute(query, bindings);
    
    // The employee has been created, get the ID of the new employee
    const newEmployeeId = results.insertId; 

    for (let c of restaurants) {
        const query = `INSERT INTO EmployeeCustomer (employee_id, customer_id)
            VALUES (?, ?)
        `;
        await connection.execute(query, [newEmployeeId, c])
    }

    res.redirect('/employees');
});

// Route to display a table of employees
router.get('/employees', async function (req, res) {
    const [employees] = await connection.execute(`
    SELECT Employees.employee_id, Employees.first_name, Employees.last_name, Departments.name AS department_name
    FROM Employees
    JOIN Departments ON Employees.department_id = Departments.department_id;
`);
    res.render('employees/index', {
        employees
    });
});

module.exports = router
