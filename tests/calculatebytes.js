function convertBytes(numBytes) {
    const conversions = {
        bytes: numBytes,
        kilobytes: numBytes / 1024,
        megabytes: numBytes / (1024 ** 2),
        gigabytes: numBytes / (1024 ** 3)
    };
    return conversions;
}

// Example usage:
// const sizeInBytes = 1048576; // 1 MB in bytes
const sizeInBytes = 5435;
const result = convertBytes(sizeInBytes);
console.log(result);
console.log(result.megabytes.toFixed());