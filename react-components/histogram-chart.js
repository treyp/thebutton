var HistogramChart = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        var histogram = new Array(60);
        for (var i = 0; i < 60; i++) {
            histogram[i] = 0;
        }
        return {
            histogram: histogram,
            mean: 60,
            height: 0,
            width: 0
        };
    },
    componentDidMount: function () {
        var self = this;
        var svg = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);
        var histogram = this.state.histogram.slice();
        var width = container.offsetWidth;
        var height = container.offsetHeight;
        this.x = d3.scale.linear().domain([1, 61]).range([0, width]);
        this.y = d3.scale.linear().range([0, height]);
        var barWidth = this.x(60) - this.x(59);

        this.props.clicks.forEach(function (click) {
            histogram[click.seconds - 1] = histogram[click.seconds - 1] + click.clicks;
        });

        svg.attr("width", width).attr("height", height);
        this.y = this.y.domain([0,
            Math.max(d3.max(histogram, function (d) { return d; }), 8)
        ]);

        // draw the axes and lines
        svg.selectAll("line.grid")
            .data([60,51,41,31,21,11])
            .enter()
            .append("line")
            .attr("class", function(d) {
                return "grid " + self.props.flairClass(d);
            })
            .attr("x1", function (d) { return self.x(d + 1); })
            .attr("y1", 0)
            .attr("x2", function (d) { return self.x(d + 1); })
            .attr("y1", height);

        // draw the bars
        var group = svg.selectAll("g.bar")
            .data(histogram)
            .enter()
            .append("g")
            .attr("class", function (d) {
                return "bar" + (d === 0 ? " hidden" : "");
            });
        group.append("rect")
            .attr("class", function (d, i) {
                return self.props.flairClass(i + 1);
            })
            .attr("x", function (d, i) { return self.x(i + 1); })
            .attr("y", function (d) { return height - self.y(d); })
            .attr("width", barWidth)
            .attr("height", function (d) { return self.y(d); });
        group.append("text")
            .attr("class", "seconds")
            .attr("x", function (d, i) { return self.x(i + 1) + (barWidth / 2); })
            .attr("y", function (d) { return height - self.y(d); })
            .attr("dy", "1.35em")
            .text(function (d, i) { return i + 1; });
        group.append("text")
            .attr("class", "clicks")
            .attr("x", function (d, i) { return self.x(i + 1) + (barWidth / 2); })
            .attr("y", function (d) { return height - self.y(d); })
            .attr("dy", "-.35em")
            .text(function (d) { return d; });

        // draw the average
        var mean = this.mean(histogram, this.props.clicksTracked);
        var meanX = this.x(mean + .5);
        svg.append("line")
            .attr("class", "average" +
                (this.props.clicks.length ? "" : " loading"))
            .attr("x1", meanX)
            .attr("y1", 0)
            .attr("x2", meanX)
            .attr("y2", height);
        svg.append("text")
            .attr("class", "average" +
                (this.props.clicks.length ? "" : " loading"))
            .attr("x", meanX)
            .attr("dx", "-.35em")
            .attr("dy", 10)
            .text("Ø " + Math.round(mean * 1000) / 1000);

        // draw the active number
        var lastValue = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].seconds : 60);
        var lastClicks = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].clicks : 1);
        svg.append("g")
                .attr("class",
                    "last" + (this.props.clicks.length ? "" : " hidden"))
            .append("rect")
                .attr("x", this.x(lastValue))
                .attr("width", barWidth)
                .attr("y", height - this.y(histogram[lastValue - 1]))
                .attr("height", this.y(lastClicks))

        this.setState({
            histogram: histogram,
            height: height,
            width: width
        });

        window.addEventListener("resize", this.windowResized);
    },
    componentWillUnmount: function () {
        window.removeEventListener("resize", this.windowResized);
    },
    mean: function (histogram, clicksTracked) {
        if (!clicksTracked) {
            return 60;
        }
        return (d3.sum(histogram.map(function (clicks, seconds) {
            return (seconds + 1) * clicks;
        })) / clicksTracked);
    },
    updateChart: function () {
        var svg = d3.select(React.findDOMNode(this.refs.chart));
        var barWidth = this.x(60) - this.x(59);
        var self = this;

        // update the bars
        var group = svg.selectAll("g.bar")
            .data(this.state.histogram)
            .attr("class", function (d) {
                return "bar" + (d === 0 ? " hidden" : "");
            });
        group.select("rect")
            .attr("x", function (d, i) { return self.x(i + 1); })
            .attr("y", function (d) { return self.state.height - self.y(d); })
            .attr("height", function (d) { return self.y(d); });
        group.select("text.seconds")
            .attr("x", function (d, i) { return self.x(i + 1) + (barWidth / 2); })
            .attr("y", function (d) { return self.state.height - self.y(d); })
        group.select("text.clicks")
            .attr("x", function (d, i) { return self.x(i + 1) + (barWidth / 2); })
            .attr("y", function (d) { return self.state.height - self.y(d); })
            .text(function (d) { return d; });

        // update the mean
        var meanX = this.x(this.state.mean + .5);
        svg.select("line.average")
            .attr("x1", meanX)
            .attr("x2", meanX)
            .attr("class", "average" +
                (this.props.clicks.length ? "" : " loading"));
        svg.select("text.average")
            .attr("x", meanX)
            .text("Ø " + Math.round(this.state.mean * 1000) / 1000)
            .attr("class", "average" +
                (this.props.clicks.length ? "" : " loading"));

        // update the active number
        var lastValue = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].seconds : 60);
        var lastClicks = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].clicks : 1);
        svg.select("g.last")
                .attr("class",
                    "last" + (this.props.clicks.length ? "" : " hidden"))
            .select("rect")
                .attr("x", this.x(lastValue))
                .attr("width", this.x(lastValue + 1) - this.x(lastValue))
                .attr("y", this.state.height - this.y(this.state.histogram[lastValue - 1]))
                .attr("height", this.y(lastClicks));
    },
    windowResized: function () {
        var self = this;
        var svg = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);
        var width = container.offsetWidth;
        var height = container.offsetHeight;
        this.x = this.x.range([0, width]);
        this.y = this.y.range([0, height]);
        var barWidth = this.x(60) - this.x(59);

        svg.attr("width", width).attr("height", height);

        // move the axes and lines
        svg.selectAll("line.grid")
            .attr("x1", function (d) { return self.x(d + 1); })
            .attr("x2", function (d) { return self.x(d + 1); })
            .attr("y1", height);

        // move the bars
        var group = svg.selectAll("g.bar");
        group.select("rect")
            .attr("x", function (d, i) { return self.x(i + 1); })
            .attr("y", function (d) { return height - self.y(d); })
            .attr("width", barWidth)
            .attr("height", function (d) { return self.y(d); });
        group.select("text.seconds")
            .attr("x", function (d, i) { return self.x(i + 1) + (barWidth / 2); })
            .attr("y", function (d) { return height - self.y(d); })
        group.select("text.clicks")
            .attr("x", function (d, i) { return self.x(i + 1) + (barWidth / 2); })
            .attr("y", function (d) { return height - self.y(d); });

        // move the average
        var mean = this.mean(this.state.histogram, this.props.clicksTracked);
        var meanX = this.x(mean + .5);
        svg.select("line.average")
            .attr("x1", meanX)
            .attr("x2", meanX)
            .attr("y2", height);
        svg.select("text.average")
            .attr("x", meanX);

        // move the active number
        var lastValue = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].seconds : 60);
        svg.select("g.last").select("rect")
            .attr("x", this.x(lastValue))
            .attr("width", this.x(lastValue + 1) - this.x(lastValue))
            .attr("y", height - this.y(this.state.histogram[lastValue - 1]))
            .attr("height", this.y(1));

        this.setState({
            height: height,
            width: width
        });
    },
    componentWillReceiveProps: function (nextProps) {
        if (nextProps.clicks.length > this.props.clicks.length) {
            var histogram = this.state.histogram.slice();
            nextProps.clicks.slice(this.props.clicks.length).forEach(function (click) {
                // console.log('new click', click);
                histogram[click.seconds - 1] = histogram[click.seconds - 1] + click.clicks;
            });
            this.setState({histogram: histogram, mean: this.mean(histogram, nextProps.clicksTracked)});
        }
    },
    componentDidUpdate: function (prevProps) {
        if (this.props.clicks.length > prevProps.clicks.length) {
            this.updateChart();
        }
    },
    render: function () {
        return (<div className="chart-container" ref="container">
            <svg className="histogram-chart" ref="chart"></svg>
        </div>);
    }
});

