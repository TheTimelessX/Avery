const crypto = require("crypto");
let a = crypto.createHash("md5").update((Math.floor(Math.random() * 999999999999) - 100000).toString()).digest('hex').slice(0, 10);
console.log(a);