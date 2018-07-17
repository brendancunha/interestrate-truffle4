App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // initialize web3
    if(typeof web3 !== 'undefined') {
      //reuse the provider of the Web3 object injected by Metamask
      App.web3Provider = web3.currentProvider;
    } else {
      //create a new provider and plug it directly into our local node
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#account').text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if(err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        })
      }
    });
  },

  initContract: function() {
    $.getJSON('InterestRate.json', function(interestRateArtifact) {
      // get the contract artifact file and use it to instantiate a truffle contract abstraction
      App.contracts.InterestRate = TruffleContract(interestRateArtifact);
      // set the provider for our contracts
      App.contracts.InterestRate.setProvider(App.web3Provider);
      // listen to events
      App.listenToEvents();
      // retrieve the article from the contract
      return App.reloadArticles();
    });
  },

  // reload ratings
  reloadArticles: function() {
    // refresh account information because the balance might have changed
    App.displayAccountInfo();

    // retrieve the article placeholder and clear it
    $('#articlesRow').empty();

    App.contracts.InterestRate.deployed().then(function(instance) {
      return instance.getRating();
    }).then(function(article) {
      if(article[0] == 0x0) {
        // no article
        return;
      }

      var price = web3.fromWei(article[4], "ether");

      // retrieve the article (rating) template and fill it
      var articleTemplate = $('#articleTemplate');
      articleTemplate.find('.panel-title').text(article[2]);
      articleTemplate.find('.article-description').text(article[3]);
      articleTemplate.find('.article-price').text(price);
      articleTemplate.find('.btn-buy').attr('data-value', price);

      var seller = article[0];
      if (seller == App.account) {
        seller = "You";
      }
      articleTemplate.find('.article-seller').text(seller);

      // buyer (issuer)
      var issuer = article[1];
      if(issuer == App.account) {
        issuer = "You are the issuer";
      } else if(issuer == 0x0) {
        issuer = "No one is looking to be rated at the moment :(";
      }
      articleTemplate.find('.article-buyer').text(issuer);

      if(article[0] == App.account || article[1] != 0x0) {
        articleTemplate.find('.btn-buy').hide();
      } else {
        articleTemplate.find('.btn-buy').show();
      }

      // add this article
      $('#articlesRow').append(articleTemplate.html());
    }).catch(function(err) {
      console.error(err.message);
    });
  },

  sellRating: function() {
    // retrieve the detail of the article
    var _article_name = $('#article_name').val();
    var _description = $('#article_description').val();
    var _price = web3.toWei(parseFloat($('#article_price').val() || 0), "ether");

    if((_article_name.trim() == '') || (_price == 0)) {
      // nothing to sell
      return false;
    }

    App.contracts.InterestRate.deployed().then(function(instance) {
      return instance.sellRating(_article_name, _description, _price, {
        from: App.account,
        gas: 500000
      });
    }).then(function(result) {
      
    }).catch(function(err) {
      console.error(err);
    });
  },

  // listen to events triggered by the contract
  listenToEvents: function() {
    App.contracts.InterestRate.deployed().then(function(instance) {
      instance.LogSellRating({}, {}).watch(function(error, event) {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>');
        } else {
          console.error(error);
        }
        App.reloadArticles();
      });
      instance.LogBuyRating({}, {}).watch(function(error, event) {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._issuer + ' was issued a rating of ' + event.args._name + ' </li>');
        } else {
          console.error(error);
        }
        App.reloadArticles();
      });
    });
  },

  buyRating: function() {
    //events.preventDefault();

    // retrieve the rating price
    var _price = parseFloat($(event.target).data('value'));

    App.contracts.InterestRate.deployed().then(function(instance) {
      return instance.buyRating({
        from: App.account,
        value: web3.toWei(_price, "ether"),
        gas: 500000
      });
    }).catch(function(error) {
      console.error(error);
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
