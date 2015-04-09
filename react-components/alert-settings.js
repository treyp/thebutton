var AlertSettings = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    updateAlertTime: function () {
        this.props.updateAlertTime(
            React.findDOMNode(this.refs.time).value.trim()
        );
    },
    render: function () {
        if (!window.Notification) {
            return (<form className="alert-settings">
                {"Sorry, but your browser doesn't support notifications."}
            </form>)
        } else {
            return (
                <form className="alert-settings">
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
                            onChange={this.updateAlertTime} ref="time" />
                        <label htmlFor="alert-time-input">seconds</label>
                    </div>
                    <div className="row detail">Leave blank for no alerts</div>
                    {this.props.deniedNotificationPermission ?
                        <div className="row error">
                            <strong>{"We don't have permission to send you notifications. "}</strong>
                            <a onClick={this.updateAlertTime}>Try again</a>
                        </div>
                        : ""}
                </form>
            );
        }
    }
});