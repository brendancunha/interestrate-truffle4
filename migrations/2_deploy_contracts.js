var InterestRate = artifacts.require("./InterestRate.sol");

module.exports = function(deployer) {
  deployer.deploy(InterestRate);
}
