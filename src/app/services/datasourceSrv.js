define([
  'angular',
  'lodash',
  'config',
  './graphite/graphiteDatasource',
  './influxdb/influxdbDatasource',
  './opentsdb/opentsdbDatasource',
  './elasticsearch/es-datasource',
],
function (angular, _, config) {
  'use strict';

  var module = angular.module('grafana.services');

  module.service('datasourceSrv', function($q, filterSrv, $http, $injector) {
    var datasources = {};
    var metricSources = [];
    var annotationSources = [];
    var grafanaDB = {};

    this.init = function() {
      _.each(config.datasources, function(value, key) {
        datasources[key] = this.datasourceFactory(value);
        if (value.default) {
          this.default = datasources[key];
        }
      }, this);

      if (!this.default) {
        this.default = datasources[_.keys(datasources)[0]];
        this.default.default = true;
      }

      // create list of different source types
      _.each(datasources, function(value, key) {
        if (value.supportMetrics) {
          metricSources.push({
            name: value.name,
            value: value.default ? null : key,
          });
        }
        if (value.supportAnnotations) {
          annotationSources.push({
            name: key,
            editorSrc: value.annotationEditorSrc,
          });
        }
        if (value.grafanaDB) {
          grafanaDB = value;
        }
      });

    };

    this.datasourceFactory = function(ds) {
      var Datasource = null;
      switch(ds.type) {
      case 'graphite':
        Datasource = $injector.get('GraphiteDatasource');
        break;
      case 'influxdb':
        Datasource = $injector.get('InfluxDatasource');
        break;
      case 'opentsdb':
        Datasource = $injector.get('OpenTSDBDatasource');
        break;
      case 'elasticsearch':
        Datasource = $injector.get('ElasticDatasource');
        break;
      }
      return new Datasource(ds);
    };

    this.get = function(name) {
      if (!name) { return this.default; }
      if (datasources[name]) { return datasources[name]; }

      throw "Unable to find datasource: " + name;
    };

    this.getAnnotationSources = function() {
      return annotationSources;
    };

    this.getMetricSources = function() {
      return metricSources;
    };

    this.getGrafanaDB = function() {
      return grafanaDB;
    };

    this.init();
  });
});
