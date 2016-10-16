var $ = require("jquery")
var d3 = require("d3")
var HashMap = require("hashmap")
var tinycolor = require("tinycolor2");

var margin = {
        top: 100,
        right: 0,
        bottom: 0,
        left: 140
    },
    width = $("#chart").parent().width() - margin.left - margin.right,
    height = $("#chart").parent().height() - margin.top - margin.bottom,
    gridSize = Math.floor(width / 12),
    legendElementWidth = gridSize * 1.25,
    h_labels = [],
    v_labels = [],
    default_value = null,
    default_color = null,
    color_ranges = [],
    range_hashmap = new HashMap(),
    uniqueValues = [],
    default_value = null,
    default_color = null,
    minimum_value = null,
    minimum_color = null,
    maximum_value = null,
    maximum_color = null;
var intensity_hashmap = new HashMap();
intensity_map_values = [
    [100, "FF"],
    [95, "F2"],
    [90, "E6"],
    [85, "D9"],
    [80, "CC"],
    [75, "BF"],
    [70, "B3"],
    [65, "A6"],
    [60, "99"],
    [55, "8C"],
    [50, "80"],
    [45, "73"],
    [40, "66"],
    [35, "59"],
    [30, "4D"],
    [25, "40"],
    [20, "33"],
    [15, "26"],
    [10, "1A"],
    [5, "0D"],
    [0, "00"]
];

for (var i = 0; i < intensity_map_values.length; i++) {
    intensity_hashmap.set(intensity_map_values[i][0], intensity_map_values[i][1]);
}

$.getJSON("data.json", function(data) {
    h_labels = data.h_labels;
    v_labels = data.v_labels;
    color_ranges = data.color_scheme.ranges;
    uniqueValues = get_range_values(data.color_scheme.ranges);

    default_value = data.color_scheme.default_value;
    default_color = data.color_scheme.default_color;
    minimum_value = uniqueValues[0]
    minimum_color = getRangeWhereMinimumIs(minimum_value, color_ranges);
    maximum_value = uniqueValues[uniqueValues.length - 1];
    maximum_color = getRangeWhereMaximumIs(maximum_value, color_ranges);

    uniqueValues.splice(0, 1);

    var iterator = null;
    for (var i = 0; i < uniqueValues.length; i++) {
        for (var j = 0; j < color_ranges.length; j++) {
            if (uniqueValues[i] === color_ranges[j].maximum) {
                range_hashmap[uniqueValues[i]] = color_ranges[j];
                break;
            }
        }
    }
    loadChart(data);
});

function getRangeWhereMinimumIs(value, color_ranges) {
    for (var i = 0; i < color_ranges.length; i++) {
        if (color_ranges[i].minimum === value) {
            return color_ranges[i].color;
        }
    }
    alert("Data related to ranges is not passed correctly.");
    return null;
}

function getRangeWhereMaximumIs(value, color_ranges) {
    var range = null;
    for (var i = 0; i < color_ranges.length; i++) {
        if (color_ranges[i].maximum === value) {
            return color_ranges[i].color;
        }
    }
    alert("Data related to ranges is not passed correctly.");
    return null;
}

function get_range_values(ranges) {
    values = []
    for (var i = 0; i < ranges.length; i++) {
        values.push(ranges[i].minimum)
        values.push(ranges[i].maximum)
    }
    var uniqueValues = [];
    $.each(values, function(i, el) {
        if ($.inArray(el, uniqueValues) === -1)
            uniqueValues.push(el);
    });
    return uniqueValues;
}

