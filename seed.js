const { PrismaClient } = require("@prisma/client");
const { customAlphabet } = require("nanoid");
const data = require("./data.js");

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 2);
const nanoid2 = customAlphabet("1234567890", 6);

const prisma = new PrismaClient();
async function main() {
  // const ab = Object.keys(data).flatMap((goodsType) => {
  //   return data[goodsType].map((item) => ({
  //     goodsType: goodsType,
  //     goodsName: item["商品名称"] ?? "无商品名称",
  //     goodsSpec: item["规格"],
  //     goodsPurchasePrice: item["单价"] || 0,
  //     goodsPurchaseNum: item["数量"] || 0,
  //     goodsActualNum: item["已拿货"] || 0,
  //     goodsTotalPrice: item["金额"] || 0,
  //     goodsActualPrice: 0,
  //     goodsBarCode: item["条形码(upc/ean等)"]?.toString(),
  //     goodsRemark: "",
  //     goodsStatus: "init",
  //     goodsInnerCode: nanoid().toUpperCase() + nanoid2(),
  //     goodsAbnormal: !item["单价"],
  //     goodsCreateOpenid: "",
  //     goodsConfirmOpenid: "",
  //     goodsRemarkPic: "",
  //     storeInnerCode: typeof item["序号"] === "string" ? item["序号"] : null,
  //   }));
  // });
  // const ab = Object.keys(data).flatMap((goodsType) => {
  //   return data[goodsType]
  //     .map((item) => ({
  //       goodsType: goodsType,
  //       goodsName: item["商品名称"] ?? "无商品名称",
  //       goodsSpec: item["规格"],
  //       goodsPurchasePrice: item["单价"] || 0,
  //       goodsPurchaseNum: item["数量"] || 0,
  //       goodsActualNum: item["拿货"] || 0,
  //       goodsTotalPrice: item["金额"] || 0,
  //       goodsActualPrice: 0,
  //       goodsBarCode: item["条形码(upc/ean等)"]?.toString(),
  //       goodsRemark: "",
  //       goodsStatus: "init",
  //       goodsInnerCode: nanoid().toUpperCase() + nanoid2(),
  //       goodsAbnormal: !item["单价"],
  //       goodsCreateOpenid: "",
  //       goodsConfirmOpenid: "",
  //       goodsRemarkPic: "",
  //       storeInnerCode: typeof item["序号"] === "string" ? item["序号"] : null,
  //     }))
  //     .filter((item) => Boolean(item.goodsActualNum));
  // });
  // await Promise.all(
  //   ab.map(async (item) => {
  //     const current = await prisma.goods.findFirst({
  //       where: {
  //         goodsName: item.goodsName,
  //         goodsType: item.goodsType,
  //         goodsSpec: item.goodsSpec ?? null,
  //         goodsBarCode: item.goodsBarCode ?? null,
  //       },
  //     });
  //     if (!current) {
  //       return Promise.resolve();
  //     }
  //     return prisma.goods.update({
  //       where: {
  //         id: current.id,
  //       },
  //       data: {
  //         goodsActualNum: item.goodsActualNum,
  //       },
  //     });
  //   })
  // );
  // console.log(
  //   "🚀 ~ ab ~ ab:",
  //   ab.filter((item) => typeof item.goodsTotalPrice === "string")
  // );
  // await prisma.goods.createMany({
  //   data: ab,
  // });

  const goods = await prisma.goods.findMany({
    where: {
      goodsBarCode: {
        not: null,
      },
    },
  });

  console.log("goods", goods.length);
  await prisma.$transaction(
    goods.map((item) => {
      return prisma.barCode.create({
        data: {
          goodsId: item.id,
          goodsBarCode: item.goodsBarCode,
        },
      });
    })
  );

  console.log("987987");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
