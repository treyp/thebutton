var Settings = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    updateAlertTime: function () {
        this.props.updateAlertTime(
            React.findDOMNode(this.refs.time).value.trim()
        );
    },
    updateBeep: function () {
        this.props.updateBeep(React.findDOMNode(this.refs.beep).checked);
    },
    updateDiscardAfter: function () {
        this.props.updateDiscardAfter(
            React.findDOMNode(this.refs.discard).value.trim()
        );
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
                            Play a beep for new clicks?
                        </label>
                    </div>
                </div>
                <div className="setting">
                        <div className="row">
                            <label htmlFor="discard-input">
                                Discard data older than:
                            </label>
                        </div>
                        <div className="row input-row">
                            <input
                                type="number"
                                min="1"
                                id="discard-input"
                                value={this.props.discardAfter}
                                onChange={this.updateDiscardAfter}
                                ref="discard" />
                            <label htmlFor="discard-input">entries</label>
                        </div>
                        <div className="row detail">Leave blank to retain all data</div>
                        <div className="row detail">Each data entry (seen as one dot or row) may represent multiple clicks</div>
                </div>
            </div>
        );
    }
});