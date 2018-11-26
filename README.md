# tcp_splitter
TCP Splitter / Duplicator to two seperate servers

Version 0.1

Author: pittss <github.com/pittss/tcp_splitter>

Usage: node splitter.js <from> <to> <dupl>
  
Shema: node splitter.js [ip:]port [ip:]port [ip:]port

Example: node splitter.js 1330 1331 1332

Example: node splitter.js localhost:1330 localhost:1331 localhost:1332

## Additional settings in splitter.js

### _workers = 2;
0 - enable all workers (1cpu = 1worker)

1 - enable only one worker

2 - enable 1 worker for every 2 cpu (2cpu = 1worker)

### _debug = false; 
true, false

### _timeout_set = 0; 
0 - disable

int > 0 - timeout in ms
