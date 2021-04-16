const { User, Message,Upvote } = require('../models/models.js')
const jwt = require('jsonwebtoken')
const { Router } = require('express')
const router = Router()


router.get('/', async function (req, res){
    let messages = await Message.findAll({})

    let vote = await Upvote.findAndCountAll()  
try{
   if (vote.count ==0 ){
    let data = { messages , votes: vote.count}
    res.render('index.ejs', data)
    }

    else{
    let data = {messages, votes: vote.rows[vote.count-1].dataValues.score}
    res.render("index.ejs",data)

    }

}catch(err){
    let data ={messages, votes: 0}
    res.render('index.ejs',data)
}
})

router.get('/createUser', async function(req, res){
    res.render('createUser.ejs')
})

router.post('/createUser', async function(req, res){
    let { username, password } = req.body

    try {
    (async ()=>await User.create({
            username,
            password,
            role:"user"
        }) ) ()
    } catch (e) {
        console.log(e)
    }

    res.redirect('/login')
})

router.get('/login', function(req, res) {
    res.render('login')
})

router.post('/login', async function(req, res) {
    let {username, password} = req.body


    try {
        let user = await User.findOne({
            where: {
                username: username
            }
        })

    if (user && user.password === password) {
        let data = {
            username: username,
            role: user.role
        }

        let token = jwt.sign(data, "theSecret")
        res.cookie("token", token)
        res.redirect('/')
    } else {
        res.redirect('/error')
    }

} catch (e) {
    console.log(e)
}
})

router.get('/message', async function (req, res) {
    let token = req.cookies.token 

    if (token) {                                      // very bad, no verify, don't do this
        res.render('message')
    } else {
        res.render('login')
    }
})

router.post('/message', async function(req, res){
    let { token } = req.cookies
    let { content } = req.body

    if (token) {
        let payload = await jwt.verify(token, "theSecret")  
 
        let user = await User.findOne({
            where: {username: payload.username}
        })

        let msg = await Message.create({
            content:content,
            userId: user.id,
            upvote: null,
        })

        res.redirect('/')
    } else {
        res.redirect('/login')
    }
})

router.get('/error', function(req, res){
    res.render('error')
})

router.get("/upvote/:count",function(req,res){

    let count = req.params.count
    console.log(count)
    let intCount = parseInt(count)
    let intNextCount = intCount + 1
    if(intCount === 0){
        (async () => await Upvote.create({
            score: 1
        }))()
        res.redirect("/")
    }
    else {
        (async()=> await Upvote.update({ score: intNextCount},
            {where:{
                score: intCount
            }}))();

            res.redirect("/")
    }   
})

router.all('*', function(req, res){
    res.send('404 dude')
})

module.exports = router