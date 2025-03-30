import express from 'express';
import Subscriber from '../models/Subscriber.js';

const router = express.Router();

// 구독자 목록 조회 (관리자용)
router.get('/admin/subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: '구독자 목록을 불러오는데 실패했습니다.' });
    }
});

// 구독자 수 조회
router.get('/count', async (req, res) => {
    try {
        const count = await Subscriber.countDocuments({ isActive: true });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 구독자 통계 조회
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [total, today, monthly, inactive] = await Promise.all([
            Subscriber.countDocuments({ isActive: true }),
            Subscriber.countDocuments({ 
                subscribedAt: { $gte: startOfToday },
                isActive: true 
            }),
            Subscriber.countDocuments({ 
                subscribedAt: { $gte: startOfMonth },
                isActive: true 
            }),
            Subscriber.countDocuments({ isActive: false })
        ]);

        const unsubscribeRate = total > 0 ? 
            Math.round((inactive / (total + inactive)) * 100) : 0;

        res.json({
            total,
            today,
            monthly,
            unsubscribeRate
        });
    } catch (error) {
        res.status(500).json({ message: '통계를 불러오는데 실패했습니다.' });
    }
});

// 차트 데이터 조회
router.get('/chart-data', async (req, res) => {
    try {
        const { period } = req.query;
        const now = new Date();
        let startDate, interval, format;

        switch (period) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                interval = { $dayOfMonth: '$subscribedAt' };
                format = date => date.getDate() + '일';
                break;
            case 'weekly':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 28);
                interval = { $week: '$subscribedAt' };
                format = date => `${date.getMonth() + 1}월 ${date.getDate()}일`;
                break;
            case 'monthly':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                interval = { $month: '$subscribedAt' };
                format = date => `${date.getMonth() + 1}월`;
                break;
        }

        const [newSubscribers, unsubscribes] = await Promise.all([
            Subscriber.aggregate([
                {
                    $match: {
                        subscribedAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: interval,
                        count: { $sum: 1 },
                        date: { $first: '$subscribedAt' }
                    }
                },
                { $sort: { date: 1 } }
            ]),
            Subscriber.aggregate([
                {
                    $match: {
                        unsubscribedAt: { 
                            $gte: startDate,
                            $ne: null
                        }
                    }
                },
                {
                    $group: {
                        _id: interval,
                        count: { $sum: 1 },
                        date: { $first: '$unsubscribedAt' }
                    }
                },
                { $sort: { date: 1 } }
            ])
        ]);

        // 날짜 범위 생성
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= now) {
            dates.push(new Date(currentDate));
            if (period === 'daily') currentDate.setDate(currentDate.getDate() + 1);
            else if (period === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
            else currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // 데이터 포맷팅
        const labels = dates.map(format);
        const subscriberData = new Array(labels.length).fill(0);
        const unsubscribeData = new Array(labels.length).fill(0);

        newSubscribers.forEach(item => {
            const index = dates.findIndex(date => {
                if (period === 'daily') return date.getDate() === item._id;
                if (period === 'weekly') return date.getWeek() === item._id;
                return date.getMonth() + 1 === item._id;
            });
            if (index !== -1) subscriberData[index] = item.count;
        });

        unsubscribes.forEach(item => {
            const index = dates.findIndex(date => {
                if (period === 'daily') return date.getDate() === item._id;
                if (period === 'weekly') return date.getWeek() === item._id;
                return date.getMonth() + 1 === item._id;
            });
            if (index !== -1) unsubscribeData[index] = item.count;
        });

        res.json({
            labels,
            newSubscribers: subscriberData,
            unsubscribes: unsubscribeData
        });
    } catch (error) {
        res.status(500).json({ message: '차트 데이터를 불러오는데 실패했습니다.' });
    }
});

// 새 구독자 추가
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        // 이미 존재하는 이메일인지 확인
        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            if (existingSubscriber.isActive) {
                return res.status(400).json({ message: '이미 구독 중인 이메일입니다.' });
            } else {
                // 비활성 상태인 구독자를 다시 활성화
                existingSubscriber.isActive = true;
                existingSubscriber.subscribedAt = new Date();
                existingSubscriber.unsubscribedAt = null;
                await existingSubscriber.save();
                req.app.get('io').emit('newSubscriber', existingSubscriber);
                return res.json({ message: '구독이 재개되었습니다.' });
            }
        }

        // 새 구독자 생성
        const subscriber = new Subscriber({ email });
        await subscriber.save();
        
        req.app.get('io').emit('newSubscriber', subscriber);
        res.status(201).json({ message: '구독이 완료되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '구독 처리 중 오류가 발생했습니다.' });
    }
});

// 구독 취소
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        const subscriber = await Subscriber.findOne({ email });
        
        if (!subscriber) {
            return res.status(404).json({ message: '구독자를 찾을 수 없습니다.' });
        }

        if (!subscriber.isActive) {
            return res.status(400).json({ message: '이미 구독이 취소된 이메일입니다.' });
        }

        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        req.app.get('io').emit('unsubscribe', email);
        res.json({ message: '구독이 취소되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '구독 취소 중 오류가 발생했습니다.' });
    }
});

// 구독 상태 확인
router.get('/check/:email', async (req, res) => {
    try {
        const subscriber = await Subscriber.findOne({ email: req.params.email });
        res.json({ 
            isSubscribed: subscriber ? subscriber.isActive : false 
        });
    } catch (error) {
        res.status(500).json({ message: '구독 상태 확인 중 오류가 발생했습니다.' });
    }
});

export default router; 