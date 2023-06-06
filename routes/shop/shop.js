var express = require('express');
var router = express.Router();
const { verifyRefreshToken } = require('./../../utils/util');

/* GET users listing. */
router.post('/', function (req, res, next) {
    const { refresh_token } = req.body;
    verifyRefreshToken(refresh_token)
        .then(({ tokenDetails }) => {
            const payload = { _id: tokenDetails._id, roles: tokenDetails.roles };
            const accessToken = jwt.sign(
                payload,
                process.env.ACCESS_TOKEN_PRIVATE_KEY,
                { expiresIn: "14m" }
            );
            res.status(200).json({
                error: false,
                accessToken,
                message: "Access token created successfully",
            });
        })
        .catch((err) => res.status(400).json(err));
});

module.exports = router;