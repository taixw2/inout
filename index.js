// require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const logger = morgan("tiny");
const prisma = new PrismaClient();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

// 搜索商品
app.get("/api/search", async (req, res) => {
  const keyword = req.query.keyword;
  console.log("🚀 ~ app.get ~ keyword:", keyword);

  prisma.goods
    .findMany({
      where: {
        goodsName: {
          contains: keyword,
        },
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 搜索商品
app.get("/api/getGoodsByCode", async (req, res) => {
  const code = req.query.code;
  console.log("🚀 ~ app.get ~ code:", code);

  prisma.goods
    .findFirst({
      where: {
        goodsBarCode: code,
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 核对商品
app.post("/api/verify", async (req, res) => {
  const { goodsId, goodsActualNum, goodsBarCode, goodsRemark } = req.body;
  const updatePayload = {
    goodsActualNum: goodsActualNum,
    goodsCreateTime: new Date(),
    goodsCreateOpenid: req.headers["x-wx-openid"],
  };
  if (goodsBarCode) {
    updatePayload["goodsBarCode"] = goodsBarCode;
  }
  if (goodsRemark) {
    updatePayload["goodsRemark"] = goodsRemark;
  }
  prisma.goods
    .update({
      where: {
        id: goodsId,
      },
      data: updatePayload,
    })
    .then((data) => {
      res.send(data);
    });
});

// 确认商品
app.post("/api/confirm", async (req, res) => {
  const { goodsId, goodsActualNum, goodsBarCode, goodsRemark } = req.body;
  const updatePayload = {
    goodsConfirmOpenid: req.headers["x-wx-openid"],
    goodsConfirmTime: new Date(),
  };
  if (goodsActualNum) {
    updatePayload["goodsActualNum"] = goodsActualNum;
  }
  if (goodsBarCode) {
    updatePayload["goodsBarCode"] = goodsBarCode;
  }
  if (goodsRemark) {
    updatePayload["goodsRemark"] = goodsRemark;
  }

  prisma.goods
    .update({
      where: {
        id: goodsId,
      },
      data: updatePayload,
    })
    .then((data) => {
      res.send(data);
    });
});

const port = process.env.PORT || 80;

async function bootstrap() {
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
