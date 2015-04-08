var ChartSelector = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    handleSlider: function () {
        this.props.updateBarHeight(
            parseInt(React.findDOMNode(this.refs.slider).value, 10)
        );
    },
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
                {
                    (this.props.chartSelected === "log" ?
                        <form className="options">
                            <label htmlFor="bar-height-slider">
                                Bar Height
                            </label>
                            <input type="range"
                                min="1"
                                max="25"
                                value={this.props.value}
                                id="bar-height-slider"
                                ref="slider"
                                onChange={this.handleSlider} />
                        </form>
                        :
                        "")
                }
            </div>
        );
    }
});