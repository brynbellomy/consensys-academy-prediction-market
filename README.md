# consensys academy: prediction market project

![screenshot](https://d3vv6lp55qjaqc.cloudfront.net/items/1E2W2y1v140a2e1H0Q3i/Image%202017-09-02%20at%202.49.44%20PM.png?X-CloudApp-Visitor-Id=1055401)

## how to run

1) Install dependencies:

```sh
$ yarn
```

2) Run testrpc/geth/parity

3) Deploy contracts:

```sh
$ truffle migrate --network dev --reset
```

4) Build frontend:

```sh
$ webpack
```

5) Serve frontend:

```sh
$ cd build && python -m SimpleHTTPServer
```

You can view the app at <http://localhost:8000>.

## running tests

```sh
$ truffle test --network dev
```

Unfortunately, the tests currently give all sorts of weird errors in geth, probably related either to nondeterministic block mining.