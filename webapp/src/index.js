import { DFU } from './dfu';
import { MD380, MD380DFU, MDUV380DFU, TYTDFU } from './tyt';

function requestRadioAccess() {
    MDUV380DFU.requestDevice([
            { 'vendorId': 0x0483, 'productId': 0xdf11 },
            { 'vendorId': 0x28e9, 'productId': 0x018a, }])
        .then((device) => TYTDFU.fromUsbDevice(device))
        .then((dfu) => window.dfu = dfu);
    window.md380 = new MD380();
}

function downloadCodePlug(dfu) {
    fetch('https://webcps.ky0lo.com/xxxxxxx.bin')
    .then(response => response.arrayBuffer())
    .then(data => programCodePlug(dfu, data));
}

async function programCodePlug(dfu, codePlug) {
    await dfu.putCodePlug(codePlug);
    await dfu.setTime();
}

let connectToRadioBtn = document.createElement('button');
connectToRadioBtn.innerText = "Connect to Radio";
connectToRadioBtn.onclick = requestRadioAccess;
document.querySelector('body').appendChild(connectToRadioBtn);
