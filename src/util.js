export function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

export function strFromDataView(dataview, offset, maxLength, bytesPerChar) {
    let str = '';

    for (let i = offset; i < offset + maxLength; i += bytesPerChar) {
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

