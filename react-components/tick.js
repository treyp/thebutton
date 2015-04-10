var Tick = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function () {
        var evenOrOdd = this.props.count % 2 === 0 ? "even" : "odd";
        if (!this.props.connected) {
            evenOrOdd = "disconnected";
        }
        return (
            <div className={"ticker " + evenOrOdd}></div>
        );
    }
});