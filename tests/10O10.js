function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

console.log(chunkArray([3, 4, 5, 5, 4, 5, 6, 6,3, 2, 2,5,4 ,4,3, 32,3,543,44543,5,435,534,345,34,5], 10)[8888] || [])