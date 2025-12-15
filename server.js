const express = require('express');
const path = require('path');
const app = express();
const distPath = path.join(__dirname, 'frontend'); // adjust if different path
app.use(express.static(distPath));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));