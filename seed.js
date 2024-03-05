const { PrismaClient } = require("@prisma/client");
const { customAlphabet } = require("nanoid");
const data = require("./data.js");

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 2);
const nanoid2 = customAlphabet("1234567890", 6);

const prisma = new PrismaClient();
async function main() {
  const ab = Object.keys(data).flatMap((goodsType) => {
    return data[goodsType].map((item) => ({
      goodsType: goodsType,
      goodsName: item["商品名称"] ?? "无商品名称",
      goodsSpec: item["规格"],
      goodsPurchasePrice: item["单价"] || 0,
      goodsPurchaseNum: item["数量"] || 0,
      goodsActualNum: item["已拿货"] || 0,
      goodsTotalPrice: item["金额"] || 0,
      goodsActualPrice: 0,
      goodsBarCode: item["条形码(upc/ean等)"]?.toString(),
      goodsRemark: "",
      goodsStatus: "init",
      goodsInnerCode: nanoid().toUpperCase() + nanoid2(),
      goodsAbnormal: !item["单价"],
      goodsCreateOpenid: "",
      goodsConfirmOpenid: "",
      goodsRemarkPic: "",
    }));
  });

  // console.log(
  //   "🚀 ~ ab ~ ab:",
  //   ab.filter((item) => typeof item.goodsTotalPrice === "string")
  // );

  await prisma.goods.createMany({
    data: ab,
  });
}

console.log("987987");
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
