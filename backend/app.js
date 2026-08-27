require('dotenv').config();

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

// 全局中间件
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);
// 解析 JSON 格式数据
app.use(express.json());
//解析表单数据的中间件（只能解析 application/x-www-form-urlencoded 格式的数据）
app.use(express.urlencoded({ extended: false }));

// 注册路由
const routes = require('./routes');
routes(app);

module.exports = app;
