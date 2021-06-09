const { Worker } = require('worker_threads');

var pow_initiate = function(threads, worker_path) {
    if (typeof worker_path == 'undefined') { worker_path = './dist/lib/pow/'; }
    if (isNaN(threads)) { threads = 8; }
    var workers = [];
    for (let i = 0; i < threads; i++) {
        workers[i] = new Worker(worker_path + 'thread.js');
    }
    return workers;
}

var pow_terminate = function(workers) {
    var threads = workers.length;
    for (let i = 0; i < threads; i++) {
        workers[i].terminate();
    }
}

var pow_callback = function(workers, hash, threshold, callback) {
    if ( (hash.length == 64) && (typeof callback == 'function')) {
        var threads = workers.length;
        for (let i = 0; i < threads; i++) {
            workers[i].on('message', function(result) {
                if(result == 'ready') {
                    result = false;
                }

                if (result !== false && result != "0000000000000000") {
                    pow_terminate(workers);
                    callback(result);
                    return;
                }

                workers[i].postMessage({ hash, threshold });
            });
        }
    }
}

module.exports = {
    pow_initiate,
    pow_callback,
    pow_terminate,
}
