// routes/historyRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getHistory, createHistory, deleteAllHistory, getHistoryById, updateHistory, deleteHistory } from '../controllers/historyController.js';
const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getHistory)
  .post(createHistory)
  .delete(deleteAllHistory);

router.route('/:id')
  .get(getHistoryById)
  .put(updateHistory)
  .delete(deleteHistory);

  export { router as historyRoutes};