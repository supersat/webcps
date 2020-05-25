import { DFU } from "./dfu";
import { parseBCD, parseString } from "./util";

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

// The constants are for the original MD380
const generalInfoOffset = 0x2040;
const textMessageOffset = 0x2180;
const contactListOffset = 0x5f80;
const rxGroupListOffset = 0xec20;
const zoneListOffset    = 0x149e0;
const scanListOffset    = 0x18860;
const channelListOffset = 0x1ee00;

const channelModes = [ null, 'analog', 'digital' ];
const bandwidth = [ 12.5, 20, 25 ];

export class MD380 {
    _parseContact(contactData) {
        let dataview = new DataView(contactData);
        if (dataview.getUint8(4) == 0 && dataview.getUint8(5) == 0) {
            return null; // Deleted contact
        }
        return {
            dmrId: dataview.getUint16(0, true) |
                (dataview.getUint8(2) << 16),
            callReceiveTone: !!(dataview.getUint8(3) & 0x20),
            callType: dataview.getUint8(3) & 0x03,
            name: parseString(dataview, 4, 16, 2)
        };
    }

    _parseChannel(channelData) {
        let dataview = new DataView(channelData);
        if (dataview.getUint8(16) == 0xff) {
            return null;
        }
        let channel = {
            mode: channelModes[dataview.getUint8(0) & 0x03],
            bandwidth: bandwidth[(dataview.getUint8(0) & 0x0c) >> 2],
            autoscan: !!(dataview.getUint8(0) & 0x10),
            tightSquelch: !(dataview.getUint8(0) & 0x20),
            loneWorker: !!(dataview.getUint8(0) & 0x80),
            allowTalkaround: !!(dataview.getUint8(1) & 0x01),
            rxOnly: !!(dataview.getUint8(1) & 0x02),
            rxRefFrequency: dataview.getUint8(3) & 0x03,
            txRefFrequency: dataview.getUint8(4) & 0x03,
            vox: !!(dataview.getUint8(4) & 0x10),
            highPower: !!(dataview.getUint8(4) & 0x20),
            tot: dataview.getUint8(8) * 15,
            totRekeyDelay: dataview.getUint8(9),
            scanList: dataview.getUint8(11),
            rxFrequency: parseBCD(dataview, 16, 4) * 10,
            txFrequency: parseBCD(dataview, 20, 4) * 10,
            name: parseString(dataview, 32, 16, 2)
        }
        if (channel.mode == 'digital') {
            channel.repeaterSlot = (dataview.getUint8(1) & 0x0c) >> 2;
            channel.colorCode = (dataview.getUint8(1) & 0xf0) >> 4;
            channel.privacyNum = dataview.getUint8(2) & 0x0f;
            channel.privacy = (dataview.getUint8(2) & 0x30) >> 4;
            channel.privateCallConfirmed = !!(dataview.getUint8(2) & 0x40);
            channel.dataCallConfirmed = !!(dataview.getUint8(2) & 0x80);
            channel.emergencyAlarmAck = !!(dataview.getUint8(3) & 0x08);
            channel.compressedUdpHdr = !!(dataview.getUint8(3) & 0x40);
            channel.admitCriteria = (dataview.getUint8(4) & 0xc0) >> 6;
            channel.contact = dataview.getUint16(6, true);
            channel.emergencySystem = dataview.getUint8(10);
            channel.rxGroupList = dataview.getUint8(12);
        } else if (channel.mode == 'analog') {
            channel.displayPttId = !(dataview.getUint8(3) & 0x80);
            channel.reverseBurst = !!(dataview.getUint8(4) & 0x04);
            channel.qtReverse = (dataview.getUint8(4) & 0x08) ? 120 : 180;
            channel.decode18 = dataview.getUint8(13);
            channel.ctcssDcsDecode = parseBCD(dataview, 24, 2);
            channel.ctcssDcsEncode = parseBCD(dataview, 26, 2);
            channel.rxSignalingSys = dataview.getUint8(28);
            channel.txSignalingSys = dataview.getUint8(29); 
        }
        return channel;
    }

    import(codePlugBin) {
        this.contacts = [];
        this.dmrIdToContactMap = {};
        for (let i = 0; i < 1000; i++) {
            let offset = contactListOffset + (i * 36);
            let contact = this._parseContact(
                codePlugBin.slice(offset, offset + 36).buffer);
            this.contacts.push(contact);
            if (contact) {
                this.dmrIdToContactMap[contact.dmrId] = i;
            }
        }
        this.channels = [];
        for (let i = 0; i < 1000; i++) {
            let offset = channelListOffset + (i * 64);
            let channel = this._parseChannel(
                codePlugBin.slice(offset, offset + 64).buffer);
            this.channels.push(channel);
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
        let radioName = parseString(
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

        await this._putContiguousBlocks(codePlug, 0, 0x40000, 0x00000000);
        await this._putContiguousBlocks(codePlug, 0x40000, 0x90000, 0x00110000);
    }
}
