// controllers/tutorialController.js
import { Tutorial } from "../models/Tutorial.js";

// @desc    Get all tutorials
// @route   GET /api/tutorials
// @access  Private
const getTutorials = async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const tutorials = await Tutorial.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tutorials.length,
      data: tutorials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single tutorial
// @route   GET /api/tutorials/:id
// @access  Private
const getTutorialById = async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Tutorial not found',
      });
    }

    // Increment views
    tutorial.views += 1;
    await tutorial.save();

    res.status(200).json({
      success: true,
      data: tutorial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new tutorial (Admin)
// @route   POST /api/tutorials
// @access  Private
const createTutorial = async (req, res) => {
  try {
    const { title, duration, videoUrl, thumbnailUrl, description, category } = req.body;

    if (!title || !duration || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, duration, and video URL',
      });
    }

    const tutorial = await Tutorial.create({
      title,
      duration,
      videoUrl,
      thumbnailUrl,
      description,
      category,
    });

    res.status(201).json({
      success: true,
      message: 'Tutorial created successfully',
      data: tutorial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update tutorial (Admin)
// @route   PUT /api/tutorials/:id
// @access  Private
const updateTutorial = async (req, res) => {
  try {
    let tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Tutorial not found',
      });
    }

    tutorial = await Tutorial.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Tutorial updated successfully',
      data: tutorial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete tutorial (Admin)
// @route   DELETE /api/tutorials/:id
// @access  Private
const deleteTutorial = async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Tutorial not found',
      });
    }

    // Soft delete by setting isActive to false
    tutorial.isActive = false;
    await tutorial.save();

    res.status(200).json({
      success: true,
      message: 'Tutorial deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search tutorials
// @route   GET /api/tutorials/search
// @access  Private
const searchTutorials = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide search query',
      });
    }

    const tutorials = await Tutorial.find({
      isActive: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    }).sort({ views: -1 });

    res.status(200).json({
      success: true,
      count: tutorials.length,
      data: tutorials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  getTutorials,
  getTutorialById,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  searchTutorials,
};