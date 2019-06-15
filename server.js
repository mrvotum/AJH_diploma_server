const Koa = require('koa');
const koaBody = require('koa-body');
const uuid = require('uuid');
const koaStatic = require('koa-static');
const http = require('http'); // Чтобы использовать HTTP-интерфейсы в Node.js
const fs = require('fs'); // Для взаимодействия с файловой системой
const path = require('path'); // Для работы с путями файлов и каталогов
const Router = require('koa-router');


const app = new Koa();
const public = path.join(__dirname, '/public');
let imagesArr = [];
const imagesArrDel = [];

const filesFolder = './public';

app.use(
  koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
  })
);

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });

    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e; 
    }
  }
 
  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set(
        'Access-Control-Allow-Headers',
        ctx.request.get('Access-Control-Request-Headers')
       );
    }

    ctx.response.status = 204; // No content
  }
});

const router = new Router();

router.get('/imagesArr', async (ctx, next) => {
  imagesArr = [];
  fs.readdirSync(filesFolder).forEach(file => {
    imagesArr.push({id: uuid.v4(), name: file});
  });
  ctx.response.body = imagesArr;
});

router.delete('/imagesArr/:id', async (ctx, next) => {
  // имя удаляемого файла
  const index = ctx.originalUrl.split("/").pop();

  const filePath = `./public/${index}`; 
  fs.unlinkSync(filePath);

  ctx.response.status = 204;
});

app.use(router.routes()).use(router.allowedMethods());
http.createServer(app.callback()).listen(process.env.PORT || 7075);
app.use(koaStatic(public));

app.use(async ctx => {
  const { name } = ctx.request;
  const { file } = ctx.request.files;

  const link = await new Promise((resolve, reject) => { 
    const oldPath = file.path;
    const fileName = uuid.v4();
    const newPath = path.join(public, fileName);

    const callback = (error) => reject(error);

    const readStream = fs.createReadStream(oldPath);
    const writeStream = fs.createWriteStream(newPath);

    readStream.on('error', callback);
    writeStream.on('error', callback);

    readStream.on('close', () => {
      console.log('close');
      fs.unlink(oldPath, callback);
      resolve(fileName);
    });

    readStream.pipe(writeStream);
  });

  ctx.response.body = link;
});




// для тестовввв
const favoriteMes = [];
const messagesAr = [];

router.post('/addFavorite', async (ctx, next) => {
    favoriteMes.push({...ctx.request.body});
    ctx.response.status = 204;
    console.log('________________________________________');
    console.log(favoriteMes);
    // удаляем иконки
    const indexFav = favoriteMes.findIndex(({id}) => id === ctx.request.body.id);
    favoriteMes[indexFav].text = favoriteMes[indexFav].text.slice(0, -13);
    console.log(favoriteMes);


    const index = messagesAr.findIndex(({id}) => id === ctx.request.body.id);
    messagesAr[index].messageType = 'favorite';
});

router.post('/newMessage', async (ctx, next) => {
  messagesAr.push({...ctx.request.body});
  ctx.response.status = 204;
  console.log('________________________________________');
  console.log(messagesAr);
});

router.get('/showMessages', async (ctx, next) => {
  // return list of favoriteMes
  ctx.response.body = messagesAr;
});

router.get('/showFavorite', async (ctx, next) => {
  // return list of favoriteMes
  ctx.response.body = favoriteMes;
});

router.delete('/dellFavorite/:id', async (ctx, next) => {
    // remove contact by id
    // ctx.originalUrl.split("/").pop() -- id
    const index = favoriteMes.findIndex(({id}) => id === ctx.originalUrl.split("/").pop());
    const indexReg = messagesAr.findIndex(({id}) => id === ctx.originalUrl.split("/").pop());
    if (index !== -1) {
      favoriteMes.splice(index, 1);
      messagesAr[indexReg].messageType = 'regular';
      console.log('Deleted: ');
      console.log(favoriteMes);
      console.log(messagesAr);
    }
    ctx.response.status = 204;
});



router.put('/favoriteMes/:id', async (ctx, next) => {
  // edit contact by id
  const index = favoriteMes.findIndex(({id}) => id === ctx.originalUrl.split("/").pop());
  
  console.log(favoriteMes[index]);

  favoriteMes[index].id = ctx.request.body.id;
  favoriteMes[index].name = ctx.request.body.name;
  favoriteMes[index].description = ctx.request.body.description;
  favoriteMes[index].status = ctx.request.body.status;
  favoriteMes[index].created = ctx.request.body.created;

  ctx.response.status = 204;
});

// status

router.put('/addToFavorite/:id', async (ctx, next) => {
  // return list of favoriteMes
  const index = favoriteMes.findIndex(({id}) => id === ctx.originalUrl.split("/").pop());
  
  console.log(favoriteMes[index]);

  favoriteMes[index].status = ctx.request.body.status;
  favoriteMes[index].created = ctx.request.body.created;

  ctx.response.status = 204;
});
// для тестовввв

// const port = process.env.PORT || 7075;
// const server = http.createServer(app.callback()).listen(port);
