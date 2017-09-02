var PredictionMarket = artifacts.require("./PredictionMarket.sol");
var SafeMath = artifacts.require("./SafeMath.sol");

module.exports = function(deployer) {
    deployer.deploy(SafeMath);
    deployer.link(SafeMath, [PredictionMarket]);
    deployer.deploy(PredictionMarket);
};
