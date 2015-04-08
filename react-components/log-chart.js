var LogChart = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        return {
            lastSynced: moment().valueOf(),
            lastTime: 60
        };
    },
    componentDidMount: function () {
        var chart = d3.select(React.findDOMNode(this));

        this.xScale = d3.scale.linear()
            .domain([0, 60])
            .range([0, this.props.width]);

        this.addBarsToSelection(
            chart
                .attr("width", this.props.width)
                .selectAll("g")
                .data(this.props.times.concat(
                    this.props.secondsRemaining
                )).enter()
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
        var chart = d3.select(React.findDOMNode(this));
        chart.attr("width", this.props.width);
        this.xScale = this.xScale.range([0, this.props.width]);

        var selection = chart
            .selectAll("g").data(this.props.times.concat(
                this.props.secondsRemaining
            ));
        this.updateBarsInSelection(selection);
        this.addBarsToSelection(selection.enter());
        selection.exit().remove();
        chart.attr("height", this.chartHeight());
    },
    updateActiveBar: function() {
        this.updateBarsWidth(
            d3.select(React.findDOMNode(this)).select("g:last-child").data(
                [this.state.lastTime - ((moment() - this.state.lastSynced) / 1000)]
            )
        );
        window.requestAnimationFrame(this.updateActiveBar);
    },
    chartHeight: function () {
        return (
            ((this.props.barHeight + 1) * (this.props.times.length + 1)) +
            // add 5 pixels of padding to top in bottom when bars are short
            // so that their text labels fully show
            (this.props.barHeight < 10 ? 10 : 0));
    },
    addBarsToSelection: function (selection) {
        selection = selection
            .append("g");
        selection.append("rect");
        selection.append("text");
        return this.updateBarsInSelection(selection);
    },
    updateBarsInSelection: function (selection) {
        var self = this;

        selection
            .attr("transform", function (d, i) {
                return "translate(0," +
                    (
                        (
                            (self.props.times.length - i) *
                            (self.props.barHeight + 1)
                        ) + (self.props.barHeight < 10 ? 5 : 0)
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
                return Math.max(1, self.xScale(60 - d));
            })
            .attr("height", this.props.barHeight)
            .attr("class", function (d) { return self.flairClass(d); });
        selection.select("text")
            .attr("x", function (d) {
                var barWidth = Math.max(1, self.xScale(60 - d));
                return (self.props.barHeight < 9 || barWidth < 20 ?
                    barWidth + 3 : barWidth - 3);
            })
            .classed("outside", function (d) {
                return self.props.barHeight < 9 || self.xScale(60 - d) < 20;
            })
            .attr("y", this.props.barHeight / 2)
            .attr("dy", ".35em")
            .text(function (d) { return Math.round(d); });
    },
    flairClass: function (seconds) {
        if (seconds > 51) {
            return "flair-press-6";
        }
        if (seconds > 41) {
            return "flair-press-5";
        }
        if (seconds > 31) {
            return "flair-press-4";
        }
        if (seconds > 21) {
            return "flair-press-3";
        }
        if (seconds > 11) {
            return "flair-press-2";
        }
        return "flair-press-1";
    },
    render: function () {
        return <svg className="log-chart"></svg>;
    }
});