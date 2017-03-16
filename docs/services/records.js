(function () {
    'use strict';

    angular.module('flexvolt.records', [])

    .factory('records', [function() {
      // Format for a record:
      // task, date/time, settings, length, dataRaw, dataFiltered


      var recordData = [];

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
      };

      records.clearForTask = function(task) {
        recordData = recordData.filter(function(record) {return record.task !== task;});
      };

      records.getForTask = function(task) {
        return recordData.filter(function(record) {return record.task === task;});
      };

      records.clearAll = function() {
        recordData = [];
      };

      records.getAll = function() {
        return recordData.slice(0); // cheap copy function
      }

      return records;
    }])
}());
