import axios from 'axios';
import { Chat } from '../models/Chat.js';

const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY;

// Get all chats for a user
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .sort({ lastMessageAt: -1 })
      .select('title lastMessageAt messages');
    
    res.json({
      success: true,
      chats: chats.map(chat => ({
        _id: chat._id,
        title: chat.title,
        lastMessageAt: chat.lastMessageAt,
        messageCount: chat.messages.length,
        lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content.substring(0, 100) : ''
      }))
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chats' });
  }
};

// Get a specific chat
const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat' });
  }
};

// Create a new chat
const createChat = async (req, res) => {
  try {
    const { title } = req.body;
    
    const chat = new Chat({
      userId: req.user.id,
      title: title || 'New Conversation',
      messages: []
    });

    await chat.save();
    res.status(201).json({ success: true, chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to create chat' });
  }
};

// Send a message and get AI response
const sendMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let chat;
    
    // If chatId is provided, find existing chat
    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        userId: req.user.id
      });

      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }
    } else {
      // Create new chat if no chatId provided
      chat = new Chat({
        userId: req.user.id,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Prepare messages for ChatGPT API (last 10 messages for context)
    const conversationHistory = chat.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Call ChatGPT API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable medical assistant specializing in asthma, respiratory health, and general wellness. Provide helpful, accurate, and empathetic advice. Always remind users to consult healthcare professionals for serious concerns or emergencies.'
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHATGPT_API_KEY}`
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // Add AI response to chat
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    await chat.save();

    res.json({
      success: true,
      chat: {
        _id: chat._id,
        title: chat.title,
        messages: chat.messages
      },
      newMessage: {
        role: 'assistant',
        content: aiResponse,
        timestamp: chat.messages[chat.messages.length - 1].timestamp
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.response?.data) {
      console.error('OpenAI API error:', error.response.data);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.response?.data?.error?.message || error.message
    });
  }
};

// Delete a chat
const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete chat' });
  }
};

// Update chat title
const updateChatTitle = async (req, res) => {
  try {
    const { title } = req.body;
    
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.user.id },
      { title },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Update chat title error:', error);
    res.status(500).json({ success: false, message: 'Failed to update chat title' });
  }
};

export {
    getUserChats,
    getChat,
    createChat,
    sendMessage,
    deleteChat,
    updateChatTitle,
  };