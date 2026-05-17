// State
const STORAGE_KEY = 'bloom_community_posts';
const defaultPosts = [
  { id: 1, question: "Is it normal to have brown discharge at the end of my period?",
    likes: 4, liked: false, time: "3 days ago",
    comments: [
      { author: "Anonymous", text: "Yes, totally normal — it's just older blood." },
      { author: "Anonymous", text: "Same here every month, don't worry!" },
    ], commentsOpen: false },
  { id: 2, question: "How can I relieve cramps without medicine?",
    likes: 12, liked: false, time: "1 week ago",
    comments: [{ author: "Anonymous", text: "A warm heating pad works wonders for me." }],
    commentsOpen: false },
];

let posts = loadPosts();
function loadPosts(){ try{ const r=localStorage.getItem(STORAGE_KEY); if(r) return JSON.parse(r);}catch(e){} return defaultPosts; }
/* localStorage is like a tiny hard drive inside your browser.
   it saves data even after you close the page
   loadPosts() tried to read saved posts. if none exist,
   it returns defaultPosts
   JSON.parse converts the saved text back into a JS object */
function savePosts(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));}catch(e){} }
/* JSON.stringify converts the posts array into text that can be saved
   localStorage.setItem saves it to your browser*/

// Anonymous avatar SVG (grey + white silhouette)
const avatarSVG = `
<svg viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
  <circle cx="21" cy="21" r="21" fill="#e9ebef"/>
  <circle cx="21" cy="17" r="6.5" fill="#ffffff"/>
  <path d="M7 38c2.2-6.5 8-10 14-10s11.8 3.5 14 10v4H7z" fill="#ffffff"/>
</svg>`;
/* this creates a GRAY CIRCLE (head) with a white inner circle
   (face) and a curved shape (body)
   it's used as a default profile picture for all anonymous users
   the backticks ' allow multi-line text */
// Navigation
const screens = {
  home: document.getElementById('screen-home'),
  community: document.getElementById('screen-community'),
};
document.querySelectorAll('[data-nav]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.nav));
});
/* document.querySelectorAll('[data-nav]') finds EVERY 
   button that has a data-nav attribute (all 5 nav buttons)
   forEach loops through each button and adds a click 
   listener 
   When clicked, it calls navigate() with the value from
   data-nav */
function navigate(target){
  document.querySelectorAll('.bottom-nav .nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.nav === target));
  if (target === 'community'){
    screens.home.classList.add('hidden');
    screens.community.classList.remove('hidden');
  } else {
    screens.community.classList.add('hidden');
    screens.home.classList.remove('hidden');
  }
  /* First, it updates the active style on the nav buttons
     Then it checks: if going to community, HIDE home
     screen and SHOW community screen
     Otherwise, do the opposite*/
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Period toggle
let periodActive = false;
const heroLabel = document.getElementById('heroLabel');
const heroTitle = document.getElementById('heroTitle');
const periodBtn = document.getElementById('periodToggle');
periodBtn.addEventListener('click', () => {
  periodActive = !periodActive;
  if (periodActive){ heroLabel.textContent='Period'; heroTitle.textContent='Day 1'; periodBtn.textContent='Period Ends'; }
  else { heroLabel.textContent='Next Period'; heroTitle.textContent='9 Days Left'; periodBtn.textContent='Period Starts'; }
});
/* periodActive = !periodActive FLIPS the value (false 
   becomes true, true becomes false)
   This is a "toggle" - each click switches between two 
   states
   It changes all three text elements: the label, the big 
   title, and the button itself */
// Submit new question
const askForm = document.getElementById('askForm');
const askInput = document.getElementById('askInput');
askForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = askInput.value.trim();
  if (!q) return;
  posts.unshift({ id: Date.now(), question: q, likes: 0, liked: false,
    time: "just now", comments: [], commentsOpen: false });
  askInput.value = '';
  savePosts(); renderFeed();
});
/* e.preventDefault() stops the form from actually 
   submitting to a server (we're handling it in JavaScript)
   askInput.value.trim() gets what the user typed and 
   removes extra spaces
   posts.unshift() adds the NEW question to the BEGINNING 
   of the posts array (so newest shows first)
   Date.now() creates a unique ID using the current 
   timestamp
   Then clears the input, saves to localStorage, and 
   re-renders the feed */

