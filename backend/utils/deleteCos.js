const cos = require('./tencentCos');

const getCosKeyFromUrl = (url) => {
  if (!url) return null;
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  const prefix = `https://${bucket}.cos.${region}.myqcloud.com/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
};

const deleteCosByUrl = async (url) => {
  const Key = getCosKeyFromUrl(url);
  if (!Key) return;
  try {
    await cos.deleteObject({
      Bucket: process.env.TENCENT_COS_BUCKET,
      Region: process.env.TENCENT_COS_REGION,
      Key
    });
  } catch (err) {
    console.error('删除COS文件失败:', err);
  }
};

module.exports = {
  deleteCosByUrl
};
