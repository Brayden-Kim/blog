# 브레이든의 지식 저장소

이 저장소는 [브레이든의 지식 저장소](https://brayden.github.io/blog) 블로그의 소스 코드입니다.

## 구조

```
blog/
├── assets/
│   └── css/
│       └── style.css
├── index.html
├── about.html
├── posts.html
├── subscribe.html
└── post/
    └── [slug].html
```

## 로컬 개발

1. 저장소를 클론합니다:
```bash
git clone https://github.com/brayden/blog.git
cd blog
```

2. 로컬 서버를 실행합니다:
```bash
python -m http.server 8000
```

3. 브라우저에서 http://localhost:8000 으로 접속합니다.

## 배포

이 블로그는 GitHub Pages를 통해 자동으로 배포됩니다. main 브랜치에 변경사항을 푸시하면 자동으로 배포가 진행됩니다.

## 라이선스

이 블로그의 모든 콘텐츠는 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 라이선스에 따라 공유됩니다. 