const cos = require('./tencentCos');
const sharp = require('sharp');

// 生成cos文件名
const getCosFileName = (ext) => {
  return `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

const uploadImageBuffer = async (buffer) => {
  // 按比例压缩图片 转webp
  const compressBuffer = await sharp(buffer)
    .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer(); // 转成二进制数据

  // 上传到cos
  const fileName = getCosFileName('.webp');
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;

  await cos.putObject({
    Bucket: bucket,
    Region: region,
    Key: fileName,
    Body: compressBuffer,
    ContentType: 'image/webp'
  });

  // 拼接cos公开访问url
  return `https://${bucket}.cos.${region}.myqcloud.com/${fileName}`;
};

module.exports = {
  uploadImageBuffer
};
