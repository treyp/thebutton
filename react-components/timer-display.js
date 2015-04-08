var TimerDisplay = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        return (
            <div className="timer">
                {this.props.connected ?
                    d3.format(".3n")(this.props.secondsRemaining) : "…"}
            </div>
        );
    }
});