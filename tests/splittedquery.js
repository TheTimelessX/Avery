function splitQuery(query){
    let splitted = query.split("&")
    let dict = {};
    for (let spl of splitted){
        let _spl = spl.split("=");
        dict[_spl[0]] = _spl[1];
    }
    return dict;
}

console.log(splitQuery("device_id=432rwr32wrf324&port=sdf342324&password=43245435435&chat_id=5435435435435"))