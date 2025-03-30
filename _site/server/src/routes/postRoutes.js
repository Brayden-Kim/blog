import express from 'express';
import Post from '../models/Post.js';
import { generateStaticSite } from '../utils/staticGenerator.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = express.Router();
const GITHUB_REPO_PATH = process.env.GITHUB_REPO_PATH || '../blog';

// GitHub에 변경사항 푸시
async function pushToGitHub() {
    try {
        await execAsync(`cd ${GITHUB_REPO_PATH} && git add . && git commit -m "블로그 컨텐츠 업데이트" && git push`);
        console.log('GitHub에 성공적으로 푸시되었습니다.');
    } catch (error) {
        console.error('GitHub 푸시 중 오류 발생:', error);
        throw error;
    }
}

// 모든 게시글 목록 조회 (관리자용)
router.get('/admin/posts', async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .select('-content'); // 내용은 제외하고 조회
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: '게시글 목록을 불러오는데 실패했습니다.' });
    }
});

// 게시글 상세 조회
router.get('/admin/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: '게시글을 불러오는데 실패했습니다.' });
    }
});

// 새 게시글 작성
router.post('/admin/posts', async (req, res) => {
    try {
        const {
            title,
            content,
            excerpt,
            category,
            tags,
            isSubscriberOnly,
            status,
            coverImage
        } = req.body;

        const post = new Post({
            title,
            content,
            excerpt,
            category,
            tags: tags || [],
            isSubscriberOnly: isSubscriberOnly || false,
            status: status || 'draft',
            coverImage: coverImage || null
        });

        if (status === 'published') {
            post.publishedAt = new Date();
        }

        await post.save();
        
        // 실시간 업데이트 전송
        req.app.get('io').emit('newPost', {
            ...post.toJSON(),
            content: undefined
        });

        // 정적 사이트 생성 및 GitHub 배포
        if (status === 'published') {
            const siteGenerated = await generateStaticSite();
            if (siteGenerated) {
                await pushToGitHub();
            }
        }

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: '게시글 작성에 실패했습니다.' });
    }
});

// 게시글 수정
router.put('/admin/posts/:id', async (req, res) => {
    try {
        const {
            title,
            content,
            excerpt,
            category,
            tags,
            isSubscriberOnly,
            status,
            coverImage
        } = req.body;

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        const wasPublished = post.status === 'published';
        const isPublishing = !wasPublished && status === 'published';

        // 필드 업데이트
        post.title = title;
        post.content = content;
        post.excerpt = excerpt;
        post.category = category;
        post.tags = tags || [];
        post.isSubscriberOnly = isSubscriberOnly || false;
        post.coverImage = coverImage || post.coverImage;

        // 발행 상태 변경 처리
        if (isPublishing) {
            post.publishedAt = new Date();
        }
        post.status = status;

        await post.save();

        // 실시간 업데이트 전송
        req.app.get('io').emit('updatePost', {
            ...post.toJSON(),
            content: undefined
        });

        // 정적 사이트 생성 및 GitHub 배포
        if (status === 'published' || wasPublished) {
            const siteGenerated = await generateStaticSite();
            if (siteGenerated) {
                await pushToGitHub();
            }
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: '게시글 수정에 실패했습니다.' });
    }
});

// 게시글 삭제
router.delete('/admin/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 실시간 업데이트 전송
        req.app.get('io').emit('deletePost', req.params.id);

        // 정적 사이트 생성 및 GitHub 배포
        if (post.status === 'published') {
            const siteGenerated = await generateStaticSite();
            if (siteGenerated) {
                await pushToGitHub();
            }
        }

        res.json({ message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '게시글 삭제에 실패했습니다.' });
    }
});

// 게시글 통계
router.get('/admin/posts/stats', async (req, res) => {
    try {
        const [total, published, draft, subscriberOnly] = await Promise.all([
            Post.countDocuments(),
            Post.countDocuments({ status: 'published' }),
            Post.countDocuments({ status: 'draft' }),
            Post.countDocuments({ isSubscriberOnly: true, status: 'published' })
        ]);

        const categories = await Post.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            total,
            published,
            draft,
            subscriberOnly,
            categories
        });
    } catch (error) {
        res.status(500).json({ message: '통계 조회에 실패했습니다.' });
    }
});

// 수동으로 정적 사이트 생성 및 배포
router.post('/admin/deploy', async (req, res) => {
    try {
        const siteGenerated = await generateStaticSite();
        if (!siteGenerated) {
            return res.status(500).json({ message: '정적 사이트 생성에 실패했습니다.' });
        }

        const pushed = await pushToGitHub();
        if (!pushed) {
            return res.status(500).json({ message: 'GitHub 배포에 실패했습니다.' });
        }

        res.json({ message: '사이트가 성공적으로 배포되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '사이트 배포에 실패했습니다.' });
    }
});

export default router; 