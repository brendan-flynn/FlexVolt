/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 *
 * main services factory for app
 *
 */

(function () {
'use strict';

angular.module('flexvolt.services', [])

.factory('bluetoothPlugin', ['$timeout','$interval', function($timeout, $interval){

    var bluetoothPlugin = {
        isConnected: undefined,
        connect: undefined,
        connectionId: undefined,
        disconnect: undefined,
        clear: undefined,
        getDevices: undefined,
        write: undefined,
        subscribe: undefined,
        unsubscribe: undefined
    };

    var onReceiveListener, onReceiveErrorListener

    var BLE_SERVICES_LIST = ['ffe0']; // currently just the temperature service hijacked by Bolutek BLE module

    ionic.Platform.ready(function() {
        window.device = ionic.Platform.device();
        window.platform = ionic.Platform.platform();
        //console.log('INFO: ionic ready, platform: '+window.platform);
        if (window.cordova) {
          window.flexvoltPlatform = 'cordova';
          console.log('INFO: ionic ready, using cordova, platform: '+window.platform+'.');

          bluetoothPlugin.connect = function(device, success, error) {
            if (device.bluetoothLE) {
              ble.connect(device.id, success, error);
            } else {
              bluetoothSerial.connect(device.id, success, error);
            }
          };
          bluetoothPlugin.disconnect = function(device, success, error) {
            // works whether connected or not.
            if (device && device.bluetoothLE) {
              ble.disconnect(device.id, success, error);
            } else {
              bluetoothSerial.disconnect(success, error);
            }
          };
          bluetoothPlugin.clear = function(device, success, error) {
            console.log('DEBUG: bluetoothPlugin.clear - Deprecated');
            // not sure we ever need this function
            if (device && device.bluetoothLE) {
              // there is no clear for the LE plugin...
              //console.log('DEBUG: no clear for bt.LE');
              success();
            } else {
              //console.log('DEBUG: bt.serial clear');
              //bluetoothSerial.clear(success, error);
              success();
            }
          };
          bluetoothPlugin.getDevices = function(singleDeviceCallback, error) {
            //singleDeviceCallback adds a single device to the devices service
            // bluetoothSerial returns a LIST of devices
            bluetoothSerial.list(
              function(listOfDevices) {
                listOfDevices.forEach(function(device){
                  device.bluetoothLE = false;
                  singleDeviceCallback(device)
                })
              },
              error
            ); // get bluetooth classic (2.0) devices - returns a list

            ble.scan(
              [],
              5,
              function(device) {
                device.bluetoothLE = true;
                singleDeviceCallback(device);
              },
              error); // scan for Bolutek ble module with service ffe0 (also a temperature sensor service)
            // ble.scan calls callback for EACH device found.
          };
          bluetoothPlugin.subscribe = function(device, onData, error) {
            if (device && device.bluetoothLE) {
              ble.startNotification(device.id, 'ffe0', 'ffe1', onData, error);
            } else {
              bluetoothSerial.subscribeRawData(onData, error);
            }
          };
          bluetoothPlugin.unsubscribe = function(device, success, error) {
            if (device && device.bluetoothLE) {
              console.log('DEBUG: BLE unsubscribe');
              ble.stopNotification(device.id, 'ffe0', 'ffe1', success, error);
            } else {
              console.log('DEBUG: BL.Serial unsubscribe');
              bluetoothSerial.unsubscribeRawData(success, error);
            }
          };
          bluetoothPlugin.write = function(device, data, success, error) {
            if (typeof data === 'string') { data = data.charCodeAt(0);}
            var newData = new Uint8Array(1);
            newData[0] = data;
            if (device && device.bluetoothLE) {
              ble.write(device.id, 'ffe0', 'ffe1', newData.buffer, success, error);
            } else {
              bluetoothSerial.write(newData.buffer, success, error);
            }
          }
          bluetoothPlugin.writeArray = function(device, dataArray, success, error) {
            // TODO - Note cannot use the array[int] or arrayBuffer all at once as
            // suggested in the readme for bluetoothSerial/bluetoothLEcentra.
            // something to do with data formats or timing?

            sendTimer = $interval(sendFunc, 1, nBytes);
            var sendTimer;
            var bufInd = 0;
            var nBytes = dataArray.length;

            function errorOut(msg) {
              $interval.cancel(sendTimer);
              error(msg);
            }

            function sendFunc(){
                if (bufInd < nBytes){
                    bluetoothPlugin.write(device, dataArray[bufInd], function(){}, errorOut);
                    bufInd++;
                    if (bufInd >= nBytes){
                        $interval.cancel(sendTimer);
                    }
                }
            }
            sendTimer = $interval(sendFunc, 1, nBytes);
          }
          bluetoothPlugin.isConnected = function(device, connectedCB, notConnectedCB, errFunc){
            if (device && device.bluetoothLE) {
              ble.isConnected(device.id, connectedCB, notConnectedCB);
            } else {
              try{
                  bluetoothSerial.isconnected(connectedCB, notConnectedCB);
              } catch(err) {errFunc(err);}
            }
          };

        } else if (chrome && chrome.serial) {
            // For chrome.serial, include wrappers to handle different args.
            // bluetoothSerial is the template for args
            window.flexvoltPlatform = 'chrome';
            console.log('INFO: ionic ready, using chrome, platform: '+window.platform);
            //console.log(chrome.serial);
            bluetoothPlugin.isConnected = function(device, connectedCB, notConnectedCB, errFunc){
                console.log('DEBUG: bluetoothPlugin.isConnected');
                try {
                    chrome.serial.getInfo(bluetoothPlugin.connectionId, function(info){
                        if (info === angular.undefined){
                            //console.log('No connection info found.');
                            notConnectedCB();
                        } else {
                            //console.log('Still connected with info:');
                            //console.log(info);
                            connectedCB();
                        }
                    });
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.connect = function(device, callback, errFunc){
                console.log('DEBUG: bluetoothPlugin.connect');
                try {
                    //console.log('Chrome connecting to '+device.name);
                    // was having issues with windows 8 not disconnecting quickly enough
                    // so far the solution has been a 50ms $timeout in felxvolt.js between
                    // searching disconnect and connecting connect.
                    // The complex inner guts below may no longer be necessary
                    chrome.serial.connect(device.path,{bitrate: 230400, ctsFlowControl: true},function(info){
                        if (chrome.runtime.lastError) {
                            console.log('ERROR: Chrome runtime error during Serial.connect: '+chrome.runtime.lastError.message);
                        }
                        if (info === angular.undefined){
                            console.log('DEBUG: Connection info empty');
                            //errFunc('Connection Unsuccessful.')
                            $timeout(function(){
                                //console.log('Clearing/Disconnecting');
                                bluetoothPlugin.disconnect(function(){
                                    if (chrome.runtime.lastError) {
                                        console.log('ERROR: Chrome runtime error during Serial.disconnect: '+chrome.runtime.lastError.message);
                                    }
                                    console.log('Disconnected, device:'+device.name);
                                    chrome.serial.connect(device.path,{bitrate: 230400, ctsFlowControl: true},function(info){
                                        if (chrome.runtime.lastError) {
                                            console.log('ERROR: Chrome runtime error during Serial.connect: '+chrome.runtime.lastError.message);
                                        }
                                        console.log('DEBUG: Chrome connecting to '+device.name+' 2nd time');
                                        if (info === angular.undefined){
                                            errFunc('Connection info was empty 2nd time');
                                            return;
                                        } else {
                                            //console.log('connected with info:');
                                            console.log(info);
                                            // save the Id for future write calls
                                            bluetoothPlugin.connectionId = info.connectionId;
                                            callback();
                                        }
                                    });
                                },errFunc);
                            },50);
                        } else {
                            //console.log('connected with info:');
                            console.log(info);
                            // save the Id for future write calls
                            bluetoothPlugin.connectionId = info.connectionId;
                            callback();
                        }
                    });
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.disconnect = function(device, callback, errFunc){
                console.log('DEBUG: bluetoothPlugin.disconnect');
                try {
                    // find and disconnect all existing connections
                    console.log('In disconnect, connectionId: '+bluetoothPlugin.connectionId);
                    if (bluetoothPlugin.connectionId) {
                      chrome.serial.getConnections( function(connectionInfos){
                          if (chrome.runtime.lastError) {
                              console.log('ERROR: Chrome runtime error during serial.getConnections: '+chrome.runtime.lastError.message);
                          }
                          connectionInfos.forEach(function(con){
                              console.log('Disconnecting connectionId '+con.connectionId);
                              chrome.serial.disconnect(con.connectionId, function(){
                                  if (chrome.runtime.lastError) {
                                      console.log('ERROR: Chrome runtime error during serial.disconnect: '+chrome.runtime.lastError.message);
                                  }
                                      //console.log('disconnecting');
                              });
                          });
                          bluetoothPlugin.connectionId = undefined;
                          callback();
                      });
                    } else {
                        console.log('connectionId undefined, skipping the disconnect step.');
                        callback();
                    }
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.clear = function(callback,errFunc){
                console.log('DEBUG: bluetoothPlugin.clear - Deprecated');
                try {
                    // chrome.serial.flush(bluetoothPlugin.connectionId, callback);
                    callback();
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.getDevices = function(singleDeviceCallback,errFunc){
                console.log('DEBUG: bluetoothPlugin.list');
                try {
                    chrome.serial.getDevices(
                      function(listOfDevices){
                        listOfDevices.forEach(function(device){
                          device.name = device.path;
                          singleDeviceCallback(device);
                        })
                      });
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.subscribe = function(device, callback, errFunc){
                try {
                    // out with the old
                    if (onReceiveListener) {chrome.serial.onReceive.removeListener(onReceiveListener);}
                    if (onReceiveErrorListener) {chrome.serial.onReceiveError.removeListener(onReceiveErrorListener);}
                    // setup the new
                    onReceiveListener = function(obj){
                        //console.log('received!');
                        var bytes = new Uint8Array(obj.data);
                        callback(bytes);
                    };
                    onReceiveErrorListener = errFunc;
                    // in with the new
                    //console.log('settings up event listeners');
                    chrome.serial.onReceive.addListener(onReceiveListener);
                    chrome.serial.onReceiveError.addListener(onReceiveErrorListener);
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.unsubscribe = function(device, success, errFunc) {
                console.log('DEBUG: BT Unsubscribe');
                try {
                    //console.log('removing event listeners');
                    chrome.serial.onReceive.removeListener(onReceiveListener);
                    chrome.serial.onReceiveError.removeListener(onReceiveErrorListener);
                    console.log('DEBUG: Chrome Unsubscribe complete.');
                    success();
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.write = function(device, data, callback, errFunc){
                if (bluetoothPlugin.connectionId === angular.undefined){
                    console.log('ERROR: Cannot write to port, connectionId undefined!');
                    return;
                } else if(bluetoothPlugin.connectionId<0){
                    console.log('ERROR: Cannot write to port, connectionId: '+bluetoothPlugin.connectionId);
                    return;
                }
                try {
                    if (typeof data === 'string') { data = data.charCodeAt(0);}
                    var newData = new Uint8Array(1);
                    newData[0] = data;

                    var onSent = function(sendInfo){
                        //console.log('sent '+sendInfo.bytesSent+' bytes with error: '+sendInfo.error);
                        callback();
                    };
                    //console.log('chrome.serial.writing:');
                    //console.log(data); // IT'S AN ARRAY BUFFER - CAN't LOG IT DIRECTLY
                    chrome.serial.send(bluetoothPlugin.connectionId, newData.buffer, onSent);
                } catch(err) {errFunc(err);}
            };
            bluetoothPlugin.writeArray = function(device, dataArray, success, error) {
                if (bluetoothPlugin.connectionId === angular.undefined){
                    console.log('ERROR: Cannot write to port, connectionId undefined!');
                    return;
                } else if(bluetoothPlugin.connectionId<0){
                    console.log('ERROR: Cannot write to port, connectionId: '+bluetoothPlugin.connectionId);
                    return;
                }

                //data can be an array or Uint8Array
                var sendTimer;
                var bufInd = 0;
                var nBytes = dataArray.length;

                function errorOut(msg) {
                  $interval.cancel(sendTimer);
                  error(msg);
                }

                function sendFunc(){
                    if (bufInd < nBytes){
                        bluetoothPlugin.write(device, dataArray[bufInd], function(){}, errorOut);
                        bufInd++;
                        if (bufInd >= nBytes){
                            $interval.cancel(sendTimer);
                            success();
                        }
                    }
                }
                sendTimer = $interval(sendFunc, 20, nBytes);
            }
        } else {
            // Web serve
            window.flexvoltPlatform = 'broswer';
            console.log('INFO: ionic ready, using browser, platform: browser');
            //console.log(chrome.serial);
            bluetoothPlugin.isConnected = function(connectedCB, notConnectedCB, errFunc){
                console.log('DEBUG: bluetoothPlugin.isConnected');
                try {
                    connectedCB();
                } catch (err) {errFunc(err);}connectedCB();
            };
            bluetoothPlugin.connect = function(device, callback, errFunc){
                console.log('DEBUG: browser bluetoothPlugin.connect');
                bluetoothPlugin.connectionId = 'fakeFlexVoltId';
                try {
                    callback();
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.disconnect = function(device, callback, errFunc){
                console.log('DEBUG: bluetoothPlugin.disconnect');
                try {
                    callback();
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.clear = function(callback,errFunc){
                console.log('DEBUG: bluetoothPlugin.clear - Deprecated');
                try {
                    callback();
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.getDevices = function(singleDeviceCallback,errFunc){
                console.log('DEBUG: browser bluetoothPlugin.list');
                device.name = 'fakeDevice';
                singleDeviceCallback(device);
            };
            bluetoothPlugin.subscribe = function(device, callback, errFunc){
                console.log('DEBUG: browser bluetoothPlugin.subscribe');
            };
            bluetoothPlugin.unsubscribe = function(device, success, errFunc) {
                console.log('DEBUG: browser bluetoothPlugin.unsubscribe');
                try {
                    success();
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.write = function(device, data, callback, errFunc){
                try {
                    callback();
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.writeArray = function(device, dataArray, success, error) {
                console.log('DEBUG: browser bluetoothPlugin.writeArray');
                try {
                    success();
                } catch (err) {errFunc(err);}
            }
        }

    });

    return bluetoothPlugin;
}])

//.factory('clipboard', function(){
//
//
//    var clipboard = {
//        copy: undefined,
//        paste: undefined
//    };
//
//    ionic.Platform.ready(function() {
//        if (window.cordova && window.cordova.plugins !== angular.undefined && window.cordova.plugins.clipboard !== angular.undefined) {
//            //console.log('initializing clipboard');
//            //console.log(window.cordova.plugins);
//            clipboard.copy = window.cordova.plugins.clipboard.copy;
//            clipboard.paste = window.cordova.plugins.clipboard.paste;
//        } else {
//            clipboard.copy = function(){};
//            clipboard.paste = function(){};
//        }
//
//    });
//
//    return clipboard;
//})
.factory('file', ['$q', 'storage', function($q, storage){
    var file = {
        getDirectory: undefined,
        currentEntry: undefined,
        path: undefined,
        id: undefined,
        readFile: undefined,
        writeFile: undefined
    };


    storage.get('saveDirectory')
      .then(function(tmp){
          if (tmp){
              file.currentEntry = tmp['entry'];
              file.path = tmp['path'];
              file.id = tmp['id'];
              chrome.fileSystem.isRestorable(file.id, function(isRestorable){
                if (isRestorable){
                  //console.log('isrestorable');
                  chrome.fileSystem.restoreEntry(file.id, gotEntry)
                } else {
                  file.currentEntry = undefined;
                  file.path = undefined;
                  file.id = undefined;
                }
              });
              console.log('DEBUG: file settings: '+angular.toJson(tmp));
          }
      });

    function gotEntry(entry){
      var deferred = $q.defer();
      if (angular.isDefined(entry)) {
        file.currentEntry = entry;
        file.id = chrome.fileSystem.retainEntry(file.currentEntry)
        chrome.fileSystem.getDisplayPath(file.currentEntry, function(displayPath){
          if (!file.currentEntry || !file.currentEntry.isDirectory){
              file.currentEntry = undefined;
              file.path = undefined;
              file.id = undefined;
              console.log('DEBUG: Resolving gotEntry with no entry and no displayPath');
              deferred.resolve();
          } else {
              chrome.fileSystem.getDisplayPath(file.currentEntry, function(displayPath){
                console.log('INFO: Loaded displayPath: '+angular.toJson(displayPath));
                file.path = displayPath;
                storage.set({saveDirectory:{path: file.path, entry: file.currentEntry, id: file.id }});
                deferred.resolve();
              });
          }
        });
      } else {
        // user cancelled - shouldn't get here
      }


      return deferred.promise;
    }

    function errorHandler(e){
        console.log('ERROR: in fileSystem: '+angular.toJson(e));
    };

    function convertToCSV(dataObj) {
        var str = '';

        var nPts = dataObj[0].data.length;

        if (typeof(dataObj[0].channel) !== 'undefined') {
          var header = '';
          for (var i = 0; i < dataObj.length; i++) {
              header += 'Channel'+(dataObj[i].channel+1)+',';
          }
          str += header + '\r\n';
        }

        for (var jPts = 0; jPts < nPts; jPts++) {
            var line = '';

            for (var i = 0; i < dataObj.length; i++) {
                line += dataObj[i].data[jPts]+',';
            }

            str += line + '\r\n';
        }

        return str;
    }

    function convertArrToCSV(dataArr) {
        var str = '';

        var nPts = dataArr[0].length;

        for (var jPts = 0; jPts < nPts; jPts++) {
            var line = '';

            for (var i = 0; i < dataArr.length; i++) {
                line += dataArr[i][jPts]+',';
            }

            str += line + '\r\n';
        }

        return str;
    }


    if (window.cordova) {
        file.getDirectory = function(){
          console.log('cordova file getDirectory');
        };
        file.readFile = function(){
          console.log('cordova file readFile');
        };
        file.writeFile = function(){
          console.log('cordova file writeFile');
        };

    } else if (chrome && chrome.fileSystem) {

        file.getDirectory = function(){
          var deferred = $q.defer();

          chrome.fileSystem.chooseEntry({type:'openDirectory'}, function(entry){
            if (chrome.runtime.lastError) {
                console.log('ERROR: Chrome runtime error during fileSystem.chooseEntry: '+chrome.runtime.lastError.message);
                deferred.reject();
            } else {
              gotEntry(entry).
                then(function(){
                  deferred.resolve();
                });
            }
          });

          return deferred.promise;
        };

        var openFile = function(filename){
          // handle extensions
          if (filename.indexOf('.') < 0){
            filename = filename + '.txt';
          }

          chrome.fileSystem.getWritableEntry(file.currentEntry, function(entry){
            if (chrome.runtime.lastError) {
                console.log('ERROR: Chrome runtime error during fileSystem.getWritableEntry: '+chrome.runtime.lastError.message);
            }
            entry.getFile(filename, {create: true}, function(newEntry){
              newEntry.createWriter(function(writer){

                writer.onwriteend = function(){
                  //console.log('Write completed.');
                };

                writer.onwriteerror = function(e){
                  console.log('ERROR: Error writing file: ' + JSON.stringify(e));
                };

                file.writer = writer;
              }, errorHandler);
            }, errorHandler);
          });
        };

        var writeFile = function(data){
          // convert to csv, then text blob
          if (typeof(data) === 'object' && data.length === undefined) {
              data = convertToCSV(data);
          } else if (typeof(data) === 'object' && data.length !== undefined) {
              data = convertArrToCSV(data);
          }
          data = new Blob([data]);

          file.writer.write(data,{type: 'text/plain'});
        };

        file.openFile = function(filename){
          if (!file.currentEntry || !file.currentEntry.isDirectory){
            file.getDirectory().
              then(function(){
                openFile(filename);
              });
          } else {
            //console.log('already have a directory - writing');
            openFile(filename);
          }
        };

        file.closeFile = function(){
          file.writer = undefined;
        };

        file.writeFile = function(filename, data){
          if (!file.writer){
            file.openFile().
              then(function(){
                writeFile(data);
              });
          } else {
            writeFile(data);
          }
        };

        window.fs = chrome.fileSystem;
    } else {
        file.getDirectory = function(){
          console.log('WARNING: unknown os file getDirectory');
        };
        file.readFile = function(){
          console.log('WARNING: unknown os file readFile');
        };
        file.writeFile = function(){
          console.log('WARNING: unknown os file writeFile');
        };
    }

    return file;
}])
.factory('storage', ['$window', '$q', function($window, $q) {
    var storage = {
        set: undefined,
        get: undefined,
        load: undefined,
        dataStore: undefined
    };

    var backupStorage = {};

    var readyDeferred = $q.defer();

    if (window.cordova) {
        // window.localStorage is synchronous, so we can load as needed
        storage.set = function(obj) {
            return readyDeferred.promise
                .then(function(){
                    var key = Object.keys(obj)[0];
                    var value = obj[key].valueOf();
                    $window.localStorage[key] = JSON.stringify(value);
                });
        };
        storage.get = function(key) {
            return readyDeferred.promise
                .then(function(){
                    return $window.localStorage.hasOwnProperty(key)? JSON.parse($window.localStorage[key]):false;
                });
        };
        readyDeferred.resolve();
        //window.storage = storage;
    } else if (chrome && chrome.storage) {
        // chrome storage is ASYNC, which is a pain, so load all now into a copy
        // then load from the copy as needed...

        storage.set = function(obj) {
            return readyDeferred.promise
                .then(function(){
                    chrome.storage.local.set(obj);
                    storage.load(); // just to keep them in sync
                });
        };
        // pass in default object, overwrites key values if present in storage
        storage.get = function(key) {
            return readyDeferred.promise
                .then(function(){return storage.dataStore[key];});
        };
        storage.load = function() {
            chrome.storage.local.get(null, function(item){
                // only log this on initial load
                if (storage.dataStore === angular.undefined){
                    storage.dataStore = item;
                    readyDeferred.resolve();
                    console.log('Loaded stored settings: '+JSON.stringify(storage.dataStore));
                } else {
                    storage.dataStore = item;
                }

            });
        };

        storage.load();

        window.storage = storage;
    } else {
        storage.set = function(obj) {
            return readyDeferred.promise
                .then(function(){
                    var key = Object.keys(obj)[0];
                    var value = obj[key].valueOf();
                    backupStorage[key] = value;
                });
        };
        storage.get = function(key) {
            return readyDeferred.promise
                .then(function(){
                    return backupStorage.hasOwnProperty(key)? backupStorage[key] : false;
                });
        };
        readyDeferred.resolve();
    }

    return storage;
}])
;

}());
