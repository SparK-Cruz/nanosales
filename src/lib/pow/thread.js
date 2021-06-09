const { parentPort } = require('worker_threads');
const Module = require('./pow');

Module['onRuntimeInitialized'] = function() {
    parentPort.postMessage('ready');
};

parentPort.on('message', function(data) {
    var { hash, threshold } = data;
    var PoW = Module.cwrap("launchPoW", 'string', ['string', 'string']);
    var generate = PoW(hash, threshold);

    parentPort.postMessage(generate);
});