// Render feed
const feedEl = document.getElementById('feed');
function renderFeed(){
  feedEl.innerHTML = posts.map(p => `
    <article class="post" data-id="${p.id}">
      <div class="post-head">
        <div class="avatar">${avatarSVG}</div>
        <span class="post-author">Anonymous</span>
      </div>
      <h3 class="post-q">${escapeHtml(p.question)}</h3>
      <div class="post-meta">
        <button class="meta-btn ${p.liked ? 'liked' : ''}" data-action="like">
          <svg class="heart" viewBox="0 0 24 24" stroke-width="2">
            <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>
          </svg><span>${p.likes}</span>
        </button>
        <button class="meta-btn" data-action="toggle-comments">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 1-2z"/>
          </svg><span>${p.comments.length}</span>
        </button>
        <span class="post-time">${p.time}</span>
      </div>
      <div class="comments ${p.commentsOpen ? 'open' : ''}">
        ${p.comments.map(c => `
          <div class="comment">
            <div class="avatar">${avatarSVG}</div>
            <div class="comment-body">
              <div class="comment-author">${escapeHtml(c.author)}</div>
              ${escapeHtml(c.text)}
            </div>
          </div>`).join('')}
        <form class="comment-form" data-action="add-comment">
          <input class="comment-input" type="text" placeholder="Write a kind reply..." />
          <button class="comment-send" type="submit">Send</button>
        </form>
      </div>
    </article>`).join('');
}
/* .map() loops through every post and converts it into HTML
    ${p.question} inserts the question text into the HTML
    ${p.liked ? 'liked' : ''} adds class 'liked' if the 
    post is liked (makes heart pink)
    ${p.commentsOpen ? 'open' : ''} shows/hides comments
    .join('') combines all the HTML strings into one big 
    string
    escapeHtml() prevents users from injecting malicious 
    code (security)*/
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Feed actions
feedEl.addEventListener('click', (e) => {
  const article = e.target.closest('.post'); if (!article) return;
  const post = posts.find(p => p.id === Number(article.dataset.id)); if (!post) return;
  const actionEl = e.target.closest('[data-action]'); if (!actionEl) return;
  const action = actionEl.dataset.action;
  
  // FIX: We moved savePosts() and renderFeed() inside the specific conditions.
  // This stops the input field from breaking when clicked.
  if (action === 'like'){ 
    post.liked = !post.liked; 
    post.likes += post.liked ? 1 : -1; 
    savePosts(); 
    renderFeed();
  }
  else if (action === 'toggle-comments'){ 
    post.commentsOpen = !post.commentsOpen; 
    savePosts(); 
    renderFeed();
  }
});
/* e.target.closest('.post') finds the post container that 
   was clicked (even if you clicked a button inside it)
   .find() locates the actual post data by matching the ID
   For LIKE: flips liked status and adds/subtracts 1 from 
   likes count
   For COMMENTS: flips commentsOpen to show/hide comment 
   section
   Then saves and re-renders
 */

// Submit comment under anonymous post
feedEl.addEventListener('submit', function(event) {
  if (!event.target.matches('[data-action="add-comment"]')) return;
  event.preventDefault();

  var article = event.target.closest('.post');
  var currentPostId = Number(article.dataset.id);
  var targetPost = null;

  for (var i = 0; i < posts.length; i++) {
    if (posts[i].id === currentPostId) {
      targetPost = posts[i];
      break;
    }
  }

  if (!targetPost) return;

  var inputField = event.target.querySelector('.comment-input');
  var userText = inputField.value.trim();
  if (userText === "") return; 

  targetPost.comments.push({ 
    author: 'Anonymous', 
    text: userText 
  });
  
  targetPost.commentsOpen = true;

  savePosts(); 
  renderFeed();
});
/* First checks if the submitted form is a comment form 
   (not the ask question form)
   Finds which post the comment belongs to
   Gets the comment text from the input field
   .push() adds the new comment to the post's comments array
   Forces comments to be visible (commentsOpen = true) so 
   you can see your new comment
   Saves and re-renders
 */
renderFeed();