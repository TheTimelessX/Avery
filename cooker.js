// Make the main remote

const token = "7745493966:AAF5Mv-e0OnuABmmXOjnmpDxY0wrb3FDwrI";
const acception_chat = "-1002810374571";
const botwallet = "TQxzn7A4NRYWjFuHZx1hM1KR9TyM7X5gnD";
const admins = [5483232752, 6827264567]
const portsubs = {
  "7": "20",
  "15": "30",
  "30": "60"
}

const TelegramBot = require("node-telegram-bot-api");
const { UserDataTransform } = require("./transform");

const bot = new TelegramBot(token, { polling: true });
const udt = new UserDataTransform();
const transregex = /^(https?:\/\/tronscan\.org\/#\/transaction\/[a-f0-9]{64}|[a-f0-9]{64})$/;

function istrans(hl) {
  return transregex.test(hl);
}

function fade(string) {
  if (string.length < 5){
    return string;
  }

  let starter = string.slice(0, 2);
  let ender   = string.slice(-2);
  return `${starter}[...]${ender}`;

}

function getms(day){
  switch (day){
    case "7":
      return 648000000;
      break;
    case "15":
      return 1296000000;
      break;
    case "30":
      return 2592000000;
      break;
  }
}

function timeRemaining(timestamp1, timestamp2) {
      const difference = Math.abs(timestamp2 - timestamp1);
      const seconds = Math.floor((difference / 1000) % 60);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));

      return { days, hours, minutes, seconds };
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

let order = {};
let steps = {};
let waiters = [];
let me = {
  id: null
}

bot.getMe().then((mine) => {
  console.log(mine);
  me.id = mine.id;
})

