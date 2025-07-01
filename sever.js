// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// ミドルウェア
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // index.html などを返す

// データファイルのパス
const DATA_FILE = path.join(__dirname, 'posts.json');

// 投稿データの読み込み（初期化）
let posts = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    posts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('JSON読み込みエラー:', e);
    posts = [];
  }
}

// 24時間前の投稿を削除する関数
function cleanOldPosts() {
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000; // 24時間前の時刻（ミリ秒）
  posts = posts.filter(post => new Date(post.createdAt).getTime() >= cutoff);
  posts.forEach(post => {
    post.replies = post.replies.filter(reply => new Date(reply.createdAt).getTime() >= cutoff);
  });
  savePosts();
}

// 投稿保存関数
function savePosts() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// 定期的に古い投稿を削除（1時間ごと）
setInterval(cleanOldPosts, 60 * 60 * 1000);

// API: 全投稿取得
app.get('/api/posts', (req, res) => {
  cleanOldPosts();
  res.json(posts);
});

// API: 新規スレッド投稿
app.post('/api/posts', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'タイトルと本文は必須です' });

  const newPost = {
    id: posts.length + 1,
    title,
    content,
    createdAt: new Date().toISOString(),
    likes: 0,
    replies: []
  };
  posts.push(newPost);
  savePosts();
  res.status(201).json(newPost);
});

// API: スレッドに返信追加
app.post('/api/posts/:id/reply', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'スレッドが見つかりません' });

  const { content } = req.body;
  if (!content) return res.status(400).json({ error: '返信内容は必須です' });

  const newReply = {
    id: post.replies.length + 1,
    content,
    createdAt: new Date().toISOString(),
    likes: 0
  };
  post.replies.push(newReply);
  savePosts();
  res.status(201).json(newReply);
});

// API: スレッドにいいね
app.post('/api/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'スレッドが見つかりません' });

  post.likes++;
  savePosts();
  res.json({ likes: post.likes });
});

// API: 返信にいいね
app.post('/api/posts/:id/replies/:replyId/like', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'スレッドが見つかりません' });

  const reply = post.replies.find(r => r.id === parseInt(req.params.replyId));
  if (!reply) return res.status(404).json({ error: '返信が見つかりません' });

  reply.likes++;
  savePosts();
  res.json({ likes: reply.likes });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});