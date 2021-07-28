'use strict';

var formElem;
var inputNets;
var inputMaxMask;
var outputMaxMask;
var outputPreElem;
var errDivElem;
var errPElem;
var statsElem;
var copyElem;
var resultValid = false;

function updateResult() {
    errDivElem.hidden = true;

    try {
        let max_masklen = inputMaxMask.valueAsNumber;
        let nets = inputNets.value
            .split(/\s+/)
            .filter(x => x)
            .map(s => IPv4Network.parse(s).clampMasklen(max_masklen));
        let inputNetCount = nets.length;
        let aggNets = IPv4Network.coalesce(nets)
            .map(net => net.toString())

        outputPreElem.textContent = aggNets.join('\n');
        statsElem.textContent = ' (' + inputNetCount.toString() + " → " + aggNets.length.toString() + ')';
        copyElem.hidden = false;
        resultValid = true;
    } catch (error) {
        resultValid = false;
        outputPreElem.textContent = '';
        errPElem.textContent = error.message;
        errDivElem.hidden = false;
        statsElem.textContent = '';
        copyElem.hidden = true;
    }
}

function handleSubmit(e) {
    e.preventDefault();
    updateResult();
}

function handleSliderInput(e) {
    outputMaxMask.textContent = inputMaxMask.value;
    if (resultValid)
        updateResult();
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
    outputMaxMask = document.getElementById('max_masklen_pos');
    inputMaxMask = document.getElementById('max_masklen');
    inputMaxMask.addEventListener('input', handleSliderInput);
    outputMaxMask.textContent = inputMaxMask.value;

    outputPreElem = document.getElementById('outputPre');
    errDivElem = document.getElementById('errorDiv');
    errDivElem.hidden = true;
    errPElem = document.getElementById('errorP');
    statsElem = document.getElementById('stats');
    copyElem = document.getElementById('copy');
    copyElem.addEventListener('click', handleCopy);
    copyElem.hidden = true;
});
