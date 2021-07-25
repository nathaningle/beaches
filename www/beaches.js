'use strict';

var formElem;
var inputNets;
var outputPreElem;
var errDivElem;
var errPElem;
var statsElem;
var copyElem;

function handleSubmit(e) {
    e.preventDefault();
    errDivElem.hidden = true;

    try {
        let nets = inputNets.value
            .split(/\s+/)
            .filter(x => x)
            .map(IPv4Network.parse);
        let inputNetCount = nets.length;
        let aggNets = IPv4Network.coalesce(nets)
            .map(net => net.toString())

        outputPreElem.textContent = aggNets.join('\n');
        statsElem.textContent = ' (' + inputNetCount.toString() + " → " + aggNets.length.toString() + ')';
        copyElem.hidden = false;
    } catch (error) {
        outputPreElem.textContent = '';
        errPElem.textContent = error.message;
        errDivElem.hidden = false;
        statsElem.textContent = '';
        copyElem.hidden = true;
    }
}

function handleCopy(e) {
    navigator.clipboard.writeText(outputPreElem.textContent).then(
        () => console.debug('Wrote to clipboard with clipboard.writeText()'),
        () => console.debug('Failed to write to clipboard with clipboard.writeText()')
    );
}

window.addEventListener('DOMContentLoaded', e => {
    formElem = document.forms[0];
    formElem.addEventListener('submit', handleSubmit);
    inputNets = document.getElementById('nets');
    outputPreElem = document.getElementById('outputPre');
    errDivElem = document.getElementById('errorDiv');
    errDivElem.hidden = true;
    errPElem = document.getElementById('errorP');
    statsElem = document.getElementById('stats');
    copyElem = document.getElementById('copy');
    copyElem.addEventListener('click', handleCopy);
    copyElem.hidden = true;
});
