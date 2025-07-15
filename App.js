const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory user store (for demo only)
const users = [];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'yourSuperSecretKey',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/?msg=loginFirst');
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.send('Username already exists. <a href="/">Try again</a>');
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed, role: 'user' });
  res.send('Registration successful! <a href="/">Login now</a>');
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.send('Invalid credentials. <a href="/">Try again</a>');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.send('Invalid credentials. <a href="/">Try again</a>');
  req.session.userId = username;
  res.redirect('/dashboard');
});

// Dashboard (protected route)
app.get('/dashboard', requireAuth, (req, res) => {
  const user = users.find(u => u.username === req.session.userId);
  res.send(`
    <h1>Welcome, ${user.username}!</h1>
    <p>Your role: ${user.role}</p>
    <a href="/logout">Logout</a>
  `);
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
