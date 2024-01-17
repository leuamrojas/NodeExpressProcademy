const express = require('express');
const userController = require('./../Controllers/userController');
const authController = require('./../Controllers/authController');

const router = express.Router();

router.route('/updatePassword').patch(authController.protect, userController.updatePassword);
router.route('/updateMe').patch(authController.protect, userController.updateMe);
router.route('/deleteMe').delete(authController.protect, userController.deleteMe);
router.route('/getAllUsers').get(userController.getAllUsers);

module.exports = router;