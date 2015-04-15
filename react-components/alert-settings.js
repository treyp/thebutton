var AlertSettings = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    updateAlertTime: function () {
        this.props.updateAlertTime(
            React.findDOMNode(this.refs.time).value.trim()
        );
    },
    updateBeep: function () {
        this.props.updateBeep(React.findDOMNode(this.refs.beep).checked);
    },
    render: function () {
        if (!window.Notification) {
            return (<div className="alert-settings">
                {"Sorry, but your browser doesn't support notifications."}
            </div>)
        } else {
            return (
                <div>
                    <div className="alert-settings">
                        <div className="row">
                            <label htmlFor="alert-time-input">
                                Notify me every time the timer passes:
                            </label>
                        </div>
                        <div className="row input-row">
                            <input
                                type="number"
                                id="alert-time-input"
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
                    </div>
                    <div className="alert-settings">
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
                </div>
            );
        }
    }
});