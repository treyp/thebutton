#!/bin/bash
set -e
msg() {
    echo "[1;34m> [1;32m$@[0m"
}

msg "Grabbing latest websocket URL from Reddit..."
curl -s "http://www.reddit.com/r/thebutton" | perl -ne '/wss:\/\/[^"]+/ && print $&' > websocket-url.txt
git add websocket-url.txt
git commit -m "websocket url update"
msg "Updated websocket-url.txt."