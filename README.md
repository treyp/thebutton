# The Button Monitor
Monitor [Reddit](//www.reddit.com/)'s [/r/thebutton](//www.reddit.com/r/thebutton/). A fork of [jamesrom.github.io](//jamesrom.github.io) with new charts and notifications (coming soon). Built using [React](//facebook.github.io/react/) and [D3](//d3js.org).

![Screenshot](/screenshot.jpg?raw=true)

## To Do List
- [x] Change header stat labels to be clearer
- [x] Port to React
- [x] Make chart horizontal with fixed, user-selectable bar height
- [x] Add desktop notifications when the timer hits a user-defined number
- [ ] Get WebSocket URL from Reddit directly instead of hard-coding
- [ ] Add chart to display click numbers over time
- [ ] Hide when browser tab not visible (for performance reasons)
- [ ] Better handling of connection errors/disconnects
- [ ] Make header responsive
- [ ] Replace pulse dot with a clearer "live" text that fades out after 1 second (with a 1 second fade)
- [ ] Add pause button
- [ ] Auto bar height option: starts large, shrinks down based on browser height and number of bars, minimum bar height of 1 still
- [ ] Cookie to save settings