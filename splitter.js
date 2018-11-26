/*
TCP Splitter / Duplicator to two seperate servers
Version 0.1
Author: pittss <github.com/pittss/tcp_splitter>

Usage: node splitter.js <from> <to> <dupl>
Shema: node splitter.js [ip:]port [ip:]port [ip:]port

Example: node splitter.js 1330 1331 1332
Example: node splitter.js localhost:1330 localhost:1331 localhost:1332
*/

const net = require('net');
const util = require('util');
const cluster = require('cluster');

/*
Config
*/

const _workers = 2; // 0 - enable all workers (1cpu = 1worker), 1 - enable only one worker, 2 - enable 1 worker for every 2 cpu (2cpu = 1worker)
const _debug = false; // true, false
const _timeout_set = 0; // 0 - disable, int > 0 - timeout in ms

/*
Splitter
*/

const log = function() {
    
    arguments[0] = util.format('\r\n' + new Date().toISOString(), arguments[0]);
    console.log.bind(console).apply(console, arguments);

};

if(cluster.isMaster) {

    var workers = {};

    // parse "80" and "localhost:80" or even "42mEANINg-life.com:80"
    const addrRegex = /^(([a-zA-Z\-\.0-9]+):)?(\d+)$/;

    const addr = {
        from: addrRegex.exec(process.argv[2]),
        to: addrRegex.exec(process.argv[3]),
        dupl: addrRegex.exec(process.argv[4])
    };

    if (!addr.from || !addr.to || !addr.dupl) {

        console.log('TCP Splitter / Duplicator to two seperate servers');
        console.log('Version 0.1');
        console.log('Author: pittss <github.com/pittss/tcp_splitter>');
        console.log('Usage: <from> <to> <dupl>');
        console.log('Shema: [ip:]port [ip:]port [ip:]port');
        console.log('Example: 1330 1331 1332');
        console.log('Example: localhost:1330 localhost:1331 localhost:1332');

        process.exit();
        return;

    }

    addr.to[2] = addr.to[2] || '0.0.0.0';
    addr.dupl[2] = addr.dupl[2] || '0.0.0.0';
    addr.from[2] = addr.from[2] || '0.0.0.0';

    !_debug || log('Debug mode ON!');

    log('Cluster started with pid', process.pid);
    log('Listening on:', addr.from[2] + ':' + addr.from[3]);
    log('Forwarding to:', addr.to[2] + ':' + addr.to[3]);
    log('Duplicating to:', addr.dupl[2] + ':' + addr.dupl[3]);

    function spawn(addr) {
        const worker = cluster.fork();
        workers[worker.pid] = worker;
        worker.send(addr);
        return worker;
    }

    var count = require('os').cpus().length;

    if(_workers === 2) {
        count = Math.round(count / 2);
    }
    else if(_workers === 1) {
        count = 1;
    }

    log('Workers count:', count);

    for (var i = 0; i < count; i++) {
        spawn(addr);
    }

    cluster.on('exit', function(worker) {

        log('[cluster] Worker ' + worker.pid + ' died. spawning a new process...');
        delete workers[worker.pid];
        spawn(addr);

    });

} else {

    process.on('message', function(addr) {

        log('[cluster] Worker started with pid', process.pid);

        net.createServer(function(from) {

            from.on('error', function(err) {

                log('[warm][from] createServer:', err.code || '');
                from.end();

            }).on('end', function() {

                !_debug || log('[debug][from] Server socket disconnect.');

            });

            const dupl = net.createConnection({
                host: addr.dupl[2],
                port: addr.dupl[3]
            }, function() {

            }).on('data',function() {

            }).on('end',function() {

                !_debug || log('[debug][dupl] Client socket disconnect.');

            }).on('timeout', function() {

                !_debug || log('[debug][dupl] Client connection timeout.');
//                dupl.end();

            }).on('error', function(err) {

                log('[error][dupl] createConnection:', err.code || '', err.errno || '', err.address || '', err.port || '');

            });

            const to = net.createConnection({
                host: addr.to[2],
                port: addr.to[3]
            }, function() {

                from.pipe(to).pipe(from).pipe(dupl);

            }).on('data',function() {

            }).on('end',function() {

                !_debug || log('[debug][to] Client socket disconnect.');

            }).on('timeout', function() {

                !_debug || log('[debug][to] Client connection timeout.');
                !_timeout_set || from.end(); // to.end();

            }).on('error', function(err) {

                log('[error][to] createConnection:', err.code || '', err.errno || '', err.address || '', err.port || '');
                from.end();

            });

            !_timeout_set || to.setTimeout(_timeout_set), dupl.setTimeout(_timeout_set);

        }).on('error', function(err) {

            log('[error][from] createServer:', err.code || '', err.errno || '', err.address || '', err.port || '');

        }).listen(addr.from[3], addr.from[2], function() {

            log('[worker][' + process.pid + ']', 'Server bound...');

        });

    });

}
