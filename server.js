const express = require('express');
const app = express();
const port = 3000;
const mariadb = require('mariadb'); // MariaDB library
const bodyParser = require('body-parser');
const { body, param, validationResult } = require('express-validator'); // Validation
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

app.use(bodyParser.json());

// MariaDB connection pool
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // Replace with your MariaDB root password
  database: 'sample', // Replace with your database name
  port: 3306, // Default port for MariaDB
  connectionLimit: 5,
  bigNumberStrings: true, // This ensures BigInt is treated as a string
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
 * Utility function to convert BigInt values to strings
 */
function handleBigInt(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'bigint') {
      obj[key] = obj[key].toString(); // Convert BigInt to string
    }
  }
  return obj;
}

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
 *               CUST_CODE:
 *                 type: string
 *                 description: The unique code of the customer
 *               CUST_NAME:
 *                 type: string
 *               CUST_CITY:
 *                 type: string
 *               WORKING_AREA:
 *                 type: string
 *               CUST_COUNTRY:
 *                 type: string
 *               GRADE:
 *                 type: number
 *               OPENING_AMT:
 *                 type: number
 *               RECEIVE_AMT:
 *                 type: number
 *               PAYMENT_AMT:
 *                 type: number
 *               OUTSTANDING_AMT:
 *                 type: number
 *               PHONE_NO:
 *                 type: string
 *               AGENT_CODE:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer added successfully
 *       500:
 *         description: Internal server error
 */
