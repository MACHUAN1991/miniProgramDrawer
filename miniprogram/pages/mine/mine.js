const app = getApp();

Page({
  data: {
    userInfo: null,
    reviewFrequency: 'every_day',
    frequencyLabel: '每天',
    totalClips: 0,
    totalTopics: 0,
    showTopicManager: false,
    allTopics: [],
    showLoginDialog: false,
    tempAvatarUrl: '',
    tempNickName: '',
  },

  onLoad() {
    this.checkLogin();
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  // 显示登录弹窗
  showLogin() {
    this.setData({
      showLoginDialog: true,
      tempAvatarUrl: '',
      tempNickName: ''
    });
  },

  // 选择头像（微信返回临时路径）
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ tempAvatarUrl: avatarUrl });
  },

  // 输入昵称（支持微信昵称快捷填入）
  onInputNickName(e) {
    this.setData({ tempNickName: e.detail.value });
  },

  // 确认登录
  confirmLogin() {
    const { tempAvatarUrl, tempNickName } = this.data;

    if (!tempAvatarUrl) {
      wx.showToast({ title: '请点击获取微信头像', icon: 'none' });
      return;
    }
    if (!tempNickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    const userInfo = {
      avatarUrl: tempAvatarUrl,
      nickName: tempNickName.trim()
    };

    wx.setStorageSync('userInfo', userInfo);
    this.setData({
      userInfo,
      showLoginDialog: false
    });
    wx.showToast({ title: '登录成功' });
  },

  // 关闭登录弹窗
  closeLoginDialog() {
    this.setData({ showLoginDialog: false });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          this.setData({ userInfo: null });
        }
      }
    });
  },

  async loadStats() {
    try {
      const db = wx.cloud.database();

      const [clipsRes, topicsRes] = await Promise.all([
        db.collection('clips').count(),
        db.collection('topics').count()
      ]);

      const userRes = await db.collection('users').get();

      let reviewFrequency = 'every_day';
      let frequencyLabel = '每天';

      if (userRes.data.length > 0) {
        reviewFrequency = userRes.data[0].reviewFrequency || 'every_day';
        frequencyLabel = this.getFrequencyLabel(reviewFrequency);
      }

      this.setData({
        totalClips: clipsRes.total,
        totalTopics: topicsRes.total,
        reviewFrequency,
        frequencyLabel
      });
    } catch (err) {
      console.error('加载统计失败', err);
    }
  },

  getFrequencyLabel(freq) {
    const map = {
      'every_day': '每天',
      'every_3_days': '每3天',
      'every_week': '每周'
    };
    return map[freq] || '每天';
  },

  async setReviewFrequency(e) {
    const freq = e.currentTarget.dataset.freq;
    this.setData({ reviewFrequency: freq, frequencyLabel: this.getFrequencyLabel(freq) });

    try {
      const db = wx.cloud.database();
      const userRes = await db.collection('users').get();

      if (userRes.data.length > 0) {
        await db.collection('users').doc(userRes.data[0]._id).update({
          data: { reviewFrequency: freq }
        });
      } else {
        await db.collection('users').add({
          data: { reviewFrequency: freq }
        });
      }

      wx.showToast({ title: '设置成功' });
    } catch (err) {
      wx.showToast({ title: '设置失败', icon: 'none' });
    }
  },

  goToReview() {
    wx.navigateTo({ url: '/pages/review/review' });
  },

  async requestNotification() {
    try {
      const setting = await wx.getSetting();
      if (!setting.authSetting['scope.notify']) {
        await wx.authorize({ scope: 'scope.notify' });
        wx.showToast({ title: '授权成功' });
      } else {
        wx.showToast({ title: '已开启通知', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '请在设置中开启通知', icon: 'none' });
    }
  },

  showAbout() {
    wx.showModal({
      title: '关于知识抽屉',
      content: '知识抽屉 v1.0\n\n帮助你在兴趣来临时快速收藏知识，定期回顾不忘记忆。\n\n当你对某件事感兴趣时，学习的内容能真正沉淀下来。',
      showCancel: false
    });
  },

  async manageTopics() {
    try {
      const db = wx.cloud.database();
      const topicsRes = await db.collection('topics').get();

      const topicsWithCount = await Promise.all(topicsRes.data.map(async (topic) => {
        const clipsRes = await db.collection('clips').where({ topicId: topic._id }).count();
        return { ...topic, clipCount: clipsRes.total };
      }));

      this.setData({
        showTopicManager: true,
        allTopics: topicsWithCount
      });
    } catch (err) {
      console.error('加载主题失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  closeTopicManager() {
    this.setData({ showTopicManager: false });
  },

  async deleteTopic(e) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: '删除主题',
      content: '删除后该主题下的所有收藏也将被删除，确定吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = wx.cloud.database();

            const clipsRes = await db.collection('clips')
              .where({ topicId: id })
              .get();

            for (const clip of clipsRes.data) {
              await db.collection('clips').doc(clip._id).remove();
            }

            await db.collection('topics').doc(id).remove();

            wx.showToast({ title: '已删除' });

            this.manageTopics();
            this.loadStats();
          } catch (err) {
            console.error('删除失败', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 阻止冒泡
  stopPropagation() {},
});
