function notSens(text){
    console.log(text == "null");
}

function beSens(text){
    console.log(text === "null");
}

notSens(null);
beSens(null);