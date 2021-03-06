define([
  'angular',
  'jquery',
  'lodash',
],
function (angular, $) {
  'use strict';

  angular
    .module('grafana.directives')
    .directive('grafanaPanel', function($compile) {

      var container = '<div class="panel-container"></div>';
      var content = '<div class="panel-content"></div>';

      var panelHeader =
      '<div class="panel-header">'+
       '<div class="row-fluid panel-extra">' +
          '<div class="panel-extra-container">' +
            '<span class="alert-error panel-error small pointer"' +
                  'config-modal="app/partials/inspector.html" ng-show="panel.error">' +
              '<span data-placement="right" bs-tooltip="panel.error">' +
              '<i class="icon-exclamation-sign"></i><span class="panel-error-arrow"></span>' +
              '</span>' +
            '</span>' +

            '<span class="panel-loading" ng-show="panelMeta.loading == true">' +
              '<i class="icon-spinner icon-spin icon-large"></i>' +
            '</span>' +

            '<span class="dropdown">' +
              '<span class="panel-text panel-title pointer" gf-dropdown="panelMeta.menu" tabindex="1" ' +
              'data-drag=true data-jqyoui-options="kbnJqUiDraggableOptions"'+
              ' jqyoui-draggable="'+
              '{'+
                'animate:false,'+
                'mutate:false,'+
                'index:{{$index}},'+
                'onStart:\'panelMoveStart\','+
                'onStop:\'panelMoveStop\''+
                '}"  ng-model="row.panels" ' +
                '>' +
                '{{panel.title || "No title"}}' +
              '</span>' +
            '</span>'+

          '</div>'+
        '</div>\n'+
      '</div>';

      return {
        restrict: 'E',
        link: function($scope, elem, attr) {
          // once we have the template, scan it for controllers and
          // load the module.js if we have any
          var newScope = $scope.$new();

          $scope.kbnJqUiDraggableOptions = {
            revert: 'invalid',
            helper: function() {
              return $('<div style="width:200px;height:100px;background: rgba(100,100,100,0.50);"/>');
            },
            placeholder: 'keep'
          };

          // compile the module and uncloack. We're done
          function loadModule($module) {
            $module.appendTo(elem);
            elem.wrap(container);
            /* jshint indent:false */
            $compile(elem.contents())(newScope);
            elem.removeClass("ng-cloak");
          }

          newScope.$on('$destroy',function() {
            elem.unbind();
            elem.remove();
          });

          $scope.$watch(attr.type, function (name) {
            elem.addClass("ng-cloak");
            // load the panels module file, then render it in the dom.
            var nameAsPath = name.replace(".", "/");
            $scope.require([
              'jquery',
              'text!panels/'+nameAsPath+'/module.html'
            ], function ($, moduleTemplate) {
              var $module = $(moduleTemplate);
              // top level controllers
              var $controllers = $module.filter('ngcontroller, [ng-controller], .ng-controller');
              // add child controllers
              $controllers = $controllers.add($module.find('ngcontroller, [ng-controller], .ng-controller'));

              if ($controllers.length) {
                $controllers.first().prepend(panelHeader);
                $controllers.first().find('.panel-header').nextAll().wrapAll(content);

                $scope.require(['panels/' + nameAsPath + '/module'], function() {
                  loadModule($module);
                });
              } else {
                loadModule($module);
              }
            });
          });

        }
      };
    });

});
