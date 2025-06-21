const net = require("net");

net.connect({
    host: "127.0.0.1",
    port: 6056
}, () => {
    console.log("connected to the server")
})

class Something {
    say(){
        return "hello world";
    }
}

module.exports = { Something };