async function loadPosts() {
  const res = await fetch('/api/posts');
  const posts = await res.json();
  const list = document.getElementById('postList');
  list.innerHTML = '';

  posts.reverse().forEach(post => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <small>投稿日: ${new Date(post.createdAt).toLocaleString()}</small><br>
      <button onclick="likePost(${post.id})">👍 ${post.likes}</button>
      <div>
        ${post.replies.map(r => `
          <div class="reply">
            <p>${r.content}</p>
            <small>返信日時: ${new Date(r.createdAt).toLocaleString()}</small><br>
            <button onclick="likeReply(${post.id}, ${r.id})">👍 ${r.likes}</button>
          </div>
        `).join('')}
        <form onsubmit="replyToPost(event, ${post.id})">
          <input type="text" name="reply" placeholder="返信を入力..." required />
          <button type="submit">返信</button>
        </form>
      </div>
    `;
    list.appendChild(div);
  });
}

document.getElementById('newPostForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();

  if (!title || !content) return alert("スレタイと本文は必須です");

  await fetch('/api/posts', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ title, content })
  });

  e.target.reset();
  loadPosts();
});

async function likePost(id) {
  await fetch(`/api/posts/${id}/like`, { method: 'POST' });
  loadPosts();
}

async function likeReply(postId, replyId) {
  await fetch(`/api/posts/${postId}/replies/${replyId}/like`, { method: 'POST' });
  loadPosts();
}

async function replyToPost(e, postId) {
  e.preventDefault();
  const reply = e.target.reply.value.trim();
  if (!reply) return;

  await fetch(`/api/posts/${postId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: reply })
  });

  e.target.reset();
  loadPosts();
}

// 初回読み込み
loadPosts();
