var data = [];
var fmt = d3.format("0,000");

(function () {
    var self = {};
    var sock = new WebSocket(
        "wss://wss.redditmedia.com/thebutton?h=" +
        "af117cac0144724620b827801e9c18e4951492df&e=1428374000"
    );
    sock.onmessage = function (evt) {
        /* jshint camelcase: false */
        // disabling camelcase since reddit uses underscore style here
        /*
        sample tick data:
        {
            "type": "ticking",
            "payload": {
                "participants_text": "608,802",
                "tick_mac": "50e7a9fd2e4c8feae6851884f91d65908cceb06b",
                "seconds_left": 60.0,
                "now_str": "2015-04-06-04-08-07"
            }
        }
        */
        var packet = JSON.parse(evt.data);
        if (packet.type !== "ticking") {
            return;
        }

        packet.payload.now = moment(
            packet.payload.now_str + " 0000",
            "YYYY-MM-DD-HH-mm-ss Z"
        );
        Stats.lag = d3.format("0,000")(packet.payload.now - moment());

        if (
            data.length > 0 &&
            packet.payload.seconds_left >= _.last(data).seconds_left
        ) {
            _.last(data).is_click = true;
        }
        data.push(packet.payload);
        Stats.ticks = fmt(data.length);
        Stats.participants = packet.payload.participants_text;

        Chart.render(data);
        Timer.sync(packet.payload.seconds_left);
        Stats.render();
    };

    return self;
}());