var InterestRate = artifacts.require("./InterestRate.sol");

// test suite
contract('InterestRate', function(accounts){
  var InterestRateInstance;
  var ratingsAgency = accounts[1];
  var issuer = accounts[2];
  var ratingName = "article 1";
  var ratingDescription = "Description for article 1";
  var ratingPrice = 10;
  var ratingsAgencyBalanceBeforeBuy, ratingsAgencyBalanceAfterBuy;
  var issuerBalanceBeforeBuy, issuerBalanceAfterBuy;
  
  it("should be initialized with empty values", function() {
    return InterestRate.deployed().then(function(instance) {
      return instance.getRating();
    }).then(function(data) {
      assert.equal(data[0], 0x0, "ratingsAgency must be empty");
      assert.equal(data[1], 0x0, "issuer must be empty");
      assert.equal(data[2], "", "article name must be empty");
      assert.equal(data[3], "", "article description must be empty");
      assert.equal(data[4].toNumber(), 0, "article price must be zero");
    })
  });

  it("should sell a rating", function() {
    return InterestRate.deployed().then(function(instance) {
      InterestRateInstance = instance;
      return InterestRateInstance.sellRating(ratingName, ratingDescription, web3.toWei(ratingPrice, "ether"), { from: ratingsAgency});
    }).then(function() {
      return InterestRateInstance.getRating();
    }).then(function(data) {
      assert.equal(data[0], ratingsAgency, "ratingsAgency must be " + ratingsAgency);
      assert.equal(data[1], 0x0, "issuer must be empty");
      assert.equal(data[2], ratingName, "article name must be " + ratingName);
      assert.equal(data[3], ratingDescription, "article description must be " + ratingDescription);
      assert.equal(data[4].toNumber(), web3.toWei(ratingPrice, "ether"), "article price must be " + web3.toWei(ratingPrice, "ether"));
    });
  });

  it("should buy rating", function() {
    return InterestRate.deployed().then(function(instance) {
      InterestRateInstance = instance;
      // record balances of seller and buyer before the transaction
      ratingsAgencyBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(ratingsAgency), "ether").toNumber();
      issuerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(issuer), "ether").toNumber();
      return InterestRateInstance.buyRating({
        from: issuer,
        value: web3.toWei(ratingPrice, "ether")
      });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogBuyRating", "event should be LogBuyRating");
      assert.equal(receipt.logs[0].args._ratingsAgency, ratingsAgency, "event ratingsAgency must be " + ratingsAgency);
      assert.equal(receipt.logs[0].args._issuer, issuer, "event issuer must be " + issuer);
      assert.equal(receipt.logs[0].args._name, ratingName, "event article name must be " + ratingName);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(ratingPrice, "ether"), "event article price must be " + web3.toWei(ratingPrice, "ether"));

      //record balances of agency and issuer after transaction
      ratingsAgencyBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(ratingsAgency), "ether").toNumber();
      issuerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(issuer), "ether").toNumber();

      // check the effect of buy on balances of issuer and agency, accounting for gas
      assert(ratingsAgencyBalanceAfterBuy == ratingsAgencyBalanceBeforeBuy + ratingPrice, "agency should have earned " + ratingPrice + " ETH");
      assert(issuerBalanceAfterBuy <= issuerBalanceBeforeBuy - ratingPrice, "issuer should have lost " + ratingPrice + " ETH");

      return InterestRateInstance.getRating();
    }).then(function(data) {
      assert.equal(data[0], ratingsAgency, "ratingsAgency must be " + ratingsAgency);
      assert.equal(data[1], issuer, "issuer must be " + issuer);
      assert.equal(data[2], ratingName, "article name must be " + ratingName);
      assert.equal(data[3], ratingDescription, "article description must be " + ratingDescription);
      assert.equal(data[4].toNumber(), web3.toWei(ratingPrice, "ether"), "article price must be " + web3.toWei(ratingPrice, "ether"));
    })
  })

  it("should trigger an event when a new article is sold", function() {
    return InterestRate.deployed().then(function(instance) {
      InterestRateInstance = instance;
      return InterestRateInstance.sellRating(ratingName, ratingDescription, web3.toWei(ratingPrice, "ether"), {from: ratingsAgency});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogSellRating", "event should be LogsellRating");
      assert.equal(receipt.logs[0].args._ratingsAgency, ratingsAgency, "event ratingsAgency must be " + ratingsAgency);
      assert.equal(receipt.logs[0].args._name, ratingName, "event article name must be " + ratingName);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(ratingPrice, "ether"), "event article price must be " + web3.toWei(ratingPrice, "ether"));
    });
  });
});
