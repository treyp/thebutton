var animating = false;

var Timer = (function () {
    var self = {};
    var fmtSeconds = d3.format(".3n");

    var timerEnd;
    var timerBar = Chart.svg.append("rect")
        .attr("class", "timer-bar")
        .attr("x", 1)
        .attr("y", 1)
        .attr("width", 1)
        .attr("height", 1)
        .attr("shape-rendering", "crispEdges");

    self.sync = function (secondsLeft) {
        timerEnd = moment().add(secondsLeft * 1000);
        timerBar
            .attr("x", function () {
                return Chart.xScale(Stats.resets);
            })
            .attr("width", function () {
                return (
                    Chart.xScale(Stats.resets) -
                    Chart.xScale(Stats.resets - 1)
                );
            });

        if (!animating) {
            animate();
        }
    };

    var animate = function () {
        animating = true;
        var timer = (timerEnd - moment());
        timerBar
            .attr("y", function () {
                return Chart.yScale(timer / 1000);
            })
            .attr("height", function () {
                return Chart.yScale(60) - Chart.yScale(timer / 1000);
            })
            .attr("fill", flairColor(timer / 1000));
        $("#timer").text(fmtSeconds(timer / 1000));
        requestAnimationFrame(animate);
    };

    self.resize = function () {
        $("#timer")
            .css("left", ($("#stats").offset().left + $("#stats").outerWidth()))
            .css("top", Chart.margins.top)
            .css("line-height", $("#stats").outerHeight() + "px");
    };

    return self;
}());