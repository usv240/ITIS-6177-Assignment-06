const express = require('express');
const app = express();
const port = 3000;
const mariadb = require('mariadb');
const bodyParser = require('body-parser');
const { body, param, validationResult } = require('express-validator'); // Validation
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

app.use(bodyParser.json());

// MariaDB connection pool
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'sample',
  port: 3306,
  connectionLimit: 5
});

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Customer API',
      version: '1.0.0',
    },
  },
  apis: ['./server.js'], // Paths to files for swagger docs
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /customer:
 *   post:
 *     summary: Add a new customer
 *     description: Adds a new customer to the database.
 *     tags:
 *       - Customers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CUST_NAME:
 *                 type: string
 *               CUST_CITY:
 *                 type: string
 *               WORKING_AREA:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer added successfully
 *       500:
 *         description: Internal server error
 */
// POST request (Add a new customer)
app.post('/customer',
  body('CUST_NAME').isString().notEmpty(), // Validate
  body('CUST_CITY').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let conn;
    try {
      conn = await pool.getConnection();
      const { CUST_NAME, CUST_CITY, WORKING_AREA } = req.body;
      const query = "INSERT INTO customer (CUST_NAME, CUST_CITY, WORKING_AREA) VALUES (?, ?, ?)";
      const result = await conn.query(query, [CUST_NAME, CUST_CITY, WORKING_AREA]);

      res.status(201).json({ message: 'Customer added successfully!', result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
});

/**
 * @swagger
 * /customer/{id}:
 *   patch:
 *     summary: Update a customer's city
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CUST_CITY:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// PATCH request (Update a customer's city)
app.patch('/customer/:id',
  param('id').isInt(),
  body('CUST_CITY').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let conn;
    try {
      conn = await pool.getConnection();
      const { CUST_CITY } = req.body;
      const query = "UPDATE customer SET CUST_CITY = ? WHERE CUST_CODE = ?";
      const result = await conn.query(query, [CUST_CITY, req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json({ message: 'Customer city updated successfully!', result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
});

/**
 * @swagger
 * /customer/{id}:
 *   put:
 *     summary: Replace a customer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CUST_NAME:
 *                 type: string
 *               CUST_CITY:
 *                 type: string
 *               WORKING_AREA:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer replaced successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// PUT request (Replace a customer)
app.put('/customer/:id',
  param('id').isInt(),
  body('CUST_NAME').isString().notEmpty(),
  body('CUST_CITY').isString().notEmpty(),
  body('WORKING_AREA').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let conn;
    try {
      conn = await pool.getConnection();
      const { CUST_NAME, CUST_CITY, WORKING_AREA } = req.body;
      const query = "UPDATE customer SET CUST_NAME = ?, CUST_CITY = ?, WORKING_AREA = ? WHERE CUST_CODE = ?";
      const result = await conn.query(query, [CUST_NAME, CUST_CITY, WORKING_AREA, req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json({ message: 'Customer replaced successfully!', result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
});

/**
 * @swagger
 * /customer/{id}:
 *   delete:
 *     summary: Delete a customer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// DELETE request (Remove a customer)
app.delete('/customer/:id',
  param('id').isInt(),
  async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query("DELETE FROM customer WHERE CUST_CODE = ?", [req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json({ message: 'Customer deleted successfully!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
});

/**
 * @swagger
 * /customers/city/{city}:
 *   get:
 *     summary: Get customers by city
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of customers
 *       404:
 *         description: No customers found
 *       500:
 *         description: Internal server error
 */
// GET customers by city (Sanitized Input Example)
app.get('/customers/city/:city',
  param('city').isString().trim().escape(),
  async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT * FROM customer WHERE CUST_CITY LIKE ?", [`%${req.params.city}%`]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'No customers found in this city' });
      }

      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
});

// Start the server
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
