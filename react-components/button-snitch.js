var ButtonSnitch = React.createClass({
    getInitialState: function () {
        return this.getInitialStateReal();
        // return this.getInitialStateFake(5e3);
    },
    parseJson: function (serializedJson) {
        try {
            var data = JSON.parse(serializedJson);
        } catch (e) {
            // couldn't parse JSON
            return;
        }
        if (Array.isArray ? !Array.isArray(data) :
            Object.prototype.toString.call(data) !== "[object Array]") {
            // not an array
            return;
        }
        return data;
    },
    importSavedClicks: function (clickData) {
        var clicks = this.parseJson(clickData);
        if (!clicks) {
            return;
        }
        var colorCounts = {};
        // shallow clone of this.state.colorCounts
        for (var k in this.state.colorCounts) {
            colorCounts[k] = this.state.colorCounts[k];
        }
        var totalClicks = this.state.clicksTracked;
        var sum = this.state.sum;
        var histogram = this.state.histogram.slice();
        clicks.forEach(function (click) {
            colorCounts[click.color] = colorCounts[click.color] + click.clicks;
            totalClicks = totalClicks + click.clicks;
            sum = sum + (click.clicks * click.seconds);
            histogram[click.seconds - 1] =
                histogram[click.seconds - 1] + click.clicks;
        });
        this.setState({
            clicks: clicks.concat(this.state.clicks),
            colorCounts: colorCounts,
            clicksTracked: totalClicks,
            entriesImported: this.state.entriesImported + clicks.length,
            sum: sum,
            mean: (sum / totalClicks),
            median: this.calculateMedian(histogram, totalClicks),
            histogram: histogram,
            started: (clicks.length ?
                moment(clicks[0].time - ((60-clicks[0].seconds) * 1000)) :
                this.state.started)
        });
    },
    now: function () {
        return this.state.now || moment();
    },
    stop: function () {
        // this causes the websocket to self destruct (see websocket.onmessage)
        this.setState({stopped: true});
    },
    replayClicks: function(data, speed) {
        var self = this;
        var clicks = this.parseJson(data);
        if (!clicks || !clicks.length) {
            return;
        }

        // in case we're already replaying, stop that
        if (this.replayAnimation) {
            window.cancelAnimationFrame(this.replayAnimation);
            this.replayAnimation = null;
        }

        if (!this.state.stopped) {
            this.stop();
        }
        this.clearClicks();

        var animationStarted = moment();
        var startMoment =
            moment(clicks[0].time - ((60 - clicks[0].seconds) * 1000));
        this.setState({
            started: startMoment,
            secondsRemaining: 60,
            participants: 0,
            ticks: 0
        });
        this.replayAnimation = window.requestAnimationFrame(function frame() {
            clicks = self.doFakeTick(
                clicks,
                startMoment + ((moment() - animationStarted) * speed)
            );
            if (!clicks || !clicks.length) {
                // we've run out of data to replay
                self.replayAnimation = null;
                return;
            }
            window.requestAnimationFrame(frame);
        });
    },
    doFakeTick: function(replayClicks, displayTime) {
        var click = replayClicks[0];
        var participants = 0;
        while (replayClicks.length && displayTime > replayClicks[0].time) {
            click = replayClicks.shift();
            participants = participants + click.clicks;
            this.addTime(click.seconds, click.clicks, click.time);
        }

        this.setState({
            ticks: this.state.ticks + 1,
            participants: this.state.participants + participants,
            secondsRemaining: -1 *
                (displayTime - (click.time + (click.seconds * 1000))) / 1000,
            now: moment(displayTime)
        });

        return replayClicks;
    },
    clearClicks: function () {
        var initialState = this.getInitialState();
        this.setState({
            clicks: initialState.clicks,
            colorCounts: initialState.colorCounts,
            clicksTracked: initialState.clicksTracked,
            entriesImported: initialState.entriesImported,
            sum: initialState.sum,
            mean: initialState.mean,
            median: initialState.median,
            histogram: initialState.histogram,
            started: moment(),
        });
    },
    generateFakeClicks: function (quantity) {
        var clicks = [];
        var colorCounts = {
            "flair-press-1": 0,
            "flair-press-2": 0,
            "flair-press-3": 0,
            "flair-press-4": 0,
            "flair-press-5": 0,
            "flair-press-6": 0
        };
        var remaining = quantity;
        var lastClickTime = moment().valueOf();
        var duration;
        var seconds;
        var clickCount;
        var histogram = new Array(60);
        var flairClass;
        var totalClicks = 0;
        var sum = 0;
        for (var i = 0; i < 60; i = i + 1) {
            histogram[i] = 0;
        }
        while (remaining > 0) {
            duration = 60 -
                (Math.round(Math.pow(Math.random(), 10) * 60e3) / 1000);
            seconds = Math.round(duration);
            lastClickTime = lastClickTime - (duration * 1000);
            clickCount = Math.ceil(Math.pow(Math.random(), 10) * 10);
            flairClass = this.flairClass(seconds);
            clicks.unshift({
                seconds: seconds,
                time: lastClickTime,
                color: flairClass,
                clicks: clickCount,
            });
            colorCounts[flairClass] = colorCounts[flairClass] + clickCount;
            histogram[seconds - 1] = histogram[seconds - 1] + clickCount;
            totalClicks = totalClicks + clickCount;
            sum = sum + (clickCount * seconds);
            remaining = remaining - clickCount;
        }
        return {
            clicks: clicks,
            colorCounts: colorCounts,
            clicksTracked: totalClicks,
            sum: sum,
            mean: (sum / totalClicks),
            median: this.calculateMedian(histogram, totalClicks),
            histogram: histogram
        };
    },
    getInitialStateFake: function (quantity) {
        var clickData = this.generateFakeClicks(quantity);
        return {
            chartSelected: "time",
            connected: true,
            started: moment(clickData.clicks[0].time),
            clicksTracked: clickData.clicksTracked,
            entriesImported: 0,
            lag: Math.round(Math.random() * 2000),
            participants: 0,
            secondsRemaining: 60.0,
            ticks: clickData.clicks.length * 5,
            clicks: clickData.clicks,
            colorCounts: clickData.colorCounts,
            histogram: clickData.histogram,
            sum: clickData.sum,
            mean: clickData.mean,
            median: clickData.median,
            alertTime: null,
            deniedNotificationPermission: false,
            notifiedForCurrentClick: false,
            lastTimeTrackedForCurrentClick: 60,
            beep: false,
            discardAfter: false,
            nightMode: false,
            displayImportNotice: false,
            stopped: false,
            now: null
        };
    },
    getInitialStateReal: function () {
        var histogram = new Array(60);
        for (var i = 0; i < 60; i = i + 1) {
            histogram[i] = 0;
        }
        return {
            chartSelected: "time",
            connected: false,
            started: null,
            clicksTracked: 0,
            entriesImported: 0,
            lag: 0,
            participants: 0,
            secondsRemaining: 60.0,
            ticks: 0,
            clicks: [],
            colorCounts: {
                "flair-press-1": 0,
                "flair-press-2": 0,
                "flair-press-3": 0,
                "flair-press-4": 0,
                "flair-press-5": 0,
                "flair-press-6": 0
            },
            histogram: histogram,
            sum: 0,
            mean: null,
            median: null,
            alertTime: null,
            deniedNotificationPermission: false,
            notifiedForCurrentClick: false,
            lastTimeTrackedForCurrentClick: 60,
            beep: false,
            discardAfter: false,
            nightMode: false,
            displayImportNotice: false,
            stopped: false,
            now: null
        };
    },
    tick: function () {
        if (!this.state.connected || this.state.stopped) {
            return;
        }
        this.setState({secondsRemaining: this.state.secondsRemaining - 0.1});
    },
    addTime: function (seconds, clicks, clickMoment) {
        var colorCounts = {};
        if (!clickMoment) {
            clickMoment = moment().valueOf();
        }
        // shallow clone of this.state.colorCounts
        for (var k in this.state.colorCounts) {
            colorCounts[k] = this.state.colorCounts[k];
        }
        colorCounts[this.flairClass(seconds)] =
            colorCounts[this.flairClass(seconds)] + clicks;
        var sum = this.state.sum + (seconds * clicks);
        var clicksTracked = (this.state.clicksTracked + clicks);
        var started = this.state.started;
        var histogram = this.state.histogram.slice();
        histogram[seconds - 1] = histogram[seconds - 1] + clicks;
        var numToDelete = 0;
        if (this.state.discardAfter &&
            this.state.clicks.length >= this.state.discardAfter) {
            numToDelete = (this.state.clicks.length + 1) -
                this.state.discardAfter;
            // iterate over all the entries to be deleted
            this.state.clicks.slice(0, numToDelete).forEach(function (click) {
                clicksTracked = clicksTracked - click.clicks;
                colorCounts[click.color] = colorCounts[click.color] -
                    click.clicks;
                histogram[click.seconds - 1] = histogram[click.seconds - 1] -
                    click.clicks;
                sum = sum - (click.seconds * click.clicks);
            });
            started = this.state.clicks.length > numToDelete ?
                moment(this.state.clicks[numToDelete].time -
                ((60 - this.state.clicks[numToDelete].seconds) * 1000))
                : moment();
        }
        this.setState({
            clicksTracked: clicksTracked,
            clicks: this.state.clicks.slice(numToDelete).concat({
                seconds: seconds,
                time: clickMoment,
                color: this.flairClass(seconds),
                clicks: clicks
            }),
            colorCounts: colorCounts,
            histogram: histogram,
            sum: sum,
            mean: sum / clicksTracked,
            median: this.calculateMedian(histogram, clicksTracked),
            notifiedForCurrentClick: false,
            started: started
        });
        if (this.state.beep) {
            React.findDOMNode(this.refs.audio).play();
        }
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
    colorName: {
        "flair-press-6": "Purple",
        "flair-press-5": "Blue",
        "flair-press-4": "Green",
        "flair-press-3": "Yellow",
        "flair-press-2": "Orange",
        "flair-press-1": "Red"
    },
    calculateMean: function () {
        if (!this.state.clicksTracked) {
            return null;
        }
        return this.state.sum / this.state.clicksTracked;
    },
    calculateMedian: function (histogram, clicksTracked) {
        // instead of iterating over all clicks, we can use the histogram
        // counts to more quickly find the median
        if (!clicksTracked) {
            return null;
        }
        // for even number of clicks, we have to average the two middle values
        var sampleIsEven = (clicksTracked % 2 === 0);
        var midRangeBottomDistanceFromEnd =
            clicksTracked - (Math.ceil(clicksTracked / 2));
        var midRangeTopDistanceFromEnd =
            midRangeBottomDistanceFromEnd - (sampleIsEven ?  1 : 0);
        var midRangeTop;
        var midRangeBottom;
        // iterate from the end to the beginning of the histogram since typical
        // distribution is back-heavy (most clicks are purples)
        var histogramIndex = histogram.length;
        var distanceFromEnd = 0;
        // we need to pass midRangeTopDistanceFromEnd clicks,
        // then midRangeTop is the next value
        while (distanceFromEnd <= midRangeTopDistanceFromEnd) {
            histogramIndex = histogramIndex - 1;
            distanceFromEnd = distanceFromEnd + histogram[histogramIndex];
        }
        midRangeTop = (histogramIndex + 1);
        while (distanceFromEnd <= midRangeBottomDistanceFromEnd) {
            histogramIndex = histogramIndex - 1;
            distanceFromEnd = distanceFromEnd + histogram[histogramIndex];
        }
        midRangeBottom = (histogramIndex + 1);
        return (midRangeTop + midRangeBottom) / 2;
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
                        "Alerts for The Button Snitch enabled!");
                }
            });
        }
    },
    updateBeep: function (beep) {
        this.setState({beep: beep});
    },
    updateDiscardAfter: function (clicks) {
        clicks = parseInt(clicks, 10) || false;
        this.setState({discardAfter: clicks});
    },
    updateNightMode: function (nightMode) {
        if (nightMode) {
            document.documentElement.classList.add('night-mode');
        } else {
            document.documentElement.classList.remove('night-mode');
        }
        this.setState({nightMode: nightMode});
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
    downloadClickHistory: function () {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("readystatechange", function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // TODO: finish implementation of this. releasing so
                    // traffic keeps the heroku dyno live.
                    self.importSavedClicks(this.responseText);
                    self.setState({displayImportNotice: true});
                }
            }
        }, false);
        xhr.open("get", "//thebuttonsnitch.herokuapp.com/", true);
        xhr.send();
    },
    findWebSocketFromReddit: function () {
        if (this.state.connected || this.state.stopped) {
            return;
        }
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("readystatechange", function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var regex = /"(wss:\/\/[^"]+)/g;
                    var matches = regex.exec(this.responseText);
                    if (matches && matches[1]) {
                        self.setupWebSocket(matches[1]);
                    } else {
                        self.findWebSocketLocally();
                    }
                } else {
                    self.findWebSocketLocally();
                }
            }
        }, false);
        xhr.addEventListener("error", function () {
            self.findWebSocketLocally();
        }, false);
        // use a proxy to get /r/thebutton because CORS would
        // block us otherwise
        xhr.open("get", "//cors-unblocker.herokuapp.com/get?url=" +
            "https%3A%2F%2Fwww.reddit.com%2Fr%2Fthebutton", true);
        xhr.send();
    },
    findWebSocketLocally: function () {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("readystatechange", function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    self.setupWebSocket(this.responseText.trim());
                } else {
                    window.setTimeout(self.findWebSocketFromReddit, 5e3);
                }
            }
        }, false);
        xhr.addEventListener("error", function () {
            window.setTimeout(self.findWebSocketFromReddit, 5e3);
        }, false);
        xhr.open("get", "websocket-url.txt", true);
        xhr.send();
    },
    setupWebSocket: function (websocketUrl) {
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
        socket.onclose = function (reason) {
            self.setState({connected: false});
            document.title = "The Button Snitch";
            document.getElementById("favicon").href = "favicon/favicon.ico";
            window.setTimeout(self.findWebSocketFromReddit, 5e3);
        };
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
            if (self.state.stopped) {
                socket.close();
                // for some reason, the socket doesn't close until a
                // minute later, so call onclose a bit early
                socket.onclose();
                return;
            }
            var packet = JSON.parse(event.data);
            if (packet.type !== "ticking") {
                return;
            }
            var tick = packet.payload;

            self.sendNecessaryNotifications(tick.seconds_left);

            currentParticipants = parseInt(
                tick.participants_text.replace(/,/g, ""),
                10
            );

            if (previousParticipants &&
                previousParticipants < currentParticipants) {
                // the second argument calculates how many people
                // clicked this time. multiple clicks apparently all count for
                // the same number.
                self.addTime(
                    previousSecondsLeft,
                    (currentParticipants - previousParticipants)
                );
            }

            self.setState({
                ticks: self.state.ticks + 1,
                lag: Math.abs(
                    moment(tick.now_str + " 0000", "YYYY-MM-DD-HH-mm-ss Z") -
                    moment()),
                participants: currentParticipants,
                secondsRemaining: tick.seconds_left
            });

            document.title = tick.seconds_left + " | The Button Snitch";
            document.getElementById("favicon").href = "favicon/" +
                self.colorName[self.flairClass(tick.seconds_left)]
                .toLowerCase() + ".ico";

            previousSecondsLeft = tick.seconds_left;
            previousParticipants = currentParticipants;
        };
    },
    promptToExit: function (event) {
        if (this.state.clicks.length - this.state.entriesImported > 10) {
            var confirmation = "You've tracked more than ten entries. " +
                "Are you sure you want to leave?";
            (event || window.event).returnValue = confirmation;
            return confirmation;
        }
    },
    clearNotice: function () {
        this.setState({displayImportNotice: false});
    },
    componentDidMount: function () {
        this.interval = setInterval(this.tick, 100);

        window.addEventListener("beforeunload", this.promptToExit);

        if (window.Notification && Notification.permission === "denied") {
            this.setState({deniedNotificationPermission: true});
        }

        this.findWebSocketFromReddit();

        this.downloadClickHistory();
    },
    componentWillUnmount: function () {
        clearInterval(this.interval);
    },
    render: function () {
        var selectedChart;
        var importNotice;
        switch (this.state.chartSelected) {
            case "log":
               selectedChart = <LogChart
                   clicks={this.state.clicks}
                   flairClass={this.flairClass}
                   secondsRemaining={this.state.secondsRemaining}
                   connected={this.state.connected}
                   now={this.now} />;
                break;
            case "time":
                selectedChart = <TimeChart
                    started={this.state.started}
                    clicks={this.state.clicks}
                    flairClass={this.flairClass}
                    mean={this.state.mean}
                    median={this.state.median}
                    secondsRemaining={this.state.secondsRemaining}
                    connected={this.state.connected}
                    stopped={this.state.stopped}
                    now={this.now} />;
                break;
            case "histogram":
                selectedChart = <HistogramChart
                    clicks={this.state.clicks}
                    flairClass={this.flairClass}
                    mean={this.state.mean}
                    median={this.state.median}
                    histogram={this.state.histogram}
                    secondsRemaining={this.state.secondsRemaining}
                    connected={this.state.connected}
                    stopped={this.state.stopped} />;
                break;
            default:
                selectedChart = <Settings
                    deniedNotificationPermission={
                        this.state.deniedNotificationPermission}
                    alertTime={this.state.alertTime}
                    updateAlertTime={this.updateAlertTime}
                    beep={this.state.beep}
                    updateBeep={this.updateBeep}
                    discardAfter={this.state.discardAfter}
                    updateDiscardAfter={this.updateDiscardAfter}
                    nightMode={this.state.nightMode}
                    updateNightMode={this.updateNightMode}
                    import={this.importSavedClicks}
                    replay={this.replayClicks}
                    clicks={this.state.clicks}
                    entriesImported={this.state.entriesImported}
                    clearClicks={this.clearClicks} />;
        }
        if (this.state.displayImportNotice) {
            importNotice = <ImportNotice
                clearClicks={this.clearClicks}
                clearNotice={this.clearNotice} />;
        }
        return (
            <div className={this.state.displayImportNotice ? "with-notice" : ""}>
                {importNotice}
                <header id="nav">
                    <div className="right-nav">
                        <span className="row links">
                            <a href="//www.reddit.com/r/thebutton/">
                                /r/thebutton
                            </a>
                            <a
                                className="github"
                                href="//github.com/treyp/thebutton/">GitHub</a>
                        </span>
                        <span className="row title">The Button Snitch</span>
                        <span className="row authors">
                            {"by "}
                            <a href="//www.reddit.com/user/treyjp">
                                /u/treyjp
                            </a>
                            {" and "}
                            <a href="//github.com/treyp/thebutton/graphs/contributors">contributors</a>
                        </span>
                    </div>
                    <TimerDisplay
                        secondsRemaining={this.state.secondsRemaining}
                        connected={this.state.connected}
                        stopped={this.state.stopped} />
                    <StatsDisplay
                        started={this.state.started}
                        clicksTracked={this.state.clicksTracked}
                        lag={this.state.lag}
                        participants={this.state.participants}
                        connected={this.state.connected}
                        stopped={this.state.stopped}
                        count={this.state.ticks}
                        now={this.now} />
                    <ChartSelector
                        updateChartSelection={this.updateChartSelection}
                        chartSelected={this.state.chartSelected}
                        alertTime={this.state.alertTime} />
                </header>
                <RainbowDistribution
                    clicksTracked={this.state.clicksTracked}
                    colorCounts={this.state.colorCounts}
                    colorName={this.colorName} />
                {selectedChart}
                <audio
                    src="beep.mp3"
                    preload="auto"
                    className="audio"
                    ref="audio"></audio>
            </div>
        );
    }
});

window.reactRoot =
    React.render(<ButtonSnitch />, document.getElementById("button-snitch"));
