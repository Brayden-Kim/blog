import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import postRoutes from './routes/postRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우터 설정
app.use('/api/posts', postRoutes);

// MongoDB 연결
console.log('MongoDB 연결 시도 중...');
mongoose.connect('mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB 연결 성공');
})
.catch((error) => {
  console.error('MongoDB 연결 실패:', error);
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
}); 