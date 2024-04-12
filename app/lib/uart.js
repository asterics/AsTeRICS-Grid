/*
--------------------------------------------------------------------
Web Bluetooth / Web Serial Interface library for Nordic UART
                     Copyright 2021 Gordon Williams (gw@pur3.co.uk)
                     https://github.com/espruino/EspruinoWebTools
--------------------------------------------------------------------
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
--------------------------------------------------------------------
This creates a 'Puck' object that can be used from the Web Browser.

Simple usage:

  UART.write("LED1.set()\n")

Execute expression and return the result:

  UART.eval("BTN.read()", function(d) {
    alert(d);
  });

Or write and wait for a result - this will return all characters,
including echo and linefeed from the REPL so you may want to send
`echo(0)` and use `console.log` when doing this.

  UART.write("1+2\n", function(d) {
    alert(d);
  });

Or more advanced usage with control of the connection
- allows multiple connections

  UART.connect(function(connection) {
    if (!connection) throw "Error!";
    connection.on('data', function(d) { ... });
    connection.on('close', function() { ... });
    connection.write("1+2\n", function() {
      connection.close();
    });
  });

ChangeLog:

...
1v00: Auto-adjust BLE chunk size up if we receive >20 bytes in a packet
      Drop UART.debug to 1 (less info printed)
      Fixed flow control on BLE
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.UART = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

  if (typeof navigator == "undefined") return;
  var isBusy;
  var queue = [];

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }
  function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++)
      bufView[i] = str.charCodeAt(i);
    return buf;
  }

  function handleQueue() {
    if (!queue.length) return;
    var q = queue.shift();
    log(3,"Executing "+JSON.stringify(q)+" from queue");
    if (q.type=="eval") uart.eval(q.expr, q.cb);
    else if (q.type=="write") uart.write(q.data, q.callback, q.callbackNewline);
    else log(1,"Unknown queue item "+JSON.stringify(q));
  }

  function log(level, s) {
    if (uart.log) uart.log(level, s);
  }

  var endpoints = [];
  var WebBluetooth = {
    name : "Web Bluetooth",
    description : "Bluetooth LE devices",
    svg : '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z" fill="#ffffff"/></svg>',
    isSupported : function() {
      if (navigator.platform.indexOf("Win")>=0 &&
          (navigator.userAgent.indexOf("Chrome/54")>=0 ||
           navigator.userAgent.indexOf("Chrome/55")>=0 ||
           navigator.userAgent.indexOf("Chrome/56")>=0)
          )
        return "Chrome <56 in Windows has navigator.bluetooth but it's not implemented properly";;
      if (window && window.location && window.location.protocol=="http:" &&
          window.location.hostname!="localhost")
        return "Serving off HTTP (not HTTPS) - Web Bluetooth not enabled";
      if (navigator.bluetooth) return true;
      var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (iOS) {
        return "To use Web Bluetooth on iOS you'll need the WebBLE App.\nPlease go to https://itunes.apple.com/us/app/webble/id1193531073 to download it.";
      } else {
        return "This Web Browser doesn't support Web Bluetooth.\nPlease see https://www.espruino.com/Puck.js+Quick+Start";
      }
    },
    connect : function(connection, callback) {
      var NORDIC_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
      var NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
      var NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
      var DEFAULT_CHUNKSIZE = 20;

      var btServer = undefined;
      var btService;
      var connectionDisconnectCallback;
      var txCharacteristic;
      var rxCharacteristic;
      var txDataQueue = [];
      var flowControlXOFF = false;
      var chunkSize = DEFAULT_CHUNKSIZE;

      connection.close = function(callback) {
        connection.isOpening = false;
        if (connection.isOpen) {
          connection.isOpen = false;
          connection.emit('close');
        } else {
          if (callback) callback(null);
        }
        if (btServer) {
          btServer.disconnect();
          btServer = undefined;
          txCharacteristic = undefined;
          rxCharacteristic = undefined;
        }
      };

      connection.write = function(data, callback) {
        if (data) txDataQueue.push({data:data,callback:callback,maxLength:data.length});
        if (connection.isOpen && !connection.txInProgress) writeChunk();

        function writeChunk() {
          if (flowControlXOFF) { // flow control - try again later
            setTimeout(writeChunk, 50);
            return;
          }
          var chunk;
          if (!txDataQueue.length) {
            uart.writeProgress();
            return;
          }
          var txItem = txDataQueue[0];
          uart.writeProgress(txItem.maxLength - txItem.data.length, txItem.maxLength);
          if (txItem.data.length <= chunkSize) {
            chunk = txItem.data;
            txItem.data = undefined;
          } else {
            chunk = txItem.data.substr(0,chunkSize);
            txItem.data = txItem.data.substr(chunkSize);
          }
          connection.txInProgress = true;
          log(2, "Sending "+ JSON.stringify(chunk));
          txCharacteristic.writeValue(str2ab(chunk)).then(function() {
            log(3, "Sent");
            if (!txItem.data) {
              txDataQueue.shift(); // remove this element
              if (txItem.callback)
                txItem.callback();
            }
            connection.txInProgress = false;
            writeChunk();
          }).catch(function(error) {
           log(1, 'SEND ERROR: ' + error);
           txDataQueue = [];
           connection.close();
          });
        }
      };

      navigator.bluetooth.requestDevice({
          filters:[
            { namePrefix: 'Puck.js' },
            { namePrefix: 'Pixl.js' },
            { namePrefix: 'MDBT42Q' },
            { namePrefix: 'Bangle' },
            { namePrefix: 'RuuviTag' },
            { namePrefix: 'iTracker' },
            { namePrefix: 'Thingy' },
            { namePrefix: 'Espruino' },
            { services: [ NORDIC_SERVICE ] }
          ], optionalServices: [ NORDIC_SERVICE ]}).then(function(device) {
        log(1, 'Device Name:       ' + device.name);
        log(1, 'Device ID:         ' + device.id);
        // Was deprecated: Should use getPrimaryServices for this in future
        //log('BT>  Device UUIDs:      ' + device.uuids.join('\n' + ' '.repeat(21)));
        device.addEventListener('gattserverdisconnected', function() {
          log(1, "Disconnected (gattserverdisconnected)");
          connection.close();
        });
        return device.gatt.connect();
      }).then(function(server) {
        log(1, "Connected");
        btServer = server;
        return server.getPrimaryService(NORDIC_SERVICE);
      }).then(function(service) {
        log(2, "Got service");
        btService = service;
        return btService.getCharacteristic(NORDIC_RX);
      }).then(function (characteristic) {
        rxCharacteristic = characteristic;
        log(2, "RX characteristic:"+JSON.stringify(rxCharacteristic));
        rxCharacteristic.addEventListener('characteristicvaluechanged', function(event) {
          var dataview = event.target.value;
          if (dataview.byteLength > chunkSize) {
            log(2, "Received packet of length "+dataview.byteLength+", increasing chunk size");
            chunkSize = dataview.byteLength;
          }
          if (uart.flowControl) {
            for (var i=0;i<dataview.byteLength;i++) {
              var ch = dataview.getUint8(i);
              if (ch==17) { // XON
                log(2,"XON received => resume upload");
                flowControlXOFF = false;
              }
              if (ch==19) { // XOFF
                log(2,"XOFF received => pause upload");
                flowControlXOFF = true;
              }
            }
          }
          var str = ab2str(dataview.buffer);
          log(3, "Received "+JSON.stringify(str));
          connection.emit('data', str);
        });
        return rxCharacteristic.startNotifications();
      }).then(function() {
        return btService.getCharacteristic(NORDIC_TX);
      }).then(function (characteristic) {
        txCharacteristic = characteristic;
        log(2, "TX characteristic:"+JSON.stringify(txCharacteristic));
      }).then(function() {
        connection.txInProgress = false;
        connection.isOpen = true;
        connection.isOpening = false;
        isBusy = false;
        queue = [];
        callback(connection);
        connection.emit('open');
        // if we had any writes queued, do them now
        connection.write();
      }).catch(function(error) {
        log(1, 'ERROR: ' + error);
        connection.close();
      });
      return connection;
    }
  };
  var WebSerial = {
    name : "Web Serial",
    description : "USB connected devices",
    svg : '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M15 7v4h1v2h-3V5h2l-3-4-3 4h2v8H8v-2.07c.7-.37 1.2-1.08 1.2-1.93 0-1.21-.99-2.2-2.2-2.2-1.21 0-2.2.99-2.2 2.2 0 .85.5 1.56 1.2 1.93V13c0 1.11.89 2 2 2h3v3.05c-.71.37-1.2 1.1-1.2 1.95 0 1.22.99 2.2 2.2 2.2 1.21 0 2.2-.98 2.2-2.2 0-.85-.49-1.58-1.2-1.95V15h3c1.11 0 2-.89 2-2v-2h1V7h-4z" fill="#ffffff"/></svg>',
    isSupported : function() {
      if (!navigator.serial)
        return "No navigator.serial - Web Serial not enabled";
      if (window && window.location && window.location.protocol=="http:" &&
          window.location.hostname!="localhost")
        return "Serving off HTTP (not HTTPS) - Web Serial not enabled";
      return true;
    },
    connect : function(connection, callback) {
      var serialPort;
      function disconnected() {
        connection.isOpening = false;
        if (connection.isOpen) {
          log(1, "Disconnected");
          connection.isOpen = false;
          connection.emit('close');
        }
      }
      // TODO: Pass USB vendor and product ID filter when supported by Chrome.
      navigator.serial.requestPort({}).then(function(port) {
        log(1, "Connecting to serial port");
        serialPort = port;
        return port.open({ baudRate: 115200 });
      }).then(function () {
        function readLoop() {
          var reader = serialPort.readable.getReader();
          reader.read().then(function ({ value, done }) {
            reader.releaseLock();
            if (value) {
              var str = ab2str(value.buffer);
              log(3, "Received "+JSON.stringify(str));
              connection.emit('data', str);
            }
            if (done) {
              disconnected();
            } else {
              readLoop();
            }
          });
        }
        readLoop();
        log(1,"Serial connected. Receiving data...");
        connection.txInProgress = false;
        connection.isOpen = true;
        connection.isOpening = false;
        callback(connection);
      }).catch(function(error) {
        log(0, 'ERROR: ' + error);
        disconnected();
      });
      connection.close = function(callback) {
        if (serialPort) {
          serialPort.close();
          serialPort = undefined;
        }
        disconnected();
      };
      connection.write = function(data, callback) {
        var writer = serialPort.writable.getWriter();
        // TODO: progress?
        writer.write(str2ab(data)).then(function() {
          callback();
        }).catch(function(error) {
          log(0,'SEND ERROR: ' + error);
          closeSerial();
        });
        writer.releaseLock();
      };

      return connection;
    }
  };
  // ======================================================================
  endpoints.push(WebBluetooth);
  endpoints.push(WebSerial);
  // ======================================================================
  var connection;
  function connect(callback) {
    var connection = {
      on : function(evt,cb) { this["on"+evt]=cb; },
      emit : function(evt,data) { if (this["on"+evt]) this["on"+evt](data); },
      isOpen : false,
      isOpening : true,
      txInProgress : false
    };

    // modal
    var e = document.createElement('div');
    e.style = 'position:absolute;top:0px;left:0px;right:0px;bottom:0px;opacity:0.5;z-index:100;background:black;';
    // menu
    var menu = document.createElement('div');
    menu.style = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family: Sans-Serif;z-index:101;';
    var menutitle = document.createElement('div');
    menutitle.innerText = "SELECT A PORT...";
    menutitle.style = 'color:#fff;background:#000;padding:8px 8px 4px 8px;font-weight:bold;';
    menu.appendChild(menutitle);
    var items = document.createElement('div');
    items.style = 'color:#000;background:#fff;padding:4px 8px 4px 8px;';
    menu.appendChild(items);
    endpoints.forEach(function(endpoint) {
      var supported = endpoint.isSupported();
      if (supported!==true)
        log(0, endpoint.name+" not supported, "+supported);
      var ep = document.createElement('div');
      ep.style = 'width:300px;height:60px;background:#ccc;margin:4px 0px 4px 0px;padding:0px 0px 0px 68px;cursor:pointer;';
      ep.innerHTML = '<div style="position:absolute;left:8px;width:48px;height:48px;background:#999;padding:6px;cursor:pointer;">'+endpoint.svg+'</div>'+
                     '<div style="font-size:150%;padding-top:8px;">'+endpoint.name+'</div>'+
                     '<div style="font-size:80%;color:#666">'+endpoint.description+'</div>';
      ep.onclick = function(evt) {
        connection = endpoint.connect(connection, callback);
        evt.preventDefault();
        document.body.removeChild(menu);
        document.body.removeChild(e);
      };
      items.appendChild(ep);
    });
    document.body.appendChild(e);
    document.body.appendChild(menu);
    return connection;
  }
  function checkIfSupported() {
    var anySupported = false;
    endpoints.forEach(function(endpoint) {
      var supported = endpoint.isSupported();
      if (supported===true)
        anySupported = true;
      else
        log(0, endpoint.name+" not supported, "+supported);
    });
    return anySupported;
  }
  // ======================================================================
  /* convenience function... Write data, call the callback with data:
       callbackNewline = false => if no new data received for ~0.2 sec
       callbackNewline = true => after a newline */
  function write(data, callback, callbackNewline) {
    if (!checkIfSupported()) return;
    if (isBusy) {
      log(3, "Busy - adding write to queue");
      queue.push({type:"write", data:data, callback:callback, callbackNewline:callbackNewline});
      return;
    }

    var cbTimeout;
    function onWritten() {
      if (callbackNewline) {
        connection.cb = function(d) {
          var newLineIdx = connection.received.indexOf("\n");
          if (newLineIdx>=0) {
            var l = connection.received.substr(0,newLineIdx);
            connection.received = connection.received.substr(newLineIdx+1);
            connection.cb = undefined;
            if (cbTimeout) clearTimeout(cbTimeout);
            cbTimeout = undefined;
            if (callback)
              callback(l);
            isBusy = false;
            handleQueue();
          }
        };
      }
      // wait for any received data if we have a callback...
      var maxTime = 300; // 30 sec - Max time we wait in total, even if getting data
      var dataWaitTime = callbackNewline ? 100/*10 sec  if waiting for newline*/ : 3/*300ms*/;
      var maxDataTime = dataWaitTime; // max time we wait after having received data
      cbTimeout = setTimeout(function timeout() {
        cbTimeout = undefined;
        if (maxTime) maxTime--;
        if (maxDataTime) maxDataTime--;
        if (connection.hadData) maxDataTime=dataWaitTime;
        if (maxDataTime && maxTime) {
          cbTimeout = setTimeout(timeout, 100);
        } else {
          connection.cb = undefined;
          if (callbackNewline)
            log(2, "write waiting for newline timed out");
          if (callback)
            callback(connection.received);
          isBusy = false;
          handleQueue();
          connection.received = "";
        }
        connection.hadData = false;
      }, 100);
    }

    if (connection && (connection.isOpen || connection.isOpening)) {
      if (!connection.txInProgress) connection.received = "";
      isBusy = true;
      return connection.write(data, onWritten);
    }

    connection = connect(function(uart) {
      if (!uart) {
        connection = undefined;
        if (callback) callback(null);
        return;
      }
      connection.received = "";
      connection.on('data', function(d) {
        connection.received += d;
        connection.hadData = true;
        if (connection.cb)  connection.cb(d);
      });
      connection.on('close', function(d) {
        connection = undefined;
      });
      isBusy = true;
      connection.write(data, onWritten);
    });
  }

  function evaluate(expr, cb) {
    if (!checkIfSupported()) return;
    if (isBusy) {
      log(3, "Busy - adding eval to queue");
      queue.push({type:"eval", expr:expr, cb:cb});
      return;
    }
    write('\x10eval(process.env.CONSOLE).println(JSON.stringify('+expr+'))\n', function(d) {
      try {
        var json = JSON.parse(d.trim());
        cb(json);
      } catch (e) {
        log(1, "Unable to decode "+JSON.stringify(d)+", got "+e.toString());
        cb(null, "Unable to decode "+JSON.stringify(d)+", got "+e.toString());
      }
    }, true/*callbackNewline*/);
  };

  // ----------------------------------------------------------

  var uart = {
    /// Are we writing debug information? 0 is no, 1 is some, 2 is more, 3 is all.
    debug : 1,
    /// Should we use flow control? Default is true
    flowControl : true,
    /// Used internally to write log information - you can replace this with your own function
    log : function(level, s) { if (level <= this.debug) console.log("<UART> "+s)},
    /// Called with the current send progress or undefined when done - you can replace this with your own function
    writeProgress : function (charsSent, charsTotal) {
      //console.log(charsSent + "/" + charsTotal);
    },
    /** Connect to a new device - this creates a separate
     connection to the one `write` and `eval` use. */
    connect : connect,
    /// Write to a device and call back when the data is written.  Creates a connection if it doesn't exist
    write : write,
    /// Evaluate an expression and call cb with the result. Creates a connection if it doesn't exist
    eval : evaluate,
    /// Write the current time to the device
    setTime : function(cb) {
      var d = new Date();
      var cmd = 'setTime('+(d.getTime()/1000)+');';
      // in 1v93 we have timezones too
      cmd += 'if (E.setTimeZone) E.setTimeZone('+d.getTimezoneOffset()/-60+');\n';
      write(cmd, cb);
    },
    /// Did `write` and `eval` manage to create a connection?
    isConnected : function() {
      return connection!==undefined;
    },
    /// get the connection used by `write` and `eval`
    getConnection : function() {
      return connection;
    },
    /// Close the connection used by `write` and `eval`
    close : function() {
      if (connection)
        connection.close();
    },
    /** Utility function to fade out everything on the webpage and display
    a window saying 'Click to continue'. When clicked it'll disappear and
    'callback' will be called. This is useful because you can't initialise
    Web Bluetooth unless you're doing so in response to a user input.*/
    modal : function(callback) {
      var e = document.createElement('div');
      e.style = 'position:absolute;top:0px;left:0px;right:0px;bottom:0px;opacity:0.5;z-index:100;background:black;';
      e.innerHTML = '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family: Sans-Serif;font-size:400%;color:white;">Click to Continue...</div>';
      e.onclick = function(evt) {
        callback();
        evt.preventDefault();
        document.body.removeChild(e);
      };
      document.body.appendChild(e);
    }
  };
  return uart;
}));

export default { UART }