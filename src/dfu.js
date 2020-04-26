import { sleep } from "./util";

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

export class DFU {
	async open(device) {
		if (this.device) {
			await this.close();
		}
		
		await device.open();
		await device.claimInterface(0);
		this.device = device;
    }
	
	async ctrlReqIn(req, len, value = 0, index = 0) {
		let ctrlReqType = {
			requestType: 'class',
			recipient: 'interface',
			request: req,
			value: value,
			index: index
		};
		
		let resp;
		for (let i = 0; i < 5; i++) {
			resp = await this.device.controlTransferIn(ctrlReqType, len);
			if (resp.status == 'ok') {
				break;
			}
			console.trace(resp);
			sleep(50);
		}
		return resp;
	}

	async ctrlReqOut(req, data, value = 0, index = 0) {
		if (data == null) {
			data = new ArrayBuffer(0);
		}

		let ctrlReqType = {
			requestType: 'class',
			recipient: 'interface',
			request: req,
			value: value,
			index: index
		};

		let resp;
		for (let i = 0; i < 5; i++) {
			resp = await this.device.controlTransferOut(ctrlReqType, data);
			if (resp.status == 'ok') {
				break;
			}
			console.trace(resp);
			sleep(50);
		}
		return resp;
	}

	async getStatus() {
		let resp = await this.ctrlReqIn(GETSTATUS, 6);
		// TODO: Map to object?
		return [resp.data.getUint8(0),
			resp.data.getUint8(1) << 16 | resp.data.getUint16(2),
			resp.data.getUint8(4), resp.data.getUint8(5)];
	}

    async getState() {
		let stateResp = await this.ctrlReqIn(GETSTATE, 1);
		// TODO: Map to enum?
        return stateResp.data.getUint8(0);
	}

	async detach() {
		await this.ctrlReqOut(DETACH, null);
	}

	async clearStatus() {
		await this.ctrlReqOut(CLRSTATUS, null);
	}

	async abort() {
		await this.ctrlReqOut(ABORT, null);
	}

	async download(blockNum, data) {
		await this.ctrlReqOut(DNLOAD, data, blockNum);
	}

	async upload(blockNum, length, index = 0) {
		return await this.ctrlReqIn(UPLOAD, length, blockNum, index);
	}

	async _sendDnloadCommand(data) {
		await this.ctrlReqOut(DNLOAD, data);
		await this.getStatus();
		let status = await this.getStatus();
		// TODO: Check status
		await this.enterDFUMode();
	}

	async _sendAddrCommand(cmd, addr) {
		let data = new ArrayBuffer(5);
		let dataview = new DataView(data);
		dataview.setUint8(0, cmd);
		dataview.setUint32(1, addr, true);
		await this._sendDnloadCommand(data);
	}

	async setAddress(addr) {
		await this._sendAddrCommand(0x21, addr);
	}

	async eraseBlock(addr) {
		await this._sendAddrCommand(0x41, addr);	
	}

	async getCommand() {
		let resp = await this.upload(0, 32);
		await this.getStatus();
		return resp;
	}

	async waitTilReady() {
		while (true) {
			let status = await this.getStatus();
			if (status[2] == dfuIDLE) {
				return;
			}
			await this.clearStatus();
		}
	}
	
	async enterDFUMode() {
		while (true) {
			let state = await this.getState();
			switch (state) {
				case dfuIDLE:
					return;
				case dfuERROR:
					await this.clearStatus();
					break;
				case appIDLE:
					await this.detach();
					break;
				case appDETACH:
				case dfuDNBUSY:
				case dfuMANIFEST_WAIT_RESET:
					await sleep(100);
					break;
				default:
					await this.abort();
					break;
			}
		}
	}
}
