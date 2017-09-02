# consensys academy: prediction market project

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