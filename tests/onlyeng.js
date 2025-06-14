let onlyenglishregex = /^[A-Za-z0-9 ]*$/;

function onlyEnglish(text){
    return onlyenglishregex.test(text);
}

console.log(onlyEnglish("Hello43 2432World"));