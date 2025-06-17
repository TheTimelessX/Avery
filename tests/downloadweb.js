// const fs = require('fs');
// const http = require('http');
// const https = require('https');

function downloadFile(url, destination) {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
        // console.log
        // if (response.statusCode !== 200) {
        //     console.error(`Failed to get '${url}' (${response.statusCode})`);
        //     return;
        // }

        const fileStream = fs.createWriteStream(destination);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Downloaded '${url}' to '${destination}'`);
        });
    }).on('error', (err) => {
        console.error(`Error: ${err.message}`);
    });
}

const targetFile = 'main.zip'  
const wallpaperUrl = 'https://github.com/TheTimelessX/Sector/archive/refs/heads/main.zip'

// let s = url.parse(wallpaperUrl, true);
// console.log(s)

//downloadFile(wallpaperUrl, targetFile)

const https = require('https');
const fs = require('fs');

const fileUrl = 'https://s6.uupload.ir/filelink/UZUjg6WwXqeW_31cf265263/h_sf2d.txt'; // Replace with your file URL
const filePath = 'file.txt'; // Desired local file path

https.get(fileUrl, (response) => {
    if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log('Download completed successfully.');
        });
    } else {
        console.log(`Failed to download file: ${response.statusCode}`);
    }
}).on('error', (err) => {
    console.error(`Error: ${err.message}`);
});
