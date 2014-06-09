zway.directive('zSwitch', function(control) {
  return {
    restrict: 'E',
    scope: {
      device: '='
    },
    template:
      '<div class="ui huge toggle checkbox">' +
      '<input id="switch-{{ id }}" type="checkbox" ng-model="on" ng-change="toggle()">' +
      '<label for="switch-{{ id }}" title="{{ updateTime }}">Switch</label>' +
      '</div>',
    link: function(s, e, a) {
      s.on = s.device.value;
      s.id = s.device.id;
      s.updateTime = new Date(s.device.updateTime).toLocaleTimeString();
      s.toggle = function() {
        console.log("Toggling switch #" + s.id);
        control.switch(2, s.on);
      };
      console.log(s);
    }
  };
});