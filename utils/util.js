const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require('bcryptjs');


async function generateTokens(user) {
  try {
    console.log(user._id)
    const payload = { _id: user._id.toString(), roles: user.username };
    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      { expiresIn: "15m", algorithms: "RS256" }
    );
    const refreshToken = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: "1d", algorithms: "HS256" }
    );

    // const userToken = await UserToken.findOne({ userId: user._id });
    // if (userToken) await userToken.remove();

    // await new UserToken({ userId: user._id, token: refreshToken }).save();
    return Promise.resolve({ accessToken, refreshToken });
  } catch (err) {
    return Promise.reject(err);
  }
};

function verifyRefreshToken(refreshToken) {
  // return new Promise((resolve, reject) => {
  //   UserToken.findOne({ token: refreshToken }, (err, doc) => {
  //     if (!doc)
  //       return reject({ error: true, message: "Invalid refresh token" });

  //     jwt.verify(
  //       refreshToken,
  //       process.env.REFRESH_TOKEN_PRIVATE_KEY,
  //       (err, tokenDetails) => {
  //         if (err)
  //           return reject({ error: true, message: "Invalid refresh token" });
  //         resolve({
  //           tokenDetails,
  //           error: false,
  //           message: "Valid refresh token",
  //         });
  //       });
  //   });
  // });
};

function authMiddleware(){
  
}


async function hashWithSalt(password) {
  const salt = await bcrypt.genSalt(10);
  return new Promise(async (resolve) => {
    const hash = await bcrypt.hash(password, salt);
    resolve(hash)
  })
}

async function comparePassword(password, hashedPassword) {
  return new Promise(async (resolve) => {
    const isValid = await bcrypt.compare(password, hashedPassword);
    resolve(isValid)
  })
}

module.exports = {
  generateTokens,
  verifyRefreshToken,
  hashWithSalt,
  comparePassword
};