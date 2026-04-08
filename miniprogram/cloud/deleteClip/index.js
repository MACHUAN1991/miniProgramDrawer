const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { clipId } = event;

  if (!clipId) {
    return { success: false, error: '缺少 clipId 参数' };
  }

  try {
    // 云函数拥有管理员权限，可以删除任意文档
    // 先查出文档，获取图片信息
    const doc = await db.collection('clips').doc(clipId).get();
    const clip = doc.data;

    // 删除文档
    await db.collection('clips').doc(clipId).remove();

    // 如果有云存储图片，一并删除
    if (clip && clip.imageUrl && clip.imageUrl.startsWith('cloud://')) {
      try {
        await cloud.deleteFile({ fileList: [clip.imageUrl] });
      } catch (e) {
        console.error('删除云存储文件失败', e);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('删除失败', err);
    return { success: false, error: err.message || '删除失败' };
  }
};
