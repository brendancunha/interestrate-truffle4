pragma solidity ^0.4.17;

contract InterestRate {
  // state variables
  address owner;
  address ratingsAgency; // seller
  address issuer; // buyer
  string name;
  string description;
  uint256 price; // price of rating

  // events
  event LogSellRating(
    address indexed _ratingsAgency,
    string _name,
    uint256 _price
  );
  event LogBuyRating(
    address indexed _ratingsAgency,
    address indexed _issuer,
    // Add rating from python file here
    string _name,
    uint256 _price
  );

  // modifiers
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  // constructor
  function InterestRate() public {
    owner = msg.sender;
  }

  // deactivate the contract
  function kill() public onlyOwner {
    selfdestruct(owner);
  }

  // sell a Rating
  function sellRating(string _name, string _description, uint256 _price) public {
    ratingsAgency = msg.sender;
    name = _name;
    description = _description;
    price = _price;

    LogSellRating(ratingsAgency, name, price);
  }

  // get a Rating
  function getRating() public view returns (
    address _ratingsAgency,
    address _issuer,
    string _name,
    string _description,
    uint256 _price
  ) {
      return(ratingsAgency, issuer, name, description, price);
  }

  // buy an Rating
  function buyRating() payable public {
    // we check whether there is an Rating for sale
    require(ratingsAgency != 0x0);

    // we check that the Rating has not been sold yet
    require(issuer == 0X0);

    // we don't allow the ratingsAgency to buy his own Rating
    require(msg.sender != ratingsAgency);

    // we check that the value sent corresponds to the price of the Rating
    require(msg.value == price);

    // keep issuer's information
    issuer = msg.sender;

    // the issuer can pay the ratingsAgency
    ratingsAgency.transfer(msg.value);

    // trigger the event
    LogBuyRating(ratingsAgency, issuer, name, price);
  }
}
