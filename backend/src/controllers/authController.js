const User = require('../model/userModel/user');
const UserToken = require('../model/userModel/userToken');
const bcryptjs = require('bcryptjs');
const { generateUniqueLinkWithToken, generateToken, generateSecureOTP } = require('../utils/generateToken');
const { setData, deleteData, getData } = require('../utils/redisVercelKv');
const { confirmAccountSendEmail, resetPasswordSendEmail, sendOTP } = require('./smtp/emailController');
const jwt = require('jsonwebtoken');
const { decryptMessage } = require('../utils/cryptoUtil');

//* POST Routes
exports.signUp = async (req, res, next) => {
    try {
        let { name, email, phone, gender, age, password } = req.body;

        const newUser = await User.create({ name, email, phone, gender, age, password });

        const { token, link } = generateUniqueLinkWithToken('account/verificationConfirmation');
        await setData('root', token, 'verifyUser', { userId: newUser.id }, 900);

        const isEmailSent = await confirmAccountSendEmail(newUser.email, newUser.name, link);

        if (!isEmailSent) {
            await deleteData('root', token, 'verifyUser');
            const error = new Error('Failed to send email verification');
            error.statusCode = 500;
            throw error;
        }

        return res.status(201).send({
            status: true,
            message: 'User Account successfully created, and need to verify your email address',
            result: { email: newUser.email }
        });

    } catch (err) {
        next(err);
    }
};

//* POST Routes
exports.signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await User.findOne({ where: { email } });

        if (!result) {
            const error = new Error("Login Failed");
            error.statusCode = 403;
            throw error;
        }

        const isPassMatch = await bcryptjs.compare(password, result.password);

        if (!isPassMatch) {
            const error = new Error("Login Failed");
            error.statusCode = 403;
            throw error;
        }

        if (!result.isUserVerified) {
            const { token, link } = generateUniqueLinkWithToken("account/verificationConfirmation");
            await setData('root', token, 'verifyUser', { userId: result.id }, 900);
            const isEmailSent = await confirmAccountSendEmail(result.email, result.name, link);

            if (!isEmailSent) {
                await deleteData('root', token, 'verifyUser');
                const error = new Error("Failed to send email verification");
                error.statusCode = 500;
                throw error;
            }

            return res.status(403).send({
                status: false,
                message: "You need to verify your account",
                code: "VerifyUser",
            });
        }

        if (result.isTwoFactorAuthEnabled) {
            const token = generateToken();
            const otp = generateSecureOTP();
            await setData('root', token, 'TwoFactorAuthEnabled', { otp, userId: result.id }, 900);
            const isEmailSent = await sendOTP(result.email, result.name, otp);

            if (!isEmailSent) {
                await deleteData('root', token, 'TwoFactorAuthEnabled');
                const error = new Error("Failed to send otp email verification");
                error.statusCode = 500;
                throw error;
            }

            return res.status(403).send({
                status: false,
                message: "two factor authentication needed",
                code: "TwoFactorAuth",
                token
            });
        }

        const token = await result.generateAuthToken();
        const { encryptedMessage, iv } = token.refreshToken;

        if (!encryptedMessage || !iv) {
            const error = new Error("Failed to generate refresh token");
            error.statusCode = 500;
            throw error;
        }

        await setData('authentication', encryptedMessage, 'refreshToken', { iv }, 2592000);

        const userInfo = result.toJSON();
        delete userInfo.password;

        const info = {
            status: true,
            message: "Login Successful",
            result: userInfo,
            token: {
                accessToken: token.accessToken,
                refreshToken: encryptedMessage
            }
        };

        res.status(200).send(info);
    } catch (error) {
        next(error);
    }
};

//* GET Routes
exports.logout = async (req, res, next) => {
    try {
        await UserToken.destroy({ where: { user_id: req.user, token: req.token } });

        res.status(200).send({
            status: true,
            message: 'Logout Successfully.'
        });
    } catch (error) {
        next(error);
    }
};

//* GET Routes
exports.checkUser = async (req, res, next) => {
    try {
        const result = await User.findByPk(req.user);

        if (!result) {
            const error = new Error("Authentication Failed");
            error.statusCode = 403;
            throw error;
        }

        res.status(200).send({ status: true, message: "User Check Passed." });
    } catch (error) {
        next(error);
    }
};


exports.resetUserPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        //! Check if the email parameter is valid
        if (!email) {
            const error = new Error("Email is required");
            error.statusCode = 400;
            throw error;
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            const error = new Error("Email is not valid");
            error.statusCode = 400;
            throw error;
        }

        //* Generate unique token and link for email verification
        const { token, link } = generateUniqueLinkWithToken("account/ResetYourPassword");

        //* Save the token in redis database with expire time 15 min.
        await setData('root', token, 'resetPassword', { userId: user.id }, 900);

        //* Send Email with smtp to activate user account
        const isEmailSent = await resetPasswordSendEmail(user.email, user.name, link);

        if (!isEmailSent) {

            //* Deleting the token from the redis database
            await deleteData('root', token, 'resetPassword');

            const error = new Error("Failed to send email verification");
            error.statusCode = 500;
            throw error;
        }


        const info = {
            status: true,
            message: "Password Reset Email Sent Successfully",
        }

        return res.status(200).send(info);

    } catch (error) {
        next(error); //! Pass the error to the global error middleware
    }
}


exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            const error = new Error("Authentication failed!");
            error.statusCode = 403;
            throw error;
        }

        const getIv = await getData("authentication", refreshToken, "refreshToken");

        if (!getIv) {
            const error = new Error("Authentication failed!");
            error.statusCode = 403;
            throw error;
        }

        const decryptedToken = decryptMessage(refreshToken, getIv.iv);

        await deleteData("authentication", refreshToken, "refreshToken");

        if (!decryptedToken) {
            const error = new Error("Authentication failed!");
            error.statusCode = 403;
            throw error;
        }

        const verifyUser = jwt.verify(decryptedToken, process.env.REFRESH_SECRET_KEY);

        if (!verifyUser) {
            const error = new Error("Authentication failed!");
            error.statusCode = 403;
            throw error;
        }

        const user = await User.findByPk(verifyUser._id);

        if (!user) {
            const error = new Error("Authentication failed!");
            error.statusCode = 403;
            throw error;
        }

        const existingToken = await UserToken.findOne({ where: { user_id: user.id, token: decryptedToken } });

        if (!existingToken) {
            const error = new Error("Authentication failed!");
            error.statusCode = 403;
            throw error;
        }

        await existingToken.destroy();

        const authToken = await user.generateAuthToken();
        const { encryptedMessage, iv } = authToken.refreshToken;

        await setData("authentication", encryptedMessage, "refreshToken", { iv }, 2592000);

        return res.status(200).send({
            status: true,
            message: "New Token Generated!",
            token: {
                accessToken: authToken.accessToken,
                refreshToken: encryptedMessage
            }
        });

    } catch (error) {
        next(error);
    }
};


exports.validateOtp = async (req, res, next) => {
    const { token } = req.params;
    try {
        if (!token) {
            const error = new Error("Invalid Token Parameters");
            error.statusCode = 404;
            throw error;
        }

        const otpData = await getData('root', token, 'TwoFactorAuthEnabled');

        if (!otpData) {
            const error = new Error("Token Expired or does not exist");
            error.statusCode = 404;
            throw error;
        }

        const { otp } = req.body;

        if (!otp) {
            const error = new Error("Otp Parameter Missing");
            error.statusCode = 405;
            throw error;
        }

        if (otp.toString() !== otpData.otp.toString()) {
            const error = new Error("Otp does not match");
            error.statusCode = 405;
            throw error;
        }

        const user = await User.findByPk(otpData.userId);

        if (!user) {
            await deleteData('root', token, 'TwoFactorAuthEnabled');
            const error = new Error("You are not verified, you may need to re-try");
            error.statusCode = 403;
            throw error;
        }

        const userInfo = user.toJSON();
        delete userInfo.password;

        await deleteData('root', token, 'TwoFactorAuthEnabled');

        const authToken = await user.generateAuthToken();
        const { encryptedMessage, iv } = authToken.refreshToken;

        if (!encryptedMessage || !iv) {
            const error = new Error("Failed to generate refresh token");
            error.statusCode = 500;
            throw error;
        }

        await setData('authentication', encryptedMessage, 'refreshToken', { iv }, 2592000);

        res.status(200).send({
            status: true,
            message: "Verification Completed successfully",
            result: userInfo,
            token: {
                accessToken: authToken.accessToken,
                refreshToken: encryptedMessage
            }
        });
    } catch (error) {
        next(error);
    }
};


exports.validateOtpToken = async (req, res, next) => {
    const { token } = req.params;
    try {
        if (!token) {
            const error = new Error("Invalid Token Parameters");
            error.statusCode = 404;
            throw error;
        }

        const otpData = await getData('root', token, 'TwoFactorAuthEnabled');

        if (!otpData) {
            const error = new Error("Token Expired or does not exist");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({ status: true, message: "Valid TwoFactor Authentication Token" });
    } catch (error) {
        next(error);
    }
};


exports.resendOtp = async (req, res, next) => {
    const { token } = req.params;
    try {
        if (!token) {
            const error = new Error("Invalid Token Parameters");
            error.statusCode = 404;
            throw error;
        }

        const otpData = await getData('root', token, 'TwoFactorAuthEnabled');

        if (!otpData) {
            const error = new Error("Token Expired or does not exist");
            error.statusCode = 404;
            throw error;
        }

        const result = await User.findByPk(otpData.userId);

        const otp = generateSecureOTP();
        await setData('root', token, 'TwoFactorAuthEnabled', { otp, userId: result.id }, 900);

        const isEmailSent = await sendOTP(result.email, result.name, otp);

        if (!isEmailSent) {
            await deleteData('root', token, 'TwoFactorAuthEnabled');
            const error = new Error("Failed to send otp email verification");
            error.statusCode = 500;
            throw error;
        }

        return res.status(200).send({
            status: false,
            message: "Otp Resend Successfully",
            code: "TwoFactorAuth",
            token
        });
    } catch (error) {
        next(error);
    }
};