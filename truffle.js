module.exports = {
  rpc: {
    host: 'localhost',
    port: 8545,
    gas: 1900000
  },
  networks: {
    dev: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    testnet: {
      host: "localhost",
      port: 8545,
      network_id: 3
    }
  },
  migrations_directory: './migrations'
}
