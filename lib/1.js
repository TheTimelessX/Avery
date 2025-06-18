function combinePath(dirname, filename){
    if (dirname.includes("\\")){
        return dirname+"\\"+filename;
    } else if (dirname.includes("/")){
        return dirname+"/"+filename;
    }
}

const fs = require("fs");
const { exec } = require("child_process");

fs.writeFile(combinePath(__dirname, "2.js"), `
setInterval(() => {
    console.log("Hello World");
}, 5000)
`, (err) => {
    if (err){
        console.log(err.message);
    }
})

exec(`node ${combinePath(__dirname, "2.js")}`, (err, stdout, stderr) => {
    fs.unlinkSync(combinePath(__dirname, "1.js"))
})