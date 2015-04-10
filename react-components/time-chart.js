/*
clicks={this.state.clicks}
flairClass={this.flairClass}
width={this.state.windowWidth}
secondsRemaining={this.state.secondsRemaining}
connected={this.state.connected}
*/

var TimeChart = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        return {
            dotSize: 5,
            lastSynced: moment().valueOf(),
            lastTime: 60,
            chartWidth: 0,
            chartHeight: 0,
            startedPlusAMinute: ((this.props.started || 0) + 60e3)
        };
    },
    componentDidMount: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var container = React.findDOMNode(this.refs.container);

        this.xScale = d3.scale.linear()
            .domain([
                this.props.connected ? this.props.started.valueOf() : 0,
                this.props.connected ? this.state.startedPlusAMinute : 0
            ])
            .range([0, this.state.chartWidth]);

        this.yScale = d3.scale.linear()
            .domain([0, 60])
            .range([0, this.state.chartHeight]);

        this.addDotsToSelection(
            chart
                .attr("width", Math.max(0, container.offsetWidth - 20))
                .attr("height", Math.max(0, container.offsetHeight - 20))
                .selectAll("g")
                .data(this.clicksWithActiveTime()).enter()
        );

        this.xAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient('bottom');
        chart.append('g')
            .attr('transform', 'translate(0,' + container.offsetHeight + ')')
            .attr('class', 'axis')
            .call(this.xAxis);

        this.yAxis = d3.svg.axis()
            .scale(this.yScale)
            .orient('left');
        chart.append('g')
            .attr('transform', 'translate(0,0)')
            .attr('class', 'axis')
            .call(this.yAxis);

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
            startedPlusAMinute: props.started ? props.started + 60e3 : 0
        });
    },
    componentDidUpdate: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        var clicksWithActiveTime = this.clicksWithActiveTime();
        chart
            .attr("width", this.state.chartWidth)
            .attr("height", this.state.chartHeight);
        if (this.props.connected) {
            this.xScale = this.xScale.domain([
                    this.props.started.valueOf(),
                    Math.max(
                        this.state.startedPlusAMinute,
                        clicksWithActiveTime.slice(-1)[0].time)
                ]).range([0, this.state.chartWidth - 20]);
            this.yScale = this.yScale.range([0, this.state.chartHeight - 20]);
        }

        var selection = chart
            .selectAll("g").data(clicksWithActiveTime);
        this.updateDots(selection);
        this.addDotsToSelection(selection.enter());
        selection.exit().remove();
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
                    .select("g:last-child")
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
            .append("g");
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
                </div>
                <div className="chart-container" ref="container">
                    <svg className="time-chart" ref="chart"></svg>
                </div>
            </div>);
    }
});