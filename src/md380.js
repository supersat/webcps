import { DFU } from "./dfu";
import { strFromDataView } from "./util";

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
        return {
            dmrId: dmrId,
            callReceiveTone: callReceiveTone,
            callType: callType,
            name: strFromDataView(dataview, 4, 32, 2)
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

export class TYTDFU extends DFU {
    static async requestDevice(filters) {
		return await navigator.usb.requestDevice({
			filters: filters || [
				{ 'vendorId': 0x0483, 'productId': 0xdf11 }
			]
		});
    }
    
    static async fromUsbDevice(device) {
        let radio = new TYTDFU();
        await radio.open(device);

        // Read out radio type
        await radio._customCommand(0xa2, 0x01);
        let resp = await radio.upload(0, 32);
        let radioName = strFromDataView(
            new DataView(resp.data.buffer), 0, 32, 1);
        
        await radio.abort();
        
        if (radioName == 'DR780') {
            let md380 = new MD380DFU();
            md380.device = radio.device;
            return md380;
        } else if (radioName == 'MD-UV380') {
            let mduv380 = new MDUV380DFU();
            mduv380.device = radio.device;
            return mduv380;
        }

        return radio;
    }

    async _customCommand(a, b) {
        let data = new Uint8Array(2);
        data[0] = a;
        data[1] = b;
        await this._sendDnloadCommand(data);
    }

    async _eraseBlocks(startAddr, size) {
        for (let offset = startAddr; offset < startAddr + size; offset += 0x10000) {
            await this.eraseBlock(offset);
        }
    }

    async _putContiguousBlocks(codePlug, cpOffset, size, addr) {
        for (let outerOffset = cpOffset; outerOffset < size; outerOffset += 0x10000) {
            await this.setAddress(addr);
            let blockNum = 2;
            for (let offset = outerOffset; offset < outerOffset + 0x10000; offset += blockSize) {
                let block = codePlug.slice(offset, offset + blockSize);
                await this.download(blockNum, block);
                while (true) {
                    let status = await this.getStatus();
                    if (status[2] == dfuDNLOAD_IDLE)
                        break;
                }
                blockNum++;
            }
            addr += 0x10000;
        }
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

export class MD380DFU extends TYTDFU {
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

        await this._eraseBlocks(0x00000000, 0x00040000);
        await this._putContiguousBlocks(codePlug, 0, codePlug.length, 0x00000000);
    }
}

export class MDUV380DFU extends TYTDFU {
    async putCodePlug(codePlug) {
        await this._customCommand(0x91, 0x01);
        await this._customCommand(0x91, 0x01);
        await this._customCommand(0xa2, 0x02);
        await this.getCommand();
        await this._customCommand(0xa2, 0x02);
        await this._customCommand(0xa2, 0x03);
        await this._customCommand(0xa2, 0x04);
        await this._customCommand(0xa2, 0x07);

        await this._eraseBlocks(0x00000000, 0x00040000);
        await this._eraseBlocks(0x00110000, 0x00090000);

        await this._putContiguousBlocks(codePlug, 0, codePlug.length, 0x00000000);
        await this._putContiguousBlocks(codePlug, 0x40000, 0x90000, 0x00110000);
    }
}
