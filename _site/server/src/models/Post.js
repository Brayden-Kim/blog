import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    excerpt: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        default: '브레이든'
    },
    category: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    isSubscriberOnly: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    publishedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    coverImage: {
        url: String,
        alt: String
    },
    viewCount: {
        type: Number,
        default: 0
    }
});

// 슬러그 생성을 위한 미들웨어
postSchema.pre('save', function(next) {
    if (!this.isModified('title')) {
        return next();
    }

    this.slug = this.title
        .toLowerCase()
        .replace(/[^가-힣a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    next();
});

// 업데이트 시간 자동 갱신
postSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Post', postSchema); 