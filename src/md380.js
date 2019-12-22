import { DFU } from "./dfu";

const DETACH = 0;
const DNLOAD = 1;
const UPLOAD = 2;
const GETSTATUS = 3;
const CLRSTATUS = 4;
const GETSTATE = 5;
const ABORT = 6;

const appIDLE = 0;
const appDETACH = 1;
const dfuIDLE = 2;
const dfuDNLOAD_SYNC = 3;
const dfuDNBUSY = 4;
const dfuDNLOAD_IDLE = 5;
const dfuMANIFEST_SYNC = 6;
const dfuMANIFEST = 7;
const dfuMANIFEST_WAIT_RESET = 8;
const dfuUPLOAD_IDLE = 9;
const dfuERROR = 10;

export class MD380 {
    constructor() {
    }

    import(codePlugBin) {
        
    }
}

export class MD380DFU extends DFU {
    static async requestDevice(filters) {
		return await navigator.usb.requestDevice({
			filters: filters || [
				{ 'vendorId': 0x0483, 'productId': 0xdf11 }
			]
		});
    }
    
    async _customCommand(a, b) {
        let data = new Uint8Array(2);
        data[0] = a;
        data[1] = b;
        await this._sendDnloadCommand(data);
    }

    async setTime(date = null) {
        if (date == null) {
            date = new Date()
        }

        await this._customCommand(0x91, 0x02);
        let timeStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0') +
            date.getHours().toString().padStart(2, '0') +
            date.getMinutes().toString().padStart(2, '0') +
            date.getSeconds().toString().padStart(2, '0');
        let data = new Uint8Array(8);
        data[0] = 0xb5;
        for (let i = 0; i < 7; i++) {
            data[i + 1] = parseInt(timeStr.substring(i * 2, i * 2 + 2), 16);
        }
        await this.download(0, data);
        await this.waitTilReady();
        await this.reboot();
    }

    async reboot() {
        let data = new Uint8Array(2);
        data[0] = 0x91;
        data[1] = 0x05;
        await this.ctrlReqOut(DNLOAD, data);
        await this.getStatus();
    }
}