var StatsDisplay = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        var runningSince = "since " + this.props.started.format("LTS");
        var runningDuration =
            moment.duration(moment().diff(this.props.started)).humanize();
        return (
            <div className="stats">
                <div>
                    {"Running: "}
                    <span title={runningSince}>{runningDuration}</span>
                    {" "}<span>({
                        d3.format("0,000")(this.props.clicksTracked) +
                        ' click' + (this.props.clicksTracked === 1 ? "" : "s")
                    })</span>
                </div>
                <div>
                    {"Lag: "}
                    {this.props.lag ?
                        <span>{d3.format("0,000")(this.props.lag)}ms</span> :
                        "Disconnected"}
                </div>
                <div>
                    {"Participants: "}
                    <span>{d3.format("0,000")(this.props.participants)}</span>
                </div>
            </div>
        );
    }
});