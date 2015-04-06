var displayQuantity = 100; // how many data points to display
var chartEl = document.getElementById('chart');

var flairColor = function (seconds) {
    if (seconds > 51) {
        return "#820080";
    }
    if (seconds > 41) {
        return "#0083C7";
    }
    if (seconds > 31) {
        return "#02be01";
    }
    if (seconds > 21) {
        return "#E5D900";
    }
    if (seconds > 11) {
        return "#e59500";
    }
    return "#e50000";
};

var Chart = (function () {
    /* jshint maxstatements: 20 */
    // overriding until this can be refactored

    var self = {
        margins: {top: 0, bottom: 30, left: 0, right: 30}
    };

    self.height = function () {
        return chartEl.offsetHeight - self.margins.top - self.margins.bottom;
    };

    self.width = function () {
        return chartEl.offsetWidth - self.margins.left - self.margins.right;
    };

    var svg = d3.select("#chart")
        .append("svg:svg")
        .attr({width: "100%", height: "100%"})
        .append("g")
        .attr(
            "transform",
            "translate(" + self.margins.left + "," + self.margins.top + ")"
        );

    var xScale = d3.scale.linear()
        .domain([0, 1])
        .range([4, self.width()]);

    var axisScale = d3.scale.linear()
        .domain([0, 1])
        .range([8, self.width() + 4]);

    var yScale = d3.scale.linear()
        .domain([60, 0])
        .range([self.height(), 0]);

    var xAxis = d3.svg.axis()
        .scale(axisScale)
        .tickFormat(d3.format("d"))
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("right");

    svg.selectAll("line.grid").data(yScale.ticks()).enter()
        .append("line")
        .attr({
            "class": "grid",
            "x1" : 4,
            "x2" : self.width(),
            "y1" : yScale,
            "y2" : yScale,
            "shape-rendering" : "crispEdges",
        });

    svg.append("g")
        .attr("class", "x axis")
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(-4," + self.height() + ")");

    svg.append("g")
        .attr("shape-rendering", "crispEdges")
        .attr("class", "y axis")
        .attr("transform", "translate(" + self.width() + ",0)");

    svg.selectAll("g.y.axis")
        .call(yAxis);

    // expose
    self.svg = svg;
    self.xScale = xScale;
    self.yScale = yScale;

    self.render = function (clicks) {
        // grab the last {displayQuantity} clicks
        // (with at least {displayQuantity} values)
        if (clicks.length < displayQuantity) {
            clicks = _.fill(Array(displayQuantity - clicks.length), 60).concat(clicks);
        }
        clicks = _.takeRight(clicks, displayQuantity);

        xScale.domain([0, clicks.length+1]);
        axisScale.domain([0, clicks.length+1]);
        svg.selectAll("g.x.axis")
            .call(xAxis);

        var rect = svg.selectAll("rect.bar").data(clicks);
        rect.attr("class", "bar")
            .attr("x", function (d, i) {
                return xScale(i);
            })
            .attr("y", yScale)
            .attr("width", function (d, i) {
                return xScale(i+1) - xScale(i);
            })
            .attr("height", function (d) {
                return yScale(60) - yScale(d);
            })
            .attr("fill", flairColor);

        rect.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("shape-rendering", "crispEdges")
            .attr("x", function (d, i) {
                return xScale(i);
            })
            .attr("y", yScale)
            .attr("width", function (d, i) {
                return xScale(i+1) - xScale(i);
            })
            .attr("height", function (d) {
                return yScale(60) - yScale(d);
            })
            .attr("fill", flairColor);

        rect.exit()
            .remove();
    };

    self.resize = function () {
        xScale.range([4, self.width()]);
        axisScale.range([8, self.width() + 4]);
        yScale.range([Chart.height(), 0]);

        var grids = svg.selectAll("line.grid")
            .data(yScale.ticks());

        grids.attr({
                "class": "grid",
                "x1" : 4,
                "x2" : self.width(),
                "y1" : yScale,
                "y2" : yScale,
                "shape-rendering" : "crispEdges",
            });

        grids.enter()
            .append("line")
            .attr({
                "class": "grid",
                "x1" : 4,
                "x2" : self.width(),
                "y1" : yScale,
                "y2" : yScale,
                "shape-rendering" : "crispEdges",
            });

        grids.exit()
            .remove();

        svg.selectAll("g.x.axis")
            .attr("transform", "translate(-4," + Chart.height() + ")")
            .call(xAxis);
        svg.selectAll("g.y.axis")
            .attr("transform", "translate(" + Chart.width() + ",0)")
            .call(yAxis);
    };

    return self;
}());

var animating = false;

var Timer = (function () {
    var self = {};
    var timerEnd;
    var timerBar = Chart.svg.append("rect")
        .attr("class", "timer-bar")
        .attr("x", 1)
        .attr("y", 1)
        .attr("width", 1)
        .attr("height", 1)
        .attr("shape-rendering", "crispEdges");

    self.sync = function (secondsLeft) {
        timerEnd = moment().add(secondsLeft * 1000);
        timerBar
            .attr("x", function () {
                return Chart.xScale(displayQuantity);
            })
            .attr("width", function () {
                return (
                    Chart.xScale(displayQuantity) -
                    Chart.xScale(displayQuantity - 1)
                );
            });

        if (!animating) {
            animate();
        }
    };

    var animate = function () {
        animating = true;
        var timer = (timerEnd - moment());
        timerBar
            .attr("y", function () {
                return Chart.yScale(timer / 1000);
            })
            .attr("height", function () {
                return Chart.yScale(60) - Chart.yScale(timer / 1000);
            })
            .attr("fill", flairColor(timer / 1000));
        requestAnimationFrame(animate);
    };

    return self;
}());

if (window.attachEvent) {
    window.attachEvent('onresize', function () {
        Chart.resize();
    });
}
else if (window.addEventListener) {
    window.addEventListener('resize', function () {
        Chart.resize();
    }, true);
}
Chart.resize();
