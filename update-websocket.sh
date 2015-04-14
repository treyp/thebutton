#!/bin/bash
curl -s "http://www.reddit.com/r/thebutton" | perl -ne '/wss:\/\/[^"]+/ && print $&' > websocket-url.txt
git add websocket-url.txt
git commit -m "websocket url update"
