const fs = require("fs");

let data = fs.readFileSync("I:\\workspace\\Avery\\tests\\_.txt");
data = data.toString();
let splited_8_lines = data.split("\n").slice(0, 8);
let s = "";

for (let i = 0;i<8;i++){    
    if (i == 3){
        s += "\nconst passname = " + "'Yugifdhgud'";
    } else {
        s += ("\n" + splited_8_lines[i].replace("\r", ""));
    }
}

console.log(s+"\n"+data);
