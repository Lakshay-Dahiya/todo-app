const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database setup
const dbPath = path.join(__dirname, '../data/todos.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database schema
function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
            category TEXT DEFAULT '',
            due_date DATE,
            order_index INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Database table initialized');
            // Add new columns if they don't exist (for existing databases)
            const alterQueries = [
                `ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high'))`,
                `ALTER TABLE todos ADD COLUMN category TEXT DEFAULT ''`,
                `ALTER TABLE todos ADD COLUMN due_date DATE`,
                `ALTER TABLE todos ADD COLUMN order_index INTEGER DEFAULT 0`
            ];
            
            alterQueries.forEach(query => {
                db.run(query, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding column:', err.message);
                    }
                });
            });
        }
    });
}

// Utility functions
function handleDatabaseError(res, err, operation) {
    console.error(`Database error during ${operation}:`, err.message);
    res.status(500).json({
        success: false,
        message: 'Database operation failed',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
}

function formatTodo(row) {
    return {
        id: row.id,
        text: row.text,
        priority: row.priority || 'medium',
        category: row.category || '',
        dueDate: row.due_date || null,
        orderIndex: row.order_index || 0,
        completed: Boolean(row.completed),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

// API Routes

// GET /api/todos - Get all todos
app.get('/api/todos', (req, res) => {
    const query = 'SELECT * FROM todos ORDER BY order_index ASC, created_at DESC';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return handleDatabaseError(res, err, 'fetching todos');
        }
        
        const todos = rows.map(formatTodo);
        res.json({
            success: true,
            data: todos,
            count: todos.length
        });
    });
});

// GET /api/todos/:id - Get a specific todo
app.get('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM todos WHERE id = ?';
    
    db.get(query, [id], (err, row) => {
        if (err) {
            return handleDatabaseError(res, err, 'fetching todo');
        }
        
        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
        }
        
        res.json({
            success: true,
            data: formatTodo(row)
        });
    });
});

// POST /api/todos - Create a new todo
app.post('/api/todos', (req, res) => {
    const { text, priority = 'medium', category = '', dueDate = null } = req.body;
    
    if (!text || text.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Todo text is required'
        });
    }
    
    if (text.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'Todo text cannot exceed 500 characters'
        });
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({
            success: false,
            message: 'Priority must be low, medium, or high'
        });
    }

    // Validate due date if provided
    if (dueDate && isNaN(Date.parse(dueDate))) {
        return res.status(400).json({
            success: false,
            message: 'Invalid due date format'
        });
    }
    
    // Get the highest order index and add 1
    db.get('SELECT MAX(order_index) as max_order FROM todos', [], (err, row) => {
        if (err) {
            return handleDatabaseError(res, err, 'getting max order');
        }
        
        const orderIndex = (row.max_order || 0) + 1;
        const query = 'INSERT INTO todos (text, priority, category, due_date, order_index) VALUES (?, ?, ?, ?, ?)';
        
        db.run(query, [text.trim(), priority, category.trim(), dueDate, orderIndex], function(err) {
            if (err) {
                return handleDatabaseError(res, err, 'creating todo');
            }
            
            // Fetch the created todo
            const selectQuery = 'SELECT * FROM todos WHERE id = ?';
            db.get(selectQuery, [this.lastID], (err, row) => {
                if (err) {
                    return handleDatabaseError(res, err, 'fetching created todo');
                }
                
                res.status(201).json({
                    success: true,
                    data: formatTodo(row),
                    message: 'Todo created successfully'
                });
            });
        });
    });
});

