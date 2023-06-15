var express = require('express');
var router = express.Router();
const MongoCli = require('../../config/mongoConfig.js');
const {
  hashWithSalt,
  comparePassword,
  generateTokens,
  authMeMiddleware,
} = require('../../action/auth.js')

router.get('/debug', async (req, res) => {
  const result = await MongoCli.db.collection('tokens').find()
  res.status(200).json(result)
});

router.get('/me', authMeMiddleware, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const { shop_id } = req.body

  const result = await MongoCli.db.collection('tokens')
    .findOneAndDelete({ fresh_token: token })
    .catch(err => {
      console.log('delete err', err)
      return res.status(400).json(err)
    })

  if (!result) {
    return res.status(404).send('Session expired')
  }
  await generateTokens({ shop_id }, res);
  res.status(200)
    .json({ message: "Logged in sucessfully" });
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log(username, password)
    const user = await MongoCli.db.collection('accounts')
      .findOne(
        { username },
        { projection: { shop_id: 1 } }
      )
    if (!user) {
      return res.status(404).send('Invalid email or password');
    }
    if (!await comparePassword(password, user.password)) {
      throw ('Invalid email or password')
    }
    delete user.password;
    await generateTokens(user, res);
    res.status(200).json({ message: "Logged in sucessfully" });
  } catch (err) {
    console.log(err)
    res.status(404).send('Invalid email or password');
  }
});

router.post('/logout', async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send('no bearer')
  }
  const bearerHeader = req.headers.authorization.split(' ');
  if (bearerHeader.length !== 2 || bearerHeader[0] !== 'Bearer') {
    return res.status(403).send('not valid')
  }
  await MongoCli.db.collection('tokens')
    .findOneAndDelete({ access_token: bearerHeader[1] })

  res.status(200).send('Logout successfully')
});

router.post('/register', async function (req, res, next) {
  try {
    const { shop_id, username, password, email, role } = req.body;
    const hash = await hashWithSalt(password);
    console.log('hashedPassword', hash)
    const isValid = comparePassword(password, hash)
    if (!isValid) throw ('password salting err happened')
    await generateTokens({ shop_id }, res);
    await MongoCli.db.collection('accounts')
      .insertOne({
        shop_id,
        username,
        password: hash,
        email,
        role,
      })
      .then(ack => {
        return res.status(200)
          .json({ shop_id, username, email, role });

      }).catch(err => {
        console.log('err', err)
        return res.status(404).json(err);
      })
  } catch (error) {
    console.log(error)
    res.status(404).json(error);
  }
});


module.exports = router;
