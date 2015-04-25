var ChartSelector = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    chartOptionLinkClass: function (choice) {
        return "chart-choice" +
            (this.props.chartSelected === choice ? " selected" : "");
    },
    render: function () {
        var alertsDescription =
            (this.props.alertTime && this.props.alertTime !== 0 ?
            <span className="tab-description">
                Alerts at <strong>{this.props.alertTime}</strong>s
            </span>
            :
            <span className="tab-description">No alerts</span>
            );
        return (
            <div className="chart-selector">
                <a className={this.chartOptionLinkClass("time")}
                    onClick={this.props.updateChartSelection.bind(null, "time")}>
                    <span className="tab-name">Time</span>
                </a>
                <a className={this.chartOptionLinkClass("histogram")}
                    onClick={this.props.updateChartSelection.bind(null, "histogram")}>
                    <span className="tab-name">Distribution</span>
                </a>
                <a className={this.chartOptionLinkClass("log")}
                    onClick={this.props.updateChartSelection.bind(null, "log")}>
                    <span className="tab-name">Log</span>
                </a>
                <a className={this.chartOptionLinkClass("settings")}
                    onClick={this.props.updateChartSelection.bind(null, "settings")}>
                    <span className="tab-name">Settings</span>
                    {alertsDescription}
                </a>
            </div>
        );
    }
});