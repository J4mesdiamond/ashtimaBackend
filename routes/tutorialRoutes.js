// routes/tutorialRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { searchTutorials, getTutorials, createTutorial, getTutorialById, updateTutorial, deleteTutorial } from '../controllers/tutorialController.js';
const router = express.Router();
// All routes are protected
router.use(protect);

// Search route (must be before /:id)
router.get('/search', searchTutorials);

router.route('/')
  .get(getTutorials)
  .post(createTutorial);

router.route('/:id')
  .get(getTutorialById)
  .put(updateTutorial)
  .delete(deleteTutorial);

  export { router as tutorialRoutes};