interface AccountInfo {
  id: number;
  is_bot: boolean;
  username: string;
  first_name: string;
  last_name: string;
  language_code: string;
  type: string;
}

interface Update {
  message?: Message;
  callback_query?: CallbackQuery;
  callback_query_answer?: CallbackQueryAnswer;
}

type MessageType =
  'mention'
  | 'hashtag'
  | 'cashtag'
  | 'phone_number'
  | 'bot_command'
  | 'url'
  | 'email'
  | 'bold'
  | 'italic'
  | 'code'
  | 'pre'
  | 'text_link'
  | 'text_mention';

interface Message {
  message_id?: number;
  chat?: AccountInfo;
  from?: AccountInfo;
  date?: number;
  chat_id?: number;
  text?: string;
  reply_markup?: { inline_keyboard: any[] };
  entities?: Array<{
    offset?: number;
    length?: number;
    type?: MessageType;
  }>;
}

interface CallbackQuery {
  data: string;
  from: AccountInfo;
  id: number
  message: Message;
}

interface CallbackQueryAnswer {
  callback_query_id: number;
  text: string;
}

interface ServerOptions {
  port?: number;
}

interface Bot {
  constructor(server: TelegramServer, token?: string, info?: AccountInfo);

  server: TelegramServer;
  info: AccountInfo;
  token: string;
  queue: any[];
  lastUpdateId: number;

  sendRawMessage(payload);

  botMethods: {
    getme(): AccountInfo;
    getupdates: Update[];
    leavechat: {};
    getchat: AccountInfo;
    answercallbackquery: true;
    sendmessage;
    sendphoto;
    sendaudio;
    senddocument;
    sendvideo;
    sendvoice;
    sendvideonote;
    sendmediagroup;
    sendlocation;
    sendvenue;
    sendcontact;
    sendchataction;
  };

  resolveChat(chatId: number): Chat;

  queueUpdate(update: Update): void;

  handleBotCall(method, payload): void;
}

interface Chat {
  constructor(owner, info: AccountInfo);

  history: Update[];
  info: AccountInfo;

  invite(user: User | Bot): void;

  leave(userId: number);

  checkAccess(userId): boolean;

  notifyBots(update: Update): void;

  postMessage(author: User | Bot, message: Message);

  postCbQuery(user: User | Bot, message: Message, data): CallbackQuery;

  postCbQueryAnswer(user: User | Bot, cbQuery: CallbackQuery): CallbackQuery;
}

interface User {
  constructor(server: TelegramServer, info?);

  server: TelegramServer;
  info: AccountInfo;

  startBot(bot: Bot, startParams: string): Chat;

  createChat(options): Chat;
}

export class TelegramServer {
  constructor(options?: ServerOptions);

  createUser(info: AccountInfo): User;

  createBot(info: AccountInfo): Bot;

  createChat(owner: Bot | User, info: AccountInfo): Chat;

  createSandbox(startParams: string): { user: User, bot: Bot, chat: Chat };

  findChat(chatId: number): Chat;

  findChatByCbQuery(cbQuerId: number): Chat;

  getApiEndpoint(): string;

  start(): void;

  stop(): void;
}

interface NaiveStore {
  constructor();

  saveUser(user: User): User;

  saveBot(bot: Bot): Bot;

  saveChat(chat: Chat): Chat;

  findBotByToken(token: string): Bot;

  findChat(chatId: number): Chat;

  findChatByCbQuery(cbQueryId: number): Chat;
}