// PUT /api/todos/:id - Update a todo
app.put('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const { text, completed, priority, category, dueDate, orderIndex } = req.body;
    
    if (text !== undefined && (!text || text.trim().length === 0)) {
        return res.status(400).json({
            success: false,
            message: 'Todo text cannot be empty'
        });
    }
    
    if (text && text.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'Todo text cannot exceed 500 characters'
        });
    }

    if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({
            success: false,
            message: 'Priority must be low, medium, or high'
        });
    }

    if (dueDate !== undefined && dueDate !== null && isNaN(Date.parse(dueDate))) {
        return res.status(400).json({
            success: false,
            message: 'Invalid due date format'
        });
    }
    
    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];
    
    if (text !== undefined) {
        updates.push('text = ?');
        values.push(text.trim());
    }
    
    if (completed !== undefined) {
        updates.push('completed = ?');
        values.push(completed ? 1 : 0);
    }

    if (priority !== undefined) {
        updates.push('priority = ?');
        values.push(priority);
    }

    if (category !== undefined) {
        updates.push('category = ?');
        values.push(category.trim());
    }

    if (dueDate !== undefined) {
        updates.push('due_date = ?');
        values.push(dueDate);
    }

    if (orderIndex !== undefined) {
        updates.push('order_index = ?');
        values.push(orderIndex);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No valid fields provided for update'
        });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
        if (err) {
            return handleDatabaseError(res, err, 'updating todo');
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
        }
        
        // Fetch the updated todo
        const selectQuery = 'SELECT * FROM todos WHERE id = ?';
        db.get(selectQuery, [id], (err, row) => {
            if (err) {
                return handleDatabaseError(res, err, 'fetching updated todo');
            }
            
            res.json({
                success: true,
                data: formatTodo(row),
                message: 'Todo updated successfully'
            });
        });
    });
});

// DELETE /api/todos/:id - Delete a todo
app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM todos WHERE id = ?';
    
    db.run(query, [id], function(err) {
        if (err) {
            return handleDatabaseError(res, err, 'deleting todo');
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Todo deleted successfully'
        });
    });
});

// DELETE /api/todos - Delete all completed todos
app.delete('/api/todos', (req, res) => {
    const query = 'DELETE FROM todos WHERE completed = 1';
    
    db.run(query, [], function(err) {
        if (err) {
            return handleDatabaseError(res, err, 'deleting completed todos');
        }
        
        res.json({
            success: true,
            message: `${this.changes} completed todo(s) deleted`,
            deletedCount: this.changes
        });
    });
});

// PUT /api/todos/bulk - Bulk update todos
app.put('/api/todos/bulk', (req, res) => {
    const { operation, todoIds, data } = req.body;
    
    if (!operation || !Array.isArray(todoIds) || todoIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Operation and todoIds array are required'
        });
    }

    const placeholders = todoIds.map(() => '?').join(',');
    let query, values;

    switch (operation) {
        case 'complete':
            query = `UPDATE todos SET completed = 1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
            values = todoIds;
            break;
        case 'uncomplete':
            query = `UPDATE todos SET completed = 0, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
            values = todoIds;
            break;
        case 'delete':
            query = `DELETE FROM todos WHERE id IN (${placeholders})`;
            values = todoIds;
            break;
        case 'reorder':
            // For reordering, data should contain array of {id, orderIndex}
            if (!data || !Array.isArray(data)) {
                return res.status(400).json({
                    success: false,
                    message: 'Reorder operation requires data array with id and orderIndex'
                });
            }
            
            // Use transaction for reordering
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                let completed = 0;
                let hasError = false;
                
                data.forEach(item => {
                    db.run('UPDATE todos SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                        [item.orderIndex, item.id], function(err) {
                        if (err) {
                            hasError = true;
                            db.run('ROLLBACK');
                            return handleDatabaseError(res, err, 'reordering todos');
                        }
                        
                        completed++;
                        if (completed === data.length && !hasError) {
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    return handleDatabaseError(res, err, 'committing reorder');
                                }
                                res.json({
                                    success: true,
                                    message: `${data.length} todos reordered successfully`
                                });
                            });
                        }
                    });
                });
            });
            return;
        default:
            return res.status(400).json({
                success: false,
                message: 'Invalid operation. Supported: complete, uncomplete, delete, reorder'
            });
    }
    
    db.run(query, values, function(err) {
        if (err) {
            return handleDatabaseError(res, err, `bulk ${operation}`);
        }
        
        res.json({
            success: true,
            message: `${this.changes} todo(s) ${operation}d successfully`,
            affectedCount: this.changes
        });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve frontend for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});