var PredictionMarket = artifacts.require("./PredictionMarket.sol");
var AddressSetLib = artifacts.require("./AddressSetLib.sol");
var SafeMath = artifacts.require("./SafeMath.sol");

module.exports = function(deployer) {
    deployer.deploy(SafeMath);
    deployer.deploy(AddressSetLib);
    deployer.link(SafeMath, [PredictionMarket]);
    deployer.link(AddressSetLib, [PredictionMarket]);
    deployer.deploy(PredictionMarket);
};
