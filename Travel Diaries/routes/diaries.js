const express = require('express');
const router = express.Router();
const Diary = require('../models/diary');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/diaries', authenticateToken, async (req, res) => {
    try {
        const diaries = await Diary.find().populate('author', 'username');
        res.json(diaries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching diaries' });
    }
});
// Create a new diary
router.post('/diaries', authenticateToken, async (req, res) => {
    try {
        const { title, entries, imageUrl } = req.body;

        const diary = new Diary({
            title,
            entries,
            author: req.user.userId,
            imageUrl
        });

        await diary.save();
        res.status(201).json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error creating diary' });
    }
});

// Add an entry to an existing diary
router.post('/diaries/:id/entries', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { text, videoUrl, imageUrl } = req.body;

        const diary = await Diary.findById(id);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const newEntry = {
            text,
            videoUrl,
            imageUrl
        };

        diary.entries.push(newEntry);
        diary.updatedAt = Date.now();

        await diary.save();
        res.status(201).json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error adding entry to diary' });
    }
});

// Update an existing entry in a diary
router.put('/diaries/:diaryId/entries/:entryId', authenticateToken, async (req, res) => {
    try {
        const { diaryId, entryId } = req.params;
        const { text, videoUrl, imageUrl } = req.body;

        const diary = await Diary.findById(diaryId);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const entry = diary.entries.id(entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        entry.text = text || entry.text;
        entry.videoUrl = videoUrl || entry.videoUrl;
        entry.imageUrl = imageUrl || entry.imageUrl;
        entry.updatedAt = Date.now();

        await diary.save();
        res.json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error updating entry in diary' });
    }
});

// Delete an entry from a diary
router.delete('/diaries/:diaryId/entries/:entryId', authenticateToken, async (req, res) => {
    try {
        const { diaryId, entryId } = req.params;

        const diary = await Diary.findById(diaryId);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const entry = diary.entries.id(entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        entry.remove();
        diary.updatedAt = Date.now();

        await diary.save();
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting entry from diary' });
    }
});

// Add a like to a diary
router.post('/diaries/:id/like', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const diary = await Diary.findById(id);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        if (!diary.likes.includes(req.user.userId)) {
            diary.likes.push(req.user.userId);
            diary.likesCount += 1;
        } else {
            return res.status(400).json({ message: 'User already liked this diary' });
        }

        await diary.save();
        res.json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error liking diary' });
    }
});

// Remove a like from a diary
router.post('/diaries/:id/unlike', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const diary = await Diary.findById(id);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const index = diary.likes.indexOf(req.user.userId);
        if (index > -1) {
            diary.likes.splice(index, 1);
            diary.likesCount -= 1;
        } else {
            return res.status(400).json({ message: 'User has not liked this diary' });
        }

        await diary.save();
        res.json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error unliking diary' });
    }
});

// Add a like to an entry
router.post('/diaries/:diaryId/entries/:entryId/like', authenticateToken, async (req, res) => {
    try {
        const { diaryId, entryId } = req.params;

        const diary = await Diary.findById(diaryId);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const entry = diary.entries.id(entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        if (!entry.likes.includes(req.user.userId)) {
            entry.likes.push(req.user.userId);
            entry.likesCount += 1;
        } else {
            return res.status(400).json({ message: 'User already liked this entry' });
        }

        await diary.save();
        res.json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error liking entry' });
    }
});

// Remove a like from an entry
router.post('/diaries/:diaryId/entries/:entryId/unlike', authenticateToken, async (req, res) => {
    try {
        const { diaryId, entryId } = req.params;

        const diary = await Diary.findById(diaryId);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const entry = diary.entries.id(entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        const index = entry.likes.indexOf(req.user.userId);
        if (index > -1) {
            entry.likes.splice(index, 1);
            entry.likesCount -= 1;
        } else {
            return res.status(400).json({ message: 'User has not liked this entry' });
        }

        await diary.save();
        res.json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error unliking entry' });
    }
});

// Add a comment to a diary
router.post('/diaries/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        const diary = await Diary.findById(id);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const newComment = {
            text,
            author: req.user.userId
        };

        diary.comments.push(newComment);
        diary.updatedAt = Date.now();

        await diary.save();
        res.status(201).json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment to diary' });
    }
});

// Add a comment to an entry
router.post('/diaries/:diaryId/entries/:entryId/comments', authenticateToken, async (req, res) => {
    try {
        const { diaryId, entryId } = req.params;
        const { text } = req.body;

        const diary = await Diary.findById(diaryId);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const entry = diary.entries.id(entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        const newComment = {
            text,
            author: req.user.userId
        };

        entry.comments.push(newComment);
        entry.updatedAt = Date.now();

        await diary.save();
        res.status(201).json(diary);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment to entry' });
    }
});

// Delete a comment from a diary
router.delete('/diaries/:diaryId/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const { diaryId, commentId } = req.params;

        const diary = await Diary.findById(diaryId);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const comment = diary.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.remove();
        diary.updatedAt = Date.now();

        await diary.save();
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment from diary' });
    }
});
router.get('/user/diaries', authenticateToken, async (req, res) => {
    try {
        const diaries = await Diary.find({ author: req.user.userId }).populate('author', 'username');
        res.json(diaries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user diaries' });
    }
});
// Delete a comment from an entry
router.delete('/diaries/:diaryId/entries/:entryId/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const { diaryId, entryId, commentId } = req.params;

        const diary = await Diary.findById(diaryId);

        if (!diary) {
            return res.status(404).json({ message: 'Diary not found' });
        }

        const entry = diary.entries.id(entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        const comment = entry.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.remove();
        entry.updatedAt = Date.now();

        await diary.save();
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment from entry' });
    }
});

module.exports = router;
