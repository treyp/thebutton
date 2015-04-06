var data = [];
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

var StatsDisplay = React.createClass({
    mixins: [PureRenderMixin],
    render: function () {
        return (
            <div className="stats">
                <div>
                    {"Started: "}<span>{this.props.started}</span>
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

var ButtonMonitor = React.createClass({
    getInitialState: function () {
        return {
            started: moment().format("YYYY-MM-DD HH:mm:ss"),
            lag: 0,
            participants: 0,
            secondsRemaining: 60.0
        };
    },
    tick: function () {
        this.setState({secondsRemaining: this.state.secondsRemaining - 0.1});
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
    componentDidMount: function () {
        this.interval = setInterval(this.tick, 100);
        var self = this;
        var socket = new WebSocket(
            "wss://wss.redditmedia.com/thebutton?h=" +
            "af117cac0144724620b827801e9c18e4951492df&e=1428374000"
        );
        socket.onmessage = function (event) {
            /* jshint camelcase: false */
            // disabling camelcase since reddit uses underscore style here
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

            packet.payload.now = moment(
                packet.payload.now_str + " 0000",
                "YYYY-MM-DD-HH-mm-ss Z"
            );
            self.updateLag(packet.payload.now);

            var previousTick = _.last(data);
            if (
                data.length > 0 &&
                packet.payload.seconds_left >= previousTick.seconds_left
            ) {
                _.last(data).is_click = true;
            }
            currentParticipants = parseInt(
                packet.payload.participants_text.replace(/,/g, ""),
                10
            );
            if (!initialParticipants) {
                initialParticipants = currentParticipants;
            }
            self.updateParticipants(currentParticipants);

            // fill in the gaps when more than one person clicks between ticks
            var barCountOffset =
                (currentParticipants - initialParticipants) -
                _.filter(data, "is_click").length;
            if (barCountOffset > 0) {
                var clone = _.clone(previousTick);
                clone.seconds_left = 60.0;
                clone.is_click = true;
                while (barCountOffset > 0) {
                    data.push(clone);
                    barCountOffset = barCountOffset - 1;
                }
            }

            data.push(packet.payload);

            Chart.render(data);
            Timer.sync(packet.payload.seconds_left);
            self.syncTimer(packet.payload.seconds_left);
        };
    },
    componentWillUnmount: function () {
        clearInterval(this.interval);
    },
    render: function () {
        return (
            <div>
                <TimerDisplay
                    secondsRemaining={this.state.secondsRemaining} />
                <StatsDisplay
                    started={this.state.started}
                    lag={this.state.lag}
                    participants={this.state.participants} />
            </div>
        );
    }
});

React.render(<ButtonMonitor />, document.getElementById("button-monitor"));