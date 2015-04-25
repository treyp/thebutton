var Settings = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        return {
            discardAfter: this.props.discardAfter,
            replaySpeed: 100
        };
    },
    componentDidMount: function () {
        var exportEl = React.findDOMNode(this.refs.exportInput);
        exportEl.onfocus = function () {
            exportEl.select();
            // work around a problem in chrome on first mouse up
            exportEl.onmouseup = function () {
                exportEl.onmouseup = null;
                return false;
            };
        }
    },
    componentDidReceiveProps: function (newProps) {
        if (this.props.discardAfter !== newProps.discardAfter) {
            this.setState({discardAfter: newProps.discardAfter});
        }
    },
    updateAlertTime: function () {
        this.props.updateAlertTime(
            React.findDOMNode(this.refs.time).value.trim()
        );
    },
    updateBeep: function () {
        this.props.updateBeep(React.findDOMNode(this.refs.beep).checked);
    },
    submitDiscard: function (e) {
        e.preventDefault();
        this.props.updateDiscardAfter(
            React.findDOMNode(this.refs.discard).value.trim()
        );
    },
    updateDiscard: function () {
        this.setState({
            discardAfter: React.findDOMNode(this.refs.discard).value.trim()
        });
    },
    updateNightMode: function () {
        this.props.updateNightMode(React.findDOMNode(this.refs.night).checked);
    },
    clearData: function () {
        if (this.props.clicks.length - this.props.entriesImported > 10) {
            var confirmation = "You've tracked more than ten entries. " +
                "Are you sure you want to clear everything out?";
            if (!window.confirm(confirmation)) {
                return;
            }
        }
        this.props.clearClicks();
    },
    submitImport: function (e) {
        e.preventDefault();
        var el = React.findDOMNode(this.refs.importInput);
        this.props.import(el.value.trim());
        el.value = "";
    },
    submitReplay: function (e) {
        e.preventDefault();
        var replay = React.findDOMNode(this.refs.replayInput);
        var speed = React.findDOMNode(this.refs.speedInput);
        this.props.replay(replay.value.trim(),speed.value.trim());
        replay.value = "";
    },
    updateReplaySpeed: function () {
        this.setState({
            replaySpeed: React.findDOMNode(this.refs.speedInput).value.trim()
        });
    },
    
    render: function () {
        return (
            <div>
                {!window.Notification ?
                    <div className="setting">{
                        "Sorry, but your browser doesn't support notifications."
                    }</div> :
                    (<div className="setting">
                        <div className="row">
                            <label htmlFor="alert-time-input">
                                Notify me every time the timer passes:
                            </label>
                        </div>
                        <div className="row input-row">
                            <input
                                type="number"
                                id="alert-time-input"
                                min="0"
                                max="60"
                                value={this.props.alertTime}
                                onChange={this.updateAlertTime}
                                ref="time" />
                            <label htmlFor="alert-time-input">seconds</label>
                        </div>
                        <div className="row detail">Leave blank for no alerts</div>
                        {this.props.deniedNotificationPermission ?
                            <div className="row error">
                                <strong>{"We don't have permission to send " +
                                    "you notifications. "}</strong>
                                <a onClick={this.updateAlertTime}>Try again</a>
                            </div>
                            : ""}
                    </div>)
                }
                <div className="setting">
                    <div className="row">
                        <input
                            type="checkbox"
                            defaultChecked={this.props.beep}
                            id="alert-beep"
                            ref="beep"
                            onChange={this.updateBeep} />
                        <label htmlFor="alert-beep">
                            Play a beep for new clicks
                        </label>
                    </div>
                </div>
                <div className="setting">
                    <div className="row">
                        <input
                            type="checkbox"
                            defaultChecked={this.props.nightMode}
                            id="night-mode"
                            ref="night"
                            onChange={this.updateNightMode} />
                        <label htmlFor="night-mode">
                            Enable night mode
                        </label>
                    </div>
                </div>
                <div className="setting">
                    <div className="row">
                        <a onClick={this.clearData}>Clear all data and start over</a>
                    </div>
                </div>
                <div className="setting">
                        <div className="row">
                            <label htmlFor="discard-input">
                                Discard data older than:
                            </label>
                        </div>
                        <form onSubmit={this.submitDiscard}>
                            <div className="row input-row">
                                <input
                                    type="number"
                                    min="1"
                                    id="discard-input"
                                    value={this.state.discardAfter}
                                    onChange={this.updateDiscard}
                                    ref="discard" />
                                <label htmlFor="discard-input">entries</label>
                            </div>
                            <div className="row">
                                <input
                                    type="submit"
                                    id="discard-submit"
                                    value="Save" />
                            </div>
                        </form>
                        <div className="row detail">Leave blank to retain all data</div>
                        <div className="row detail">Each data entry (seen as one dot or row) may represent multiple clicks</div>
                </div>
                <div className="setting">
                    <form onSubmit={this.submitImport}>
                        <div className="row">
                            <label htmlFor="import-input">
                                Import click data
                            </label>
                        </div>
                        <div className="row">
                            <textarea
                                ref="importInput"
                                id="import-input"
                                autocomplete="off"
                                spellcheck="false" />
                        </div>
                        <div className="row detail">
                            Pasting large amounts of data here will probably
                            cause your browser to freeze for several seconds
                        </div>
                        <div className="row spacer-row">
                            <input
                                type="submit"
                                value="Import"
                                id="import-submit" />
                        </div>
                    </form>
                    <div className="row">
                        <label htmlFor="export-input">
                            Export click data
                            <a className="right">Select all</a>
                        </label>
                    </div>
                    <div className="row">
                        <textarea
                            ref="exportInput"
                            id="export-input"
                            autocomplete="off"
                            spellcheck="false"
                            value={JSON.stringify(this.props.clicks)} />
                    </div>
                </div>
                <div className="setting">
                    <form onSubmit={this.submitReplay}>
                        <div className="row">
                            <label htmlFor="replay-input">
                                Replay click data
                            </label>
                        </div>
                        <div className="row spacer-row">
                            <textarea
                                ref="replayInput"
                                id="replay-input"
                                autocomplete="off"
                                spellcheck="false" />
                        </div>
                        <div className="row">
                            <label htmlFor="speed-input">Replay speed</label>
                        </div>
                        <div className="row spacer-row input-row">
                            <input
                                type="number"
                                className="no-space"
                                min="1"
                                id="speed-input"
                                value={this.state.replaySpeed}
                                onChange={this.updateReplaySpeed}
                                ref="speedInput" />
                            X
                        </div>
                        <div className="row">
                            <input
                                type="submit"
                                value="Replay"
                                id="replay-submit" />
                        </div>
                        <div className="row detail">
                            This will clear out all data saved up to this point.
                            Replay will start after ten seconds. The page will
                            stop in a disconnected state after the replay is
                            complete. Refresh to start collecting data again.
                        </div>
                    </form>
                </div>
            </div>
        );
    }
});