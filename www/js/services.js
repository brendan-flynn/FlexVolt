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

.factory('bluetoothPlugin', ['$timeout', function($timeout){

    var bluetoothPlugin = {
        isConnected: undefined,
        connect: undefined,
        connectionId: undefined,
        disconnect: undefined,
        clear: undefined,
        list: undefined,
        write: undefined,
        subscribe: undefined
    };

    ionic.Platform.ready(function() {
        window.device = ionic.Platform.device();
        window.platform = ionic.Platform.platform();
        //console.log('INFO: ionic ready, platform: '+window.platform);
        if (window.cordova) {
            window.flexvoltPlatform = 'cordova';
            console.log('INFO: ionic ready, using cordova, platform: '+window.platform);
            bluetoothPlugin.connect = bluetoothSerial.connect;
            bluetoothPlugin.disconnect = bluetoothSerial.disconnect;
            bluetoothPlugin.clear = bluetoothSerial.clear;
            bluetoothPlugin.list = bluetoothSerial.list;
            bluetoothPlugin.subscribe = bluetoothSerial.subscribeRawData;
            bluetoothPlugin.write = bluetoothSerial.write;
            bluetoothPlugin.isConnected = function(connectedCB, notConnectedCB, errFunc){
                try{
                    bluetoothSerial.isconnected(connectedCB, notConnectedCB);
                } catch(err) {errFunc(err);}
            };
        } else {
            // For chrome.serial, include wrappers to handle different args.
            // bluetoothSerial is the template for args
            window.flexvoltPlatform = 'chrome';
            console.log('INFO: ionic ready, using chrome, platform: '+window.platform);
            //console.log(chrome.serial);
            bluetoothPlugin.isConnected = function(connectedCB, notConnectedCB, errFunc){
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
            bluetoothPlugin.connect = function(portName, callback, errFunc){
                console.log('DEBUG: bluetoothPlugin.connect');
                try {
                    //console.log('Chrome connecting to '+portName);
                    // was having issues with windows 8 not disconnecting quickly enough
                    // so far the solution has been a 50ms $timeout in felxvolt.js between
                    // searching disconnect and connecting connect.
                    // The complex inner guts below may no longer be necessary
                    chrome.serial.connect(portName,{bitrate: 230400, ctsFlowControl: true},function(info){
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
                                    console.log('Disconnected, portNamt:'+portName);
                                    chrome.serial.connect(portName,{bitrate: 230400, ctsFlowControl: true},function(info){
                                        if (chrome.runtime.lastError) {
                                            console.log('ERROR: Chrome runtime error during Serial.connect: '+chrome.runtime.lastError.message);
                                        }
                                        console.log('DEBUG: Chrome connecting to '+portName+' 2nd time');
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
            bluetoothPlugin.disconnect = function(callback,errFunc){
                console.log('DEBUG: bluetoothPlugin.disconnect');
                try {
                    // find and disconnect all existing connections
                    //console.log('In disconnect, connectionId: '+bluetoothPlugin.connectionId);
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
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.clear = function(callback,errFunc){
                console.log('DEBUG: bluetoothPlugin.clear');
                try {
                    chrome.serial.flush(bluetoothPlugin.connectionId, callback);
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.list = function(callback,errFunc){
                console.log('DEBUG: bluetoothPlugin.list');
                try {
                    chrome.serial.getDevices(callback);
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.subscribe = function(callback,errFunc){
                var onReceiveCallback = function(obj){
                    //console.log('received!');
                    var bytes = new Uint8Array(obj.data);
                    callback(bytes);
                };
                try {
                    //console.log('settings up events');
                    chrome.serial.onReceive.addListener(onReceiveCallback);
                    chrome.serial.onReceiveError.addListener(errFunc);
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.write = function(data,callback,errFunc){
                if (bluetoothPlugin.connectionId === angular.undefined){
                    console.log('ERROR: Cannot write to port, connectionId undefined!');
                    return;
                } else if(bluetoothPlugin.connectionId<0){
                    console.log('ERROR: Cannot write to port, connectionId: '+bluetoothPlugin.connectionId);
                    return;
                }
                try {
                    if ( (typeof data) === 'string'){
                        //console.log('data to write, '+data+', was a string!');
                        var buf=new ArrayBuffer(data.length);
                        var bufView=new Uint8Array(buf);
                        for (var i=0; i<data.length; i++) {
                          bufView[i]=data.charCodeAt(i);
                        }
                        data = buf;
                    }
                    var onSent = function(sendInfo){
                        //console.log('sent '+sendInfo.bytesSent+' bytes with error: '+sendInfo.error);
                        callback();
                    };
                    //console.log('chrome.serial.writing:');
                    //console.log(data); // IT'S AN ARRAY BUFFER - CAN't LOG IT DIRECTLY
                    chrome.serial.send(bluetoothPlugin.connectionId, data, onSent);
                } catch(err) {errFunc(err);}
            };
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
            gotEntry(entry).
              then(function(){
                deferred.resolve();
              });
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
