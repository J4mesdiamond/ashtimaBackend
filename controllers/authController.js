// const { generateToken } = require('../middleware/authMiddleware');
import { generateToken } from '../middlewares/authMiddleware.js';
import { UserModel } from '../models/User.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
      const { fullName, email, password, confirmPassword } = req.body;
  
      // Validation
      if (!fullName || !email || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields',
        });
      }
  
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match',
        });
      }
  
      // Check if user exists
      const userExists = await UserModel.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      }
  
      // Create user
      const user = await UserModel.create({
        fullName,
        email,
        password,
      });
  
      if (user) {
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            token: generateToken(user._id),
          },
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password',
        });
      }
  
      // Check user exists
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
  
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // In production, send OTP via email
    // For now, we'll return it in response (NOT RECOMMENDED FOR PRODUCTION)
    res.status(200).json({
      success: true,
      message: 'OTP sent to email',
      otp: otp, // Remove this in production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    const user = await UserModel.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
      const { email, otp, password, confirmPassword } = req.body;
  
      if (!email || !otp || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields',
        });
      }
  
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match',
        });
      }
  
      const user = await UserModel.findOne({
        email,
        resetPasswordOTP: otp,
        resetPasswordExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
      }
  
      // Update password
      user.password = password;
      user.resetPasswordOTP = null;
      user.resetPasswordExpires = null;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
};