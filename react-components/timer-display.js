var TimerDisplay = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        var time = "…";
        if (this.props.ended) {
            time = "The End";
        } else if (this.props.secondsRemaining &&
            (this.props.connected || this.props.stopped)) {
            time = d3.format(".3n")(this.props.secondsRemaining);
        }
        return (
            <div className={"timer" + (this.props.ended ? " ended" : "")}>
                {time}
            </div>
        );
    }
});