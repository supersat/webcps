export function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

export function parseString(dataview, offset, maxLength, bytesPerChar) {
    let str = '';

    for (let i = offset; i < offset + maxLength * bytesPerChar; i += bytesPerChar) {
        let char;
        if (bytesPerChar == 1) 
            char = dataview.getUint8(i);
        else if (bytesPerChar == 2)
            char = dataview.getUint16(i, true);
        else
            break;
        if (char == 0) {
            break;
        }
        str = str + String.fromCharCode(char);
    }

    return str;
}

export function parseBCD(dataview, offset, len) {
    let val = 0;
    for (let i = 0; i < len; i++) {
        let bcd = dataview.getUint8(offset + len - i - 1);
        val = (((bcd & 0xf0) >> 4) * 10) + (bcd & 0x0f) + (val * 100);
    }
    return val;
}
