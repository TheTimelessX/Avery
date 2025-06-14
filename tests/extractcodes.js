const codeRegex = /\b\d{4,8}\b/g;

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

console.log(extractCodes("Here are some numbers: 1234, 56789, 12345678, and 123. "))