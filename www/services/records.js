(function () {
    'use strict';

    angular.module('flexvolt.records', [])

    .factory('records', ['$q', 'storage', function($q, storage) {
      // Format for a record:
      // dummyrecord = {
      //   filename: 'flexvolt-recorded-data-DATE-TIME.txt',
      //   taskName: '$state.current.name',
      //   hardwareSettings: 'hardwareLogic.settings',
      //   softwareSettings: // filters, window sizes, etc.
      //   length: datalength,
      //   task: $state.current.name,
      //   startTime: new Date();
      //   stopTime: new Date();
      // }


      var recordData = [];

      storage.get('records')
          .then(function(tmp){
              if (tmp){
                  console.log('found records: ' + JSON.stringify(tmp));
                  recordData = tmp;
              }
          });

      var records = {
        put: undefined,
        clearForTask: undefined,
        getForTask: undefined,
        clearAll: undefined,
        getAll: undefined
      };

      records.put = function(record) {
        console.log('added new record');
        recordData.push(record);
        storage.set({records:recordData});
      };

      records.clearForTask = function(task) {
        recordData = recordData.filter(function(record) {return record.taskName !== task;});
        storage.set({records:recordData});
      };

      records.getForTask = function(task) {
        return recordData.filter(function(record) {return record.taskName === task;});
      };

      records.clearAll = function() {
        recordData = [];
        storage.set({records:recordData});
      };

      records.getAll = function() {
        return recordData.slice(0); // cheap copy function
      }

      return records;
    }])
}());
