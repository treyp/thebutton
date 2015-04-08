var Tick = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    render: function() {
        var evenOrOdd = this.props.count % 2 === 0 ? "even" : "odd";
        return (
            <div className="tick">
                <div className={"tock " + evenOrOdd}></div>
            </div>
        );
    }
});