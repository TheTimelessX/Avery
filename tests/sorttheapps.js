let sym = "|";

function sortAppsToString(apps, inslice){
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

    return {
        status: true,
        message: s,
        next_slice: inslice < (allapps.length - 1),
        previous_slice: inslice > 0
    }

}

function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
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

function convertBytes(numBytes) {
    const conversions = {
        bytes: numBytes,
        kilobytes: numBytes / 1024,
        megabytes: numBytes / (1024 ** 2),
        gigabytes: numBytes / (1024 ** 3)
    };
    return conversions;
}

let appsArray = [
    {
        package_name: "org.telegram.android",
        name: "telegram",
        size: 100000000
    },
    {
        package_name: "ir.rubika.rbmain",
        name: "Rubika",
        size: 75000000
    },
    {
        package_name: "org.telegram.android",
        name: "telegram",
        size: 100000000
    },
    {
        package_name: "ir.rubika.rbmain",
        name: "Rubika",
        size: 75000000
    },
    {
        package_name: "org.telegram.android",
        name: "telegram",
        size: 100000000
    },
    {
        package_name: "ir.rubika.rbmain",
        name: "Rubika",
        size: 75000000
    },
    {
        package_name: "org.telegram.android",
        name: "telegram",
        size: 100000000
    },
    {
        package_name: "ir.rubika.rbmain",
        name: "Rubika",
        size: 75000000
    }
]

console.log(sortAppsToString(appsArray, 1));

`seeApps_${msgowner}_${devid}_${inslice - 1}`