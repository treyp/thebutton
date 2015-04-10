var ButtonMonitor = React.createClass({
    getInitialState: function () {
        return {
            chartSelected: "time",
            connected: false,
            started: null,
            clicksTracked: 0,
            lag: 0,
            participants: 0,
            secondsRemaining: 60.0,
            ticks: 0,
            clicks: [],
            windowWidth: 0,
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
            clicksTracked: this.state.clicks.length + 1,
            clicks: this.state.clicks.concat({
                seconds: seconds,
                time: moment().valueOf(),
                color: this.flairClass(seconds)
            }),
            notifiedForCurrentClick: false
        });
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
        if (!window.Notification) {
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
        if (!window.Notification) {
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
        this.setState({windowWidth: React.findDOMNode(this).offsetWidth});
    },
    findWebSocket: function () {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("readystatechange", function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    self.setupWebSocket(this.responseText.trim());
                } else {
                    window.setTimeout(self.findWebSocket, 5e3);
                }
            }
        }, false);
        xhr.addEventListener("error", function () {
            window.setTimeout(self.findWebSocket, 5e3);
        }, false);
        xhr.open("get", "websocket-url.txt", true);
        xhr.send();
    },
    setupWebSocket: function (websocketUrl) {
        var initialParticipants;
        var currentParticipants;
        var previousSecondsLeft;
        var previousParticipants;
        var self = this;

        var socket = new WebSocket(websocketUrl);
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
                    self.state.clicks.length;
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

        if (window.Notification && Notification.permission === "denied") {
            this.setState({deniedNotificationPermission: true});
        }

        this.findWebSocket();
    },
    componentWillUnmount: function () {
        clearInterval(this.interval);
        window.removeEventListener("resize", this.windowResized);
    },
    render: function () {
        return (
            <div>
                <header id="nav">
                    <div className="right-nav">
                        <a href="//github.com/treyp/thebutton/">GitHub</a>
                        <span className="author"><a href="//www.reddit.com/user/treyjp">by /u/treyjp</a></span>
                    </div>
                    <div className="right-nav">
                        <a href="//www.reddit.com/r/thebutton/">/r/thebutton</a>
                    </div>
                    <TimerDisplay
                        secondsRemaining={this.state.secondsRemaining}
                        connected={this.state.connected} />
                    <StatsDisplay
                        started={this.state.started}
                        clicksTracked={this.state.clicksTracked}
                        lag={this.state.lag}
                        participants={this.state.participants}
                        connected={this.state.connected}
                        count={this.state.ticks} />
                    <ChartSelector
                        updateChartSelection={this.updateChartSelection}
                        chartSelected={this.state.chartSelected}
                        alertTime={this.state.alertTime} />
                </header>
                {
                    this.state.chartSelected === "log" ?
                        <LogChart
                            clicks={this.state.clicks}
                            flairClass={this.flairClass}
                            width={this.state.windowWidth}
                            secondsRemaining={this.state.secondsRemaining}
                            connected={this.state.connected}
                            />
                        :
                        (this.state.chartSelected === "time" ?
                            <TimeChart
                                started={this.state.started}
                                clicks={this.state.clicks}
                                flairClass={this.flairClass}
                                secondsRemaining={this.state.secondsRemaining}
                                connected={this.state.connected}
                                /> :
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