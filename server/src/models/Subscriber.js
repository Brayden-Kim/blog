import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    unsubscribedAt: {
        type: Date,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    accessCount: {
        type: Number,
        default: 0
    }
});

// 주차 계산을 위한 헬퍼 메서드
Date.prototype.getWeek = function() {
    const firstDayOfYear = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7);
};

export default mongoose.model('Subscriber', subscriberSchema); 