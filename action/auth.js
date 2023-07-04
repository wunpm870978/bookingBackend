const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require('bcryptjs');
const MongoCli = require('../config/mongoConfig.js');

async function authMeMiddleware(req, res, next) {
  if (!req.headers.authorization || !req.headers['grant-type']) {
    return res.status(403).send('no bearer')
  }
  const bearerHeader = req.headers.authorization.split(' ');
  return bearerHeader.length !== 2 || bearerHeader[0] !== 'Bearer'
    ? res.status(404).send('not valid')
    : jwt.verify(
      bearerHeader[1],
      req.headers['grant-type'] === 'refresh'
        ? process.env.REFRESH_TOKEN_PRIVATE_KEY
        : process.env.ACCESS_TOKEN_PRIVATE_KEY,
      function (err, decoded) {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            // token expired
            return res.status(401).send('not valid')
          } else {
            // mandatory logout
            return res.status(404).send('no bearer ')
          }
        }
        return next()
      })
}

async function generateTokens(user, res) {
  try {
    if (!user.shop_id) {
      throw new Error('user EMPTY')
    }
    const access_token = jwt.sign(
      user,
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      { expiresIn: "15m", algorithm: "HS256" }
    );
    const refresh_token = jwt.sign(
      user,
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: "1d", algorithm: "HS256" }
    );
    await MongoCli.db.collection('tokens')
      .insertOne({
        refresh_token,
        shop_id: user.shop_id,
        createdAt: new Date()
      })
      .catch(err => {
        console.log('insert err', err)
        return res.status(400).json(err)
      })
    res.header('Access-Control-Allow-Credentials', true)
      .header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      .cookie("access_token", access_token, {
        httpOnly: true,
        // sameSite: 'none',
        // secure: process.env.NODE_ENV === "production",
      })
      .cookie("refresh_token", refresh_token, {
        httpOnly: true,
        // sameSite: 'none',
        //     sameSite: 'Strict',  // or 'Lax', it depends
        //     maxAge: 604800000,  // 7 days
        // secure: process.env.NODE_ENV === "production",
      })
    // return Promise.resolve({ access_token, refresh_token });
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
  bcrypt.compare(password, hashedPassword)
    .then(res => {
      return res
    });
}

module.exports = {
  generateTokens,
  verifyRefreshToken,
  hashWithSalt,
  comparePassword,
  authMeMiddleware
};