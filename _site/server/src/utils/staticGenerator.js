import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import Post from '../models/Post.js';

// 정적 사이트 생성 함수
async function generateStaticSite() {
    try {
        // 블로그 디렉토리 경로
        const blogDir = path.join(__dirname, '../../../blog');
        const postDir = path.join(blogDir, 'post');

        // 디렉토리 생성
        await fs.mkdir(postDir, { recursive: true });

        // 모든 공개된 포스트 가져오기
        const posts = await Post.find({ status: 'published' }).sort({ createdAt: -1 });

        // 포스트 목록 페이지 생성
        const postsList = posts.map(post => ({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            category: post.category,
            createdAt: post.createdAt
        }));

        // 포스트 상세 페이지 생성
        for (const post of posts) {
            const postContent = marked(post.content);
            const postHtml = generatePostHtml(post, postContent);
            await fs.writeFile(
                path.join(postDir, `${post.slug}.html`),
                postHtml
            );
        }

        // 메인 페이지 업데이트
        const mainHtml = generateMainHtml(postsList);
        await fs.writeFile(
            path.join(blogDir, 'index.html'),
            mainHtml
        );

        // 글 목록 페이지 업데이트
        const postsHtml = generatePostsHtml(postsList);
        await fs.writeFile(
            path.join(blogDir, 'posts.html'),
            postsHtml
        );

        console.log('정적 사이트 생성 완료');
    } catch (error) {
        console.error('정적 사이트 생성 중 오류:', error);
        throw error;
    }
}

// 포스트 상세 페이지 HTML 생성
function generatePostHtml(post, content) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - 브레이든의 지식 저장소</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <header class="site-header">
        <div class="container">
            <h1 class="site-title"><a href="/">브레이든의 지식 저장소</a></h1>
            <nav class="site-nav">
                <a href="/">홈</a>
                <a href="/posts.html">글 목록</a>
                <a href="/about.html">소개</a>
                <a href="/subscribe.html">구독하기</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <article class="post">
            <header class="post-header">
                <h1 class="post-title">${post.title}</h1>
                <div class="post-meta">
                    <span class="post-date">${new Date(post.createdAt).toLocaleDateString()}</span>
                    <span class="post-category">${post.category}</span>
                </div>
            </header>

            <div class="post-content">
                ${content}
            </div>
        </article>
    </main>

    <footer class="site-footer">
        <div class="container">
            <p>&copy; 2024 브레이든의 지식 저장소. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

// 메인 페이지 HTML 생성
function generateMainHtml(posts) {
    const latestPosts = posts.slice(0, 6);
    const postsHtml = latestPosts.map(post => `
        <article class="post-card">
            <h2><a href="/post/${post.slug}.html">${post.title}</a></h2>
            <div class="post-meta">
                <span class="post-date">${new Date(post.createdAt).toLocaleDateString()}</span>
                <span class="post-category">${post.category}</span>
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="/post/${post.slug}.html" class="read-more">자세히 보기</a>
        </article>
    `).join('');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>브레이든의 지식 저장소</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <header class="site-header">
        <div class="container">
            <h1 class="site-title"><a href="/">브레이든의 지식 저장소</a></h1>
            <nav class="site-nav">
                <a href="/">홈</a>
                <a href="/posts.html">글 목록</a>
                <a href="/about.html">소개</a>
                <a href="/subscribe.html">구독하기</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <section class="hero">
            <h2>지식을 공유하고 성장하세요</h2>
            <p>프로그래밍, 기술, 학습에 관한 다양한 지식과 경험을 공유합니다.</p>
            <a href="/subscribe.html" class="cta-button">구독하기</a>
        </section>

        <section class="latest-posts">
            <h2>최신 글</h2>
            <div class="posts-grid">
                ${postsHtml}
            </div>
        </section>
    </main>

    <footer class="site-footer">
        <div class="container">
            <p>&copy; 2024 브레이든의 지식 저장소. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

// 글 목록 페이지 HTML 생성
function generatePostsHtml(posts) {
    const postsHtml = posts.map(post => `
        <article class="post-card">
            <h2><a href="/post/${post.slug}.html">${post.title}</a></h2>
            <div class="post-meta">
                <span class="post-date">${new Date(post.createdAt).toLocaleDateString()}</span>
                <span class="post-category">${post.category}</span>
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="/post/${post.slug}.html" class="read-more">자세히 보기</a>
        </article>
    `).join('');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>글 목록 - 브레이든의 지식 저장소</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <header class="site-header">
        <div class="container">
            <h1 class="site-title"><a href="/">브레이든의 지식 저장소</a></h1>
            <nav class="site-nav">
                <a href="/">홈</a>
                <a href="/posts.html">글 목록</a>
                <a href="/about.html">소개</a>
                <a href="/subscribe.html">구독하기</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <div class="posts-header">
            <h1>모든 글</h1>
        </div>

        <div class="posts-grid">
            ${postsHtml}
        </div>
    </main>

    <footer class="site-footer">
        <div class="container">
            <p>&copy; 2024 브레이든의 지식 저장소. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

export { generateStaticSite }; 