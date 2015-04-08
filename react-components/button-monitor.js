var ButtonMonitor = React.createClass({
    getInitialState: function () {
        return {
            chartSelected: "log",
            connected: false,
            started: null,
            clicksTracked: 0,
            lag: 0,
            participants: 0,
            secondsRemaining: 60.0,
            ticks: 0,
            times: [], // [60,59,18,60,59,25,60,8,0,3,45,35,60,55],
            chartWidth: 0,
            barHeight: 20,
            alertTime: null,
            deniedNotificationPermission: false,
            notifiedForCurrentClick: false,
            lastTimeTrackedForCurrentClick: 60
        };
    },
    tick: function () {
        if (!this.state.connected) {
            return;
        }
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
        // console.log('new time: ' + seconds);
        this.setState({
            clicksTracked: this.state.times.length + 1,
            times: this.state.times.concat(seconds),
            notifiedForCurrentClick: false
        });
    },
    updateBarHeight: function (barHeight) {
        this.setState({barHeight: barHeight});
    },
    updateChartSelection: function (chart) {
        this.setState({chartSelected: chart});
    },
    updateAlertTime: function (time) {
        var self = this;

        if (!time && time !== 0) {
            time = null;
        } else {
            time = parseInt(time, 10);
        }
        this.setState({alertTime: time});
        if (!("Notification" in window)) {
            return;
        }
        if (Notification.permission === "denied") {
            self.setState({deniedNotificationPermission: true});
        } else if (Notification.permission === "granted") {
            self.setState({deniedNotificationPermission: false});
        } else {
            Notification.requestPermission(function (permission) {
                if (permission === "denied") {
                    self.setState({deniedNotificationPermission: true});
                } else if (permission === "granted") {
                    self.setState({deniedNotificationPermission: false});
                    new Notification(
                        "Alerts for The Button Monitor enabled!");
                }
            })
        }
    },
    sendNecessaryNotifications: function (seconds) {
        if (!this.state.alertTime && this.state.alertTime !== 0) {
            return;
        }
        if (this.state.notifiedForCurrentClick) {
            return;
        }
        if (!("Notification" in window)) {
            return;
        }
        if (seconds <= this.state.alertTime) {
            if (Notification.permission === "denied") {
                this.setState({deniedNotificationPermission: true});
            }
            new Notification("/r/thebutton passed " + this.state.alertTime +
                " seconds at " + moment().format("LTS"));
            this.setState({notifiedForCurrentClick: true});
        }
    },
    windowResized: function () {
        this.setState({chartWidth: React.findDOMNode(this).offsetWidth});
    },
    setupWebSocket: function () {
        var initialParticipants;
        var currentParticipants;
        var previousSecondsLeft;
        var previousParticipants;
        var self = this;

        var socket = new WebSocket(
            "wss://wss.redditmedia.com/thebutton?h=" +
            "c5a59ef8bfb5fca5be6dfbf58f152212e745d7a1&e=1428567490"
        );
        socket.onopen = function () {
            if (!self.state.started) {
                self.setState({started: moment()});
            }
            self.setState({connected: true});
        };
        socket.onclose = function () {
            self.setState({connected: false});
        };
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

            self.sendNecessaryNotifications(tick.seconds_left);

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
    componentDidMount: function () {
        this.interval = setInterval(this.tick, 100);

        // thanks to React's autobinding, no need to worry about 'this' in the
        // handler call
        window.addEventListener("resize", this.windowResized);
        this.windowResized();

        if (("Notification" in window) &&
            Notification.permission === "denied") {
            this.setState({deniedNotificationPermission: true});
        }

        this.setupWebSocket();
    },
    componentWillUnmount: function () {
        clearInterval(this.interval);
        window.removeEventListener("resize", this.windowResized);
    },
    render: function () {
        return (
            <div>
                <header id="nav">
                    <a href="//github.com/treyp/thebutton/" className="github">
                        GitHub
                    </a>
                    <a
                        href="//www.reddit.com/r/thebutton/"
                        className="thebutton">
                        /r/thebutton
                    </a>
                    <TimerDisplay
                        secondsRemaining={this.state.secondsRemaining}
                        connected={this.state.connected} />
                    <Tick count={this.state.ticks} />
                    <StatsDisplay
                        started={this.state.started}
                        clicksTracked={this.state.clicksTracked}
                        lag={this.state.lag}
                        participants={this.state.participants}
                        connected={this.state.connected} />
                    <ChartSelector
                        barHeight={this.state.barHeight}
                        updateBarHeight={this.updateBarHeight}
                        updateChartSelection={this.updateChartSelection}
                        chartSelected={this.state.chartSelected}
                        alertTime={this.state.alertTime} />
                </header>
                {
                    this.state.chartSelected === "log" ?
                        <LogChart
                            times={this.state.times}
                            barHeight={this.state.barHeight}
                            width={this.state.chartWidth}
                            secondsRemaining={this.state.secondsRemaining}
                            connected={this.state.connected}
                            />
                        :
                        (this.state.chartSelected === "time" ?
                            <TimeChart /> :
                            <AlertSettings
                                deniedNotificationPermission={
                                    this.state.deniedNotificationPermission}
                                alertTime={this.state.alertTime}
                                updateAlertTime={this.updateAlertTime} />)
                }
            </div>
        );
    }
});

React.render(<ButtonMonitor />, document.getElementById("button-monitor"));