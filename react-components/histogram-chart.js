var HistogramChart = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    margins: {top: 15, left: 45, right: 5, bottom: 40},
    getInitialState: function () {
        return {
            height: 0,
            width: 0,
            displayHighlight: true,
            displayGrid: true,
            displayMean: true,
            lastSynced: moment().valueOf(),
            lastTime: 60
        };
    },
    componentDidMount: function () {
        var self = this;
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);
        var width = container.offsetWidth;
        var height = container.offsetHeight;
        this.xScale = d3.scale.linear()
            .domain([0.5, 60.5])
            .range([
                this.margins.left, Math.max(0, width - this.margins.right)
            ]);
        this.yScale = d3.scale.linear()
            .range([
                this.margins.top, Math.max(0, height - this.margins.bottom)
            ]);
        var barWidth = this.xScale(60) - this.xScale(59);

        chart.attr("width", width).attr("height", height);
        this.yScale = this.yScale.domain([
            Math.max(d3.max(this.props.histogram, function (d) {
                return d;
            }), 8), 0
        ]);

        // draw the axes and lines
        chart.selectAll("line.grid")
            .data([60,51,41,31,21,11])
            .enter()
            .append("line")
            .attr("class", function(d) {
                return "grid " + self.props.flairClass(d);
            })
            .attr("x1", function (d) { return self.xScale(d + 0.5); })
            .attr("y1", this.margins.top)
            .attr("x2", function (d) { return self.xScale(d + 0.5); })
            .attr("y2", height - this.margins.bottom);
        this.xAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient("bottom");
        this.xAxisEl = chart.append("g")
            .attr("transform", "translate(0," +
                (height - this.margins.bottom) + ")")
            .attr("class", "axis x-axis")
            .call(this.xAxis);
        this.xAxisLabel = chart.append("text")
            .attr("class", "label x-label")
            .attr("text-anchor", "center")
            .attr("x", width / 2)
            .attr("y", height - 5)
            .text("Seconds");
        this.yAxis = d3.svg.axis()
            .scale(this.yScale)
            .orient("left");
        this.yAxisEl = chart.append("g")
            .attr("transform", "translate(" + this.margins.left + ",0)")
            .attr("class", "axis y-axis")
            .call(this.yAxis);
        this.yAxisLabel = chart.append("text")
            .attr("class", "label y-label")
            .attr("text-anchor", "center")
            .attr("x", -1 * height / 2)
            .attr("y", 12)
            .attr("transform", "rotate(-90)")
            .text("Number of clicks");

        // draw the bars
        var group = chart.selectAll("g.bar")
            .data(this.props.histogram)
            .enter()
            .append("g")
            .attr("class", function (d) {
                return "bar" + (d === 0 ? " hidden" : "");
            });
        group.append("rect")
            .attr("class", function (d, i) {
                return self.props.flairClass(i + 1);
            })
            .attr("x", function (d, i) { return self.xScale(i + 0.5); })
            .attr("y", function (d) { return self.yScale(d); })
            .attr("width", barWidth)
            .attr("height",
                function (d) { return self.yScale(0) - self.yScale(d); });
        group.append("text")
            .attr("class", function (d) {
                return ("seconds" +
                    (self.yScale(0) - self.yScale(d) > 15 ? "" : " hidden"));
            })
            .attr("x", function (d, i) {
                return self.xScale(i + 0.5) + (barWidth / 2);
            })
            .attr("y", function (d) { return self.yScale(d); })
            .attr("dy", "1.35em")
            .text(function (d, i) { return i + 1; });
        group.append("text")
            .attr("class", "clicks")
            .attr("x", function (d, i) {
                return self.xScale(i + 0.5) + (barWidth / 2);
            })
            .attr("y", function (d) { return self.yScale(d); })
            .attr("dy", "-.35em")
            .text(function (d) { return d3.format("0,000")(d); });

        // draw the average
        var meanX = this.xScale(this.props.mean);
        chart.append("line")
            .attr("class", "average" +
                (this.props.clicks.length && this.state.displayMean ?
                    "" : " hidden"))
            .attr("x1", meanX)
            .attr("y1", this.margins.top)
            .attr("x2", meanX)
            .attr("y2", height - this.margins.bottom);
        chart.append("text")
            .attr("class", "average" +
                (this.props.clicks.length && this.state.displayMean ?
                    "" : " hidden"))
            .attr("x", meanX)
            .attr("y", this.margins.top)
            .attr("dx", "-.35em")
            .attr("dy", 10)
            .text("Ø " + Math.round(this.props.mean * 1000) / 1000);

        // draw the active number
        var lastValue = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].seconds : 60);
        var lastClicks = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].clicks : 1);
        chart.append("g")
                .attr("class", "last" +
                    (this.props.clicks.length && this.state.displayHighlight ?
                        "" : " hidden"))
            .append("rect")
                .attr("x", this.xScale(lastValue - 0.5))
                .attr("width", barWidth)
                .attr("y", this.yScale(this.props.histogram[lastValue - 1]))
                .attr("height", this.yScale(0) - this.yScale(lastClicks));

        // draw the current timer
        var timerX = this.xScale(this.props.secondsRemaining);
        this.timerLine = chart.append("line")
            .attr("class", "timer " + (this.props.connected ? "" : "hidden ") +
                this.props.flairClass(this.props.secondsRemaining))
            .attr("x1", timerX)
            .attr("y1", this.margins.top)
            .attr("x2", timerX)
            .attr("y2", height - this.margins.bottom);

        this.setState({
            height: height,
            width: width
        });

        window.requestAnimationFrame(this.updateTimerLine);

        window.addEventListener("resize", this.windowResized);
    },
    componentWillUnmount: function () {
        window.cancelAnimationFrame(this.updateTimerLine);

        window.removeEventListener("resize", this.windowResized);
    },
    updateChart: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var barWidth = this.xScale(60) - this.xScale(59);
        var self = this;

        this.yScale = this.yScale.domain([
            Math.max(
                d3.max(this.props.histogram, function (d) { return d; }), 8
            ), 0
        ]);
        this.yAxisEl.call(this.yAxis);

        // update the bars
        var group = chart.selectAll("g.bar")
            .data(this.props.histogram)
            .attr("class", function (d) {
                return "bar" + (d === 0 ? " hidden" : "");
            });
        group.select("rect")
            .attr("x", function (d, i) { return self.xScale(i + 0.5); })
            .attr("y", function (d) { return self.yScale(d); })
            .attr("height",
                function (d) { return self.yScale(0) - self.yScale(d); });
        group.select("text.seconds")
            .attr("class", function (d) {
                return ("seconds" +
                    (self.yScale(0) - self.yScale(d) > 15 ? "" : " hidden"));
            })
            .attr("x", function (d, i) {
                return self.xScale(i + 0.5) + (barWidth / 2);
            })
            .attr("y", function (d) { return self.yScale(d); });
        group.select("text.clicks")
            .attr("x", function (d, i) {
                return self.xScale(i + 0.5) + (barWidth / 2);
            })
            .attr("y", function (d) { return self.yScale(d); })
            .text(function (d) { return d3.format("0,000")(d); });

        // update the mean
        var meanX = this.xScale(this.props.mean);
        chart.select("line.average")
            .attr("x1", meanX)
            .attr("x2", meanX)
            .attr("class", "average" +
                (this.props.clicks.length && this.state.displayMean ?
                    "" : " hidden"));
        chart.select("text.average")
            .attr("x", meanX)
            .text("Ø " + Math.round(this.props.mean * 1000) / 1000)
            .attr("class", "average" +
                (this.props.clicks.length && this.state.displayMean ?
                    "" : " hidden"));

        // update the active number
        var lastValue = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].seconds : 60);
        var lastClicks = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].clicks : 1);
        chart.select("g.last")
                .attr("class", "last" +
                    (this.props.clicks.length && this.state.displayHighlight ?
                        "" : " hidden"))
            .select("rect")
                .attr("x", this.xScale(lastValue - 0.5))
                .attr("width",
                    this.xScale(lastValue + 1) - this.xScale(lastValue))
                .attr("y", this.yScale(this.props.histogram[lastValue - 1]))
                .attr("height", this.yScale(0) - this.yScale(lastClicks));
    },
    updateTimerLine: function () {
        var secondsRemaining = this.state.lastTime -
            ((moment() - this.state.lastSynced) / 1000);
        var timerX = this.xScale(secondsRemaining + 0.5);
        this.timerLine
            .attr("class", "timer " + (this.props.connected ? "" : "hidden ") +
                this.props.flairClass(secondsRemaining))
            .attr("x1", timerX)
            .attr("x2", timerX);

        window.requestAnimationFrame(this.updateTimerLine);
    },
    windowResized: function () {
        var self = this;
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);
        var width = container.offsetWidth;
        var height = container.offsetHeight;
        this.xScale =
            this.xScale.range([
                this.margins.left, Math.max(0, width - this.margins.right)
            ]);
        this.yScale =
            this.yScale.range([
                this.margins.top, Math.max(0, height - this.margins.bottom)
            ]);
        var barWidth = this.xScale(60) - this.xScale(59);

        chart.attr("width", width).attr("height", height);

        // move the axes and lines
        chart.selectAll("line.grid")
            .attr("x1", function (d) { return self.xScale(d + 0.5); })
            .attr("y1", this.margins.top)
            .attr("x2", function (d) { return self.xScale(d + 0.5); })
            .attr("y2", height - this.margins.bottom);
        this.xAxis = this.xAxis.scale(this.xScale);
        this.xAxisEl = this.xAxisEl
            .attr("transform", "translate(0," +
                (height - this.margins.bottom) + ")")
            .call(this.xAxis);
        this.xAxisLabel = this.xAxisLabel
            .attr("x", width / 2)
            .attr("y", height - 5);
        this.yAxis = this.yAxis.scale(this.yScale);
        this.yAxisEl = this.yAxisEl
            .attr("transform", "translate(" +
                this.margins.left + ",0)")
            .call(this.yAxis);
        this.yAxisLabel = this.yAxisLabel
            .attr("x", -1 * height / 2)
            .attr("y", 12);

        // move the bars
        var group = chart.selectAll("g.bar");
        group.select("rect")
            .attr("x", function (d, i) { return self.xScale(i + 0.5); })
            .attr("y", function (d) { return self.yScale(d); })
            .attr("width", barWidth)
            .attr("height",
                function (d) { return self.yScale(0) - self.yScale(d); });
        group.select("text.seconds")
            .attr("class", function (d) {
                return ("seconds" +
                    (self.yScale(0) - self.yScale(d) > 15 ? "" : " hidden"));
            })
            .attr("x", function (d, i) {
                return self.xScale(i + 0.5) + (barWidth / 2);
            })
            .attr("y", function (d) { return self.yScale(d); });
        group.select("text.clicks")
            .attr("x", function (d, i) {
                return self.xScale(i + 0.5) + (barWidth / 2);
            })
            .attr("y", function (d) { return self.yScale(d); });

        // move the average
        var meanX = this.xScale(this.props.mean);
        chart.select("line.average")
            .attr("x1", meanX)
            .attr("y1", this.margins.top)
            .attr("x2", meanX)
            .attr("y2", height - this.margins.bottom);
        chart.select("text.average")
            .attr("x", meanX)
            .attr("y", this.margins.top);

        // move the active number
        var lastValue = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].seconds : 60);
        var lastClicks = (this.props.clicks.length ?
            this.props.clicks.slice(-1)[0].clicks : 1);
        chart.select("g.last").select("rect")
            .attr("x", this.xScale(lastValue - 0.5))
            .attr("width", this.xScale(lastValue + 1) - this.xScale(lastValue))
            .attr("y", this.yScale(this.props.histogram[lastValue - 1]))
            .attr("height", this.yScale(0) - this.yScale(lastClicks));

        // move the timer line
        this.timerLine
            .attr("y1", this.margins.top)
            .attr("y2", height - this.margins.bottom);

        this.setState({
            height: height,
            width: width
        });
    },
    componentWillReceiveProps: function(nextProps) {
        if (this.props.secondsRemaining !== nextProps.secondsRemaining) {
            this.setState({
                lastSynced: moment().valueOf(),
                lastTime: nextProps.secondsRemaining
            });
        }
    },
    componentDidUpdate: function (prevProps) {
        if (prevProps.histogram !== this.props.histogram) {
            this.updateChart();
        }
    },
    handleHighlight: function () {
        this.setState({
            displayHighlight:
                React.findDOMNode(this.refs.highlight).checked
        });
    },
    handleGrid: function () {
        this.setState({
            displayGrid: React.findDOMNode(this.refs.grid).checked
        });
    },
    handleMean: function () {
        this.setState({
            displayMean: React.findDOMNode(this.refs.mean).checked
        });
    },
    render: function () {
        return (
            <div>
                <div className="options">
                    <label htmlFor="display-highlight">
                        Outline last click?
                    </label>
                    <input type="checkbox"
                        defaultChecked={this.state.displayHighlight}
                        id="display-highlight"
                        ref="highlight"
                        onChange={this.handleHighlight} />
                    <label htmlFor="grid-visible">
                        Grid visible?
                    </label>
                    <input type="checkbox"
                        defaultChecked={this.state.displayGrid}
                        id="grid-visible"
                        ref="grid"
                        onChange={this.handleGrid} />
                    <label htmlFor="mean-visible">
                        Average (mean) visible?
                    </label>
                    <input type="checkbox"
                        defaultChecked={this.state.displayMean}
                        id="mean-visible"
                        ref="mean"
                        onChange={this.handleMean} />
                </div>
                <div className="chart-container" ref="container">
                    <svg className={"histogram-chart " +
                        (this.state.displayGrid ?
                            "with-grid" : "without-grid")} ref="chart"></svg>
                </div>
            </div>);
    }
});

