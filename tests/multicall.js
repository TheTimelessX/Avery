function something(callback = () => {}){
    callback(1, 2, 3)
}

something((a, b) => {
    console.log(a, b)
})