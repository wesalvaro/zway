var zway = angular.module('zway', []);

/** @type {string} */
zway.BASE_URL = 'http://192.168.1.2:8083/ZWaveAPI/';

/** @enum {number} */
zway.CommandClasses = {
  BATTERY: 0x80,
  DOOR_LOCK: 0x62,
  METER: 0x32,
  SENSOR_BINARY: 0x31,
  SENSOR_MULTI: 0x30,
  SWITCH_BINARY: 0x25,
  SWITCH_MULTI: 0x26,
  THERMOSTAT_SETPOINT: 0x43,
  WAKEUP: 0x84
};

/** @enum {number} */
zway.GenericClasses = {
  CONTROLLER_BASIC: 0x01,
  CONTROLLER_STATIC: 0x02,
  METER: 0x31,
  SENSOR_BINARY: 0x20,
  SENSOR_MULTI: 0x21,
  SWITCH_BINARY: 0x10,
  SWITCH_MULTI: 0x11,
  THERMOSTAT: 0x08
};

zway.ON = 255;
zway.OFF = 0;

/** @enum {number} */
zway.NodeId = {
  BROADCAST: 255
};

zway.service('control', function($http) {
  var timestamp = 0;
  var controllerNodeId;

  this.switch = function(deviceIndex, enabled) {
    var set = enabled ? zway.ON : zway.OFF;
    return $http.get(
        zway.BASE_URL + 'Run/devices[' + deviceIndex + '].instances[0].commandClasses[0x25].Set(' + set + ')');
  };

  this.status = function() {
    return $http.get(zway.BASE_URL + 'Data/' + timestamp).then(function(res) {
      var data = res.data;
      controllerNodeId = data.controller.data.nodeId.value;
      return data;
    });
  };

  var value = function(genericType, commandClasses) {
    var commandClass;
    var path = 'level';
    switch (genericType) {
      case zway.GenericClasses.SWITCH_BINARY:
        commandClass = zway.CommandClasses.SWITCH_BINARY;
        break;
      case zway.GenericClasses.SWITCH_MULTI:
        commandClass = zway.CommandClasses.SWITCH_MULTI;
        break;
      case zway.GenericClasses.SWITCH_BINARY:
        commandClass = zway.CommandClasses.SENSOR_BINARY;
        break;
      case zway.GenericClasses.SENSOR_MULTI:
        commandClass = zway.CommandClasses.SENSOR_MULTI;
        path = 'val';
        break;
    }
    var value = commandClasses[commandClass].data[path];
    return {value: value.value, updateTime: value.updateTime * 1000};
  };

  this.devices = function() {
    return this.status().then(function(status) {
      var devices = {};
      angular.forEach(status.devices, function(device, id) {
        if (id == controllerNodeId) return;  // Skip controller.
        var isListening = device.data.isListening.value;
        var data = device.data;
        var genericType = data.genericType.value;
        var instance = device.instances[0];
        var commandClasses = instance.commandClasses;
        devices[id] = {
          id: id,
          basicType: data.basicType.value,
          genericType: genericType,
          specificType: data.specificType.value,
          isListening: isListening,
          isFLiRS: !isListening && (data.sensor250.value || data.sensor1000.value),
          hasWakeup: zway.CommandClasses.WAKEUP in commandClasses,
          hasBattery: zway.CommandClasses.BATTERY in commandClasses
        };
        angular.extend(devices[id], value(genericType, commandClasses));
      });
      return devices; 
    });
  };

  this.device = function(i) {
    return this.devices().then(function(devices) { return devices[i]; })
  };

  this.controller = function() {
    return this.status().then(function(status) { return status.controller.data; });
  };

});

zway.controller('system', function(control) {
  var self = this;
  this.refresh = function() {
    control.devices().then(function(devices) {
      self.devices = devices;
    });
  };
  this.refresh();
});