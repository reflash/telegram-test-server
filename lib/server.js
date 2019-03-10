const Koa = require('koa')
const koaBody = require('koa-body')
const koaRouter = require('koa-router')
const assert = require('http-assert')
const Store = require('./store')
const User = require('./models/user')
const Bot = require('./models/bot')
const Chat = require('./models/chat')
const Subject = require('rxjs').Subject
const timer = require('rxjs').timer
const take = require('rxjs/operators').take
const takeUntil = require('rxjs/operators').takeUntil

class TelegramServer {
  constructor (options) {
    this.options = { port: 4000, ...options }
    this.store = new Store()
    this.nextMessage$ = new Subject()
  }

  createUser (info) {
    const user = new User(this, info)
    return this.store.saveUser(user)
  }

  createBot (info) {
    const bot = new Bot(this, info)
    return this.store.saveBot(bot)
  }

  createChat (owner, info) {
    const chat = new Chat(owner, info)
    return this.store.saveChat(chat)
  }

  createSandbox (startParams) {
    const user = this.createUser()
    const bot = this.createBot()
    return {
      user,
      bot,
      chat: user.startBot(bot, startParams)
    }
  }

  findChat (chatId, botId) {
    return this.store.findChat(chatId, botId)
  }

  findChatByCbQuery (cbQueryId) {
    return this.store.findChatByCbQuery(cbQueryId)
  }

  getApiEndpoint () {
    return `http://${this.options.host || '0.0.0.0'}:${this.options.port}`
  }

  waitForNextMessages (count) {
    return this.nextMessage$.pipe(
      take(count || 1),
      takeUntil(timer(500))
    ).toPromise()
  }

  start () {
    const router = koaRouter()
    router.all('/bot:token/:method', async (ctx) => {
      try {
        const { token, method } = ctx.params
        const bot = this.store.findBotByToken(token)
        assert(bot, 401, 'Unauthorized')
        if (method !== 'getUpdates') {
          this.nextMessage$.next()
        }
        const result = await Promise.resolve(
          bot.handleBotCall(method.toLowerCase(), {
            ...ctx.request.query,
            ...ctx.request.body
          })
        )
        assert(result, 404, 'Not Found: method not found')
        ctx.body = {
          ok: true,
          result
        }
      } catch (err) {
        ctx.status = err.status || 500
        ctx.body = {
          ok: false,
          error_code: ctx.status,
          description: err.message
        }
      }
    })
    const app = new Koa()
    app.use(koaBody({ multipart: true }))
    app.use(router.routes())
    this.server = app.listen(this.options.port, this.options.host)
  }

  stop () {
    this.server && this.server.close()
  }
}

module.exports = TelegramServer
