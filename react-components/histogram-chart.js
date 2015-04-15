var HistogramChart = React.createClass({
    lastUpdate: 0,
    histogram: [],
    lastClick: {},
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        return {
            barHeight: 20,
            lastSynced: moment().valueOf(),
            lastTime: 60
        };
    },
    componentDidMount: function () {
        this.buildChart();

        //window.requestAnimationFrame(this.updateActiveBar);
    },
    buildChart: function() {
        var data = this.histogram;

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

        var height = 500;
        var width = 1000;

        var svg = d3.select(React.findDOMNode(this.refs.chart));

        var x = d3.scale.ordinal().rangeRoundBands([0, width], 0, 0);

        var y = d3.scale.linear().range([0, height]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(10);

        svg.attr("width", width).attr("height",height);

        x.domain(data.map(function(d) { return d.seconds; }));
        y.domain([0, Math.max(d3.max(data, function(d) { return d.clicks; }), 8)]);

        svg.text("");

        var mean = 0;

        if (this.props.clicks.length > 0) {
            mean = (d3.mean(data, function(d) { return d.seconds * d.clicks; }) / this.props.clicks.length) * 60;
        }

        var group = svg.selectAll("bar")
            .data(data)
            .enter()
            .append("g")
            .filter(function(d) {return d.clicks > 0;});

        group.append("rect")
            .style("fill", function(d) {return flairColor(d.seconds);})
            .attr("x", function(d) { return x(d.seconds); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return height - y(d.clicks); })
            .attr("height", function(d) { return y(d.clicks); });

        svg.selectAll("bar")
            .data([this.lastClick])
            .enter().append("rect")
            .style("fill", "black").style("opacity", "0.5")
            .attr("x", function(d) { return x(d.seconds); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return height - y(d.clicks); })
            .attr("height", function(d) { return y(1); })

        group.append("text")
            .attr("class", "histogram-seconds")
            .attr("x", function(d) { return x(d.seconds); })
            .attr("y", function(d) { return height - y(d.clicks) + 10 ; })
            .text(function(d) {return d.seconds;});

        group.append("text")
            .attr("class", "histogram-clicks")
            .attr("x", function(d) { return x(d.seconds); })
            .attr("y", function(d) { return height - y(d.clicks) - 5 ; })
            .text(function(d) {return d.clicks;});

        svg.append("line")
            .attr("stroke", "#777777")
            .attr("x1", 1000 - ((mean - 1) * 1000 / 60))
            .attr("y1", 0)
            .attr("x2", 1000 - ((mean - 1) * 1000 / 60))
            .attr("y2", height);

        svg.append("text")
            .attr("class", "histogram-average")
            .attr("x", function(d) { return 1000 - ((mean - 1.5) * 1000 / 60); })
            .attr("y", function(d) { return 10; })
            .text("Ø " + Math.round(mean * 1000) / 1000);

        svg.append("line")
            .attr("stroke", "#333")
            .attr("x1", width)
            .attr("y1", height)
            .attr("x2", 0)
            .attr("y2", height);

        svg.append("line")
            .attr("stroke", "#333")
            .attr("x1", width)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", height);

        var borders = [60,51,41,31,21,11];

        svg.selectAll("line")
            .data(borders)
            .enter()
            .append("line")
            .attr("stroke", function(d) {return flairColor(d); })
            .attr("x1", function(d) {return x(d);})
            .attr("y1", 0)
            .attr("x2", function(d) {return x(d);})
            .attr("y2", height);

        svg.append("line")
            .attr("stroke", flairColor(60))
            .attr("x1", x(60))
            .attr("y1", 0)
            .attr("x2", x(60))
            .attr("y2", height);

        svg.append("line")
            .attr("stroke", flairColor(51))
            .attr("x1", x(51))
            .attr("y1", 0)
            .attr("x2", x(51))
            .attr("y2", height);

        svg.append("line")
            .attr("stroke", flairColor(41))
            .attr("x1", x(41))
            .attr("y1", 0)
            .attr("x2", x(41))
            .attr("y2", height);
    },
    componentWillUnmount: function () {
        window.cancelAnimationFrame(this.updateActiveBar);
    },
    componentWillReceiveProps: function(props) {
        this.setState({
            lastSynced: moment().valueOf(),
            lastTime: props.secondsRemaining
        });
    },
    componentDidUpdate: function () {
        if (this.props.clicks.length > this.lastUpdate) {
            this.lastUpdate = this.props.clicks.length;
            this.histogram = this.getHistogram();
            this.lastClick = this.props.clicks[this.props.clicks.length - 1];
            this.buildChart();
        }
    },
    getHistogram: function () {
        var histogram = [];
        for (i = 60; i > 0; i--) {
            histogram.push({seconds: i, clicks: this.getClickCount(i, this.props.clicks)});
        }
        return histogram;
    },
    getClickCount: function (seconds, data) {
        var count = 0;

        for (var i = 0; i < data.length; i++) {
            if (data[i].seconds == seconds) {
                count = count + 1;
            }
        }
        return count;
    },
    updateActiveBar: function() {
        if (this.props.connected) {

        }
        window.requestAnimationFrame(this.updateActiveBar);
    },
    chartHeight: function () {
        return (
            ((this.state.barHeight + 1) * (60)) +
            // add 5 pixels of padding to top and bottom when bars are short
            // so that their text labels fully show
            (this.state.barHeight < 10 ? 10 : 0));
    },
    handleSlider: function () {
        this.setState({
            barHeight:
                parseInt(React.findDOMNode(this.refs.slider).value, 10)
        });
    },
    render: function () {
        return (
            <div>
                <svg className="histogram-chart" ref="chart"></svg>
            </div>);
    }
});