bot.on("message", async (msg) => {
  //console.log(msg)
  msg.text = msg.text == undefined || msg.text == null ? "" : msg.text;
  if (msg.text.startsWith("/gift")){
    if (admins.includes(msg.from.id)){
      let timez = msg.text.slice(5, msg.text.length).trim();
      if (timez == "" || !(/^\d+$/.test(timez))){
        await udt.createGift("7", async (g) => {
          if (!g.status){
            console.log(g)
          } else {
            await bot.sendMessage(
              msg.chat.id,
              build(`🎁 | new gift created\n📆 | about ${portsubs["7"]} trx\n🆔️ | `) + `<code>${g.gift}</code>`,
              {
                reply_to_message_id: msg.message_id,
                parse_mode: "HTML"
              }
            )
          }
        })
      } else {
        await udt.createGift(timez, async (g) => {
          if (!g.status){
            console.log(g)
          } else {
            await bot.sendMessage(
              msg.chat.id,
              build(`🎁 | new gift created\n📆 | about ${portsubs[timez]} trx\n🆔️ | `) + `<code>${g.gift}</code>`,
              {
                reply_to_message_id: msg.message_id,
                parse_mode: "HTML"
              }
            )
          }
        })
      }
    }
  } else if (msg.text.startsWith("/show_gifts")){
    if (!admins.includes(msg.from.id)){return}
    await udt.getGifts(async (gifts) => {
      if (!gifts.status){
        console.log(gifts);
        return;
      }
      let s = build("🔖 | gifts box") + (gifts.gifts.length == 0 ? build(" is empty") : "");
     // console.log(s)
      for (g of gifts.gifts){
        s += `\n📘 | <code>${g.id}</code> - ${g.about} days`;
      }
      await bot.sendMessage(
        msg.chat.id,
        s,
        {
          reply_to_message_id: msg.message_id,
          parse_mode: "HTML"
        }
      )
    })
  } else if (msg.text.startsWith("/use")){
    let code = msg.text.slice(4, msg.text.length).trim();
    if (code.length == 0){
      await bot.sendMessage(
        msg.chat.id,
        build("🔴 | no gift code detected"),
        {
          reply_to_message_id: msg.message_id
        }
      )
      return;
    } else {
      let gfound = false;
      await udt.getGifts(async (g) => {
        for (gift of g.gifts){
          if (gift.id == code){
            gfound = true;
            await udt.useGift(msg.from.id, gift.id, async (m) => {
              if (!m.status){
                console.log(m);
                return;
              } else {
                //await udt.increaseCharge(msg.from.id, parseInt(portsubs[gift.about]), true)
                await bot.sendMessage(
                  msg.chat.id,
                  build(`📣 | gift were opened !\n📮 | ${portsubs[gift.about]} trx moved to your wallet !`),
                  {
                    reply_to_message_id: msg.message_id
                  }
                )
                return;
              }
            })
          }
        }
        if (!gfound){
          await bot.sendMessage(
            msg.chat.id,
            build("🚫 | no gift code detected"),
            {
              reply_to_message_id: msg.message_id
            }
          )
        }
      })
    }
  } else if (msg.text.startsWith("/start")){
    await udt.getUserById(msg.from.id, async (user) => {
      //console.log(user)
      if (!user.status){
        //console.log("jiii")
        if (!waiters.includes(msg.from.id)){waiters.push(msg.from.id)}
        await bot.sendMessage(
          msg.chat.id,
          build("🔺️ | your request sent to the admins\n💬 | new message will send ..."),
          {
            reply_to_message_id: msg.message_id
          }
        )
        await bot.sendMessage(
          acception_chat,
          build("▪️ | user ") + `<a href="tg://openmessage?user_id=${msg.from.id}">${msg.from.id}</a>` + build(" wanted to accept\n\n📕 | would you accept?"),
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: build("🔹️ yes"),
                    callback_data: `accept_${msg.from.id}`
                  },
                  {
                    text: build("🔸️ no"),
                    callback_data: `dontaccept_${msg.from.id}`
                  }
                ]
              ]
            }
          }
        )
      } else if (!user.user.is_ban == true){
        await bot.sendMessage(
          msg.chat.id,
          build("↗️ | use the options below\n⚠️ | be careful about ") + `<a href="t.me/VexPrivacy">${build("privacy & rules")}</a>` + `\n🧵 | <code>${botwallet}</code>`,
          {
            reply_to_message_id: msg.message_id,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: build("🔗 charge"),
                    callback_data: `charge_${msg.from.id}`
                  },
                  {
                    text: build("📶 wallet"),
                    callback_data: `seewallet_${msg.from.id}`
                  }
                ],
                [
                  {
                    text: build("📕 privacy & rules"),
                    url: "t.me/VexPrivacy"
                  }
                ],
                [
                  {
                    text: build("📡 buy port"),
                    callback_data: `buyport_${msg.from.id}`
                  },
                  {
                    text: build("📃 my port"),
                    callback_data: `myport_${msg.from.id}`
                  }
                ]
              ]
            }
          }
        )
      }
    })
  } else if (msg.reply_to_message && msg.reply_to_message.from && msg.reply_to_message.from.id == me.id){
    if (istrans(msg.text)){
      let isban = false;
      await udt.getUserById(msg.from.id, (user) => {
        if (user.status){
          if (user.user.is_ban){
            isban = true;
          }
        }
      })
      await bot.sendMessage(
        msg.chat.id,
        build("💠 | trying to understand what you sent ..."),
        {
          reply_to_message_id: msg.message_id
        }
      ).then(async (rmsg) => {
        if (isban){
          await bot.editMessageText(
            build("🚫 | sorry but you were banned by admins"),
            {
              chat_id: rmsg.chat.id,
              message_id: rmsg.message_id
            }
          )
          return;
        }
        let islink = false;
        if (msg.text.startsWith("https://tronscan.org/#/transaction/")){islink = true};
        await udt.getTracInfo(msg.text.replace("https://tronscan.org/#/transaction/", ""), async (tinfo) => {
          if (!tinfo.status){
            await bot.editMessageText(
              build("🛑 | error from tronscan web-service detected\n⏳️ | please try again later"),
              {
                chat_id: rmsg.chat.id,
                message_id: rmsg.message_id
              }
            )
            return;
          } else {
            let issame = tinfo.to == botwallet ? true : false;
            await udt.isHashExists(tinfo.from, async (ihe) => {
              if (ihe.status == true){
                await bot.editMessageText(
                  build("⚠️ | you cannot use a hash for twice"),
                  {
                    chat_id: rmsg.chat.id,
                    message_id: rmsg.message_id
                  }
                )
                await bot.sendMessage(
                  acception_chat,
                  build("📌 | user ") + `<a href="tg://openmessage?user_id=${msg.from.id}">${msg.from.id}</a>` + build(" wanted to use a hash for twice\n\n🕯 | would you ban him/her ?"),
                  {
                    parse_mode: "HTML",
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: build("🩸 ban"),
                            callback_data: `ban_${msg.from.id}`
                          },
                          {
                            text: build("⛓️ forgive"),
                            callback_data: `close`
                          }
                        ]
                      ]
                    }
                  }
                )
                return;
              }
              await bot.editMessageText(
                build(`🐚 | replied message is ${islink == false ? "hash" : "hash-link"}\n🐋 | about ${tinfo.amount} trx\n🧭 | from ${tinfo.from}\n🎯 | moved to bot-wallet: ${issame == true ? "yes" : "no"}${issame == true ? "\n\n🛎 | your ox-wallet were charged" : ""}`),
                {
                  chat_id: rmsg.chat.id,
                  message_id: rmsg.message_id
                }
              )
              if (issame == true){
                await udt.increaseCharge(msg.from.id, tinfo.amount, false);
                await udt.addHash(tinfo.from);
              }
            })
          }
        })
      })
    } else if (msg.text.includes(":")){
      if (!steps[msg.from.id] == "gettoken"){return;}
      let spl = msg.text.split(":");
      if (!(/^\d+$/.test(spl[0]))){
        await bot.sendMessage(
          msg.chat.id,
          build("🔴 | invalid bot-token please try again"),
          {
            reply_to_message_id: msg.message_id
          }
        )
      } else {
        order[msg.from.id]["token"] = msg.text.trim();
        steps[msg.from.id] = "getgroupchat"
        await bot.sendMessage(
          msg.chat.id,
          build("🎯 | reply your group-chat id"),
          {
            reply_to_message_id: msg.message_id
          }
        )
      }
    } else if (msg.text.startsWith("-")){
      if (!steps[msg.from.id] == "getgroupchat"){return}
      let real = msg.text.slice(1, msg.text.length).trim();
      if (!(/^\d+$/.test(real))){
        await bot.sendMessage(
          msg.chat.id,
          build("🔴 | invalid group-chat id please try again"),
          {
            reply_to_message_id: msg.message_id
          }
        )
      } else {
        order[msg.from.id]["chat_id"] = msg.text.trim();
        steps[msg.from.id] = "getportname";
        await bot.sendMessage(
          msg.chat.id,
          build("📝 | reply port name"),
          {
            reply_to_message_id: msg.message_id
          }
        )
      }
    } else {
      if (steps[msg.from.id] == "getportname"){
        msg.text = msg.text.trim();
        if (msg.text.length < 8){
          await bot.sendMessage(
            msg.chat.id,
            build("❗️ | port-name must be more than 8 charecters"),
            {
              reply_to_message_id: msg.message_id
            }
          )
          return;
        }
        await udt.isPortExists(msg.text, async (pst) => {
          if (pst){
            await bot.sendMessage("⚠️ | port is exists please try another one")
          } else {
            steps[msg.from.id] = "getportpass";
            order[msg.from.id]["name"] = msg.text;
            await bot.sendMessage(
              msg.chat.id,
              build("📣 | reply password"),
              {
                reply_to_message_id: msg.message_id
              }
            )
          }
        })
      } else if (steps[msg.from.id] == "getportpass"){
        msg.text = msg.text.trim();
        if (msg.text.length < 8){
          await bot.sendMessage(
            msg.chat.id,
            build("❗️ | password must be more than 8 charecters"),
            {
              reply_to_message_id: msg.message_id
            }
          )
          return;
        }
        order[msg.from.id]["password"] = msg.text;
        let or = order[msg.from.id]
        delete steps[msg.from.id];
        await bot.sendMessage(
          msg.chat.id,
          build(`🧳 | token: ${fade(or["token"])}\n🌐 | group-chat id: ${or["chat_id"]}\n🌊 | port-name: ${or["name"]}\n🔐 | password: ${fade(or["password"])}\n⏱️ | will end in next ${or["about"]} days\n\n🗼 | is ok?`),
          {
            reply_to_message_id: msg.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: build("✅️ yes"),
                    callback_data: `build_${msg.from.id}`
                  },
                  {
                    text: build("❌️ no"),
                    callback_data: `reset_${msg.from.id}`
                  }
                ]
              ]
            }
          }
        )
      }
    }
  } else if (msg.text.startsWith("/unban")){
    if (!admins.includes(msg.from.id)){return;}
    let uid = msg.text.slice(6, msg.text.length).trim();
    if (uid == "" || !(/^\d+$/.test(uid))){
      await bot.sendMessage(
        msg.from.id,
        build("🔴 | no number detected"),
        {
          reply_to_message_id: msg.message_id
        }
      )
    } else {
      await udt.bandana(uid, false);
      await bot.sendMessage(
        msg.chat.id,
        build("🔰 | user were removed from ban list - ") + `<a href="tg://openmessage?user_id=${uid}">${uid}</a>`,
        {
          reply_to_message_id: msg.message_id,
          parse_mode: "HTML"
        }
      )
    }
  } else if (msg.text.startsWith("/ban")){
    if (!admins.includes(msg.from.id)){return;}
    let uid = msg.text.slice(4, msg.text.length).trim();
    if (uid == "" || !(/^\d+$/.test(uid))){
      await bot.sendMessage(
        msg.chat.id,
        build("🔴 | no number detected"),
        {
          reply_to_message_id: msg.message_id
        }
      )
    } else {
      await udt.bandana(uid, true);
      await bot.sendMessage(
        msg.chat.id,
        build("🔰 | user were added to ban list - ") + `<a href="tg://openmessage?user_id=${uid}">${uid}</a>`,
        {
          reply_to_message_id: msg.message_id,
          parse_mode: "HTML"
        }
      )
    }
  }
})

