var RainbowDistribution = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        return {
            rainbow: true
        };
    },
    toggleDisplay: function (e) {
        e.preventDefault();
        this.setState({rainbow: !this.state.rainbow});
    },
    render: function () {
        if (!this.props.clicksTracked) {
            return (<div className="rainbow-distribution disconnected">
                Waiting for the first click…
            </div>);
        }
        return (
            <div
                className={"rainbow-distribution " +
                    (this.state.rainbow ? "rainbow" : "text")}
                onClick={this.toggleDisplay}>
                {[6, 5, 4, 3, 2, 1].map(function (flairClass) {
                    flairClass = "flair-press-" + flairClass;
                    var percentage = 100 * this.props.colorCounts[flairClass] /
                        this.props.clicksTracked;

                    return (<div
                        className={flairClass}
                        key={flairClass}
                        style={{width: percentage + "%"}}>
                            <span className="label">
                                {this.props.colorName[flairClass]}:
                            </span>
                            {" " + d3.format(".3n")(percentage)}% ({
                                d3.format("0,000")(
                                    this.props.colorCounts[flairClass]
                                )
                            } click{
                                this.props.colorCounts[flairClass] === 1 ?
                                    "" : "s"
                            })
                    </div>);
                }, this)}
            </div>
        );
    }
});