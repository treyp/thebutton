var TimeChart = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    minimumDuration: 60e3,
    margins: {top: 10, left: 45, right: 10, bottom: 25},
    getInitialState: function () {
        return {
            dotSize: 5,
            lastSynced: moment().valueOf(),
            lastTime: 60,
            chartWidth: 0,
            chartHeight: 0,
            displayLabels: true,
            startedPlusAMinute:
                ((this.props.started || 0) + this.minimumDuration)
        };
    },
    componentDidMount: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);

        this.xScale = this.calculateXRange(d3.scale.linear()
            .domain([
                this.props.connected ? this.props.started.valueOf() : 0,
                this.props.connected ? this.state.startedPlusAMinute : 0
            ]));

        this.yScale = this.calculateYRange(d3.scale.linear()
            .domain([0, 60]));

        this.xAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient('bottom')
            .tickFormat(function (d) { return moment(d).format('h:mm:ss'); });
        this.xAxisEl = chart.append('g')
            .attr('transform', 'translate(0,' + (container.offsetHeight - this.margins.top - this.margins.bottom) + ')')
            .attr('class', 'axis x-axis')
            .call(this.xAxis);
        this.xAxisLabel = chart.append("text")
            .attr("class", "label x-label")
            .attr("text-anchor", "center")
            .attr("x", container.offsetWidth / 2)
            .attr("y", container.offsetHeight)
            .text("Time");

        this.yAxis = d3.svg.axis()
            .scale(this.yScale)
            .orient('left');
        this.yAxisEl = chart.append('g')
            .attr('transform', 'translate(' +  this.margins.left + ',' + 0 + ')')
            .attr('class', 'axis y-axis')
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
                .selectAll("g")
                .data(this.clicksWithActiveTime()).enter()
        );

        window.addEventListener("resize", this.windowResized);
        this.windowResized();

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
            startedPlusAMinute: props.started ?
                props.started + this.minimumDuration : 0
        });
    },
    componentDidUpdate: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var clicksWithActiveTime = this.clicksWithActiveTime();
        chart
            .attr("width", this.state.chartWidth)
            .attr("height", this.state.chartHeight);
        if (this.props.connected) {
            this.xScale = this.calculateXRange(this.xScale.domain([
                    this.props.started.valueOf(),
                    Math.max(
                        this.state.startedPlusAMinute,
                        clicksWithActiveTime.slice(-1)[0].time)
                ]));
            this.yScale = this.calculateYRange(this.yScale);
        }

        var selection = chart
            .selectAll("g.dot").data(clicksWithActiveTime);
        this.updateDots(selection);
        this.addDotsToSelection(selection.enter());
        selection.exit().remove();

        this.xAxisEl
            .attr('transform', 'translate(0,' + (this.state.chartHeight - this.margins.top - this.margins.bottom) + ')')
            .call(this.xAxis);
        this.xAxisLabel
            .attr("x", this.state.chartWidth / 2)
            .attr("y", this.state.chartHeight);

        this.yAxisEl
            .call(this.yAxis);
        this.yAxisLabel
            .attr("x", -1 * this.state.chartHeight / 2);
    },
    calculateYRange: function (scale) {
        return scale.range([this.margins.top, Math.max(
                this.margins.top,
                this.state.chartHeight - this.margins.top - this.margins.bottom
            )]);
    },
    calculateXRange: function (scale) {
        return scale.range([this.margins.left, Math.max(
                this.margins.left,
                this.state.chartWidth - this.margins.left - this.margins.right
            )]);
    },
    windowResized: function () {
        var container = React.findDOMNode(this.refs.container);
        this.setState({
            chartWidth: container.offsetWidth,
            chartHeight: container.offsetHeight
        });
    },
    clicksWithActiveTime: function () {
        return this.props.clicks.concat({
            seconds: this.props.secondsRemaining,
            time: moment().valueOf(),
            color: this.props.flairClass(this.props.secondsRemaining)
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
                        color: this.props.flairClass(this.state.lastTime)
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
            .attr("class", function (d) { return d.color; });
        selection.select("text")
            .attr("x", function (d) {
                return self.xScale(d.time);
            })
            .attr("y", function (d) {
                return self.yScale(d.seconds);
            })
            .attr("dy", "-" + (self.state.dotSize + 5) + "px")
            .text(function (d) { return Math.round(d.seconds); });
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