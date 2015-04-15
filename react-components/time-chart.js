var TimeChart = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    minimumDuration: 180e3,
    margins: {top: 20, left: 45, right: 10, bottom: 30},
    getInitialState: function () {
        return {
            dotSize: 5,
            lastSynced: moment().valueOf(),
            lastTime: 60,
            chartWidth: 0,
            chartHeight: 0,
            displayLabels: true,
            startingXMax: (moment().valueOf() + this.minimumDuration)
        };
    },
    componentDidMount: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);

        this.xScale = this.calculateXRange(
            d3.scale.linear()
                .domain([
                    this.props.connected ?
                        this.props.started.valueOf() : this.state.lastSynced,
                    this.state.startingXMax
                ]),
            container.offsetWidth);
        this.yScale = this.calculateYRange(
            d3.scale.linear()
                .domain([0, 60]),
            container.offsetHeight);

        this.xAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient("bottom")
            .tickFormat(function (d) { return moment(d).format("h:mm:ss A"); });
        this.xAxisEl = chart.append("g")
            .attr("transform", "translate(0," +
                (container.offsetHeight - this.margins.top -
                    this.margins.bottom) +
                ")")
            .attr("class", "axis x-axis")
            .call(this.xAxis);
        this.xAxisLabel = chart.append("text")
            .attr("class", "label x-label")
            .attr("text-anchor", "center")
            .attr("x", container.offsetWidth / 2)
            .attr("y", container.offsetHeight - 5)
            .text("Time");
        this.yAxis = d3.svg.axis()
            .scale(this.yScale)
            .orient("left");
        this.yAxisEl = chart.append("g")
            .attr("transform", "translate(" +  this.margins.left + ",0)")
            .attr("class", "axis y-axis")
            .call(this.yAxis);
        this.yAxisLabel = chart.append("text")
            .attr("class", "label y-label")
            .attr("text-anchor", "center")
            .attr("x", -1 * container.offsetHeight / 2)
            .attr("y", 12)
            .attr("transform", "rotate(-90)")
            .text("Seconds Remaining");

        this.addDotsToSelection(
            chart
                .attr("width", container.offsetWidth)
                .attr("height", container.offsetHeight)
                .selectAll("g.dot")
                .data(this).enter()
        );

        window.addEventListener("resize", this.windowResized);

        window.requestAnimationFrame(this.updateActiveDot);

        this.setState({
            chartWidth: container.offsetWidth,
            chartHeight: container.offsetHeight
        });
    },
    componentWillUnmount: function () {
        window.cancelAnimationFrame(this.updateActiveDot);

        clearInterval(this.interval);
        window.removeEventListener("resize", this.windowResized);
    },
    componentWillReceiveProps: function(props) {
        this.setState({
            lastSynced: moment().valueOf(),
            lastTime: props.secondsRemaining,
            startingXMax: props.started ?
                props.started + this.minimumDuration : 0
        });
    },
    componentDidUpdate: function (prevProps, prevState) {
        var chart = d3.select(React.findDOMNode(this.refs.chart));

        if (!this.props.connected) {
            // remove the active dot
            chart.selectAll("g.dot").data(this.props.clicks).exit().remove();
            return;
        }

        var clicksWithActiveTime = this.clicksWithActiveTime();

        // performance optimization: if we have a lot of elements on the page,
        // only update the old dots (which probably don't need to move) when
        // a new dot shows up
        if (this.props.clicks.length > 300 &&
            this.props.clicks.length === prevProps.clicks.length &&
            this.state.chartWidth === prevState.chartWidth &&
            this.state.chartHeight === prevState.chartHeight) {
            // update active dot
            this.updateDots(chart
                .select("g.dot:last-child")
                .data(clicksWithActiveTime.slice(-1)[0]));
        } else {
            var selection = chart
                .selectAll("g.dot").data(clicksWithActiveTime);
            this.updateDots(selection);
            this.addDotsToSelection(selection.enter());
            selection.exit().remove();
        }

        this.xScale = this.calculateXRange(this.xScale.domain([
                this.props.started.valueOf(),
                Math.max(
                    this.state.startingXMax,
                    clicksWithActiveTime.slice(-1)[0].time)
            ]), this.state.chartWidth);
        this.xAxisEl.call(this.xAxis);
    },
    calculateYRange: function (scale, height) {
        return scale.range([this.margins.top, Math.max(
                this.margins.top,
                height - this.margins.top - this.margins.bottom
            )]);
    },
    calculateXRange: function (scale, width) {
        return scale.range([this.margins.left, Math.max(
                this.margins.left,
                width - this.margins.left - this.margins.right
            )]);
    },
    windowResized: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);
        var height = container.offsetHeight;
        var width = container.offsetWidth;

        chart
            .attr("width", width)
            .attr("height", height);
        this.xAxisLabel
            .attr("x", width / 2)
            .attr("y", height - 5);
        this.xAxisEl
            .attr("transform", "translate(0," +
                (height - this.margins.top -
                    this.margins.bottom) +
                ")");
        this.yScale = this.calculateYRange(this.yScale, height);
        this.yAxisEl
            .call(this.yAxis);
        this.yAxisLabel
            .attr("x", -1 * height / 2);

        this.setState({chartWidth: width, chartHeight: height});
    },
    clicksWithActiveTime: function () {
        return this.props.clicks.concat({
            seconds: this.props.secondsRemaining,
            time: moment().valueOf(),
            color: this.props.flairClass(this.props.secondsRemaining),
            clicks: 0
        });
    },
    updateActiveDot: function() {
        if (this.props.connected) {
            this.updateDots(
                d3.select(React.findDOMNode(this.refs.chart))
                    .select("g.dot:last-child")
                    .data([{
                        seconds: this.state.lastTime -
                            ((moment() - this.state.lastSynced) / 1000),
                        time: moment(),
                        color: this.props.flairClass(this.state.lastTime),
                        clicks: 0
                    }])
            );
        }
        window.requestAnimationFrame(this.updateActiveDot);
    },
    addDotsToSelection: function (selection) {
        selection = selection
            .append("g").attr("class", "dot");
        selection.append("circle");
        selection.append("text");
        return this.updateDots(selection);
    },
    updateDots: function(selection) {
        var self = this;

        selection.select("circle")
            .attr("r", self.state.dotSize)
            .attr("cx", function (d) {
                return self.xScale(d.time);
            })
            .attr("cy", function (d) {
                return self.yScale(d.seconds);
            })
            .attr("class", function (d) {
                return d.color + " times-" + d.clicks +
                    (d.clicks >= 10 ? "-or-more" : "");
            });
        selection.select("text")
            .attr("x", function (d) {
                return self.xScale(d.time);
            })
            .attr("y", function (d) {
                return self.yScale(d.seconds);
            })
            .attr("dy", "-" + (self.state.dotSize + 5) + "px")
            .text(function (d) {
                return Math.round(d.seconds) +
                    (d.clicks > 1 ? (" × " + d.clicks) : "");
            });
    },
    handleSlider: function () {
        this.setState({
            dotSize:
                parseInt(React.findDOMNode(this.refs.slider).value, 10)
        });
    },
    handleLabels: function () {
        this.setState({
            displayLabels:
                React.findDOMNode(this.refs.labels).checked
        });
    },
    render: function () {
        return (
            <div>
                <div className="options">
                    <label htmlFor="dot-size-slider">
                        Dot Size:
                    </label>
                    <input type="range"
                        min="1"
                        max="20"
                        value={this.state.dotSize}
                        id="dot-size-slider"
                        ref="slider"
                        onChange={this.handleSlider} />
                    <label htmlFor="labels-visible">
                        Labels visible?
                    </label>
                    <input type="checkbox"
                        defaultChecked={this.state.displayLabels}
                        id="labels-visible"
                        ref="labels"
                        onChange={this.handleLabels} />
                </div>
                <div className="chart-container" ref="container">
                    <svg className={"time-chart " +
                        (this.state.displayLabels ?
                            "with-labels" : "without-labels")
                    } ref="chart"></svg>
                </div>
            </div>);
    }
});