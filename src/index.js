import { DFU } from './dfu';
import { MD380, MD380DFU, TYTDFU } from './tyt';

function requestRadioAccess() {
    MD380DFU.requestDevice()
        .then((device) => TYTDFU.fromUsbDevice(device))
        .then((dfu) => window.dfu = dfu);
    window.md380 = new MD380();
}

let connectToRadioBtn = document.createElement('button');
connectToRadioBtn.innerText = "Connect to Radio";
connectToRadioBtn.onclick = requestRadioAccess;
document.querySelector('body').appendChild(connectToRadioBtn);