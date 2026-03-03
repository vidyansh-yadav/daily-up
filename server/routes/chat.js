const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ========== GET ALL ACTIVE CHATS ==========
router.get('/', auth, async (req, res) => {
    try {
        const chats = await Chat.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json(chats);
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== CREATE NEW CHAT ==========
router.post('/', auth, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        
        const user = await User.findById(req.userId);
        
        const chat = new Chat({
            user: {
                userId: req.userId,
                username: user.username,
                isAdmin: user.role === 'admin'
            },
            message: message.trim()
        });
        
        await chat.save();
        
        // Emit to all connected clients
        req.io.emit('new-chat', chat);
        
        res.status(201).json({
            message: 'Chat posted successfully',
            chat
        });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== REPLY TO CHAT ==========
router.post('/:chatId/reply', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const chatId = req.params.chatId;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Reply cannot be empty' });
        }
        
        const chat = await Chat.findById(chatId);
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        if (!chat.isActive) {
            return res.status(400).json({ error: 'This chat is no longer active' });
        }
        
        const user = await User.findById(req.userId);
        
        chat.replies.push({
            user: {
                userId: req.userId,
                username: user.username,
                isAdmin: user.role === 'admin'
            },
            message: message.trim()
        });
        
        await chat.save();
        
        // Emit reply update
        req.io.to(`chat-${chatId}`).emit('new-reply', {
            chatId,
            reply: chat.replies[chat.replies.length - 1]
        });
        
        res.json({
            message: 'Reply added successfully',
            chat
        });
    } catch (error) {
        console.error('Reply error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== KICK USER FROM CHAT (ADMIN ONLY) ==========
router.delete('/:chatId/kick/:userId', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        
        if (admin.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const chat = await Chat.findById(req.params.chatId);
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        if (chat.user.userId.toString() === req.params.userId) {
            chat.isActive = false;
            await chat.save();
            req.io.emit('chat-removed', chat._id);
            res.json({ message: 'Chat deactivated successfully' });
        } else {
            chat.replies = chat.replies.filter(
                reply => reply.user.userId.toString() !== req.params.userId
            );
            await chat.save();
            req.io.emit('reply-removed', {
                chatId: chat._id,
                userId: req.params.userId
            });
            res.json({ message: 'User kicked from chat' });
        }
    } catch (error) {
        console.error('Kick user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== DELETE CHAT (ADMIN ONLY) ==========
router.delete('/:chatId', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        
        if (admin.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const chat = await Chat.findById(req.params.chatId);
        
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        chat.isActive = false;
        await chat.save();
        
        req.io.emit('chat-removed', chat._id);
        
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;