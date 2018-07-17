// contract to be tested
var InterestRate = artifacts.require("./InterestRate.sol");

// test suite
contract("InterestRate", function(accounts) {
    var InterestRateInstance;
    var ratingsAgency = accounts[1];
    var issuer = accounts[2];
    var ratingName = "article 1";
    var ratingDescription = "desc for 1";
    var ratingPrice = 10;

    // no rating for sale (completed) yet
    it("should throw an exception if you try to buy a rating when the company isn't rated yet", function() {
        return InterestRate.deployed().then(function(instance) {
            InterestRateInstance = instance;
            return InterestRateInstance.buyRating({
                from: issuer,
                value: web3.toWei(ratingPrice, "ether")
            });
        }).then(assert.fail)
        .catch(function(error) {
            assert(true);
        }).then(function() {
            return InterestRateInstance.getRating();
    }).then(function(data) {
        assert.equal(data[0], 0x0, "ratingsAgency must be empty");
        assert.equal(data[1], 0x0, "issuer must be empty");
        assert.equal(data[2], "", "article name must be empty");
        assert.equal(data[3], "", "article description must be empty");
        assert.equal(data[4].toNumber(), 0, "article price must be zero");
    })
    })
})