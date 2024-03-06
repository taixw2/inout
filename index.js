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
  prisma.goods
    .findMany({
      where: {
        OR: [
          {
            goodsName: {
              contains: keyword,
            },
          },
          {
            storeInnerCode: {
              contains: keyword,
            },
          },
        ],
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 统计
app.get("/api/stat", async (req, res) => {
  const [initCount, allCount] = await Promise.all([
    prisma.goods.count({
      where: {
        goodsStatus: "init",
        goodsCreateOpenid: {
          not: "",
        },
      },
    }),
    prisma.goods.count({}),
  ]);

  return {
    initCount,
    allCount,
  };
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

// 通过 ID 查找商品
app.get("/api/getGoodsById", async (req, res) => {
  const id = req.query.id;
  console.log("🚀 ~ app.get ~ id:", id);
  prisma.goods
    .findFirst({
      where: {
        id: Number(id),
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 查找所有没有确认的商品
app.get("/api/getUnConfirmGoods", async (req, res) => {
  prisma.goods
    .findMany({
      where: {
        goodsConfirmOpenid: "",
        goodsStatus: "init",
        goodsCreateOpenid: {
          not: "",
        },
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 获取未处理的商品
app.get("/api/getUnHandleGoods", async (req, res) => {
  prisma.goods
    .findMany({
      where: {
        goodsActualNum: 0,
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 获取拒绝的商品
app.get("/api/getRefuseGoods", async (req, res) => {
  prisma.goods
    .findMany({
      where: {
        goodsStatus: "refuse",
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 核对商品
app.post("/api/verify", async (req, res) => {
  const {
    goodsId,
    goodsActualNum,
    goodsBarCode,
    goodsRemark,
    goodsRemarkPic,
    goodsPic,
    goodsInputPic,
    storeInnerCode,
  } = req.body;
  const updatePayload = {
    goodsActualNum: goodsActualNum,
    goodsCreateTime: new Date(),
    goodsCreateOpenid: req.headers["x-wx-openid"],
    goodsStatus: "init",
  };
  if (goodsBarCode) {
    updatePayload["goodsBarCode"] = goodsBarCode;
  }
  if (goodsRemarkPic) {
    updatePayload["goodsRemarkPic"] = goodsRemarkPic;
  }
  if (goodsRemark) {
    updatePayload["goodsRemark"] = goodsRemark;
  }
  if (goodsPic) {
    updatePayload["goodsPic"] = goodsPic;
  }
  if (storeInnerCode) {
    updatePayload["storeInnerCode"] = storeInnerCode;
  }
  if (goodsInputPic) {
    updatePayload["goodsInputPic"] = goodsInputPic;
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
  const { goodsId, goodsStatus, goodsRemark } = req.body;
  const updatePayload = {
    goodsConfirmOpenid: req.headers["x-wx-openid"],
    goodsConfirmTime: new Date(),
    goodsStatus: goodsStatus,
  };

  if (goodsRemark) {
    updatePayload["goodsRemark"] = goodsRemark;
  }

  prisma.goods
    .update({
      where: {
        id: Number(goodsId),
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
