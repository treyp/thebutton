var ChartSelector = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    chartOptionLinkClass: function (choice) {
        return "chart-choice" +
            (this.props.chartSelected === choice ? " selected" : "");
    },
    render: function () {
        return (
            <div className="chart-selector">
                <a className={this.chartOptionLinkClass("log")}
                    onClick={this.props.updateChartSelection.bind(null, "log")}>
                    <span className="tab-name">Log</span>
                </a>
                <a className={this.chartOptionLinkClass("time")}
                    onClick={this.props.updateChartSelection.bind(null, "time")}>
                    <span className="tab-name">Time</span>
                </a>
                <a className={this.chartOptionLinkClass("alerts")}
                    onClick={this.props.updateChartSelection.bind(null, "alerts")}>
                    <span className="tab-name">Alerts</span>
                    {this.props.alertTime && this.props.alertTime !== 0 ?
                        <span className="tab-description">
                            at <strong>{this.props.alertTime}</strong>s
                        </span>
                        : ""}
                </a>
            </div>
        );
    }
});