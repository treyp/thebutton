var TimerDisplay = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        return (
            <div className="timer">
                {d3.format(".3n")(this.props.secondsRemaining)}
            </div>
        );
    }
});