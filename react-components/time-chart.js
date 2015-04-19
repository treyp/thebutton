var TimeChart = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    minimumDuration: 180e3,
    margins: {top: 20, left: 50, right: 20, bottom: 30},
    getInitialState: function () {
        return {
            dotSize: 5,
            lastSynced: moment().valueOf(),
            lastTime: 60,
            displayLabels: true,
            displayGrid: true,
            displayMean: false,
            startingXMax: (moment().valueOf() + this.minimumDuration)
        };
    },
    componentDidMount: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);
        var width = container.offsetWidth;
        var height = container.offsetHeight;
        var self = this;

        this.xScale = this.calculateXRange(
            d3.scale.linear()
                .domain([
                    this.props.connected ?
                        this.props.started.valueOf() : this.state.lastSynced,
                    Math.max(
                        (this.props.clicks.length ?
                            this.props.clicks.slice(-1)[0].time : 0),
                        this.state.startingXMax
                    )
                ]),
            width);
        this.yScale = this.calculateYRange(
            d3.scale.linear()
                .domain([0, 60]),
            height);

        this.grid = chart.selectAll("line.grid")
            .data([60,51,41,31,21,11])
            .enter()
            .append("line")
            .attr("class", function(d) {
                return "grid " + self.props.flairClass(d);
            })
            .attr("x1", this.margins.left)
            .attr("y1", function (d) { return self.yScale(d); })
            .attr("x2", width - this.margins.right)
            .attr("y2", function (d) { return self.yScale(d); });
        this.xAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient("bottom")
            .tickFormat(function (d) { return moment(d).format("h:mm:ss A"); });
        this.xAxisEl = chart.append("g")
            .attr("transform", "translate(0," +
                (height - this.margins.top - this.margins.bottom) + ")")
            .attr("class", "axis x-axis")
            .call(this.xAxis);
        this.xAxisLabel = chart.append("text")
            .attr("class", "label x-label")
            .attr("text-anchor", "center")
            .attr("x", width / 2)
            .attr("y", height - 5)
            .text("Time");
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
            .text("Seconds Remaining");

        this.addDotsToSelection(
            chart
                .attr("width", width)
                .attr("height", height)
                .selectAll("g.dot")
                .data(this.props.clicks).enter()
        );

        var meanY = this.yScale(this.props.mean);
        this.mean = chart.append("line")
            .attr("class", "average" +
                (this.props.clicks.length && this.state.displayMean ?
                    "" : " hidden"))
            .attr("x1", this.margins.left)
            .attr("y1", meanY)
            .attr("x2", width - this.margins.right)
            .attr("y2", meanY);
        this.meanLabel = chart.append("text")
            .attr("class", "average" +
                (this.props.clicks.length && this.state.displayMean ?
                    "" : " hidden"))
            .attr("y", meanY)
            .attr("x", this.margins.left)
            .attr("dy", ".35em")
            .attr("dx", -5)
            .text("Ø " + Math.round(this.props.mean * 1000) / 1000);

        window.addEventListener("resize", this.windowResized);

        window.requestAnimationFrame(this.updateActiveDot);
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

        if (this.state.displayMean !== prevState.displayMean ||
            this.props.mean !== prevProps.mean ||
            this.props.clicks.length !== prevProps.clicks.length) {
            var meanY = this.yScale(this.props.mean);
            this.mean
                .attr("class", "average" +
                    (this.props.clicks.length && this.state.displayMean ?
                        "" : " hidden"))
                .attr("y1", meanY)
                .attr("y2", meanY);
            this.meanLabel
                .attr("class", "average" +
                    (this.props.clicks.length && this.state.displayMean ?
                        "" : " hidden"))
                .attr("y", meanY)
                .text("Ø " + Math.round(this.props.mean * 1000) / 1000);
        }
        // performance optimization: if we have a lot of elements on the page,
        // only update the old dots (which probably don't need to move) when
        // a new dot shows up
        if (this.props.clicks.length > 300 &&
            this.props.clicks === prevProps.clicks) {
            // update active dot
            this.updateDots(chart
                .select("g.dot:last-child")
                .data(clicksWithActiveTime.slice(-1)[0]));
        } else {
            this.xScale = this.calculateXRange(this.xScale.domain([
                    this.props.started.valueOf(),
                    Math.max(
                        this.state.startingXMax,
                        clicksWithActiveTime.slice(-1)[0].time)
                ]), React.findDOMNode(this.refs.container).offsetWidth);
            this.xAxisEl.call(this.xAxis);

            var selection = chart
                .selectAll("g.dot").data(clicksWithActiveTime);
            this.updateDots(selection);
            this.addDotsToSelection(selection.enter());
            selection.exit().remove();
        }
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
                width - this.margins.right
            )]);
    },
    windowResized: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);
        var height = container.offsetHeight;
        var width = container.offsetWidth;
        var self = this;

        chart
            .attr("width", width)
            .attr("height", height);

        this.yScale = this.calculateYRange(this.yScale, height);

        this.grid = this.grid
            .attr("y1", function (d) { return self.yScale(d); })
            .attr("x2", width - this.margins.right)
            .attr("y2", function (d) { return self.yScale(d); });

        this.xScale = this.calculateXRange(this.xScale.domain([
                this.props.started.valueOf(),
                Math.max(
                    this.state.startingXMax,
                    moment().valueOf())
            ]), width);
        this.xAxisLabel
            .attr("x", width / 2)
            .attr("y", height - 5);
        this.xAxisEl
            .attr("transform", "translate(0," +
                (height - this.margins.top -
                    this.margins.bottom) +
                ")")
            .call(this.xAxis);
        this.yAxisEl
            .call(this.yAxis);
        this.yAxisLabel
            .attr("x", -1 * height / 2);

        var meanY = this.yScale(this.props.mean);
        this.mean = this.mean
            .attr("y1", meanY)
            .attr("x2", width - this.margins.right)
            .attr("y2", meanY);
        this.meanLabel = this.meanLabel
            .attr("y", meanY);

        this.updateDots(
            chart.selectAll("g.dot").data(this.clicksWithActiveTime())
        );
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
            displayLabels: React.findDOMNode(this.refs.labels).checked
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
                    <svg className={"time-chart " +
                        (this.state.displayLabels ?
                            "with-labels" : "without-labels") + " " +
                        (this.state.displayGrid ?
                            "with-grid" : "without-grid")
                    } ref="chart"></svg>
                </div>
            </div>);
    }
});