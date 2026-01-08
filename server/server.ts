import express from 'express';
import path from 'path';

const app = express();
const port = 3000;

// API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// For any other request, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
