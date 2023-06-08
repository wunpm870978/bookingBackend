const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require('bcryptjs');

async function authMeMiddleware(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).send('no bearer')
  }
  try {
    const bearerHeader = req.headers.authorization.split(' ');
    const isValid = await new Promise((resolve, reject) => {
      jwt.verify(
        bearerHeader[1],
        process.env.ACCESS_TOKEN_PRIVATE_KEY,
        function (err, decoded) {
          if (err) return reject(false);
          return resolve(true)
        }
      )
    })
    if (bearerHeader[0] !== 'Bearer' || !isValid) {
      return res.status(401).send('not valid')
    }
  } catch (err) {
    return res.status(403).send('no bearer')
  }
  next()
}

async function generateTokens(user) {
  try {
    const accessToken = jwt.sign(
      user,
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      { expiresIn: "15m", algorithm: "HS256" }
    );
    const refreshToken = jwt.sign(
      user,
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: "1d", algorithm: "HS256" }
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
  comparePassword,
  authMeMiddleware
};