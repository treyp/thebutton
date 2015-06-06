var StatsDisplay = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        var runningSince = "Loading…";
        var runningDuration = "Loading…";
        var participants = "Unknown";
        if (this.props.connected || this.props.stopped) {
            runningSince = this.props.started.format("LTS");
            runningDuration =
                moment.duration(this.props.now().diff(this.props.started))
                .humanize() + " ago";
        }
        if (this.props.participants) {
            participants = d3.format("0,000")(this.props.participants);
        }
        if (this.props.ended) {
            participants = "1,008,316";
        }
        return (
            <div className="stats">
                <div>
                    {"Clicks tracked here: "}
                    <span title={d3.format("0,000")(this.props.resetsTracked) +
                        " resets"}>
                        {d3.format("0,000")(this.props.clicksTracked)}
                    </span>
                </div>
                <div>
                    {"Data since: "}
                    <span title={runningSince}>{runningDuration}</span>
                    <Tick
                        count={this.props.count}
                        connected={this.props.connected} />
                </div>
                <div>
                    {"Participants: "}
                    <span>{participants}</span>
                </div>
            </div>
        );
    }
});