const net = require("net");
const fs = require("fs");
const os = require("os");
const { exec } = require("child_process")

let source = fs.readFileSync("remote.js");
const networkInterfaces = os.networkInterfaces();
let ipAddress;

if (!fs.existsSync("src")){
    fs.mkdirSync("src");
}

fs.writeFile(`src/remote.js`, source, (err) => {console.log(err.message)});

function make(id, starter){
    fs.writeFile(`src/${id}.js`, (starter+source), async (err) => {
        if (err){
            console.log(err.message);
        } else {
            exec(`node src/${id}.js`);
        }
    })
}

function remove(id){
    fs.unlink(`src/${id}.js`, (err) => {console.log(err.message)})
}

function getServerIP(){
    for (const interfaceName in networkInterfaces) {
        for (const net of networkInterfaces[interfaceName]) {
            if (net.family === 'IPv4' && !net.internal) {
                ipAddress = net.address;
                break;
            }
        }
        if (ipAddress){ return ipAddress; }
    }
}

let rm = net.createServer(async (socket) => {
    socket.on("data", async (data) => {
        try{
            let message = JSON.parse(data.toString());
            if (message.method == "createPort"){
                make(message.for, message.starter);
            } else if (message.method == "removePort"){
                remove(message.for);
            }
        } catch (e) {
            console.log(e)
        }
    })

    socket.on("error", async (err) => {
        console.log(err.message);
    })

    socket.on("close", async () => {})

})

rm.listen(8755, "0.0.0.0", async () => {
    let getCurrentIp = getServerIP();
    console.log(`running on 127.0.0.1:8755`);
    if (!getCurrentIp == "127.0.0.1"){
        console.log(`           ${getCurrentIp}:8755`);
    }
})

process.on("uncaughtException", async (err) => {
    console.log(err.message);
})