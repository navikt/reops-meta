## k6
Grafana k6 is an easy-to-use, open source load testing tool

## Installing k6 via Homebrew example
https://formulae.brew.sh/formula/k6

## Documentation
https://grafana.com/docs/k6/latest/get-started/running-k6/ 

## Example run script 
### uses the hardcoded URL
```
k6 run proxy-kafka/script.js
```
### Point it at another env
```
BASE_URL="https://your.env" k6 run script.js
```
### Tune endpoint if needed
```
BASE_URL="https://your.env" ENDPOINT="/api/send" k6 run script.js
```