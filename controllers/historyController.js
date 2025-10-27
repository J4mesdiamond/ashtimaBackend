import { History } from "../models/History.js";

// @desc    Get all history for a user
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const history = await History.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single history item
// @route   GET /api/history/:id
// @access  Private
const getHistoryById = async (req, res) => {
  try {
    const history = await History.findById(req.params.id);

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History item not found',
      });
    }

    // Check if history belongs to user
    if (history.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this history',
      });
    }

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new history item
// @route   POST /api/history
// @access  Private
const createHistory = async (req, res) => {
  try {
    const {
      location,
      time,
      date,
      coordinates,
      weatherData,
      medicalFacilities,
    } = req.body;

    if (!location || !time || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location, time, and date',
      });
    }

    const history = await History.create({
      userId: req.user.id,
      location,
      time,
      date,
      coordinates,
      weatherData: {
        aqi: weatherData?.aqi || 'N/A',
        pm25: weatherData?.pm25 || 'N/A',
        pm10: weatherData?.pm10 || 'N/A',
        no2: weatherData?.no2 || 'N/A',
        ozone: weatherData?.ozone || 'N/A',
        pollen: weatherData?.pollen || 'N/A',
        temperature: weatherData?.temperature || null,
        humidity: weatherData?.humidity || null,
        windSpeed: weatherData?.windSpeed || null,
        windDirect: weatherData?.windDirect || null,
        category: weatherData?.category || 'N/A',
      },
      medicalFacilities: medicalFacilities || false,
    });

    res.status(201).json({
      success: true,
      message: 'History item created successfully',
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update history item
// @route   PUT /api/history/:id
// @access  Private
const updateHistory = async (req, res) => {
  try {
    let history = await History.findById(req.params.id);

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History item not found',
      });
    }

    // Check if history belongs to user
    if (history.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this history',
      });
    }

    const {
      location,
      time,
      date,
      coordinates,
      weatherData,
      medicalFacilities,
    } = req.body;

    history = await History.findByIdAndUpdate(
      req.params.id,
      {
        location,
        time,
        date,
        coordinates,
        weatherData: weatherData
          ? {
              aqi: weatherData.aqi || history.weatherData.aqi,
              pm25: weatherData.pm25 || history.weatherData.pm25,
              pm10: weatherData.pm10 || history.weatherData.pm10,
              no2: weatherData.no2 || history.weatherData.no2,
              ozone: weatherData.ozone || history.weatherData.ozone,
              pollen: weatherData.pollen || history.weatherData.pollen,
              temperature: weatherData.temperature || history.weatherData.temperature,
              humidity: weatherData.humidity || history.weatherData.humidity,
              windSpeed: weatherData.windSpeed || history.weatherData.windSpeed,
              windDirect: weatherData.windDirect || history.weatherData.windDirect,
              category: weatherData.category || history.weatherData.category,
            }
          : history.weatherData,
        medicalFacilities: medicalFacilities !== undefined ? medicalFacilities : history.medicalFacilities,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'History item updated successfully',
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete history item
// @route   DELETE /api/history/:id
// @access  Private
const deleteHistory = async (req, res) => {
  try {
    const history = await History.findById(req.params.id);

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History item not found',
      });
    }

    // Check if history belongs to user
    if (history.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this history',
      });
    }

    await history.deleteOne();

    res.status(200).json({
      success: true,
      message: 'History item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete all history for user
// @route   DELETE /api/history
// @access  Private
const deleteAllHistory = async (req, res) => {
  try {
    await History.deleteMany({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'All history deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  getHistory,
  getHistoryById,
  createHistory,
  updateHistory,
  deleteHistory,
  deleteAllHistory,
};