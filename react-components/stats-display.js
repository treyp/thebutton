var StatsDisplay = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        var runningSince = "Loading…"; 
        var runningDuration = "Loading…";
        if (this.props.connected) {
            runningSince = "since " + this.props.started.format("LTS");
            runningDuration =
                moment.duration(this.props.now().diff(this.props.started))
                .humanize();
        }
        return (
            <div className="stats">
                <div>
                    {"Running: "}
                    <span title={runningSince}>{runningDuration}</span>
                    {" "}<span>({
                        d3.format("0,000")(this.props.clicksTracked) +
                        " click" + (this.props.clicksTracked === 1 ? "" : "s")
                    })</span>
                </div>
                <div>
                    {"Lag: "}
                    {this.props.connected ?
                        <span>{d3.format("0,000")(this.props.lag)}ms</span> :
                        "Disconnected"}
                    <Tick
                        count={this.props.count}
                        connected={this.props.connected} />
                </div>
                <div>
                    {"Participants: "}
                    <span>{d3.format("0,000")(this.props.participants)}</span>
                </div>
            </div>
        );
    }
});