function loadChart(data) {
    var svg = d3.select("#chart").append("svg").attr("width", width).attr("height", height).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define the div for the tooltip
    var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    var courseLabels = svg.selectAll(".courseLabel").data(v_labels).enter().append("text").text(function(d) {
        return d;
    }).attr("x", 0).attr("y", function(d, i) {
        return i * gridSize;
    }).style("text-anchor", "end").style("margin-right", "5px").attr("transform", "translate(-6," + gridSize / 1.5 + ")").attr("class", function(d, i) {
        return ((i >= 0 && i <= 7) ?
            "courseLabel mono axis axis-workweek" :
            "courseLabel mono axis");
    });

    var x = d3.scale.linear().domain([
        0, gridSize * h_labels.length
    ]).range([
        0, gridSize * h_labels.length
    ]);

    var xAxis = d3.svg.axis(x)
        .tickValues([
            gridSize * 0,
            gridSize * 1,
            gridSize * 2,
            gridSize * 3,
            gridSize * 4,
            gridSize * 5,
            gridSize * 6
        ]).tickFormat(function(d, i) {
            return h_labels[i];
        });

    svg.append("g").attr("class", "x axis").call(xAxis).selectAll("text").attr("class", "mono").style("font-weight", "bold").style("text-anchor", "start").attr("dx", "2.25em").attr("dy", "0.4em").attr("transform", "rotate(-45)");

    var heatmapChart = function() {
        raw_data = data.content;
        data = [];
        for (var i = 0; i < raw_data.length; i++) {
            for (var j = 0; j < raw_data.length; j++) {
                data.push({
                    "x": j,
                    "y": i,
                    "text": raw_data[i][j].text,
                    "value": raw_data[i][j].value
                });
            }
        }

        var cards = svg.selectAll(".assignment").data(data);

        cards.append("title");

        cards.enter().append("rect").attr("x", function(d) {
            return (d.x) * gridSize;
        }).attr("y", function(d) {
            return (d.y) * gridSize;
        }).attr("rx", 4).attr("ry", 4).attr("class", "hour bordered").attr("width", gridSize).attr("height", gridSize).on("mouseover", function(d) {
            div.transition().duration(200).style("opacity", .65);
            div.html(d.text + "<br/>").style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px");
        }).on("mouseout", function(d) {
            div.transition().duration(500).style("opacity", 0);
        });

        cards.transition().duration(1000).style("fill", function(d) {
            return get_fill_color(d.value);
        });

        cards.select("title").text(function(d) {
            return d.value;
        });

        cards.exit().remove();

        function get_fill_color(value) {
            if (value === default_value) {
                return default_color;
            } else if (value === minimum_value) {
                return minimum_color;
            } else if (value === maximum_value) {
                return maximum_color;
            }

            for (var i = 0; i < uniqueValues.length; i++) {
                if (value < uniqueValues[i]) {
                    if (i == 0) {
                        minimum = minimum_value;
                    } else {
                        minimum = uniqueValues[i - 1];
                    }
                    return getColorWithIntensity(range_hashmap[uniqueValues[i]].color, value, minimum, uniqueValues[i]);
                }
            }

            return range_hashmap[uniqueValues[uniqueValues.length - 1]].color;
        }

        function getRangeColor(value) {
            if (value === default_value) {
                return default_color;
            } else if (value === minimum_value) {
                return minimum_color;
            } else if (value === maximum_value) {
                return maximum_color;
            }

            for (var i = 0; i < uniqueValues.length; i++) {
                if (value < uniqueValues[i]) {
                    return range_hashmap[uniqueValues[i]].color;
                }
            }
        }

        function getColorWithIntensity(color, value, minimum_in_range, maximum_in_range) {
            var intensity_percentage = get_brightening_intensity_percentage(value, minimum_in_range, maximum_in_range);
            var final_color = getAdjustedColor(color, intensity_percentage);
            return final_color;
        }

        function get_brightening_intensity_percentage(value, min, max) {
            if (value < 0) {
                var diff = value - min;
            } else {
                var diff = max - value;
            }

            return (diff * 100 / Math.abs(max - min)) / 5
        }

        function getAdjustedColor(color, intensity_percentage) {
            return tinycolor(color).lighten(intensity_percentage).toString();
        }

        var legend = svg.selectAll(".legend").data(uniqueValues);

        legend.enter().append("g").attr("class", "legend");

        legend.append("rect").attr("x", function(d, i) {
            return legendElementWidth * i;
        }).attr("y", gridSize * (v_labels.length + 1)).attr("width", legendElementWidth).attr("height", gridSize / 2).style("fill", function(d, i) {
            return getRangeColor(d);
        });

        legend.append("text").attr("class", "mono").text(function(d) {
            return "≥ " + Math.round(d);
        }).attr("x", function(d, i) {
            return legendElementWidth * i;
        }).attr("y", gridSize * (v_labels.length + 1) + gridSize / 2);

        legend.exit().remove();
    };
    heatmapChart();
}
