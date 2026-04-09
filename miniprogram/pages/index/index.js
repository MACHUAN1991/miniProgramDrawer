Page({
  data: {
    clips: [],
    allClips: [],
    searchKey: '',
    loading: false,
    showDialog: false,
    showLogin: false,
    loginAvatar: '',
    loginNickname: '',
    dialogContent: '',
    dialogImageUrl: '',
    dialogCloudId: '',
    showPwd: false,
    pwdVal: '',
    pwdCallback: null,
    userInfo: null,
    // 分类筛选
    selectedType: '', // '' | 'text' | 'image'
    countAll: 0,
    countText: 0,
    countImage: 0,
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
    this.loadData();
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
    this.loadData();
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ selectedType: type });
    this.loadData();
  },

  onLoginTap() {
    if (this.data.userInfo && this.data.userInfo.nickName) {
      wx.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            wx.removeStorageSync('userInfo');
            this.setData({ userInfo: null });
            wx.showToast({ title: '已退出' });
          }
        }
      });
      return;
    }
    this.setData({
      showLogin: true,
      loginAvatar: this.data.userInfo?.avatarUrl || '',
      loginNickname: this.data.userInfo?.nickName || '',
    });
  },

  closeLogin() {
    this.setData({ showLogin: false });
  },

  onChooseAvatar(e) {
    this.setData({ loginAvatar: e.detail.avatarUrl });
  },

  onChooseAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({ loginAvatar: res.tempFilePaths[0] });
      }
    });
  },

  onLoginNickname(e) {
    this._loginNickname = e.detail.value;
  },

  confirmLogin() {
    const { loginAvatar, loginNickname } = this.data;
    const nickName = this._loginNickname || loginNickname;
    if (!loginAvatar) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }
    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    const userInfo = { avatarUrl: loginAvatar, nickName: nickName.trim() };
    wx.setStorageSync('userInfo', userInfo);
    this.setData({ userInfo, showLogin: false });
    wx.showToast({ title: '登录成功' });
  },

  onLogout() {
    wx.removeStorageSync('userInfo');
    this.setData({ userInfo: null });
    wx.showToast({ title: '已退出' });
  },

  onPullDownRefresh() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const { selectedType } = this.data;

      const res = await db.collection('clips')
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();

      // 按类型筛选
      let clipsData = res.data;
      if (selectedType) {
        clipsData = res.data.filter(clip => clip.type === selectedType);
      }

      // 批量获取图片临时链接
      const cloudFileIds = clipsData
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
          console.error('获取图片链接失败', e);
        }
      }

      const clips = clipsData.map(clip => {
        let imageUrl = clip.imageUrl || '';
        if (imageUrl && tempUrlMap[imageUrl]) {
          imageUrl = tempUrlMap[imageUrl];
        }
        const creatorShow = clip.creatorName
          || (clip._openid ? '微信用户' + String(clip._openid).slice(-6) : '微信用户');
        return {
          ...clip,
          imageUrl,
          createdAt: this.formatDate(clip.createdAt),
          creator: clip.creatorName || '微信用户',
          creatorShow,
        };
      });

      // 统计各类型数量
      const countAll = res.data.length;
      const countText = res.data.filter(c => c.type === 'text').length;
      const countImage = res.data.filter(c => c.type === 'image').length;

      this.setData({
        clips,
        allClips: clips,
        countAll,
        countText,
        countImage,
        loading: false
      });
    } catch (err) {
      console.error('加载失败', err);
      this.setData({ loading: false });
    }
  },

  onSearch(e) {
    const key = e.detail.value.toLowerCase();
    const { allClips } = this.data;
    if (!key) {
      this.setData({ clips: allClips, searchKey: '' });
      return;
    }
    const filtered = allClips.filter(clip =>
      clip.content && clip.content.toLowerCase().includes(key)
    );
    this.setData({ clips: filtered, searchKey: e.detail.value });
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;
      const oneDay = 86400000;
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hour}:${minute}`;

      if (diff < oneDay && date.getDate() === now.getDate()) {
        return `今天 ${timeStr}`;
      }
      const yesterday = new Date(now - oneDay);
      if (date.getDate() === yesterday.getDate() &&
          date.getMonth() === yesterday.getMonth() &&
          date.getFullYear() === yesterday.getFullYear()) {
        return `昨天 ${timeStr}`;
      }
      if (date.getFullYear() === now.getFullYear()) {
        return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
      }
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${timeStr}`;
    } catch (e) {
      return dateStr;
    }
  },

  showAdd() {
    const userInfo = this.data.userInfo;
    if (!userInfo || !userInfo.nickName) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.setData({
      showDialog: true,
      dialogContent: '',
      dialogImageUrl: '',
      dialogCloudId: '',
      currentTime: timeStr,
    });
  },

  closeDialog() {
    this.setData({ showDialog: false });
  },

  stopPropagation() {
    // 阻止事件冒泡
  },

  onContentInput(e) {
    this.setData({ dialogContent: e.detail.value });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({ dialogImageUrl: tempFilePath });
        this.uploadImage(tempFilePath);
      }
    });
  },

  async uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' });
    try {
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `images/${Date.now()}.jpg`,
        filePath: filePath,
      });
      this.setData({ dialogCloudId: uploadRes.fileID });
      wx.hideLoading();
      wx.showToast({ title: '上传成功' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  async saveClip() {
    const { dialogContent, dialogCloudId, userInfo } = this.data;

    if (!dialogContent.trim()) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      const db = wx.cloud.database();
      await db.collection('clips').add({
        data: {
          type: dialogCloudId ? 'image' : 'text',
          content: dialogContent.trim(),
          imageUrl: dialogCloudId || '',
          creatorName: userInfo?.nickName || '',
          creatorAvatar: userInfo?.avatarUrl || '',
          createdAt: new Date().toISOString(),
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '保存成功' });
      this.closeDialog();
      this.loadData();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({ current: url, urls: [url] });
    }
  },

  toggleExpand(e) {
    const index = e.currentTarget.dataset.index;
    const clips = this.data.clips;
    clips[index].expanded = !clips[index].expanded;
    this.setData({ clips });
  },

  deleteClip(e) {
    const userInfo = this.data.userInfo;
    if (!userInfo || !userInfo.nickName) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const id = e.currentTarget.dataset.id;
    const clip = this.data.clips.find(c => c._id === id);
    if (!clip) return;

    // 检查是否是创建者本人
    const isCreator = clip.creatorName === userInfo.nickName;

    if (isCreator) {
      // 创建者本人，弹确认框
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条内容吗？',
        success: (res) => {
          if (res.confirm) {
            this.doDelete(id);
          }
        }
      });
    } else {
      // 非创建者，需要输入密码
      this.setData({
        showPwd: true,
        pwdVal: '',
        pwdCallback: () => this.doDelete(id),
      });
    }
  },

  onPwdInput(e) {
    this.setData({ pwdVal: e.detail.value });
  },

  closePwd() {
    this.setData({ showPwd: false, pwdVal: '', pwdCallback: null });
  },

  submitPwd() {
    const { pwdVal, pwdCallback } = this.data;
    if (pwdVal !== '231109') {
      wx.showToast({ title: '密码错误', icon: 'none' });
      this.setData({ pwdVal: '' });
      return;
    }
    this.closePwd();
    if (pwdCallback) pwdCallback();
  },

  doDelete(id) {
    wx.showLoading({ title: '删除中...' });
    wx.cloud.callFunction({
      name: 'deleteClip',
      data: { clipId: id }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '已删除' });
        this.loadData();
      } else {
        wx.showToast({ title: '删除失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '删除失败', icon: 'none' });
    });
  },
});