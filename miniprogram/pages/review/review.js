const app = getApp();

Page({
  data: {
    clips: [],
    currentIndex: 0,
    loading: true,
  },

  onLoad() {
    this.loadReviewClips();
  },

  async loadReviewClips() {
    this.setData({ loading: true });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('clips')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      // 批量获取图片临时链接
      const cloudFileIds = res.data
        .filter(c => c.imageUrl && c.imageUrl.startsWith('cloud://'))
        .map(c => c.imageUrl);

      const tempUrlMap = {};
      if (cloudFileIds.length > 0) {
        try {
          const tempRes = await wx.cloud.getTempFileURL({ fileList: cloudFileIds });
          if (tempRes.fileList) {
            tempRes.fileList.forEach(f => {
              if (f.tempFileURL) tempUrlMap[f.fileID] = f.tempFileURL;
            });
          }
        } catch (e) {
          console.error('批量获取图片链接失败', e);
        }
      }

      const clips = res.data.map(clip => {
        let imageUrl = clip.imageUrl || '';
        if (imageUrl && tempUrlMap[imageUrl]) {
          imageUrl = tempUrlMap[imageUrl];
        }
        return {
          ...clip,
          imageUrl,
          createdAt: this.formatDate(clip.createdAt),
        };
      });

      this.setData({
        clips,
        loading: false
      });
    } catch (err) {
      console.error('加载失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    } catch (e) {
      return dateStr;
    }
  },

  prevClip() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 });
    }
  },

  nextClip() {
    if (this.data.currentIndex < this.data.clips.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 });
    } else {
      wx.showToast({ title: '已全部看完', icon: 'none' });
    }
  },

  toggleExpand() {
    const clips = this.data.clips;
    clips[this.data.currentIndex].expanded = !clips[this.data.currentIndex].expanded;
    this.setData({ clips });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        current: url,
        urls: [url]
      });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});