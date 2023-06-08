var express = require('express');
var router = express.Router();
const MongoCli = require('../../config/mongoConfig.js');
const {
  hashWithSalt,
  comparePassword,
  generateTokens,
} = require('../../action/auth.js')

router.post('/me', (req, res) => {

})

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log(username, password)
    const user = await MongoCli.db.collection('accounts')
      .findOne(
        { username },
        { projection: { _id: 0 } }
      )
    if (!user) {
      res.status(404).send('Invalid email or password');
    }
    if (!await comparePassword(password, user.password)) {
      throw ('Invalid email or password')
    }
    delete user.password;
    const { accessToken, refreshToken } = await generateTokens(user);
    res.status(200).json({
      ...user,
      message: "Logged in sucessfully",
    });
    // .cookie('jwt', newRefreshToken, {
    //     httpOnly: true, 
    //     secure: true,
    //     sameSite: 'Strict',  // or 'Lax', it depends
    //     maxAge: 604800000,  // 7 days
    // });
  } catch (err) {
    console.log(err)
    res.status(404).send('Invalid email or password');
  }
});
router.post('/logout', async (req, res, next) => {

});
router.post('/register', async function (req, res, next) {
  try {
    const { shop_id, username, password, email, role } = req.body;
    const hash = await hashWithSalt(password);
    console.log('hashedPassword', hash)
    const isValid = comparePassword(password, hash)
    if (!isValid) throw ('password salting err happened')
    const { accessToken, refreshToken } = await generateTokens({
      shop_id,
      email,
      role
    });
    const response = await MongoCli.db.collection('accounts')
      .insertOne({
        shop_id,
        username,
        password: hash,
        email,
        role,
        refresh_token: refreshToken
      })
      .then(res => {
        return {
          shop_id: res.shop_id,
          username: res.username,
          email: res.email,
          role,
          access_token: accessToken,
          refresh_token: refreshToken
        }
      }).catch(err => {
        console.log('err', err)
        return 'Register failed'
      })
    res.status(200).send(response);
  } catch (error) {
    console.log(error)
    res.status(404).json(error);
  }
});


module.exports = router;
