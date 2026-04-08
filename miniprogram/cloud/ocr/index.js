const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { filePath } = event;

  try {
    const res = await cloud.downloadFile({ fileID: filePath });
    const buffer = res.fileContent;

    // 调用微信云开发的OCR能力
    const ocrResult = await cloud.openapi.ocr({
      type: 'image',
      img: {
        contentType: 'image/jpeg',
        value: buffer
      }
    });

    // 整理OCR结果
    let text = '';
    if (ocrResult.items && ocrResult.items.length > 0) {
      text = ocrResult.items.map(item => item.text).join('\n');
    }

    return {
      success: true,
      result: { text }
    };
  } catch (err) {
    console.error('OCR识别失败', err);
    return {
      success: false,
      error: err.message
    };
  }
};