(function () {
    'use strict';

    angular.module('flexvolt.devices', [])

    .factory('devices', [function() {
      var devices = {
        add: undefined,
        get: undefined,
        getPreferred: undefined,
        getUnknown: undefined,
        getAll: undefined,
        reset: undefined
      };

      var deviceList = [];

      // Find all devices with FlexVolt in the name.
      function getPreferred() {
          var preferred = [];
          deviceList.forEach(function(device) {
            if (angular.isDefined(device) &&
                angular.isDefined(device.name) &&
                (typeof(device.name) === 'string') &&
                (device.name.toLowerCase().indexOf('flexvolt') > -1)
              ) {
              preferred.push(device);
            }
          });

          return preferred;
      }

      // Find all devices without FlexVolt in the name
      // For windows this will be everything, since they only list ports as COMs
      function getUnknown() {
          var preferred = getPreferred();
          var unknown = deviceList.filter(function(el){return preferred.indexOf(el) < 0; });

          return unknown;
      }

      devices.add = function(device){
        if (window.chrome) {
          device.id = device.path; // chrome uses path, android uses id
          var mCU = '/dev/cu.';
          var mTTY = '/dev/tty.';
          var shortName;
          if (device.id.indexOf(mCU) === 0) {
            // if /dev/tty is already here, don't add /dev/cu
            shortName = device.id.slice(mCU.length);
            if (devices.get(mTTY+shortName)){
              console.log('INFO: Already added '+mTTY+shortName+'.  Discarding '+device.id);
              return;
            }
          } else if (device.id.indexOf(mTTY) === 0) {
            // if this is tty and cu already exists, toss cu
            shortName = device.id.slice(mTTY.length);
            device.name = shortName;
            if (devices.get(mCU+shortName)){
              console.log('INFO: Already added '+mCU+shortName+'.  Replacing with '+device.id);
              devices.remove(mCU+shortName);
            }
          }
        }
        deviceList.push(device);
        console.log('INFO: Added device: ' +JSON.stringify(device));
      };

      devices.remove = function(id) {
        var index = deviceList.findIndex(function(elem){
          return elem.id === id;
        });
        if (index >= 0) {deviceList.splice(index,1);}
      };

      devices.get = function(id){
        var device_found = deviceList.filter(function(device){
          return device.id == id;
        });
        return device_found[0];
      };

      devices.getPreferred = function() {
        return getPreferred();
      };

      devices.getUnknown = function() {
        return getUnknown();
      };

      devices.getAll = function(){
          return deviceList;
      };

      devices.reset = function(){
        deviceList = [];
      };

      return devices;
    }]);
}());
