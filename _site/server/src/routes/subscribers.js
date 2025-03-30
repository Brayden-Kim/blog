import express from 'express';
import Subscriber from '../models/Subscriber.js';

const router = express.Router();

// 구독자 목록 조회
router.get('/', async (req, res) => {
    try {
        const subscribers = await Subscriber.find({ isActive: true });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 새 구독자 추가
router.post('/', async (req, res) => {
    const subscriber = new Subscriber({
        email: req.body.email
    });

    try {
        const newSubscriber = await subscriber.save();
        // Socket.io를 통해 실시간 업데이트 전송
        req.app.get('io').emit('newSubscriber', newSubscriber);
        res.status(201).json(newSubscriber);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 구독 취소
router.delete('/:email', async (req, res) => {
    try {
        const subscriber = await Subscriber.findOne({ email: req.params.email });
        if (!subscriber) {
            return res.status(404).json({ message: '구독자를 찾을 수 없습니다.' });
        }
        
        subscriber.isActive = false;
        await subscriber.save();
        
        // Socket.io를 통해 실시간 업데이트 전송
        req.app.get('io').emit('subscriberUnsubscribed', req.params.email);
        res.json({ message: '구독이 취소되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 