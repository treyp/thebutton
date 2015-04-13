var LogChart = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        return {
            barHeight: 20,
            lastSynced: moment().valueOf(),
            lastTime: 60
        };
    },
    componentDidMount: function () {
        var chart = d3.select(React.findDOMNode(this.refs.chart));

        this.xScale = d3.scale.linear()
            .domain([0, 60])
            .range([0, this.props.width]);

        this.addBarsToSelection(
            chart
                .attr("width", this.props.width)
                .selectAll("g")
                .data(this.clicksWithActiveTime()).enter()
        );

        chart.attr("height", this.chartHeight());

        window.requestAnimationFrame(this.updateActiveBar);
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
        var chart = d3.select(React.findDOMNode(this.refs.chart));
        chart.attr("width", this.props.width);
        this.xScale = this.xScale.range([0, this.props.width]);

        var selection = chart
            .selectAll("g").data(this.clicksWithActiveTime());
        this.updateBarsInSelection(selection);
        this.addBarsToSelection(selection.enter());
        selection.exit().remove();
        chart.attr("height", this.chartHeight());
    },
    clicksWithActiveTime: function () {
        return this.props.clicks.concat({
            seconds: this.props.secondsRemaining,
            time: null, // we don't use this here anyway
            color: this.props.flairClass(this.props.secondsRemaining),
            clicks: 0
        });
    },
    updateActiveBar: function() {
        if (this.props.connected) {
            this.updateBarsWidth(
                d3.select(React.findDOMNode(this.refs.chart))
                    .select("g:last-child")
                    .data([{
                        seconds: this.state.lastTime -
                            ((moment() - this.state.lastSynced) / 1000),
                        time: null, // we don't use this here anyway
                        color: this.props.flairClass(this.state.lastTime),
                        clicks: 0
                    }])
            );
        }
        window.requestAnimationFrame(this.updateActiveBar);
    },
    chartHeight: function () {
        return (
            ((this.state.barHeight + 1) * (this.props.clicks.length + 1)) +
            // add 5 pixels of padding to top and bottom when bars are short
            // so that their text labels fully show
            (this.state.barHeight < 10 ? 10 : 0));
    },
    addBarsToSelection: function (selection) {
        selection = selection
            .append("g");
        selection.append("rect");
        selection.append("text").attr("dy", ".35em");
        return this.updateBarsInSelection(selection);
    },
    updateBarsInSelection: function (selection) {
        var self = this;

        selection
            .attr("transform", function (d, i) {
                return "translate(0," +
                    (
                        (
                            (self.props.clicks.length - i) *
                            (self.state.barHeight + 1)
                        ) + (self.state.barHeight < 10 ? 5 : 0)
                    ) +
                    ")";
            });
        this.updateBarsWidth(selection);
        return selection;
    },
    updateBarsWidth: function(selection) {
        var self = this;

        selection.select("rect")
            .attr("width", function (d) {
                return Math.max(1, self.xScale(60 - d.seconds));
            })
            .attr("height", this.state.barHeight)
            .attr("class", function (d) { return d.color; });
        selection.select("text")
            .attr("x", function (d) {
                var barWidth = Math.max(1, self.xScale(60 - d.seconds));
                return (self.state.barHeight < 9 || barWidth < 35 ?
                    barWidth + 3 : barWidth - 3);
            })
            .classed("outside", function (d) {
                return self.state.barHeight < 9 ||
                    self.xScale(60 - d.seconds) < 35;
            })
            .attr("y", this.state.barHeight / 2)
            .text(function (d) {
                return Math.round(d.seconds) +
                    (d.clicks > 1 ? (" × " + d.clicks) : "");
            });
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
                <div className="options">
                    <label htmlFor="bar-height-slider">
                        Bar Height:
                    </label>
                    <input type="range"
                        min="1"
                        max="25"
                        value={this.state.barHeight}
                        id="bar-height-slider"
                        ref="slider"
                        onChange={this.handleSlider} />
                </div>
                <svg className="log-chart" ref="chart"></svg>
            </div>);
    }
});