// POST request (Add a new customer)
app.post('/customer',
  body('CUST_CODE').isString().notEmpty(),
  body('CUST_NAME').isString().notEmpty(),
  body('CUST_CITY').isString().optional(),
  body('WORKING_AREA').isString().notEmpty(),
  body('CUST_COUNTRY').isString().notEmpty(),
  body('GRADE').isDecimal().optional(),
  body('OPENING_AMT').isDecimal().notEmpty(),
  body('RECEIVE_AMT').isDecimal().notEmpty(),
  body('PAYMENT_AMT').isDecimal().notEmpty(),
  body('OUTSTANDING_AMT').isDecimal().notEmpty(),
  body('PHONE_NO').isString().notEmpty(),
  body('AGENT_CODE').isString().optional(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let conn;
    try {
      conn = await pool.getConnection();
      const {
        CUST_CODE, CUST_NAME, CUST_CITY, WORKING_AREA, CUST_COUNTRY, GRADE,
        OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, PHONE_NO, AGENT_CODE
      } = req.body;

      const query = `
        INSERT INTO customer 
        (CUST_CODE, CUST_NAME, CUST_CITY, WORKING_AREA, CUST_COUNTRY, GRADE, 
        OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, PHONE_NO, AGENT_CODE)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const result = await conn.query(query, [
        CUST_CODE, CUST_NAME, CUST_CITY, WORKING_AREA, CUST_COUNTRY, GRADE,
        OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, PHONE_NO, AGENT_CODE
      ]);

      res.status(201).json({ message: 'Customer added successfully!', result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
  }
);

/**
 * @swagger
 * /customer/{id}:
 *   patch:
 *     summary: Update a customer's city and country
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CUST_CITY:
 *                 type: string
 *               CUST_COUNTRY:
 *                 type: string
 *               GRADE:
 *                 type: number
 *               OPENING_AMT:
 *                 type: number
 *               RECEIVE_AMT:
 *                 type: number
 *               PAYMENT_AMT:
 *                 type: number
 *               OUTSTANDING_AMT:
 *                 type: number
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// PATCH request (Update a customer's information)
app.patch('/customer/:id',
  param('id').isString(),
  body('CUST_CITY').isString().optional(),
  body('CUST_COUNTRY').isString().optional(),
  body('GRADE').isDecimal().optional(),
  body('OPENING_AMT').isDecimal().optional(),
  body('RECEIVE_AMT').isDecimal().optional(),
  body('PAYMENT_AMT').isDecimal().optional(),
  body('OUTSTANDING_AMT').isDecimal().optional(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let conn;
    try {
      conn = await pool.getConnection();
      const { CUST_CITY, CUST_COUNTRY, GRADE, OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT } = req.body;
      const query = `
        UPDATE customer 
        SET CUST_CITY = ?, CUST_COUNTRY = ?, GRADE = ?, OPENING_AMT = ?, RECEIVE_AMT = ?, PAYMENT_AMT = ?, OUTSTANDING_AMT = ?
        WHERE CUST_CODE = ?`;

      const result = await conn.query(query, [
        CUST_CITY, CUST_COUNTRY, GRADE, OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, req.params.id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json({ message: 'Customer updated successfully!', result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
  }
);

/**
 * @swagger
 * /customer/{id}:
 *   put:
 *     summary: Replace a customer's entire data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CUST_CODE:
 *                 type: string
 *               CUST_NAME:
 *                 type: string
 *               CUST_CITY:
 *                 type: string
 *               WORKING_AREA:
 *                 type: string
 *               CUST_COUNTRY:
 *                 type: string
 *               GRADE:
 *                 type: number
 *               OPENING_AMT:
 *                 type: number
 *               RECEIVE_AMT:
 *                 type: number
 *               PAYMENT_AMT:
 *                 type: number
 *               OUTSTANDING_AMT:
 *                 type: number
 *               PHONE_NO:
 *                 type: string
 *               AGENT_CODE:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer replaced successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// PUT request (Replace a customer's entire data)
app.put('/customer/:id',
  param('id').isString(),
  body('CUST_NAME').isString().notEmpty(),
  body('CUST_CITY').isString().optional(),
  body('WORKING_AREA').isString().notEmpty(),
  body('CUST_COUNTRY').isString().notEmpty(),
  body('GRADE').isDecimal().optional(),
  body('OPENING_AMT').isDecimal().notEmpty(),
  body('RECEIVE_AMT').isDecimal().notEmpty(),
  body('PAYMENT_AMT').isDecimal().notEmpty(),
  body('OUTSTANDING_AMT').isDecimal().notEmpty(),
  body('PHONE_NO').isString().notEmpty(),
  body('AGENT_CODE').isString().optional(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let conn;
    try {
      conn = await pool.getConnection();
      const {
        CUST_NAME, CUST_CITY, WORKING_AREA, CUST_COUNTRY, GRADE,
        OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, PHONE_NO, AGENT_CODE
      } = req.body;

      const query = `
        UPDATE customer 
        SET CUST_NAME = ?, CUST_CITY = ?, WORKING_AREA = ?, CUST_COUNTRY = ?, GRADE = ?, 
        OPENING_AMT = ?, RECEIVE_AMT = ?, PAYMENT_AMT = ?, OUTSTANDING_AMT = ?, PHONE_NO = ?, AGENT_CODE = ?
        WHERE CUST_CODE = ?`;

      const result = await conn.query(query, [
        CUST_NAME, CUST_CITY, WORKING_AREA, CUST_COUNTRY, GRADE,
        OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, PHONE_NO, AGENT_CODE, req.params.id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json({ message: 'Customer replaced successfully!', result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
  }
);

/**
 * @swagger
 * /customer/{id}:
 *   get:
 *     summary: Get a customer by CUST_CODE
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// GET request (Get customer by CUST_CODE)
app.get('/customer/:id',
  param('id').isString(),
  async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query("SELECT * FROM customer WHERE CUST_CODE = ?", [req.params.id]);

      if (result.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Convert BigInt fields to string
      const customerData = handleBigInt(result[0]);

      res.json(customerData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (conn) conn.release();
    }
  }
);

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
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// DELETE request (Delete customer by CUST_CODE)
app.delete('/customer/:id',
  param('id').isString(),
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
  }
);

// Start the server
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
