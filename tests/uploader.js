const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require("url");

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        console.log(url.parse(req.url));
        const filePath = path.join(__dirname, 'uploads', '.');
        console.log(filePath)
        const writeStream = fs.createWriteStream(filePath);
        req.pipe(writeStream);

        writeStream.on('finish', () => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('File uploaded successfully.');
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <form method="POST" enctype="multipart/form-data">
                <input type="file" name="file" />
                <button type="submit">Upload</button>
            </form>
        `);
    }
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
