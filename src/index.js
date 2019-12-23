import { DFU } from './dfu';
import { MD380, MD380DFU } from './md380';

function requestRadioAccess() {
    MD380DFU.requestDevice().then((device) => {
        window.dfu = new MD380DFU();
        dfu.open(device);
    });
    window.md380 = new MD380();
}

document.getElementById('connectToRadio').onclick = requestRadioAccess;
