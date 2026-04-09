const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const ADMIN_PWD = '231109';

exports.main = async (event, context) => {
  const { clipId, needPwd } = event;

  if (!clipId) {
    return { success: false, error: '缺少 clipId 参数' };
  }

  // 获取当前用户的 openid
  const openid = context.userInfo && context.userInfo.openId;

  try {
    // 查询该 clip 的创建者
    const doc = await db.collection('clips').doc(clipId).get();
    const clip = doc.data;

    if (!clip) {
      return { success: false, error: '内容不存在' };
    }

    // 如果需要密码验证（表示不是创建者删除）
    if (needPwd) {
      // 密码验证由客户端处理，这里直接执行删除
    }

    // 删除文档
    await db.collection('clips').doc(clipId).remove();

    // 如果有云存储图片，一并删除
    if (clip.imageUrl && clip.imageUrl.startsWith('cloud://')) {
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