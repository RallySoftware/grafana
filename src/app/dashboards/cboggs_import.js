/* global _ */

/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes a number of user
 * supplied URL parameters (int ARGS variable)
 *
 * Global accessable variables
 * window, document, $, jQuery, ARGS, moment
 *
 * Return a dashboard object, or a function
 *
 * For async scripts, return a function, this function must take a single callback function,
 * call this function with the dasboard object
 */

'use strict';

// accessable variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;

function find_hostnames(query) {
    var search_url = window.location.protocol + '//bld-influxdb-01/db/alm-test/series?u=testuser&p=testpw&q=' + query;
    var results = [];
    var request = new XMLHttpRequest();
    request.open('GET', search_url, false);
    request.send(null);
    var obj = JSON.parse(request.responseText);

    for (var i = 0; i < obj[0]["points"].length; i++) {
        results.push(obj[0]["points"][i][1]);
    };

    return results.sort();
};

return function(callback) {

    // Setup some variables
    var dashboard, timspan, panels;

    var rowHeight = '200px';
    var argHostname = (ARGS.host || 'bogus.rally.prod');
    var argPrefix = (ARGS.prefix || 'bogus');
    var argService = (ARGS.service || 'Bogus');
    var argTemplate = (ARGS.template || 'foo_template.js');
    var argAggregate;

    if (!_.isUndefined(ARGS.agg) && ARGS.agg === "true") {
        argAggregate = true;
    } else {
        argAggregate = false;
    }

    // Set a default timespan if one isn't specified
    timspan = '1d';

    // Intialize a skeleton with nothing but a rows array and service object
    dashboard = {
        rows: [],
        services: {}
    };

    // Set a title
    dashboard.title = argAggregate ? argService + ' Aggregate' : argService;

    dashboard.services.filter = {
        time: {
            from: "now-" + (ARGS.from || timspan),
            to: "now"
        }
    };

    $("head").append('<script type="text/javascript" src="/' + argTemplate + '.js"></script>');

    $.ajax({
        method: 'GET',
        url: '/'
    })
        .done(function(result) {
            if (argAggregate) {
                dashboard.rows.push({
                    title: argHostname.split(".")[0],
                    height: rowHeight,
                    panels: window[argTemplate](argHostname, argPrefix, argAggregate),
                });
            } else {
                var hosts = find_hostnames('select distinct(hostname) from allHosts where hostname =~ /' + argHostname + '/');
                console.log(hosts.length);

                for (var i = 0; i < hosts.length; i++) {
                    dashboard.rows.push({
                        title: 'Chart',
                        height: rowHeight,
                        panels: window[argTemplate](hosts[i], argPrefix, argAggregate, i + 1),
                    });
                }
            }

            // when dashboard is composed call the callback
            // function and pass the dashboard
            // console.log(dashboard);
            callback(dashboard);

        });
}