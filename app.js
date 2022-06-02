const express = require("express");
const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Post = require("./models/post");
const Comment = require("./models/comment");
const app = express();
const router = express.Router();
app.set('view engine', 'ejs');
// 사용자 인증 미들웨어 불러오기
const authMiddlewares = require("./middlewares/authconfirm");

// Robo T3 DB 연결
mongoose.connect("mongodb://localhost/SPA_Expert_HOMEWORK", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

router.get("/", (req, res)=> {
    res.send("Homework")
});

// - nickname은 `최소 3자 이상, 알파벳 대소문자(a~z, A~Z), 숫자(0~9)`로 구성하기
// - 비밀번호는 `최소 4자 이상이며, 닉네임과 같은 값이 포함된 경우 회원가입에 실패`
const UserSchema = Joi.object({
    nickname: Joi.string().min(3).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    password: Joi.string().min(4).required(),
    confirmPassword: Joi.string().min(4).required(),
});

// 회원가입 API
router.post("/users", async (req, res) => {
try {    
    const { nickname, password, confirmPassword } = await UserSchema.validateAsync(req.body);

    if (password !== confirmPassword) {
        res.status(400).send({
            errorMessage: "패드워드가 패스워드 확인란과 동일하지 않습니다."
        });
        return;
    }

    if (nickname === password) {
        res.status(400).send({
            errorMessage: "닉네임과 비밀번호가 동일합니다"
        })
        return;
    }

    const existUsers = await User.find({ nickname });

    if (existUsers.length) {
        res.status(400).send({
            errorMessage: "중복된 닉네임입니다."
        });
        return;
    }

    const user = new User({ nickname, password });
    await user.save();

    res.status(201).send({});
} catch (err) {
    console.log(err);
    res.status(400).send({});
}
});

// 로그인 기능
router.post("/auth", async (req, res) => {
try{
    const { nickname, password } = req.body;

    const name = await User.findOne({ nickname });
    
    if(!name || password !== name.password){
        res.status(400).send({
            errorMessage: "닉네임 또는 패스워드를 확인해주세요"
        });
        // console.log(name.password);
        return;
    }
    res.send({
        token: jwt.sign({ userId: name.userId }, "homework-sercet-key"),
    });
} catch (err) {
    console.error(err);
    res.status(400).send({})
}
});

// 로그인 검사
router.get("/users/me", authMiddlewares, async (req, res) =>{
    res.send({ user: req.locals.user });
});

// 게시글 전체 조회
router.get("/posts", async (req, res) => {
    const posts = await Post.find({}).sort({date: '-1'});
    // res.render('list.ejs', {posts,});
    res.send({ posts, });
});

// 게시글 작성
router.post("/posts", async (req,res) => {
    const { postId, password, name, title, content } = req.body;
    
    const createdPosts = await Post.create({ postId, password, name, title, content });
    // const post = new Post({ postId, password, name, title, content });
    // await post.save();
    // res.render('write.ejs', { posts: createdPosts })
    res.send({ posts: createdPosts });
});

// 게시글 상세 조회
router.get("/posts/:postId", async (req, res) => {
    const { postId } = req.params;
    const postsId  = await Post.findOne({postId});
    
    res.send({ postsId });
});

// 게시글 수정 
router.put("/posts/:postId", async (req, res) => {
    const { postId } = req.params;
    const { title, content, password } = req.body;

    const pass = await Post.findOne({ postId, password });

    if ( !pass ) {
        res.status(400).send({ errorMessage: "비밀번호가 틀렸습니다." });
        return;
    } else {
        await Post.updateOne({ postId: Number(postId) }, { $set: { title, content } });
    };

    res.send({ success: true });
});

// 게시글 삭제
router.delete("/posts/:postId", async (req, res) => {
    const { postId } = req.params;
    const { password } = req.body;
    const pass = await Post.findOne({ postId, password });

    if ( !pass ) {
        res.status(400).send({ errorMessage: "비밀번호가 틀렸습니다." }); 
        return;   
    } else {
        await Post.deleteOne({ postId: postId });
    }
    res.send({ success: true });
});

// 댓글 전체 목록 조회
router.get("/posts/:postId/comments", async (req,res) => {
    const { postId } = req.params;
    const comments = await Comment.findOne({ postId }).sort({date: '-1'});
    
    res.send({ comments });
});

// 댓글 작성
router.post("/posts/:postId/comments", authMiddlewares, async (req, res) => {
    const { userId } = res.locals.user;
    const { postId } = req.params;
    const { content } = req.body;
    
    if(!content){
        console.log(content)
        res.status(400).send({errorMessage: "댓글 내용을 입력해주세요"}) 
        return;
    }
    
    const existUser = await Comment.findOne({ userId, postId });
    if(!existUser){
        await Comment.create({ userId, postId, content });
    }
    // const createdComment = new Comment({ userId, postId, content, });
    // await createdComment.save();
    res.send({ });
});

// 댓글 수정
router.put("/posts/:postId/comments", authMiddlewares, async (req, res) => {
    const { userId } = res.locals.user;
    const { postId } = req.params;
    const { content } = req.body;

    const existComment = await Comment.findOne({ userId, postId });

    if (existComment) {
        await Comment.updateOne({ userId }, { $set: { content } });
    }

    res.send({ });
});
// 댓글 삭제
router.delete("/posts/:postId/comments", authMiddlewares, async (req, res) => {
    const { userId } = res.locals.user;
    const { postId } = req.params;

    const existComment = await Comment.findOne({ userId, postId });

    if (existComment) {
        await Comment.deleteOne({});
    }
    res.send({ });
});

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use('/', router);
// app.use('/list', router);
// app.use('/write', router);
// app.use(express.static("views"));

app.listen(8080, () => {
    console.log("서버가 요청을 받을 준비가 됐어요.");
});