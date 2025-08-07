const bcrypt = require("bcrypt");

bcrypt.hash("admin1234", 10).then((hash) => {
  console.log("Hashed Password:", hash);
});
