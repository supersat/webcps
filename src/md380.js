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

const blockSize = 1024;

const contactListOffset = 0x5f80;

export class MD380 {
    _parseContact(contactData) {
        let dataview = new DataView(contactData);
        if (dataview.getUint8(4) == 0 && dataview.getUint8(5) == 0) {
            return {}; // Deleted contact
        }
        let dmrId = dataview.getUint16(0, true) |
            (dataview.getUint8(2) << 16);
        let callReceiveTone = !!(dataview.getUint8(3) & 0x20);
        let callType = dataview.getUint8(3) & 0x03;
        let name = '';
        for (let i = 4; i < 36; i += 2) {
            let char = dataview.getUint16(i, true);
            if (char == 0) {
                break;
            }
            name = name + String.fromCharCode(char);
        }
        return {
            dmrId: dmrId,
            callReceiveTone: callReceiveTone,
            callType: callType,
            name: name
        };
    }

    import(codePlugBin) {
        this.contacts = [];
        for (let i = 0; i < 1000; i++) {
            let offset = contactListOffset + (i * 36)
            let contact = this._parseContact(
                codePlugBin.slice(offset, offset + 36).buffer);
            if (contact) {
                contact.id = i;
                this.contacts.push(contact);
            }
        }
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

    async getCodePlug() {
        let codePlug = new Uint8Array(0x40000);
        await this._customCommand(0x91, 0x01);
        await this._customCommand(0xa2, 0x02);
        await this._customCommand(0xa2, 0x02);
        await this._customCommand(0xa2, 0x03);
        await this._customCommand(0xa2, 0x04);
        await this._customCommand(0xa2, 0x07);
        await this.setAddress(0x00000000);
        for (let blockNum = 2; blockNum < 0x102; blockNum++) {
            let block = await this.upload(blockNum, blockSize);
            let status = await this.getStatus();
            codePlug.set(new Uint8Array(block.data.buffer),
                (blockNum - 2) * blockSize);
        }
        return codePlug;
    }

    async putCodePlug(codePlug) {
        await this._customCommand(0x91, 0x01);
        await this._customCommand(0x91, 0x01);
        await this._customCommand(0xa2, 0x02);
        await this.getCommand();
        await this._customCommand(0xa2, 0x02);
        await this._customCommand(0xa2, 0x03);
        await this._customCommand(0xa2, 0x04);
        await this._customCommand(0xa2, 0x07);

        await this.eraseBlock(0x00000000);
        await this.eraseBlock(0x00010000);
        await this.eraseBlock(0x00020000);
        await this.eraseBlock(0x00030000);

        await this.setAddress(0x00000000);

        let blockNum = 2;
        for (let offset = 0; offset < codePlug.length; offset += blockNum) {
            let block = codePlug.slice(offset, offset + blockSize);
            await this.download(blockNum, block);
            while (true) {
                let status = await this.getStatus();
                if (status[2] == dfuDNLOAD_IDLE)
                    break;
            }
            blockNum++;
        }
    }
}
