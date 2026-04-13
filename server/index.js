const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Подключение к SQLite (имитация PostgreSQL)
const db = new Database('./course_tracker.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Создание таблиц
const createTables = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        order_index INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        order_index INTEGER NOT NULL,
        is_completed INTEGER DEFAULT 0
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Таблицы созданы успешно');
  } catch (err) {
    console.error('Ошибка создания таблиц:', err);
  }
};

// API для курсов
app.get('/api/courses', (req, res) => {
  try {
    const result = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', (req, res) => {
  try {
    const { title, description } = req.body;
    const stmt = db.prepare('INSERT INTO courses (title, description) VALUES (?, ?)');
    const info = stmt.run(title, description);
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(info.lastInsertRowid);
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Курс удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API для модулей
app.get('/api/courses/:courseId/modules', (req, res) => {
  try {
    const result = db.prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY order_index').all(req.params.courseId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/:courseId/modules', (req, res) => {
  try {
    const { title, order_index } = req.body;
    const stmt = db.prepare('INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)');
    const info = stmt.run(req.params.courseId, title, order_index);
    const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(info.lastInsertRowid);
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API для уроков
app.get('/api/modules/:moduleId/lessons', (req, res) => {
  try {
    const result = db.prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index').all(req.params.moduleId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/modules/:moduleId/lessons', (req, res) => {
  try {
    const { title, content, order_index } = req.body;
    const stmt = db.prepare('INSERT INTO lessons (module_id, title, content, order_index) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.params.moduleId, title, content, order_index);
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(info.lastInsertRowid);
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lessons/:id/toggle', (req, res) => {
  try {
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id);
    const newStatus = lesson.is_completed ? 0 : 1;
    db.prepare('UPDATE lessons SET is_completed = ? WHERE id = ?').run(newStatus, req.params.id);
    const updated = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API для заметок
app.get('/api/lessons/:lessonId/notes', (req, res) => {
  try {
    const result = db.prepare('SELECT * FROM notes WHERE lesson_id = ? ORDER BY created_at DESC').all(req.params.lessonId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lessons/:lessonId/notes', (req, res) => {
  try {
    const { content } = req.body;
    const stmt = db.prepare('INSERT INTO notes (lesson_id, content) VALUES (?, ?)');
    const info = stmt.run(req.params.lessonId, content);
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid);
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve React app for all other routes
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  createTables();
  console.log(`Сервер запущен на порту ${PORT}`);
});
