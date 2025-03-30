source "https://rubygems.org"

gem "github-pages", "~> 231", group: :jekyll_plugins
gem "webrick"

# Jekyll 플러그인
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# 마크다운 처리
gem "kramdown-parser-gfm"

# 코드 하이라이팅
gem "rouge", "~> 4.5.1"

# 개발 의존성
group :jekyll_plugins do
  gem "jekyll-admin", :git => "https://github.com/jekyll/jekyll-admin.git"
end 