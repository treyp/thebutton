var ImportNotice = React.createClass({
    mixins: [React.addons.PureRenderMixin],
    getInitialState: function () {
        return {secondsRemaining: 10};
    },
    componentDidMount: function () {
        window.setInterval(this.decreaseTime, 1e3);
    },
    componentWillUnmount: function () {
        window.clearInterval(this.decreaseTime);
    },
    decreaseTime: function () {
        if (this.state.secondsRemaining <= 1) {
            this.props.clearNotice();
        }
        this.setState({secondsRemaining: this.state.secondsRemaining - 1});
    },
    startOver: function () {
        this.props.clearClicks();
        this.props.clearNotice();
    },
    render: function () {
        return (
            <div className="import-notice">
                <a onClick={this.props.clearNotice} className="close">&times;</a>
                <span className="time-remaining">{this.state.secondsRemaining}</span>
                The latest click data has been imported.
                <a onClick={this.props.clearNotice} className="action">Okay</a>
                <a onClick={this.startOver} className="action">Get rid of it</a>
            </div>
        );
    }
});