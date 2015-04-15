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
- [ ] Export graph to an image
- [ ] Make header responsive
- [ ] Replace pulse dot with a clearer "live" text that fades out after 1 second (with a 1 second fade)
- [ ] Auto dot size and bar height option: starts large, shrinks down based on window size, minimum of 1
- [ ] Hide animations when browser tab not visible (for performance reasons)
- [ ] Add pause button
- [ ] Cookie to save settings
