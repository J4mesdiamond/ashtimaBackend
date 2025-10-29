import express from 'express';
import { createChat, deleteChat, getChat, getUserChats, sendMessage, updateChatTitle } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';
const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all chats for the authenticated user
router.get('/', getUserChats);

// Get a specific chat
router.get('/:chatId', getChat);

// Create a new chat
router.post('/', createChat);

// Send a message (creates chat if chatId not provided)
router.post('/message', sendMessage);

// Update chat title
router.patch('/:chatId', updateChatTitle);

// Delete a chat
router.delete('/:chatId', deleteChat);

export { router as chatRoutes};