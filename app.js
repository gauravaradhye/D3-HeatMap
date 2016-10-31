var $ = require("jquery")
var d3 = require("d3")
var HashMap = require("hashmap")
var tinycolor = require("tinycolor2");

var margin = {
        top: $("#chart").parent().height() / 6.5,
        //top: 0,
        right: 0,
        bottom: 0,
        left: $("#chart").parent().width() / 6
            //left: 0
    },
    width = $("#chart").parent().width() - margin.left - margin.right,
    height = $("#chart").parent().height() - margin.top - margin.bottom,
    gridSize = 0,
    total_legendWidth = 0,
    h_labels = [],
    v_labels = [],
    color_ranges = [],
    range_hashmap = new HashMap(),
    uniqueValues = [],
    minimum_value = null,
    minimum_color = null,
    maximum_value = null,
    maximum_color = null,
    legendWidthPercentage = 0.8;

function get_color_ranges_from_custom_scheme(color_scheme) {

}

$.getJSON("data.json", function(data) {
    h_labels = data.h_labels;
    v_labels = data.v_labels;
    console.log(height);
    console.log(width);
    if (h_labels.length > v_labels.length) {
        gridSize = Math.floor((width - margin.left) / h_labels.length);
    } else {
        gridSize = Math.floor((height - margin.top) / v_labels.length);
    }
    showTextInsideBoxes = data.showTextInsideBoxes;
    total_legendWidth = gridSize * h_labels.length * 0.8;
    if (!data.showCustomColorScheme) {
        color_ranges = data.color_scheme.ranges;
    } else {
        color_ranges = get_color_ranges_from_custom_scheme(data.custom_color_scheme);
    }
    uniqueValues = get_range_values(data.color_scheme.ranges);

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

function colourGradientor(p, rgb_beginning, rgb_end) {
    var w = p * 2 - 1;
    var w1 = (w + 1) / 2.0;
    var w2 = 1 - w1;

    var rgb = [parseInt(rgb_beginning[0] * w1 + rgb_end[0] * w2),
        parseInt(rgb_beginning[1] * w1 + rgb_end[1] * w2),
        parseInt(rgb_beginning[2] * w1 + rgb_end[2] * w2)
    ];
    return rgb;
};

function hexToRgb(hex) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    }
    throw new Error('Bad Hex');
}

function loadChart(data) {
    var svg = d3.select("#chart").append("svg").attr("width", width + margin.left).attr("height", height + margin.top).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define the div for the tooltip
    var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    var courseLabels = svg.selectAll(".courseLabel").data(v_labels).enter().append("text").text(function(d) {
        return d;
    }).attr("x", 0).attr("y", function(d, i) {
        return i * gridSize;
    }).style("text-anchor", "end").style("margin-right", "5px").attr("transform", "translate(-6," + gridSize / 1.5 + ")").attr("class", function(d, i) {
        return ((i >= 0 && i <= h_labels.length) ?
            "courseLabel mono axis axis-workweek" :
            "courseLabel mono axis");
    });

    var x = d3.scale.linear().domain([
        0, gridSize * h_labels.length
    ]).range([
        0, gridSize * h_labels.length
    ]);

    var x_ticks = []
    for (var i = 0; i < h_labels.length; i++) {
        x_ticks.push(gridSize * i);
    }

    var xAxis = d3.svg.axis(x)
        .tickValues(x_ticks).tickFormat(function(d, i) {
            return h_labels[i];
        });

    svg.append("g").attr("class", "x axis").call(xAxis).selectAll("text").attr("class", "mono").style("font-weight", "bold").style("text-anchor", "start").attr("dx", "2.25em").attr("dy", "0.4em").attr("transform", "rotate(-45)");

    var heatmapChart = function() {
        raw_data = data.content;
        data = [];
        for (var i = 0; i < raw_data.length; i++) {
            for (var j = 0; j < raw_data[i].length; j++) {
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

        if (showTextInsideBoxes) {
            cards.enter().append("text").attr("x", function(d) {
                    return ((d.x) * gridSize);
                })
                .attr("y", function(d) {
                    return (d.y) * gridSize;
                })
                .attr("dx", gridSize * 0.3)
                .attr("dy", gridSize / 2)
                .attr("class", "mono")
                .text(function(d) {
                    return d.text;
                });
            // });.call(wrap, gridSize * 0.7);

            cards.exit().remove();
        }

        function get_fill_color(value) {

            if (value === minimum_value) {
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

        function wrap(text, width) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", text.attr("y")).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

        function getRangeColor(value) {
            if (value === minimum_value) {
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

        var legend_values = uniqueValues.slice();
        var legendElementWidth = total_legendWidth / legend_values.length;
        legend_values.unshift(minimum_value);
        legend_values.pop();
        console.log(legend_values);
        var legend = svg.selectAll(".legend").data(legend_values);

        legend.enter().append("g").attr("class", "legend");

        legend.append("rect").attr("x", function(d, i) {
            return legendElementWidth * i + (1 - legendWidthPercentage) * total_legendWidth / 2;
        }).attr("y", gridSize * (v_labels.length + 0.5)).attr("width", legendElementWidth).attr("height", gridSize / 2).style("fill", function(d, i) {
            return getRangeColor(d);
        });

        legend.append("text").attr("class", "mono").text(function(d) {
            return "≥" + d;
        }).attr("x", function(d, i) {
            return legendElementWidth * i + (1 - legendWidthPercentage) * total_legendWidth / 2;
        }).attr("y", gridSize * (v_labels.length + 1) + gridSize / 2.5);

        legend.exit().remove();

        changeTextSize();

        function changeTextSize() {
            var cols = document.getElementsByClassName('mono');
            for (i = 0; i < cols.length; i++) {
                cols[i].style.fontSize = $("#chart").parent().width() / 40 + "px";
            }
        }
    };
    heatmapChart();
}
