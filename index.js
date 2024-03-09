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
      include: {
        barCodes: true,
      },
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
  const [initCount, allCount, pickCount] = await Promise.all([
    prisma.goods.count({
      where: {
        goodsStatus: "init",
        goodsCreateOpenid: {
          not: "",
        },
      },
    }),
    prisma.goods.count({}),
    prisma.goods.count({
      where: {
        goodsPick: true,
      },
    }),
  ]);

  res.send({
    initCount,
    allCount,
    pickCount,
  });
});

// 搜索商品
app.get("/api/getGoodsByCode", async (req, res) => {
  const code = req.query.code;
  const barCode = await prisma.barCode.findFirst({
    where: {
      goodsBarCode: code,
    },
  });

  if (!barCode || !barCode.goodsBarCode) {
    res.send(null);
  }

  const result = await prisma.goods.findFirst({
    include: {
      barCodes: true,
    },
    where: {
      id: barCode?.goodsId,
    },
  });

  res.send(result);
});

// 通过分类获取商品列表
app.get("/api/getGoodsByType", async (req, res) => {
  const type = req.query.type;
  prisma.goods
    .findMany({
      where: {
        goodsType: type,
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 拣货
app.post("/api/pick", async (req, res) => {
  const { goodsId, goodsBarCode, storeInnerCode, goodsRemark, goodsPick } = req.body;
  prisma.goods
    .update({
      where: {
        id: Number(goodsId),
      },
      data: {
        goodsPick,
        goodsBarCode,
        goodsRemark,
        storeInnerCode,
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
      include: {
        barCodes: true,
      },
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
    goodsPick: true,
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
  const {
    goodsId,
    goodsStatus,
    goodsRemark,
    goodsLocation,
    goodsRealName,
    storeInnerCode,
    goodsBarCode,
    goodsActualNum,
    goodsInputNum,
  } = req.body;
  const updatePayload = {
    goodsConfirmOpenid: req.headers["x-wx-openid"],
    goodsConfirmTime: new Date(),
    goodsStatus: goodsStatus,
  };
  if (goodsRemark) {
    updatePayload["goodsRemark"] = goodsRemark;
  }
  if (goodsLocation) {
    updatePayload["goodsLocation"] = goodsLocation;
  }
  if (goodsRealName) {
    updatePayload["goodsRealName"] = goodsRealName;
  }
  if (storeInnerCode) {
    updatePayload["storeInnerCode"] = storeInnerCode;
  }
  if (goodsBarCode) {
    updatePayload["goodsBarCode"] = goodsBarCode;
  }
  if (goodsActualNum) {
    updatePayload["goodsActualNum"] = goodsActualNum;
  }
  if (goodsInputNum) {
    updatePayload["goodsInputNum"] = goodsInputNum;
  }
  prisma.goods
    .update({
      include: {
        barCodes: true,
      },
      where: {
        id: Number(goodsId),
      },
      data: updatePayload,
    })
    .then((data) => {
      res.send(data);
    });
});

// 摆货
app.post("/api/pickup", async (req, res) => {
  const { goodsId, goodsLocation } = req.body;
  prisma.goods
    .update({
      where: {
        id: Number(goodsId),
      },
      data: {
        goodsLocation: goodsLocation,
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 添加条形码
app.post("/api/addBarCode", async (req, res) => {
  const { goodsId, goodsBarCode } = req.body;
  prisma.barCode
    .create({
      data: {
        goodsId,
        goodsBarCode,
      },
    })
    .then((data) => {
      res.send(data);
    });
});

// 删除条形码
app.post("/api/deleteBarCode", async (req, res) => {
  const { id } = req.body;
  prisma.barCode
    .delete({
      where: {
        id,
      },
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
