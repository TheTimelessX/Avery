let steps = {};

Object.defineProperty(steps, 666, {
    writable: true,
    enumerable: true,
    configurable: true,
    value: "helloworld"
});

console.log(steps)
console.log(steps[666]);
console.log(Object.keys(steps).includes(666)); // return false
console.log(Object.keys(steps).includes(toString(666))); // return false
let _ = 666;
let s = _.toString();
console.log(s); // return 666
console.log(typeof s); // return string
console.log(Object.keys(steps).includes(s)); // return true