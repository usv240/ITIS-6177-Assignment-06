const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2/promise'); // MySQL library
const mariadb = require('mariadb'); // MariaDB library
const bodyParser = require('body-parser');
const { body, param, validationResult } = require('express-validator'); // Validation
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

app.use(bodyParser.json());

// MySQL connection pool (replace with MariaDB or MySQL based on your environment)
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // Replace with your MySQL or MariaDB root password
  database: 'sample', // Replace with your database name
  port: 3306, // Default port for MySQL/MariaDB
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
 *                 description: Opening amount
 *               RECEIVE_AMT:
 *                 type: number
 *                 description: Receive amount
 *               PAYMENT_AMT:
 *                 type: number
 *                 description: Payment amount
 *               OUTSTANDING_AMT:
 *                 type: number
 *                 description: Outstanding amount
 *               PHONE_NO:
 *                 type: string
 *                 description: Phone number of the customer
 *               AGENT_CODE:
 *                 type: string
 *                 description: Agent code
 *     responses:
 *       201:
 *         description: Customer added successfully
 *       500:
 *         description: Internal server error
 */
// POST request to add a new customer
app.post('/customer', [
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
  body('AGENT_CODE').isString().optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  let conn;
  try {
    console.log("Received customer data:", req.body);
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

    console.log("Executing query:", query);

    const result = await conn.query(query, [
      CUST_CODE, CUST_NAME, CUST_CITY, WORKING_AREA, CUST_COUNTRY, GRADE, 
      OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, PHONE_NO, AGENT_CODE
    ]);

    console.log("Query result:", result);

    // Convert BigInt to string before sending response
    const formattedResult = {
      ...result,
      insertId: result.insertId.toString()  // Convert BigInt to string
    };

    res.status(201).json({ message: 'Customer added successfully!', result: formattedResult });

  } catch (err) {
    console.error("Error adding customer:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});


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
app.patch('/customer/:id', [
  param('id').isString(),
  body('CUST_CITY').isString().optional(),
  body('CUST_COUNTRY').isString().optional(),
  body('GRADE').isDecimal().optional(),
  body('OPENING_AMT').isDecimal().optional(),
  body('RECEIVE_AMT').isDecimal().optional(),
  body('PAYMENT_AMT').isDecimal().optional(),
  body('OUTSTANDING_AMT').isDecimal().optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  let conn;
  try {
    console.log("Received update data:", req.body);
    conn = await pool.getConnection();

    const { CUST_CITY, CUST_COUNTRY, GRADE, OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT } = req.body;

    const query = `
      UPDATE customer 
      SET CUST_CITY = ?, CUST_COUNTRY = ?, GRADE = ?, OPENING_AMT = ?, RECEIVE_AMT = ?, PAYMENT_AMT = ?, OUTSTANDING_AMT = ?
      WHERE CUST_CODE = ?`;

    console.log("Executing query:", query);

    const result = await conn.query(query, [
      CUST_CITY, CUST_COUNTRY, GRADE, OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, req.params.id
    ]);

    console.log("Query result:", result);

    if (result.affectedRows === 0) {
      console.log("Customer not found with CUST_CODE:", req.params.id);
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Convert BigInt to string before sending response
    const formattedResult = {
      ...result,
      affectedRows: result.affectedRows.toString(),  // Convert BigInt to string
      insertId: result.insertId ? result.insertId.toString() : null  // Convert if exists
    };

    console.log("Formatted result:", formattedResult);

    res.json({ message: 'Customer updated successfully!', result: formattedResult });
  } catch (err) {
    console.error("Error during PATCH request:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});


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
app.put('/customer/:id', [
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
  body('AGENT_CODE').isString().optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  let conn;
  try {
    console.log("Received replace data:", req.body);
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

    console.log("Executing query:", query);

    const result = await conn.query(query, [
      CUST_NAME, CUST_CITY, WORKING_AREA, CUST_COUNTRY, GRADE, 
      OPENING_AMT, RECEIVE_AMT, PAYMENT_AMT, OUTSTANDING_AMT, PHONE_NO, AGENT_CODE, req.params.id
    ]);

    console.log("Query result:", result);

    if (result.affectedRows === 0) {
      console.log("Customer not found with CUST_CODE:", req.params.id);
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Convert BigInt to string before sending response
    const formattedResult = {
      ...result,
      affectedRows: result.affectedRows.toString(),  // Convert BigInt to string
      insertId: result.insertId ? result.insertId.toString() : null  // Convert if exists
    };

    res.json({ message: 'Customer replaced successfully!', result: formattedResult });
  } catch (err) {
    console.error("Error during PUT request:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

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

      res.json(result[0]);
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


/**
 * @swagger
 * /agent:
 *   post:
 *     summary: Add a new agent
 *     description: Adds a new agent to the database.
 *     tags:
 *       - Agents
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               AGENT_CODE:
 *                 type: string
 *                 description: The unique code of the agent
 *               AGENT_NAME:
 *                 type: string
 *                 description: Name of the agent
 *               WORKING_AREA:
 *                 type: string
 *                 description: Working area of the agent
 *               COMMISSION:
 *                 type: number
 *                 description: Commission percentage of the agent
 *               PHONE_NO:
 *                 type: string
 *                 description: Phone number of the agent
 *               COUNTRY:
 *                 type: string
 *                 description: Country of the agent
 *     responses:
 *       201:
 *         description: Agent added successfully
 *       400:
 *         description: Validation errors
 *       500:
 *         description: Internal server error
 */
app.post('/agent', [
  body('AGENT_CODE').isString().notEmpty(),
  body('AGENT_NAME').isString().notEmpty(),
  body('WORKING_AREA').isString().optional(),
  body('COMMISSION').isDecimal().optional(),
  body('PHONE_NO').isString().optional(),
  body('COUNTRY').isString().optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let conn;
  try {
    console.log("Received agent data:", req.body);
    conn = await pool.getConnection();

    const {
      AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY
    } = req.body;

    const query = `
      INSERT INTO agents 
      (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY)
      VALUES (?, ?, ?, ?, ?, ?)`;

    const result = await conn.query(query, [
      AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY
    ]);

    console.log("Query result:", result);

    res.status(201).json({ message: 'Agent added successfully!', result });
  } catch (err) {
    console.error("Error adding agent:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});


/**
 * @swagger
 * /agent/{id}:
 *   get:
 *     summary: Get an agent by AGENT_CODE
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent details
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Internal server error
 */

// GET request to retrieve an agent by AGENT_CODE
app.get('/agent/:id', [
  param('id').isString(),
], async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("SELECT * FROM agents WHERE AGENT_CODE = ?", [req.params.id]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});


/**
 * @swagger
 * /agent/{id}:
 *   put:
 *     summary: Replace an agent's entire data
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
 *               AGENT_NAME:
 *                 type: string
 *               WORKING_AREA:
 *                 type: string
 *               COMMISSION:
 *                 type: number
 *               PHONE_NO:
 *                 type: string
 *               COUNTRY:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent replaced successfully
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Internal server error
 */

// PUT request to replace an agent's data by AGENT_CODE
app.put('/agent/:id', [
  param('id').isString(),
  body('AGENT_NAME').isString().notEmpty(),
  body('WORKING_AREA').isString().optional(),
  body('COMMISSION').isDecimal().optional(),
  body('PHONE_NO').isString().optional(),
  body('COUNTRY').isString().optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const {
      AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY
    } = req.body;

    const query = `
      UPDATE agents 
      SET AGENT_NAME = ?, WORKING_AREA = ?, COMMISSION = ?, PHONE_NO = ?, COUNTRY = ?
      WHERE AGENT_CODE = ?`;

    const result = await conn.query(query, [
      AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY, req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json({ message: 'Agent updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /company/{id}:
 *   get:
 *     summary: Get a company by COMPANY_ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company details
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
// GET request to retrieve a company by COMPANY_ID
app.get('/company/:id', [
  param('id').isString(),
], async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("SELECT * FROM company WHERE COMPANY_ID = ?", [req.params.id]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * @swagger
 * /company/{id}:
 *   put:
 *     summary: Replace a company's entire data
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
 *               COMPANY_NAME:
 *                 type: string
 *               COMPANY_CITY:
 *                 type: string
 *     responses:
 *       200:
 *         description: Company replaced successfully
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
// PUT request to replace a company's data by COMPANY_ID
app.put('/company/:id', [
  param('id').isString(),
  body('COMPANY_NAME').isString().notEmpty(),
  body('COMPANY_CITY').isString().optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const { COMPANY_NAME, COMPANY_CITY } = req.body;

    const query = `
      UPDATE company 
      SET COMPANY_NAME = ?, COMPANY_CITY = ?
      WHERE COMPANY_ID = ?`;

    const result = await conn.query(query, [COMPANY_NAME, COMPANY_CITY, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company updated successfully!' });
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
