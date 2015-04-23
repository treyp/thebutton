# The Button Snitch
Monitor [Reddit](//www.reddit.com/)'s [/r/thebutton](//www.reddit.com/r/thebutton/). A fork of [jamesrom.github.io](//jamesrom.github.io) with different visualizations and notifications. Built using [React](//facebook.github.io/react/) and [D3](//d3js.org).

![Screenshot](/screenshot.png?raw=true)

## To Do List
- [x] Change header stat labels to be clearer
- [x] Port to React
- [x] Make chart horizontal with fixed, user-selectable bar height
- [x] Add desktop notifications when the timer hits a user-defined number
- [x] Get WebSocket URL from Reddit directly instead of hard-coding
- [x] Add chart to display click numbers over time
- [x] Make text labels optional
- [x] Consider adding AM/PM to time labels on X axis
- [x] Change counting of simultaenous clicks so all clickers get the proper flair (instead of 60s for the "missed" presses)
- [x] Show distribution of flair colors in tracked clicks
- [x] Better handling of connection errors/disconnects
- [x] Support beep noise for new clicks (suggestion from [/u/crazykoala](//www.reddit.com/user/crazykoala))
- [x] Update favicon and window title to reflect color and time remaining
- [x] Add a histogram chart (started as [a pull request from renoth](//github.com/treyp/thebutton/pull/1))
- [x] ~~Hide animations when page not visible (for performance reasons)~~ D3 uses requestAnimationFrame which takes care of this
- [x] Throw away data older than X minutes for performance reasons (suggestion from [/u/debugmonkey](//www.reddit.com/user/debugmonkey))
- [x] Add current time to histogram chart (suggestion from [/u/shotgun_nancy](//www.reddit.com/user/shotgun_nancy))
- [x] Fix all the bugs introduced by the data discarding feature (reported by [/u/TOTALLY_ATHIEST](//www.reddit.com/user/TOTALLY_ATHIEST))
- [x] Add a new darker theme called night mode (suggestion from [/u/SohnoJam](//www.reddit.com/user/SohnoJam))
- [ ] Import historical data on first load
- [ ] Show time zone on time axes
- [ ] Dual chart display (request from [/u/argash](//www.reddit.com/user/argash))
- [ ] Breakdown of percentage of time spent in each color (request from [/u/carpevirginem](//www.reddit.com/user/carpevirginem))
- [ ] Beep support like Squire
- [ ] Scroll to zoom, or at least support clamping to start/end times selectable in options bar
- [ ] Horizontal option for log chart
- [ ] Export graph to an image
- [ ] Make header responsive
- [ ] Replace pulse dot with a clearer "live" text that fades out after 1 second (with a 1 second fade)
- [ ] Auto dot size and bar height option: starts large, shrinks down based on window size, minimum of 1
- [ ] Add pause button
- [ ] Cookie to save settings
