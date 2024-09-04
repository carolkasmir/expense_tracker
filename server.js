const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Database setup with connection pooling
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10 // Connection pool limit
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/add-expense', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add-expense.html'));
});

app.get('/edit-expense', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'edit-expense.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Serve predefined categories
app.get('/api/categories', (req, res) => {
    const categories = [
        'Food', 'Housing', 'Transportation', 'Utilities', 'Books & Supplies',
        'Entertainment', 'Personal Care', 'Technology', 'Health & Wellness',
        'Miscellaneous', 'Education', 'Clothing', 'Gifts', 'Travel', 'Dining Out'
    ];
    res.status(200).json(categories);
});

// User registration
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error registering user:', err);
                res.status(500).send('Error registering user');
            } else {
                res.status(200).send('User registered successfully');
            }
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Error registering user');
    }
});

// User login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT user_id, password FROM users WHERE username = ?';
    db.query(query, [username], async (err, result) => {
        if (err) {
            console.error('Error querying user:', err);
            res.status(500).json({ message: 'Error querying user' });
        } else if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
            res.status(401).json({ message: 'Invalid credentials' });
        } else {
            const userId = result[0].user_id;
            res.status(200).json({ userId, message: 'Login successful' });
        }
    });
});

const expenseSchema = Joi.object({
    user_id: Joi.number().required(),
    category: Joi.string().valid('Food', 'Transport', 'Housing', 'Entertainment', 'Personal Care').required(),
    amount: Joi.number().precision(2).required(),
    description: Joi.string().optional(),
    date: Joi.date().iso().required()
});

app.post('/api/expenses', (req, res) => {
    const { error } = expenseSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    const { user_id, category, amount, description, date } = req.body;
    const query = 'INSERT INTO expenses (user_id, category, amount, description, date) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [user_id, category, amount, description, date], (err, result) => {
        if (err) {
            console.error('Error adding expense:', err);
            res.status(500).send('Error adding expense');
        } else {
            res.status(200).send('Expense added successfully');
        }
    });
});

// Get expenses
app.get('/api/expenses', (req, res) => {
    const { user_id, category, date } = req.query;
    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [user_id];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    if (date) {
        query += ' AND date = ?';
        params.push(date);
    }

    db.query(query, params, (err, result) => {
        if (err) {
            console.error('Error fetching expenses:', err);
            res.status(500).send('Error fetching expenses');
        } else {
            res.status(200).json(result);
        }
    });
});

// Get expense by ID
app.get('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM expenses WHERE expense_id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error fetching expense:', err);
            res.status(500).send('Error fetching expense');
        } else if (result.length === 0) {
            res.status(404).send('Expense not found');
        } else {
            res.status(200).json(result[0]);
        }
    });
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    const { category, amount, description, date } = req.body;
    const query = 'UPDATE expenses SET category = ?, amount = ?, description = ?, date = ? WHERE expense_id = ?';
    db.query(query, [category, amount, description, date, id], (err, result) => {
        if (err) {
            console.error('Error updating expense:', err);
            res.status(500).send('Error updating expense');
        } else {
            res.status(200).send('Expense updated successfully');
        }
    });
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM expenses WHERE expense_id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting expense:', err);
            res.status(500).send('Error deleting expense');
        } else {
            res.status(200).send('Expense deleted successfully');
        }
    });
});

// Update Profile Information
app.put('/api/users/:userId', (req, res) => {
    const { userId } = req.params;
    const { username, email } = req.body;
    const query = 'UPDATE users SET username = ?, email = ? WHERE user_id = ?';
    db.query(query, [username, email, userId], (err, result) => {
        if (err) {
            console.error('Error updating profile:', err);
            res.status(500).send('Error updating profile');
        } else {
            res.status(200).send('Profile updated successfully');
        }
    });
});

// Change Password
app.put('/api/users/:userId/password', async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check current password
    const query = 'SELECT password FROM users WHERE user_id = ?';
    db.query(query, [userId], async (err, result) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).send('Error fetching user');
        } else if (result.length === 0 || !(await bcrypt.compare(currentPassword, result[0].password))) {
            res.status(401).send('Current password is incorrect');
        } else {
            // Update to new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updateQuery = 'UPDATE users SET password = ? WHERE user_id = ?';
            db.query(updateQuery, [hashedPassword, userId], (err) => {
                if (err) {
                    console.error('Error updating password:', err);
                    res.status(500).send('Error updating password');
                } else {
                    res.status(200).send('Password changed successfully');
                }
            });
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.status(200).send('Logout successful');
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});