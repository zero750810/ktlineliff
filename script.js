// Supabase 初始化
const supabaseUrl = 'https://thzfluofcwgkwooydecd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoemZsdW9mY3dna3dvb3lkZWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3Nzg3MzAsImV4cCI6MjAyNTM1NDczMH0.R9SkcU1J5ohlZKxZ76y_oP8k1TF5bX0FxOQURX2JjC4';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
// LIFF 初始化
//liff.init({ liffId: '2006746791-q2Dj1Mgw' }).then(() => {
 //  if (!liff.isLoggedIn()) {
 //       console.log("not logged in");
 //       liff.login();
 //   } else {
 //       console.log("logged in");
 //       checkJWT();
 //   }
//}).catch(console.error);
checkJWT();
// 檢查 JWT
async function checkJWT() {
    const jwt = localStorage.getItem('jwt');
    const isValid = await validateJWT(jwt);
    if (!jwt || !isValid) {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('loginButton').addEventListener('click', loginWithGoogle);
    } else {
        document.getElementById('reportSection').style.display = 'block';
        fetchData(jwt);
    }
}

// 驗證 JWT 是否有效
async function validateJWT(jwt) {
    if (!jwt) return false;
    const { data, error } = await supabase.auth.getUser(jwt);
    return data ? true : false;
}

// 使用 Google OAuth 登入
async function loginWithGoogle() {
    const { user, session, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin, // 自動適配當前網站
          },
    });
    if (session) {
        localStorage.setItem('jwt', session.access_token);
        location.reload();
    }
}

// 獲取回報資料
async function fetchData(jwt) {
    const user = await supabase.auth.getUser(jwt);
    const mail = user.data.email;
    const { data: teacher } = await supabase
        .from('teacher')
        .select('id')
        .eq('mail', mail)
        .single();
    const teacherId = teacher.id;

    const today = new Date().toISOString().split('T')[0];
    const { data: events } = await supabase
        .from('event_view')
        .select('*')
        .eq('teacherid', teacherId)
        .eq('date', today);

    console.log('今日回報資料:', events);
}

// 簽名功能
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;

canvas.addEventListener('mousedown', () => (drawing = true));
canvas.addEventListener('mouseup', () => (drawing = false));
canvas.addEventListener('mousemove', draw);

function draw(event) {
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
}

// 清除簽名
document.getElementById('clearButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 提交回報
document.getElementById('submitButton').addEventListener('click', async () => {
    const signatureUrl = canvas.toDataURL('image/png');
    const { data, error } = await supabase.storage
        .from('signatures')
        .upload(`signature-${Date.now()}.png`, signatureUrl);

    console.log('簽名上傳成功:', data);
});