bot.on("callback_query", async (call) => {
  let spl = call.data.split("_");
  let method = spl[0];
  let once = parseInt(spl[1]);
  if (method == "accept"){
    await bot.editMessageText(
      build("🌐 | request accepted - ") + `<a href="tg://openmessage?user_id=${once}">${once}</a>`,
      {
        chat_id: call.message.chat.id,
        message_id: call.message.message_id,
        parse_mode: "HTML"
      }
    )
    waiters.splice(waiters.indexOf(once), 1);
    await udt.add(once);
    await bot.sendMessage(
      once,
      build("✅️ | your request accepted !\nℹ️ | send ") + "/start" + build(" to see options")
    )
  } else if (method == "dontaccept"){
    await bot.editMessageText(
      build("▶️ | request rejected - ") + `<a href="tg://openmessage?user_id=${once}">${once}</a>`,
      {
        chat_id: call.message.chat.id,
        message_id: call.message.message_id,
        parse_mode: "HTML"
      }
    )
    waiters.splice(waiters.indexOf(once), 1);
    await bot.sendMessage(
      once,
      build("🚫 | you were rejected by admin\n🔁 | try again later")
    )
  } else if (method == "charge"){
    if (once == call.from.id){
      await bot.editMessageText(
        build("🪭 | reply the link/hash of your transection on one of the bots messages "),
        {
          chat_id: call.message.chat.id,
          message_id: call.message.message_id
        }
      )
    }
  } else if (method == "seewallet"){
    if (once == call.from.id){
      await udt.getUserById(once, async (user) => {
        if (!user.status){
          await bot.editMessageText(
            build(`❌️ | error: ${user.message} - please send this message to the admins`),
            {
              chat_id: call.message.chat.id,
              message_id: call.message.message_id
            }
          )
        } else if (user.user.is_ban == true){
          true;
        } else {
          await bot.editMessageText(
            build(`🛜 | you have ${user.user.charged} trx in your ox-wallet\n📃 | ${user.user.gwallet != undefined || user.user.gwallet != null ? user.user.gwallet : 0} required from gifts`),
            {
              chat_id: call.message.chat.id,
              message_id: call.message.message_id
            }
          )
        }
      })
    }
  } else if (method == "buyport"){
    if (once == call.from.id){
      await udt.getUserById(once, async (user) => {
        if (!user.status){
          await bot.editMessageText(
            build(`❌️ | error: ${user.message} - please send this message to the admins`),
            {
              chat_id: call.message.chat.id,
              message_id: call.message.message_id
            }
          )
        } else if (user.user.is_ban == true){
          true;
        } else {
          if (Object.keys(user.user.ports).length != 0){
            await bot.editMessageText(
              build("🛑 | you already have port"),
              {
                chat_id: call.message.chat.id,
                message_id: call.message.message_id
              }
            )
          } else if (user.user.charged < parseInt(portsubs["7"]) && user.user.gwallet < parseInt(portsubs["7"]) && (user.user.gwallet + user.user.charged) < parseInt(portsubs["7"])){
            await bot.editMessageText(
              build("🪁  | sorry but you have not enough money to buy port"),
              {
                chat_id: call.message.chat.id,
                message_id: call.message.message_id
              }
            )
          } else {
            let flayer = [{ text: "7 days", callback_data: `port_${call.from.id}_7` }];
            let slayer = [];
            if (user.user.charged >= parseInt(portsubs["15"]) || user.user.gwallet >= parseInt(portsubs["15"]) || (user.user.gwallet + user.user.charged) >= parseInt(portsubs["15"])){
              flayer.push({ text: "15 days", callback_data: `port_${call.from.id}_15` });
            }

            if (user.user.charged >= parseInt(portsubs["30"]) || user.user.gwallet >= parseInt(portsubs["30"]) || (user.user.gwallet + user.user.charged) >= parseInt(portsubs["30"])){
              slayer.push({ text: "30 days", callback_data: `port_${call.from.id}_30` })
            }
            let d_ = build("days")
            await bot.editMessageText(
              build(`📮 | choose days that you want to buy\n\n🔹️ | 7      ${d_}: ${portsubs["7"]} trx\n🔹️ | 15   ${d_}: ${portsubs["15"]} trx\n🔹️ | 30   ${d_}: ${portsubs["30"]} trx`),
              {
                chat_id: call.message.chat.id,
                message_id: call.message.message_id,
                reply_markup: {
                  inline_keyboard: [
                    flayer,
                    slayer,
                    [
                      {
                        text: build("close"),
                        callback_data: "close_4"
                      }
                    ]
                  ]
                }
              }
            )
          }
        }
      })
    }
  } else if (method == "port"){
    if (once == call.from.id){
      await udt.getUserById(once, async (user) => {
        if (!user.status){
          await bot.editMessageText(
            build(`🔴 | error: ${user.message} - share this message with admins`),
            {
              chat_id: call.message.chat.id,
              message_id: call.message.message_id
            }
          )
        } else if (user.user.is_ban == true){
          true;
        } else if (user.user.charged < parseInt(portsubs[spl[2]]) && user.user.gwallet < parseInt(portsubs[spl[2]]) && (user.user.gwallet + user.user.charged) < parseInt(portsubs[spl[2]])){
          await bot.answerCallbackQuery(call.id, {
            text: build("❌️ | not enough money"),
            show_alert: true
          })
        } else if (Object.keys(user.user.ports).length != 0){
          await bot.answerCallbackQuery(call.id, {
            text: build("📃 | you already have port"),
            show_alert: true
          })
        } else {
          steps[call.from.id] = "gettoken";
          order[call.from.id] = {};
          order[call.from.id]["activated_in"] = new Date().getTime();
          order[call.from.id]["will_end"] = order[call.from.id]["activated_in"] + getms(spl[2]);
          order[call.from.id]["about"] = spl[2]
          console.log(order)
          await bot.editMessageText(
            build("⚙️ | reply your bot-token"),
            {
              chat_id: call.message.chat.id,
              message_id: call.message.message_id
            }
          )
        }
      })
    }
  } else if (method == "close"){
    try{
      await bot.deleteMessage(call.message.chat.id, call.message.message_id)
    } catch (e){true}
  } else if (method == "ban"){
    await udt.bandana(once, true);
    await bot.editMessageText(
       build("⛔️ | user ") + `<a href="tg://openmessage?user_id=${once}">${once}</a>` + build(" were banned"),
      {
        chat_id: call.message.chat.id,
        message_id: call.message.message_id,
        parse_mode: "HTML"
      }
    )
    await bot.sendMessage(
      once,
      build("❗️ | you were banned by admins")
    )
  } else if (method == "build"){
    if (once == call.from.id){
      await udt.getUserById(once, async (user) => {
        if (!user.status){
          await bot.answerCallbackQuery(call.id, {
            text: build("📵 | error: " + prt.message + " - talk to admins about this"),
            show_alert: true
          })
          return;
        } else if (user.user.is_ban){
          await bot.answerCallbackQuery(call.id, {
            text: build("⛔️ | you were banned"),
            show_alert: true
          })
        } else {
          //console.log(portsubs[order[once]["about"]])
          //await udt.decreaseCharge(once, portsubs[order[once]["about"]], (a) => {console.log(a)});
          await udt.createPort(once, order[once]["name"], order[once]['password'], order[once]["token"], order[once]["chat_id"], order[once]["will_end"], parseInt(portsubs[order[once]["about"]]), async (r) => {
            console.log(r)
            if (!r.status){
              await bot.editMessageText(
                build(`🔹️ | error: ${r.message}`),
                {
                  chat_id: call.message.chat.id,
                  message_id: call.message.message_id
                }
              )
              return
            }
            await bot.editMessageText(
              call.message.text.replace(build("🗼 | is ok?"), build("✅️ | your port was created - enjoy")),
              {
                chat_id: call.message.chat.id,
                message_id: call.message.message_id
              }
            )
          })
        }
      })
    }
  } else if (method == "reset"){
    delete order[once];
    await bot.editMessageText(
      build("🩸 | your order was deleted"),
      {
        chat_id: call.message.chat.id,
        message_id: call.message.message_id
      }
    )
  } else if (method == "myport"){
    if (once == call.from.id){
      await udt.getUserById(once, async (prt) => {
        if (!prt.status){
          await bot.editMessageText(
            build("📵 | error: " + prt.message + " - talk to admins about this"),
            {
              chat_id: call.message.chat.id,
              message_id: call.message.message_id
            }
          )
        } else if (prt.user.is_ban){
          true;
        } else {
          if (Object.keys(prt.user.ports).length == 0){
            await bot.editMessageText(
              build("🛅 | you have no port yet"),
              {
                chat_id: call.message.chat.id,
                message_id: call.message.message_id
              }
            )
          } else {
            //console.log(prt.user.ports)
            //prt.user.ports = JSON.parse(prt.user.ports);
            let act = new Date(prt.user.ports.activated_in);
            let wend = new Date(prt.user.ports.will_end);
            let remain = timeRemaining(wend.getTime(), new Date().getTime())
            console.log(remain);
            await bot.editMessageText(
              build(`📋 | port: `) + `<code>${prt.user.ports.name}</code>` + build(`\n🔐 | password: `) + `${fade(prt.user.ports.password)}` + build("\n📊 | token: ") + `${fade(prt.user.ports.token)}` + build(`\n📆 | activated in ${act.getUTCFullYear()}/${act.getMonth()}/${act.getDay()} - ${act.getHours()}:${act.getMinutes()}:${act.getSeconds()}\n🎚 | will end ${wend.getUTCFullYear()}/${wend.getMonth()}/${wend.getDay()} - ${wend.getHours()}:${wend.getMinutes()}:${wend.getSeconds()}\n🗓 | ${remain.days == 0 ? remain.hours + ":" + remain.minutes + ":" + remain.seconds : remain.days + " days and " + remain.hours + ":" + remain.minutes + ":" + remain.seconds}`),
              {
                chat_id: call.message.chat.id,
                message_id: call.message.message_id,
                parse_mode: "HTML"
              }
            )
          }
        }
      })
    }
  }
})

setInterval(async () => {
  await udt.getAll(async (users) => {
    for (let user of users){
      if (Object.keys(user.ports).length != 0){
        await udt.safeRemovePort(user.id)
      }
    }
  })
}, 5000)
