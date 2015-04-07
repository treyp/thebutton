var initialParticipants = 0;
var currentParticipants = 0;
var PureRenderMixin = React.addons.PureRenderMixin;

var TimerDisplay = React.createClass({
    mixins: [PureRenderMixin],
    render: function() {
        return (
            <div className="timer">
                {d3.format(".3n")(this.props.secondsRemaining)}
            </div>
        );
    }
});

var Tick = React.createClass({
    mixins: [PureRenderMixin],
    render: function() {
        var evenOrOdd = this.props.count % 2 === 0 ? "even" : "odd";
        return (
            <div className="tick">
                <div className={"tock " + evenOrOdd}></div>
            </div>
        );
    }
});

var StatsDisplay = React.createClass({
    mixins: [PureRenderMixin],
    render: function () {
        var runningSince = "since " + this.props.started.format("LTS");
        var runningDuration =
            moment.duration(moment().diff(this.props.started)).humanize();
        return (
            <div className="stats">
                <div>
                    {"Running: "}
                    <span title={runningSince}>{runningDuration}</span>
                </div>
                <div>
                    {"Lag: "}
                    <span>{d3.format("0,000")(this.props.lag)}</span>ms
                </div>
                <div>
                    {"Participants: "}
                    <span>{d3.format("0,000")(this.props.participants)}</span>
                </div>
            </div>
        );
    }
});

var Chart = React.createClass({
    mixins: [PureRenderMixin],
    componentDidMount: function () {
        var data = this.props.times;
        var chart = d3.select(React.findDOMNode(this));

        this.xScale = d3.scale.linear()
            .domain([0, 60])
            .range([0, this.props.width]);

        this.addBarsToSelection(
            chart
                .attr("width", this.props.width)
                .selectAll("g")
                .data(data).enter()
        );
        chart.attr("height", ((this.props.barHeight + 1) * data.length));
    },
    componentWillUpdate: function (props) {
        var data = props.times;
        var chart = d3.select(React.findDOMNode(this));
        chart.attr("width", props.width);
        this.xScale = this.xScale.range([0, props.width]);

        var selection = chart
            .selectAll("g").data(data);
        this.updateBarsInSelection(selection);
        this.addBarsToSelection(selection.enter());
        selection.exit().remove();
        chart.attr("height", ((props.barHeight + 1) * selection.size()));
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
                    (selection.size() - i - 1) * (self.props.barHeight + 1) +
                    ")";
            });
        selection.select("rect")
            .attr("width", function (d) {
                return Math.max(1, self.xScale(60 - d));
            })
            .attr("height", this.props.barHeight)
            .attr("class", function (d) { return self.flairClass(d); });
        selection.select("text")
            .attr("x", function (d) {
                var barWidth = Math.max(1, self.xScale(60 - d));
                return barWidth < 20 ? barWidth + 3 : barWidth - 3;
            })
            .classed("outside", function (d) {
                return self.xScale(60 - d) < 20;
            })
            .attr("y", this.props.barHeight / 2)
            .attr("dy", ".35em")
            .text(function (d) { return d; });
        return selection;
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
        return <svg className="chart"></svg>;
    }
});

var ButtonMonitor = React.createClass({
    getInitialState: function () {
        return {
            started: moment(),
            lag: 0,
            participants: 0,
            secondsRemaining: 60.0,
            ticks: 0,
            times: [], // [60,59,18,60,59,25,60,8,0,3,45,35,60,55],
            chartWidth: 0
        };
    },
    tick: function () {
        this.setState({secondsRemaining: this.state.secondsRemaining - 0.1});
    },
    increaseTicks: function () {
        this.setState({ticks: this.state.ticks + 1});
    },
    updateParticipants: function (participants) {
        this.setState({participants: participants});
    },
    updateLag: function (serverTime) {
        this.setState({lag: Math.abs(serverTime - moment())});
    },
    syncTimer: function (secondsRemaining) {
        this.setState({secondsRemaining: secondsRemaining});
    },
    addTime: function (seconds) {
        this.setState({times: this.state.times.concat(seconds)});
    },
    windowResized: function () {
        this.setState({chartWidth: React.findDOMNode(this).offsetWidth});
    },
    componentDidMount: function () {
        this.interval = setInterval(this.tick, 100);

        // thanks to React's autobinding, no need to worry about 'this' in the
        // handler call
        window.addEventListener("resize", this.windowResized);
        this.windowResized();

        var previousSecondsLeft;
        var previousParticipants;
        var self = this;
        var socket = new WebSocket(
            "wss://wss.redditmedia.com/thebutton?h=" +
            "1d15884a584a15b84dcb15561824698e9f43cf9f&e=1428466168"
        );
        socket.onmessage = function (event) {
            /* jshint camelcase: false, maxstatements: 20 */
            // disabling camelcase since reddit uses underscore style here
            // also bumping maxstatements until i have a chance to refactor
            /*
            sample tick data:
            {
                "type": "ticking",
                "payload": {
                    "participants_text": "608,802",
                    "tick_mac": "50e7a9fd2e4c8feae6851884f91d65908cceb06b",
                    "seconds_left": 60.0,
                    "now_str": "2015-04-06-04-08-07"
                }
            }
            */
            var packet = JSON.parse(event.data);
            if (packet.type !== "ticking") {
                return;
            }
            self.increaseTicks();
            var tick = packet.payload;

            self.updateLag(
                moment(tick.now_str + " 0000", "YYYY-MM-DD-HH-mm-ss Z")
            );

            currentParticipants = parseInt(
                tick.participants_text.replace(/,/g, ""),
                10
            );
            if (!initialParticipants) {
                initialParticipants = currentParticipants;
            }
            self.updateParticipants(currentParticipants);

            if (previousParticipants &&
                previousParticipants < currentParticipants) {
                // time to create new chart bars
                self.addTime(previousSecondsLeft);
                // fill in the gaps when more than one person clicks between
                // ticks
                var barCountOffset =
                    (currentParticipants - initialParticipants) -
                    self.state.times.length;
                if (barCountOffset > 0) {
                    while (barCountOffset > 0) {
                        self.addTime(60.0);
                        barCountOffset = barCountOffset - 1;
                    }
                }
            }

            self.syncTimer(tick.seconds_left);

            previousSecondsLeft = tick.seconds_left;
            previousParticipants = currentParticipants;
        };
    },
    componentWillUnmount: function () {
        clearInterval(this.interval);
        window.removeEventListener("resize", this.windowResized);
    },
    render: function () {
        return (
            <div>
                <TimerDisplay
                    secondsRemaining={this.state.secondsRemaining} />
                <Tick count={this.state.ticks} />
                <StatsDisplay
                    started={this.state.started}
                    lag={this.state.lag}
                    participants={this.state.participants} />
                <Chart
                    times={this.state.times}
                    barHeight={20}
                    width={this.state.chartWidth} />
            </div>
        );
    }
});

React.render(<ButtonMonitor />, document.getElementById("button-monitor"));