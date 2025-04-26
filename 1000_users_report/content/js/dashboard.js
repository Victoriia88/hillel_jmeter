/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 59.34, "KoPercent": 40.66};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.5643, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.6685, 500, 1500, "All characters"], "isController": false}, {"data": [0.2975, 500, 1500, "ChangeHero"], "isController": false}, {"data": [0.1405, 500, 1500, "DeleteHero"], "isController": false}, {"data": [0.7215, 500, 1500, "GetById"], "isController": false}, {"data": [0.9935, 500, 1500, "CreateHero"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 10000, 4066, 40.66, 91.4906999999999, 0, 2195, 4.0, 172.0, 509.8499999999967, 1446.9899999999998, 1428.9797084881395, 24920.01830322056, 211.50253308981138], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["All characters", 2000, 372, 18.6, 336.93000000000075, 0, 2195, 106.0, 1178.5000000000005, 1446.9499999999998, 1632.98, 287.68699654775605, 24550.04742340334, 36.818878560126585], "isController": false}, {"data": ["ChangeHero", 2000, 1405, 70.25, 11.08950000000002, 0, 280, 1.0, 29.90000000000009, 74.0, 180.0, 411.35335252982316, 235.4931660710613, 59.032419786096256], "isController": false}, {"data": ["DeleteHero", 2000, 1719, 85.95, 6.433, 0, 234, 1.0, 13.0, 39.94999999999982, 112.99000000000001, 420.16806722689074, 241.0820969012605, 47.928702731092436], "isController": false}, {"data": ["GetById", 2000, 557, 27.85, 36.570000000000036, 0, 247, 7.0, 133.0, 144.0, 171.0, 393.77830281551485, 166.30807460868283, 51.33576983658201], "isController": false}, {"data": ["CreateHero", 2000, 13, 0.65, 66.43100000000008, 0, 328, 18.5, 226.0, 248.0, 309.99, 393.8558487593541, 114.44685561490743, 88.27082666650256], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset by peer (connect failed)", 28, 0.6886374815543532, 0.28], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 357, 8.780127889818003, 3.57], "isController": false}, {"data": ["404/Not Found", 1821, 44.78603049680275, 18.21], "isController": false}, {"data": ["Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 33: http://localhost:3001/character/${randomHeroId}", 1860, 45.74520413182489, 18.6], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 10000, 4066, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 33: http://localhost:3001/character/${randomHeroId}", 1860, "404/Not Found", 1821, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 357, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset by peer (connect failed)", 28, "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["All characters", 2000, 372, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 356, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset by peer (connect failed)", 16, "", "", "", "", "", ""], "isController": false}, {"data": ["ChangeHero", 2000, 1405, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 33: http://localhost:3001/character/${randomHeroId}", 744, "404/Not Found", 661, "", "", "", "", "", ""], "isController": false}, {"data": ["DeleteHero", 2000, 1719, "404/Not Found", 975, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 33: http://localhost:3001/character/${randomHeroId}", 744, "", "", "", "", "", ""], "isController": false}, {"data": ["GetById", 2000, 557, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 33: http://localhost:3001/character/${randomHeroId}", 372, "404/Not Found", 185, "", "", "", "", "", ""], "isController": false}, {"data": ["CreateHero", 2000, 13, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset by peer (connect failed)", 12, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Broken pipe (Write failed)", 1, "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
